import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import styles from '../styles/detailstyles';
import { useFavorites } from '../context/FavoritesContext';

export default function DetailScreen({ route }) {
  const { name, price, description, seller, condition, id } = route.params;

  // ① useFavorites からメソッドを取得
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  // ② liked を定義
  const liked = isFavorite(id);

  // ③ toggleFavorite を定義
  const toggleFavorite = () => {
    if (liked) {
      removeFavorite(id);
    } else {
      addFavorite({ id, name, price });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* 商品画像 */}
      <Image
        source={{ uri: 'https://picsum.photos/400' }}
        style={styles.image}
      />

      {/* 価格と商品名 */}
      <View style={styles.section}>
        <Text style={styles.price}>¥{price.toLocaleString()}</Text>
        <Text style={styles.name}>{name}</Text>
      </View>

      {/* 商品情報 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>商品情報</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>商品の状態</Text>
          <Text style={styles.infoValue}>{condition}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>出品者</Text>
          <Text style={styles.infoValue}>{seller}</Text>
        </View>
      </View>

      {/* 商品説明 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>商品説明</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {/* お気に入りボタン */}
      <TouchableOpacity
        style={[styles.favoriteButton, liked && styles.favoriteButtonActive]}
        onPress={toggleFavorite}
      >
        <Text style={liked ? styles.favoriteActiveButtonText : styles.favoriteButtonText}>
          {liked ? 'お気に入り済み ♥' : 'お気に入りに追加 ♡'}
        </Text>
      </TouchableOpacity>

      {/* 購入ボタン */}
      <TouchableOpacity
        style={styles.buyButton}
        onPress={() => alert('購入手続きへ')}
      >
        <Text style={styles.buyButtonText}>購入する</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}
