import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>フリマ</Text>

      <View style={styles.card}>
        <Image
          source={{ uri: 'https://picsum.photos/200' }}
          style={styles.image}
        />
        <Text style={styles.productName}>ビンテージデニムジャケット</Text>
        <Text style={styles.price}>¥3,800</Text>
        <TouchableOpacity style={styles.button} onPress={() => alert('いいねしました！')}>
          <Text style={styles.buttonText}>いいね ♡</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    width: 240,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
