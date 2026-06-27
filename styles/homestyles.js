import { StyleSheet } from 'react-native'; // ← 追加

const styles = StyleSheet.create({
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
});

export default styles; // ← 追加