import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import styles from '../styles/homestyles';
import products from '../products';

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
              description: item.description,
              seller: item.seller,
              condition: item.condition,
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
