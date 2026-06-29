import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Platform, Keyboard
} from 'react-native';
import {
  collection, addDoc, onSnapshot,
  orderBy, query, serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export default function ChatScreen({ route }) {
  const { chatId, productName, seller } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef(null);

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

  const isMe = (senderId) => senderId === auth.currentUser.email;

  return (
    // OS のナビゲーションバーに入力欄が隠れないよう 50px 上げる
    <View style={[styles.container, { paddingBottom: keyboardHeight + 50 }]}>
      {/* 商品情報バー */}
      <View style={styles.productBar}>
        <Text style={styles.productBarText}>商品：{productName}</Text>
        <Text style={styles.productBarSeller}>出品者：{seller}</Text>
      </View>

      {/* メッセージ一覧 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
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
        )}
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
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
        >
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
