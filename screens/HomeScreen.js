import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import styles from '../styles/homestyles';

const products = [
  { id: 1, name: 'デニムジャケット', price: '¥3,800' },
  { id: 2, name: 'レザーバッグ', price: '¥5,200' },
  { id: 3, name: 'スニーカー', price: '¥2,100' },
  { id: 4, name: 'ウールコート', price: '¥8,900' },
];

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.row}>
        {products.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => navigation.navigate('Detail', {
              name: item.name,
              price: item.price,
            })}
          >
            <Image
              source={{ uri: 'https://picsum.photos/200' }}
              style={styles.image}
            />
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.price}>{item.price}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
