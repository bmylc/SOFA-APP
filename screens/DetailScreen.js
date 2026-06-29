import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { deleteDoc, doc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useFavorites } from '../context/FavoritesContext';

export default function DetailScreen({ route, navigation }) {
  const { id, name, price, description, seller, condition, imageUrl } = route.params;
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const liked = isFavorite(id);
  const isMyProduct = auth.currentUser.email === seller; // ← 自分の商品か判定

  const toggleFavorite = () => {
    if (liked) {
      removeFavorite(id);
    } else {
      addFavorite({ id, name, price });
    }
  };

  // 出品者とのチャットを開く（なければ作成）
  const handleContact = async () => {
    const currentUser = auth.currentUser;
    const chatId = [currentUser.uid, seller].sort().join('_') + '_' + id;

    // チャットが既に存在するか確認
    const chatRef = collection(db, 'chats');
    const q = query(chatRef, where('chatId', '==', chatId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // 新規チャット作成
      await addDoc(chatRef, {
        chatId,
        members: [currentUser.email, seller],
        productId: id,
        productName: name,
        createdAt: serverTimestamp(),
      });
    }

    navigation.navigate('Chat', { chatId, productName: name, seller });
  };

  const handleDelete = () => {    Alert.alert(
      '出品取り消し',
      'この商品の出品を取り消しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '取り消す',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'products', id));
              Alert.alert('完了', '出品を取り消しました', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              Alert.alert('エラー', '取り消しに失敗しました');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 商品画像 */}
      <Image
        source={{ uri: imageUrl || 'https://picsum.photos/400' }}
        style={styles.image}
      />

      {/* 価格と商品名 */}
      <View style={styles.section}>
        <Text style={styles.price}>¥{price.toLocaleString()}</Text>
        <Text style={styles.name}>{name}</Text>
      </View>

      {/* 商品情報 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>商品情報</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>商品の状態</Text>
          <Text style={styles.infoValue}>{condition}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>出品者</Text>
          <Text style={styles.infoValue}>{seller}</Text>
        </View>
      </View>

      {/* 商品説明 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>商品説明</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {/* 自分の商品かどうかで表示を切り替え */}
      {isMyProduct ? (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>出品を取り消す</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContact}
          >
            <Text style={styles.contactButtonText}>出品者に連絡する</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.favoriteButton, liked && styles.favoriteButtonActive]}
            onPress={toggleFavorite}
          >
            <Text style={[styles.favoriteButtonText, liked && styles.favoriteButtonTextActive]}>
              {liked ? 'お気に入り済み ♥' : 'お気に入りに追加 ♡'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buyButton}
            onPress={() => alert('購入手続きへ')}
          >
            <Text style={styles.buyButtonText}>購入する</Text>
          </TouchableOpacity>
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    paddingBottom: 32,
  },
  image: {
    width: '100%',
    height: 300,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  contactButton: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  contactButtonText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  favoriteButton: {    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  favoriteButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  favoriteButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  favoriteButtonTextActive: {
    color: '#fff',
  },
  buyButton: {
    backgroundColor: '#FF6B6B',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#fff',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
