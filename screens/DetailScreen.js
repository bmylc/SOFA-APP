import { View, Text, Image } from 'react-native';
import styles from '../styles/detailstyles';

export default function DetailScreen({ route }) {
  const { name, price } = route.params;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://picsum.photos/400' }}
        style={styles.image}
      />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.price}>{price}</Text>
    </View>
  );
}
