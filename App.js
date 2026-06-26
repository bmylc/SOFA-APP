import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

// 子コンポーネント：商品カード
function ProductCard({ name, price, onLikeChange }) {
  const [liked, setLiked] = useState(false);

  const handlePress = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    onLikeChange(newLiked);// いいね状態
  };

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: 'https://picsum.photos/200' }}
        style={styles.image}
      />
      <Text style={styles.productName}>{name}</Text>
      <Text style={styles.price}>{price}</Text>
      <TouchableOpacity
        style={[styles.button, liked && styles.buttonLiked]}
        onPress={handlePress}
      >
        <Text style={styles.buttonText}>
          {liked ? 'いいね済み ♥' : 'いいね ♡'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// 親コンポーネント
export default function App() {
  const [totalLikes, setTotalLikes] = useState(0);
  const products = [
    { id: 1, name: 'デニムジャケット', price: '¥3,800' },
    { id: 2, name: 'レザーバッグ', price: '¥5,200' },
    { id: 3, name: 'スニーカー', price: '¥2,100' },
    { id: 4, name: 'ウールコート', price: '¥8,900' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>フリマ</Text>
      <Text style={styles.title}>{totalLikes}</Text>
      <View style={styles.row}>
        {products.map((item) => (
          <ProductCard
            key={item.id}
            name={item.name}
            price={item.price}
            onLikeChange={(isLiked) => {
              setTotalLikes(totalLikes => isLiked ? totalLikes + 1 : totalLikes - 1);
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    width: 150,
    elevation: 4,
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
  button: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonLiked: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
