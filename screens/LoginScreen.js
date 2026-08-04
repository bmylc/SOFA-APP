import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { showError } from '../utils/errorHandler';
import { useNavigation } from '@react-navigation/native';


export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

const handleLogin = async () => {
  if (!email.trim()) {
    Alert.alert('エラー', 'メールアドレスを入力してください');
    return;
  }
  if (!password) {
    Alert.alert('エラー', 'パスワードを入力してください');
    return;
  }
  setLoading(true);
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (error) {
    showError(error); // ← 日本語エラーメッセージ
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ログイン</Text>



      <TextInput
        style={styles.input}
        placeholder="メールアドレス"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="パスワード"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '処理中...' : 'ログイン'}
        </Text>
      </TouchableOpacity>

      {/* ← 学生証ログインボタンを追加 */}
      <TouchableOpacity
        style={styles.nfcButton}
        onPress={() => navigation.navigate('NfcLogin')}
      >
        <Text style={styles.nfcButtonText}>🎓 学生証でログイン</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.link}>アカウントをお持ちでない方はこちら</Text>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 0.5,
    borderColor: '#ddd',
    marginBottom: 12,
    color: '#333',
  },
  button: {
    backgroundColor: '#06534B',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#06534B',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  nfcButton: {
    backgroundColor: '#06534B',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  nfcButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: '#ddd',
  },
  dividerText: {
    fontSize: 13,
    color: '#999',
  },
});