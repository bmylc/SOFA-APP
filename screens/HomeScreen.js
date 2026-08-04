import { useState, useEffect, memo, useCallback} from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, onSnapshot, orderBy, query,getDocs,where } from 'firebase/firestore';
import { db } from '../firebase';
import { isEnrolledStudent } from '../utils/checkEnrollment';

// HomeScreen.js と SearchScreen.js 共通
const ProductCard = memo(function ProductCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl || 'https://picsum.photos/200' }}
          style={styles.image}
        />
        {/* 売約済みバッジ */}
        {item.status === 'reserved' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>売約済み</Text>
          </View>
        )}
        {item.status === 'sold' && (
          <View style={[styles.badge, styles.badgeSold]}>
            <Text style={styles.badgeText}>取引完了</Text>
          </View>
        )}
        {/* ← 在校生バッジ（右上） */}
        {item.isEnrolled && (
          <View style={styles.enrolledBadge}>
            <Text style={styles.enrolledBadgeText}>在校生</Text>
          </View>
        )}
      </View>
      <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.price}>¥{item.price.toLocaleString()}</Text>
    </TouchableOpacity>
  );
});

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc')
    );

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const data = await Promise.all(snapshot.docs.map(async (doc) => {
      const product = { id: doc.id, ...doc.data() };

      // 出品者の在校生判定
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', product.seller)
      );
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        product.isEnrolled = isEnrolledStudent(userData); // ← ここで判定
      } else {
        product.isEnrolled = false;
      }

      return product;
    }));

    setProducts(data);
    setLoading(false);
},
(error) => {
      console.error('Firestoreエラー:', error.message); // ← 追加
      console.error('エラーコード:', error.code); // ← 追加
      setLoading(false);
    }
);

    return unsubscribe;
  }, []);
  
  const handlePressProduct = useCallback((item) => {
    navigation.navigate('Detail', {
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description,
      seller: item.seller,
      condition: item.condition,
      imageUrl: item.imageUrl,
      meetupLocation: item.meetupLocation || '未設定', // ← 追加
      meetupDetail: item.meetupDetail || '',            // ← 追加
    });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06534B" />
      </View>
    );
  }
  
  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.container}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={
        <Text style={styles.title}>商品一覧</Text>
      }
      renderItem={({ item }) => (
        <ProductCard
          item={item}
          onPress={() => handlePressProduct(item)}
        />
      )}
      windowSize={5}
      maxToRenderPerBatch={10}
      initialNumToRender={10}
      removeClippedSubviews={true}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#f0f0f0',
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    padding: 8,
    marginBottom: 8,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    flex: 1,
    elevation: 4,
    maxWidth:'49%',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  productName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#06534B',
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFE66D',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeSold: {
    backgroundColor: '#4ECDC4',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },
  enrolledBadge: {
  position: 'absolute',
  top: 8,
  right: 8, // ← 右上
  backgroundColor: '#06534B',
  paddingVertical: 3,
  paddingHorizontal: 7,
  borderRadius: 8,
},
enrolledBadgeText: {
  fontSize: 10,
  color: '#fff',
  fontWeight: 'bold',
},
});