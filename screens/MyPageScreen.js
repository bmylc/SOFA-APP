import { View, Text } from 'react-native';
import { useFavorites } from '../context/FavoritesContext';
import styles from '../styles/mypagestyles';

export default function MyPageScreen() {
  const { favorites } = useFavorites();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>マイページ</Text>
      <Text style={styles.sectionTitle}>お気に入り（{favorites.length}件）</Text>
      {favorites.length === 0 ? (
        <Text style={styles.empty}>お気に入りはまだありません</Text>
      ) : (
        favorites.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>{item.price}</Text>
          </View>
        ))
      )}
    </View>
  );
}
