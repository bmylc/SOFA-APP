import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Platform, Keyboard,
  Alert
} from 'react-native';
import {
  collection, addDoc, onSnapshot,
  orderBy, query, serverTimestamp,
  doc, updateDoc, getDocs,where
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useUsers } from '../context/UserContext';
import { generateTradeNumber } from '../utils/generateTradeNumber';



export default function ChatScreen({ route }) {
  const { chatId, productName, seller, productId } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [productStatus, setProductStatus] = useState('available');
  const flatListRef = useRef(null);
  const isMe = (senderId) => senderId === auth.currentUser.email;
  const isSeller = auth.currentUser.email === seller;
  const [sellerName, setSellerName] = useState(''); // ← 出品者名
  const [messageNames, setMessageNames] = useState({}); // ← メッセージの表示名
  const [checklistVisible, setChecklistVisible] = useState(false);
  const [userNames, setUserNames] = useState({})
  const { getUserName } = useUsers();
  const [checklist, setChecklist] = useState({
    confirmed: false,   // 相手と取引内容を確認した
    meetup: false,      // キャンパスでの待ち合わせ場所を決めた
    price: false,       // 価格に双方合意している
    condition: false,   // 商品の状態を確認した
  });
  const [tradeNumber, setTradeNumber] = useState(null);

  // 出品者名を事前に取得
  useEffect(() => {
    getUserName(seller).then(name => setSellerName(name));
  }, [seller]);



  // メッセージの送信者名をまとめて取得
  useEffect(() => {
    const fetchNames = async () => {
      const uniqueSenders = [...new Set(
        messages
          .map(m => m.senderId)
          .filter(s => s !== 'system' && s !== auth.currentUser.email)
      )];

      const names = {};
      for (const email of uniqueSenders) {
        names[email] = await getUserName(email);
      }
      setMessageNames(names);
    };

    if (messages.length > 0) fetchNames();
  }, [messages]);

  // 表示名を取得
  const getDisplayName = (senderId) => {
    if (senderId === 'system') return 'システム';
    if (senderId === auth.currentUser.email) return 'あなた';
    return messageNames[senderId] || ''; // ← 空文字でアドレスを一瞬表示しない
  };

  // チャットメンバーの氏名を取得
  useEffect(() => {
    const fetchUserNames = async () => {
      const chatRef = collection(db, 'chats');
      const q = query(chatRef, where('chatId', '==', chatId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const members = snapshot.docs[0].data().members || [];
        const names = {};

        for (const email of members) {
          // メールアドレスからユーザーを検索
          const usersRef = collection(db, 'users');
          const userQuery = query(usersRef, where('email', '==', email));
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            names[email] = userSnapshot.docs[0].data().name;
          } else {
            names[email] = email; // 見つからない場合はメールアドレスのまま
          }
        }
        setUserNames(names);
      }
    };
    fetchUserNames();
  }, [chatId]);


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
        setTradeNumber(snap.data().tradeNumber || null); // ← 追加
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

  const handleReserve = () => {
    setChecklistVisible(true); // ← モーダルを表示するだけ
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
            setChecklistVisible(false);
            setChecklist({ confirmed: false, meetup: false, price: false, condition: false });

            try {
              const tradeNumber = generateTradeNumber(); // ← 取引番号を生成

              // 商品を売約済みに更新（取引番号を追加）
              await updateDoc(doc(db, 'products', productId), {
                status: 'reserved',
                reservedChatId: chatId,
                tradeNumber: tradeNumber, // ← 追加
                tradeNumberIssuedAt: serverTimestamp(), // ← 追加
              });

              // 売約した買い手へのメッセージ（取引番号を含める）
              await addDoc(collection(db, 'chats', chatId, 'messages'), {
                text: `🤝 売約済みになりました！\n\n取引番号：${tradeNumber}\n\nキャンパスでの対面取引の際にお互いの取引番号を確認してください。`,
                senderId: 'system',
                createdAt: serverTimestamp(),
              });

              // 他の買い手へのメッセージ
              const chatRef = collection(db, 'chats');
              const q = query(chatRef, where('productId', '==', productId));
              const snapshot = await getDocs(q);

              snapshot.docs.forEach(async (chatDoc) => {
                const otherChatId = chatDoc.data().chatId;
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
          }
        },
      ]
    );
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

  return (
    <View style={[styles.container, { paddingBottom: keyboardHeight + 50 }]}>
      {/* 商品情報バー */}
      <View style={styles.productBar}>
        <View style={styles.productBarLeft}>
          <Text style={styles.productBarText}>商品：{productName}</Text>
          <Text style={styles.productBarSeller}>
            出品者：{userNames[seller] || seller}
          </Text>
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
      </View>

      {/* チェックリストモーダル */}
      {checklistVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>売約済みにする前に確認</Text>
            <Text style={styles.modalSubtitle}>以下をすべて確認してから売約済みにしてください</Text>

            {[
              { key: 'confirmed', label: '買い手と取引内容を確認した' },
              { key: 'meetup', label: 'キャンパスでの待ち合わせ場所・日時を決めた' },
              { key: 'price', label: '価格に双方合意している' },
              { key: 'condition', label: '商品の状態を買い手に説明した' },
            ].map((item) => (
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
                !Object.values(checklist).every(Boolean) && styles.modalButtonDisabled
              ]}
              disabled={!Object.values(checklist).every(Boolean)}
                onPress={async () => {
                setChecklistVisible(false);
                setChecklist({ confirmed: false, meetup: false, price: false, condition: false });
                try {
                  // ← 取引番号を生成
                  const tradeNumber = generateTradeNumber();

                  // 商品を売約済みに更新
                  await updateDoc(doc(db, 'products', productId), {
                    status: 'reserved',
                    reservedChatId: chatId,
                    tradeNumber: tradeNumber,           // ← 追加
                    tradeNumberIssuedAt: serverTimestamp(), // ← 追加
                  });

                  // 売約した買い手へのメッセージ（取引番号を含める）
                  await addDoc(collection(db, 'chats', chatId, 'messages'), {
                    text: `🤝 売約済みになりました！\n\n取引番号：${tradeNumber}\n\nキャンパスでの対面取引の際にお互いの取引番号を確認してください。`,
                    senderId: 'system',
                    createdAt: serverTimestamp(),
                  });

                  // 他の買い手のチャットにもメッセージを送る
                  const chatRef = collection(db, 'chats');
                  const q = query(chatRef, where('productId', '==', productId));
                  const snapshot = await getDocs(q);

                  snapshot.docs.forEach(async (chatDoc) => {
                    const otherChatId = chatDoc.data().chatId;
                    if (otherChatId !== chatId) {
                      await addDoc(collection(db, 'chats', otherChatId, 'messages'), {
                        text: '😔 申し訳ありませんが、この商品は他の方との取引が決まりました。またの機会にお願いします。',
                        senderId: 'system',
                        createdAt: serverTimestamp(),
                      });
                    }
                  });

                } catch (error) {
                  console.error('エラー:', error.message);
                  Alert.alert('エラー', '更新に失敗しました');
                }
              }}
            >
              <Text style={styles.modalButtonText}>
                {Object.values(checklist).every(Boolean)
                  ? '売約済みにする ✓'
                  : `残り${4 - Object.values(checklist).filter(Boolean).length}項目`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setChecklistVisible(false);
                setChecklist({ confirmed: false, meetup: false, price: false, condition: false });
              }}
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

          const displayName = getDisplayName(item.senderId);

          return (
            <View style={[
              styles.messageRow,
              isMe(item.senderId) ? styles.messageRowMe : styles.messageRowOther
            ]}>
              {/* 名前が取得できてから表示 */}
              {!isMe(item.senderId) && displayName !== '' && (
                <Text style={styles.senderName}>{displayName}</Text>
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
          placeholderTextColor="#999"
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
  messageList: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
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
    backgroundColor: '#06534B',
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
    backgroundColor: '#fff', // ← 白背景を明示的に指定
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    borderWidth: 0.5,
    borderColor: '#ddd',
    width:'80%',
    color: '#333', // ← 入力文字色も明示的に指定
  },
  sendButton: {
    backgroundColor: '#06534B',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  productBarLeft: {
  flex: 1,
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
completeButton: {
  backgroundColor: '#06534B',
  width:'50%',
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 8,
},
completeButtonText: {
  color: '#fff',
  textAlign:'center',
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
sellerButtons: {
  flexDirection: 'row',
  gap: 8,
},
cancelReserveButton: {
  backgroundColor: '#fff',
  width:'50%',
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#06534B',
},
cancelReserveButtonText: {
  color: '#06534B',
  textAlign:'center',
  fontSize: 12,
  fontWeight: 'bold',
},
tradeNumberContainer: {
  marginTop: 0,
  backgroundColor: '#E8F5E9',
  borderRadius: 6,
  padding: 6,
  borderWidth: 1,
  borderColor: '#06534B',
},
tradeNumberLabel: {
  fontSize: 10,
  color: '#06534B',
  fontWeight: 'bold',
},
tradeNumber: {
  fontSize: 14,
  color: '#06534B',
  fontWeight: 'bold',
  letterSpacing: 1,
},
});