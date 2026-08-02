import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useUsers } from '../context/UserContext';

export default function ChatListScreen({ route, navigation }) {
  const { productId, productName } = route.params;
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState({});
  const [buyerNames, setBuyerNames] = useState({}); // ← 追加
  const { getUserName } = useUsers();

  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      where('productId', '==', productId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChats(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [productId]);

  // チャットが更新されたら買い手の名前を取得
  useEffect(() => {
    const fetchNames = async () => {
      const names = {};
      for (const chat of chats) {
        const buyer = chat.members.find(m => m !== auth.currentUser.email);
        if (buyer && !names[buyer]) {
          names[buyer] = await getUserName(buyer);
        }
      }
      setBuyerNames(names);
    };
    if (chats.length > 0) fetchNames();
  }, [chats]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>「{productName}」へのオファー</Text>
      <Text style={styles.subtitle}>{chats.length}件のチャット</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#06534B" />
      ) : chats.length === 0 ? (
        <Text style={styles.empty}>まだオファーはありません</Text>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const buyer = item.members.find(m => m !== auth.currentUser.email);
            const displayName = buyerNames[buyer] || ''; // ← 取得前は空文字
            return (
              <TouchableOpacity
                style={styles.chatRow}
                onPress={() => navigation.navigate('Chat', {
                  chatId: item.chatId,
                  productName,
                  seller: auth.currentUser.email,
                  productId,
                })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {displayName ? displayName[0].toUpperCase() : '?'}
                  </Text>
                </View>
                <View style={styles.chatInfo}>
                  {/* 名前が取得できてから表示 */}
                  <Text style={styles.buyerName}>
                    {displayName || '読み込み中...'}
                  </Text>
                  <Text style={styles.chatDate}>タップしてチャットを開く</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 14,
  },
  chatRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#06534B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  buyerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  chatDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
  },
});