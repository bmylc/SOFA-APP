import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const CATEGORIES = [
  { id: 'coop', name: '生協', icon: '🏪', single: true },
  { id: 'kitchencar', name: 'キッチンカー', icon: '🚚', single: false },
  { id: 'cafeteria', name: '食堂', icon: '🍽', single: true },
  { id: 'bakery', name: 'ベーカリー', icon: '🍞', single: true },
  { id: 'circle', name: '学生団体', icon: '🎓', single: false },
];

export default function CampusScreen({ navigation }) {
  const handleCategoryPress = (category) => {
    if (category.single) {
      // 単一事業者は直接詳細画面へ
      navigation.navigate('AdvertiserDetail', { category: category.id });
    } else {
      // 複数事業者は一覧画面へ
      navigation.navigate('AdvertiserList', {
        category: category.id,
        title: category.name,
      });
    }
  };

  return (
     <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>キャンパス情報</Text>

        {/* 右上にマイページボタン */}
        <TouchableOpacity
        style={styles.myPageButton}
        onPress={() => navigation.navigate('Flea', { screen: 'MyPage' })}
        >
        <Text style={styles.myPageButtonText}>👤 マイページ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>カテゴリを選択してください</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.card}
              onPress={() => handleCategoryPress(category)}
            >
              <Text style={styles.cardIcon}>{category.icon}</Text>
              <Text style={styles.cardName}>{category.name}</Text>
              {!category.single && (
                <Text style={styles.cardSub}>一覧を見る →</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  content: {
    padding: 16,
  },
  myPageButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#06534B',
  },
  myPageButtonText: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    width: '47%',
    gap: 8,
  },
  cardIcon: {
    fontSize: 36,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSub: {
    fontSize: 12,
    color: '#06534B',
  },
});