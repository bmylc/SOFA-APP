import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Platform, Keyboard,
  Alert
} from 'react-native';
import {
  collection, addDoc, onSnapshot,
  orderBy, query, serverTimestamp,
  doc, updateDoc, where, getDocs
} from 'firebase/firestore';
import { db, auth } from '../firebase';

const CHECKLIST_ITEMS = [
  { key: 'confirmed', label: '買い手と取引内容を確認した' },
  { key: 'meetup', label: 'キャンパスでの待ち合わせ場所・日時を決めた' },
  { key: 'price', label: '価格に双方合意している' },
  { key: 'condition', label: '商品の状態を買い手に説明した' },
];

const INITIAL_CHECKLIST = {
  confirmed: false,   // 相手と取引内容を確認した
  meetup: false,      // キャンパスでの待ち合わせ場所を決めた
  price: false,       // 価格に双方合意している
  condition: false,   // 商品の状態を確認した
};

export default function ChatScreen({ route }) {
  const { chatId, productName, seller, productId } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [productStatus, setProductStatus] = useState('available');
  const [checklistVisible, setChecklistVisible] = useState(false);
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);
  const flatListRef = useRef(null);
  const isMe = (senderId) => senderId === auth.currentUser.email;
  const isSeller = auth.currentUser.email === seller;
  const allChecked = Object.values(checklist).every(Boolean);

  // キーボードの高さを監視（iOS / Android 両対応）
  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(data);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    });
    return unsubscribe;
  }, [chatId]);

  // 商品ステータスをリアルタイムで監視
  useEffect(() => {
    if (!productId) return;
    const unsubscribe = onSnapshot(doc(db, 'products', productId), (snap) => {
      if (snap.exists()) {
        setProductStatus(snap.data().status || 'available');
      }
    });
    return unsubscribe;
  }, [productId]);

  const handleSend = async () => {
    if (text.trim() === '') return;
    const currentText = text;
    setText('');
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: currentText,
        senderId: auth.currentUser.email,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
    }
  };

  // 売約済みボタン → チェックリストを表示するだけ
  const handleReserve = () => {
    setChecklistVisible(true);
  };

  const closeChecklist = () => {
    setChecklistVisible(false);
    setChecklist(INITIAL_CHECKLIST);
  };

  // チェックリストをすべて確認したら売約済みにする
  const confirmReserve = async () => {
    closeChecklist();
    try {
      // 商品を売約済みに更新
      await updateDoc(doc(db, 'products', productId), {
        status: 'reserved',
        reservedChatId: chatId, // 売約したチャットIDを保存
      });

      // 売約した買い手へのメッセージ
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: '🤝 出品者が「売約済み」に設定しました。キャンパスでの対面取引の日時・場所を決めましょう！',
        senderId: 'system',
        createdAt: serverTimestamp(),
      });

      // 他の買い手のチャットにもメッセージを送る（オファーが1件なら何も送らない）
      const chatRef = collection(db, 'chats');
      const q = query(chatRef, where('productId', '==', productId));
      const snapshot = await getDocs(q);

      snapshot.docs.forEach(async (chatDoc) => {
        const otherChatId = chatDoc.data().chatId;
        // 自分のチャット以外にのみ送信
        if (otherChatId !== chatId) {
          await addDoc(collection(db, 'chats', otherChatId, 'messages'), {
            text: '😔 申し訳ありませんが、この商品は他の方との取引が決まりました。またの機会にお願いします。',
            senderId: 'system',
            createdAt: serverTimestamp(),
          });
        }
      });
    } catch (error) {
      Alert.alert('エラー', '更新に失敗しました');
    }
  };

  const handleCancelReserve = () => {
    Alert.alert(
      '売約キャンセル',
      '売約済みを取り消しますか？\n他のオファーも再度受け付けられるようになります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '取り消す',
          style: 'destructive',
          onPress: async () => {
            try {
              // 商品ステータスを戻す
              await updateDoc(doc(db, 'products', productId), {
                status: 'available',
                reservedChatId: null,
              });

              // このチャットにキャンセルメッセージ
              await addDoc(collection(db, 'chats', chatId, 'messages'), {
                text: '❌ 出品者が売約を取り消しました。引き続きご検討ください。',
                senderId: 'system',
                createdAt: serverTimestamp(),
              });

              // 他の買い手のチャットにも通知
              const chatRef = collection(db, 'chats');
              const q = query(chatRef, where('productId', '==', productId));
              const snapshot = await getDocs(q);

              snapshot.docs.forEach(async (chatDoc) => {
                const otherChatId = chatDoc.data().chatId;
                if (otherChatId !== chatId) {
                  await addDoc(collection(db, 'chats', otherChatId, 'messages'), {
                    text: '🔄 出品者が売約を取り消しました。再度オファーを検討してみてください！',
                    senderId: 'system',
                    createdAt: serverTimestamp(),
                  });
                }
              });

              Alert.alert('完了', '売約を取り消しました');
            } catch (error) {
              Alert.alert('エラー', '取り消しに失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    Alert.alert(
      '取引完了',
      '対面取引は完了しましたか？完了すると商品が一覧から削除されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '完了にする',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'products', productId), {
                status: 'sold',
              });
              await addDoc(collection(db, 'chats', chatId, 'messages'), {
                text: '✅ 取引が完了しました。ありがとうございました！',
                senderId: 'system',
                createdAt: serverTimestamp(),
              });
            } catch (error) {
              Alert.alert('エラー', '更新に失敗しました');
            }
          },
        },
      ]
    );
  };

  return (
    // OS のナビゲーションバーに入力欄が隠れないよう 50px 上げる
    <View style={[styles.container, { paddingBottom: keyboardHeight + 50 }]}>
      {/* 商品情報バー */}
      <View style={styles.productBar}>
        <View style={styles.productBarLeft}>
          <Text style={styles.productBarText}>商品：{productName}</Text>
          <Text style={styles.productBarSeller}>出品者：{seller}</Text>
        </View>
        {/* 出品者のみボタンを表示 */}
        {isSeller && productStatus === 'available' && (
          <TouchableOpacity style={styles.reserveButton} onPress={handleReserve}>
            <Text style={styles.reserveButtonText}>売約済みにする</Text>
          </TouchableOpacity>
        )}
        {isSeller && productStatus === 'reserved' && (
          <View style={styles.sellerButtons}>
            <TouchableOpacity style={styles.cancelReserveButton} onPress={handleCancelReserve}>
              <Text style={styles.cancelReserveButtonText}>売約キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
              <Text style={styles.completeButtonText}>取引完了</Text>
            </TouchableOpacity>
          </View>
        )}
        {productStatus === 'reserved' && (
          <View style={styles.reservedBadge}>
            <Text style={styles.reservedBadgeText}>売約済み</Text>
          </View>
        )}
      </View>

      {/* チェックリストモーダル */}
      {checklistVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>売約済みにする前に確認</Text>
            <Text style={styles.modalSubtitle}>以下をすべて確認してから売約済みにしてください</Text>

            {CHECKLIST_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.checkItem}
                onPress={() => setChecklist(prev => ({
                  ...prev,
                  [item.key]: !prev[item.key]
                }))}
              >
                <View style={[
                  styles.checkbox,
                  checklist[item.key] && styles.checkboxChecked
                ]}>
                  {checklist[item.key] && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.modalButton,
                !allChecked && styles.modalButtonDisabled
              ]}
              disabled={!allChecked}
              onPress={confirmReserve}
            >
              <Text style={styles.modalButtonText}>
                {allChecked
                  ? '売約済みにする ✓'
                  : `残り${CHECKLIST_ITEMS.length - Object.values(checklist).filter(Boolean).length}項目`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={closeChecklist}
            >
              <Text style={styles.modalCancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* メッセージ一覧 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => {
          if (item.senderId === 'system') {
            return (
              <View style={styles.systemMessage}>
                <Text style={styles.systemMessageText}>{item.text}</Text>
              </View>
            );
          }
          return (
            <View style={[
              styles.messageRow,
              isMe(item.senderId) ? styles.messageRowMe : styles.messageRowOther
            ]}>
              {!isMe(item.senderId) && (
                <Text style={styles.senderName}>{item.senderId}</Text>
              )}
              <View style={[
                styles.bubble,
                isMe(item.senderId) ? styles.bubbleMe : styles.bubbleOther
              ]}>
                <Text style={[
                  styles.bubbleText,
                  isMe(item.senderId) ? styles.bubbleTextMe : styles.bubbleTextOther
                ]}>
                  {item.text}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* 入力欄 */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="メッセージを入力"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>送信</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  productBar: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productBarLeft: {
    flex: 1,
  },
  productBarText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  productBarSeller: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  reserveButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sellerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelReserveButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  cancelReserveButtonText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reservedBadge: {
    backgroundColor: '#FFE66D',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  reservedBadgeText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#999',
    fontSize: 14,
  },
  messageList: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 4,
    maxWidth: '85%',
  },
  systemMessageText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'column',
    maxWidth: '75%',
  },
  messageRowMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  bubble: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleMe: {
    backgroundColor: '#FF6B6B',
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: '#fff',
  },
  bubbleTextOther: {
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
