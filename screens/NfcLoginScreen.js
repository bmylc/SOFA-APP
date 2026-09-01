import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { signInWithCustomToken } from 'firebase/auth';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { auth } from '../firebase';
import {
  verifyStudentCard,
} from '../utils/checkEnrollment';

export default function NfcLoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [nfcSupported, setNfcSupported] = useState(true);

  useEffect(() => {
    const checkNfc = async () => {
      try {
        if (!NfcManager) {
          setNfcSupported(false);
          return;
        }
        const supported = await NfcManager.isSupported();
        setNfcSupported(!!supported);
        if (supported) await NfcManager.start();
      } catch (error) {
        console.error('NFC初期化エラー:', error);
        setNfcSupported(false);
      }
    };
    checkNfc();
    return () => {
      if (NfcManager) NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  const handleNfcLogin = async () => {
    setLoading(true);
    setStatus('reading');

    try {
      // Step1: NFCでUIDを読み取る
      await NfcManager.requestTechnology([
        NfcTech.NfcF,
        NfcTech.IsoDep,
        NfcTech.Ndef,
      ]);
      const tag = await NfcManager.getTag();
      if (!tag || !tag.id) throw new Error('学生証の読み取りに失敗しました');

      const uid = tag.id;
      console.log('読み取ったUID:', uid);
      setStatus('verifying');

      // Step2: GASでUID照合＆カスタムトークン取得
      const result = await verifyStudentCard(uid);
      console.log('GAS結果:', JSON.stringify(result));

      if (!result.success) {
        Alert.alert(
          '未登録',
          'この学生証はまだ紐づけられていません。\nマイページから学生証を紐づけてください。'
        );
        setStatus('error');
        return;
      }

      // Step3: カスタムトークンでFirebaseにログイン
      await signInWithCustomToken(auth, result.token);
      setStatus('success');

    } catch (error) {
      console.error('NFCエラー:', error.message);
      Alert.alert('エラー', error.message || 'NFC読み取りに失敗しました');
      setStatus('error');
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => {});
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'reading': return '学生証を読み取り中...';
      case 'verifying': return 'サーバーで確認中...';
      case 'success': return '認証成功！';
      case 'error': return 'もう一度お試しください';
      default: return 'スマホに学生証をかざしてください';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>学生証でログイン</Text>
      <Text style={styles.subtitle}>
        事前にマイページから{'\n'}学生証の紐づけが必要です
      </Text>

      {!nfcSupported ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>このデバイスはNFCに対応していません</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.nfcButton, loading && styles.nfcButtonLoading]}
            onPress={handleNfcLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <Text style={styles.nfcIcon}>🎓</Text>
                <Text style={styles.nfcButtonText}>学生証をかざす</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.statusText}>{getStatusMessage()}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  nfcButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#06534B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    gap: 12,
  },
  nfcButtonLoading: {
    backgroundColor: '#054a43',
  },
  nfcIcon: {
    fontSize: 48,
  },
  nfcButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    marginTop: 24,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
});