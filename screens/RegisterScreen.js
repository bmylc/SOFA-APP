import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Linking } from 'react-native';

const REGISTER_URL = 'https://script.google.com/macros/s/AKfycbwzyE_55R5mvp2yvuc4w4FSA1NDzISH1UzK-xCVIlXNskBEQvwZyl45mEYJtOaIeFme/exec'; // ← あとで変更するURL

export default function RegisterScreen() {
  const handleOpenBrowser = async () => {
    const supported = await Linking.canOpenURL(REGISTER_URL);
    if (supported) {
      await Linking.openURL(REGISTER_URL);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>会員登録</Text>
      <Text style={styles.description}>
        会員登録はブラウザから行います。{'\n'}
        下のボタンをタップして登録してください。
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleOpenBrowser}>
        <Text style={styles.buttonText}>ブラウザで登録する →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#06534B',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});