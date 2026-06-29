import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

// 出品者が1つの商品に届いた複数のオファー（チャット）を一覧で確認する画面
export default function ChatListScreen({ route, navigation }) {
  const { productId, productName } = route.params;
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>「{productName}」へのオファー</Text>
      <Text style={styles.subtitle}>{chats.length}件のチャット</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FF6B6B" />
      ) : chats.length === 0 ? (
        <Text style={styles.empty}>まだオファーはありません</Text>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const buyer = item.members.find(m => m !== auth.currentUser.email);
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
                    {buyer ? buyer[0].toUpperCase() : '?'}
                  </Text>
                </View>
                <View style={styles.chatInfo}>
                  <Text style={styles.buyerName}>{buyer}</Text>
                  <Text style={styles.chatDate}>
                    タップしてチャットを開く
                  </Text>
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
    backgroundColor: '#FF6B6B',
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
