import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Image, TouchableOpacity, ActivityIndicator, Linking
} from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdvertiserDetailScreen({ route, navigation }) {
  const { advertiserId, category } = route.params;
  const [advertiser, setAdvertiser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (advertiserId) {
      // IDで直接取得
      const unsubscribe = onSnapshot(doc(db, 'advertisers', advertiserId), (snap) => {
        if (snap.exists()) {
          setAdvertiser({ id: snap.id, ...snap.data() });
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // カテゴリで検索（単一事業者の場合）
      const q = query(
        collection(db, 'advertisers'),
        where('category', '==', category),
        where('isActive', '==', true)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          setAdvertiser({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        }
        setLoading(false);
      });
      return unsubscribe;
    }
  }, [advertiserId, category]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06534B" />
      </View>
    );
  }

  if (!advertiser) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.empty}>情報が見つかりませんでした</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
      </View>

      {/* 画像 */}
      <Image
        source={{ uri: advertiser.imageUrl || 'https://picsum.photos/400' }}
        style={styles.image}
      />

      {/* 基本情報 */}
      <View style={styles.section}>
        <Text style={styles.name}>{advertiser.name}</Text>
        <Text style={styles.description}>{advertiser.description}</Text>
      </View>

      {/* 営業時間 */}
      {advertiser.businessHours && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>営業時間</Text>
          <Text style={styles.sectionContent}>🕐 {advertiser.businessHours}</Text>
        </View>
      )}

      {/* メニュー */}
      {advertiser.menu && advertiser.menu.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>メニュー</Text>
          {advertiser.menu.map((item, index) => (
            <View key={index} style={styles.menuItem}>
              <Text style={styles.menuBullet}>•</Text>
              <Text style={styles.menuText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* リンク */}
      {advertiser.link && (
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => Linking.openURL(advertiser.link)}
        >
          <Text style={styles.linkButtonText}>🔗 詳細ページを開く</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  container: {
    backgroundColor: '#f5f5f5',
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 48,
  },
  backButton: {
    fontSize: 16,
    color: '#06534B',
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 250,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: 15,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  menuBullet: {
    fontSize: 15,
    color: '#06534B',
    fontWeight: 'bold',
  },
  menuText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  linkButton: {
    backgroundColor: '#06534B',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  empty: {
    fontSize: 14,
    color: '#999',
  },
});