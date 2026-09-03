import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeSelectScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* 右上にマイページボタン */}
      <TouchableOpacity
        style={styles.myPageButton}
        onPress={() => navigation.navigate('Flea', { screen: 'MyPage' })}
      >
         <Text style={styles.myPageButtonText}>👤 マイページ</Text>
      </TouchableOpacity>

      <Text style={styles.title}>SOFA</Text>
      <Text style={styles.subtitle}>何をしますか？</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Flea')}
        >
          <Text style={styles.cardIcon}>🛒</Text>
          <Text style={styles.cardTitle}>フリマ</Text>
          <Text style={styles.cardDescription}>
            不用品を売ったり{'\n'}欲しいものを探そう
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Campus')}
        >
          <Text style={styles.cardIcon}>📢</Text>
          <Text style={styles.cardTitle}>キャンパス情報</Text>
          <Text style={styles.cardDescription}>
            生協・食堂・キッチンカー{'\n'}学生団体の情報
          </Text>
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
    padding: 24,
  },
  myPageButton: {
    position: 'absolute',
    top: 48,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#06534B',
    elevation: 2,
  },
  myPageButtonText: {
    color: '#06534B',
    fontSize: 13,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#06534B',
    marginBottom: 8,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 48,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  cardIcon: {
    fontSize: 48,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});