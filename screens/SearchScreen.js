import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, Image,
  TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const CATEGORIES = [
  'すべて', 'レディース', 'メンズ', 'バッグ', 'シューズ', 'アクセサリー', 'その他',
];

// memo で囲んだ ProductCard
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

      <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.price}>¥{item.price.toLocaleString()}</Text>
    </TouchableOpacity>
  );
});

export default function SearchScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('すべて');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // useMemo で絞り込み結果をキャッシュ（useEffect + setFiltered から置き換え）
  const filtered = useMemo(() => {
    let result = products;
    if (category !== 'すべて') {
      result = result.filter(p => p.category === category);
    }
    if (keyword.trim() !== '') {
      result = result.filter(p =>
        p.name.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    return result;
  }, [products, keyword, category]);

  // useCallback で onPress を安定させる
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

  return (
    <View style={styles.container}>

      {/* 検索バー */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="キーワードで検索"
          placeholderTextColor="#999"
          value={keyword}
          onChangeText={setKeyword}
        />
      </View>

      {/* カテゴリフィルター */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(item) => item}
        style={styles.categoryList}
        contentContainerStyle={{ gap: 8, paddingRight: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryButton, category === item && styles.categoryButtonActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* 検索結果 */}
      {loading ? (
        <ActivityIndicator size="large" color="#FF6B6B" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productList}
          columnWrapperStyle={{ gap: 8 }}
          windowSize={5}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <Text style={styles.empty}>該当する商品が見つかりません</Text>
          }
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={() => handlePressProduct(item)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    padding: 12,
    backgroundColor: '#fff',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  categoryList: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
    minHeight: 50,
    maxHeight: 50,
  },
  categoryButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  categoryText: {
    fontSize: 13,
    color: '#333',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  productList: {
    padding: 8,
    gap: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    flex: 1,
    elevation: 2,
    gap: 6,
    maxWidth: '49%',
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 14,
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
