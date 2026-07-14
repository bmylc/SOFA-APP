import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // ← 追加
import { deleteDoc, doc, onSnapshot, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { useFavorites } from '../context/FavoritesContext';

export default function DetailScreen({ route, navigation }) {
  const { id, name, price, description, seller, condition, imageUrl, meetupLocation, meetupDetail } = route.params;
  const [status, setStatus] = useState('available');
  const [hasChat, setHasChat] = useState(false);   // 売約済みでも自分のチャットがあれば確認できる
  const [chatInfo, setChatInfo] = useState(null);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const liked = isFavorite(id);
  const isMyProduct = auth.currentUser.email === seller; // ← 自分の商品か判定

  // ステータスをリアルタイムで監視（Hooks はコンポーネントの直下で呼ぶ）
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'products', id), (snap) => {
      if (snap.exists()) {
        setStatus(snap.data().status || 'available');
      }
    });
    return unsubscribe;
  }, [id]);

  // 自分（買い手）が既にこの商品のチャットを持っているか確認
  useEffect(() => {
    if (isMyProduct) return;
    const checkChat = async () => {
      const currentUser = auth.currentUser;
      const myChatId = [currentUser.uid, seller].sort().join('_') + '_' + id;
      const chatRef = collection(db, 'chats');
      const q = query(chatRef, where('chatId', '==', myChatId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setHasChat(true);
        setChatInfo(snapshot.docs[0].data());
      }
    };
    checkChat();
  }, [id]);

  const handleContact = async () => {
    const currentUser = auth.currentUser;

    if (isMyProduct) {
      // 出品者の場合：この商品のチャットを全件検索
      const chatRef = collection(db, 'chats');
      const q = query(chatRef, where('productId', '==', id));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert('お知らせ', 'まだ誰もチャットを開始していません');
        return;
      }

      if (snapshot.docs.length === 1) {
        // チャットが1件のみはそのまま移動
        const chatData = snapshot.docs[0].data();
        navigation.navigate('Chat', {
          chatId: chatData.chatId,
          productName: name,
          seller,
          productId: id,
        });
      } else {
        // 複数の場合はオファー一覧へ
        navigation.navigate('ChatList', {
          productId: id,
          productName: name,
        });
      }
    } else {
      // 買い手の場合：既存チャットを確認して、なければ新規作成
      const chatId = [currentUser.uid, seller].sort().join('_') + '_' + id;
      const chatRef = collection(db, 'chats');
      const q = query(chatRef, where('chatId', '==', chatId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(chatRef, {
          chatId,
          members: [currentUser.email, seller],
          productId: id,
          productName: name,
          createdAt: serverTimestamp(),
        });
      }

      navigation.navigate('Chat', {
        chatId,
        productName: name,
        seller,
        productId: id,
      });
    }
  };

  const toggleFavorite = () => {
    if (liked) {
      removeFavorite(id);
    } else {
      addFavorite({ id, name, price });
    }
  };

  const handleDelete = () => {
    Alert.alert(
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

  // 出品者（ユーザー）を通報する
  const handleReport = () => {
    Alert.alert(
      'ユーザーを通報',
      `${seller} を通報する理由を選択してください`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '不適切な商品',
          onPress: () => submitReport('不適切な商品'),
        },
        {
          text: '詐欺・偽物',
          onPress: () => submitReport('詐欺・偽物'),
        },
        {
          text: '禁止商品の出品',
          onPress: () => submitReport('禁止商品の出品'),
        },
        {
          text: 'その他',
          onPress: () => submitReport('その他'),
        },
      ]
    );
  };

  const submitReport = async (reason) => {
    try {
      await addDoc(collection(db, 'reports'), {
        reportedUser: seller,
        reportedBy: auth.currentUser.email,
        productId: id,
        productName: name,
        reason,
        status: 'pending', // pending / reviewed / resolved
        createdAt: serverTimestamp(),
      });
      Alert.alert('通報完了', '通報を受け付けました。確認後に対応いたします。');
    } catch (error) {
      Alert.alert('エラー', '通報に失敗しました');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
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

        {/* 売約済みバナー */}
        {status === 'reserved' && (
          <View style={styles.reservedBanner}>
            <Text style={styles.reservedBannerText}>🤝 売約済み・対面取引待ち</Text>
          </View>
        )}
        {status === 'sold' && (
          <View style={styles.soldBanner}>
            <Text style={styles.soldBannerText}>✅ 取引完了</Text>
          </View>
        )}

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

        {/* 受け渡し場所セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>受け渡し場所</Text>
          <View style={styles.meetupContainer}>
            <View style={styles.meetupBadge}>
              <Text style={styles.meetupBadgeText}>
                📍 {meetupLocation || '未設定'}
              </Text>
            </View>
            {meetupDetail ? (
              <Text style={styles.meetupDetail}>{meetupDetail}</Text>
            ) : null}
          </View>
        </View>

        {/* 自分の商品か・ステータスで表示を切り替え */}
        {isMyProduct ? (
          <>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContact}
            >
              <Text style={styles.contactButtonText}>チャットを確認する</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>出品を取り消す</Text>
            </TouchableOpacity>
          </>
        ) : status === 'available' ? (
          <>
            <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
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
            {/* 通報ボタン（他人の商品のみ表示） */}
            {!isMyProduct && (
              <TouchableOpacity
                style={styles.reportButton}
                onPress={handleReport}
              >
                <Text style={styles.reportButtonText}>🚨 このユーザーを通報する</Text>
              </TouchableOpacity>
            )}
          </>
        ) : hasChat ? (
          // 売約済みでもチャットがあれば確認できる
          <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
            <Text style={styles.contactButtonText}>チャットを確認する</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.reservedMessage}>
            <Text style={styles.reservedMessageText}>
              {status === 'reserved'
                ? 'この商品は現在売約済みです'
                : 'この商品の取引は完了しています'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
    color: '#06534B',
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
  reservedBanner: {
    backgroundColor: '#FFE66D',
    padding: 12,
    alignItems: 'center',
  },
  reservedBannerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  soldBanner: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    alignItems: 'center',
  },
  soldBannerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  reservedMessage: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  reservedMessageText: {
    fontSize: 14,
    color: '#999',
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
  favoriteButton: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#06534B',
  },
  favoriteButtonActive: {
    backgroundColor: '#06534B',
  },
  favoriteButtonText: {
    color: '#06534B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  favoriteButtonTextActive: {
    color: '#fff',
  },
  reportButton: {
    margin: 16,
    marginTop: 0,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#ccc',
    fontSize: 13,
  },
  meetupContainer: {
    marginTop: 8,
    gap: 8,
  },
  meetupBadge: {
    backgroundColor: '#FFF3F3',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  meetupBadgeText: {
    fontSize: 15,
    color: '#06534B',
    fontWeight: 'bold',
  },
  meetupDetail: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  deleteButton: {
    backgroundColor: '#fff',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#06534B',
  },
  deleteButtonText: {
    color: '#06534B',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
