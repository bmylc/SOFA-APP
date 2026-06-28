import { StyleSheet } from 'react-native'; // ← 追加

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 0.5,
    borderColor: '#ddd',
    marginTop: 8,
  },
  message: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 14,
  },
});
export default styles; // ← 追加
