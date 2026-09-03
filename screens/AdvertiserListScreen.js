import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Image, ActivityIndicator
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdvertiserListScreen({ route, navigation }) {
  const { category, title } = route.params;
  const [advertisers, setAdvertisers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'advertisers'),
      where('category', '==', category),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAdvertisers(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [category]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#06534B" style={{ marginTop: 32 }} />
      ) : advertisers.length === 0 ? (
        <Text style={styles.empty}>現在登録されている情報はありません</Text>
      ) : (
        <FlatList
          data={advertisers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('AdvertiserDetail', {
                advertiserId: item.id,
                category,
              })}
            >
              <Image
                source={{ uri: item.imageUrl || 'https://picsum.photos/200' }}
                style={styles.image}
              />
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
                {item.businessHours && (
                  <Text style={styles.hours}>🕐 {item.businessHours}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    elevation: 2,
  },
  backButton: {
    fontSize: 16,
    color: '#06534B',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    flexDirection: 'row',
  },
  image: {
    width: 100,
    height: 100,
  },
  info: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  hours: {
    fontSize: 12,
    color: '#06534B',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 48,
    fontSize: 14,
  },
});