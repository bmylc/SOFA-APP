import { useState, useEffect, memo, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

// memo で囲んで、props が変わらないカードは再描画しない
const ProductCard = memo(function ProductCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl || 'https://picsum.photos/200' }}
          style={styles.image}
        />
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
      </View>
      <Text style={styles.productName}>{item.name}</Text>
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Hooks は if (loading) return より前に書く
  const handlePressProduct = useCallback((item) => {
    navigation.navigate('Detail', {
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description,
      seller: item.seller,
      condition: item.condition,
      imageUrl: item.imageUrl,
    });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
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
    maxWidth: '49%',
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
    color: '#FF6B6B',
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
});
