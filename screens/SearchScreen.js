import { View, Text, TextInput } from 'react-native';
import styles from '../styles/searchstyles';

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="キーワードで検索"
        placeholderTextColor="#999"
      />
      <Text style={styles.message}>検索結果がここに表示されます</Text>
    </View>
  );
}
