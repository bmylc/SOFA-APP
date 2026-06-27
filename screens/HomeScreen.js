import { useState } from 'react';
import { FlatList } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import styles from '../styles/homestyles';
import products from '../products';

function ProductCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: 'https://picsum.photos/200' }}
        style={styles.image}
      />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.price}>{item.price}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = () => {
    setIsLoading(true);
    // 実際はここでAPIを呼ぶ
    setTimeout(() => {
      setIsLoading(false);
      alert('全件表示済みです！');
    }, 1000);
  };

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      contentContainerStyle={styles.container}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={
        <Text style={styles.title}>商品一覧</Text>
      }
      ListFooterComponent={
        isLoading ? <ActivityIndicator size="large" color="#FF6B6B" /> : null
      }
      renderItem={({ item }) => (
        <ProductCard
          item={item}
          onPress={() => navigation.navigate('Detail', {
            name: item.name,
            price: item.price,
            description: item.description,
            seller: item.seller,
            condition: item.condition,
          })}
        />
      )}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
    />
  );
}
