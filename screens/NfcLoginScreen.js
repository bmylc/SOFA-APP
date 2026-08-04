import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { signInWithCustomToken } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { auth, db } from '../firebase';
import {
  verifyStudentCard,
  checkUserExists,
} from '../utils/checkEnrollment';

export default function NfcLoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle / reading / verifying / success / error
  const [nfcSupported, setNfcSupported] = useState(true);

  useEffect(() => {
    const checkNfc = async () => {
      try {
        if (!NfcManager) {
          setNfcSupported(false);
          return;
        }
        const supported = await NfcManager.isSupported();
        console.log('NFC対応:', supported);
        setNfcSupported(!!supported);
        if (supported) {
          await NfcManager.start();
          console.log('NFC初期化完了');
        }
      } catch (error) {
        console.error('NFC初期化エラー:', error);
        setNfcSupported(false);
      }
    };
    checkNfc();

    // クリーンアップ
    return () => {
      if (NfcManager) NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  const handleNfcLogin = async () => {
    setLoading(true);
    setStatus('reading');

    try {
      console.log('ステップ1: NFC開始');

      // FeliCa を基本に、IsoDep / Ndef も候補にする
      await NfcManager.requestTechnology([
        NfcTech.NfcF,      // FeliCa
        NfcTech.IsoDep,    // ISO14443
        NfcTech.Ndef,      // NDEF
      ]);
      console.log('ステップ2: テクノロジー取得成功');

      const tag = await NfcManager.getTag();
      console.log('ステップ3: タグ:', JSON.stringify(tag));
      if (!tag || !tag.id) throw new Error('学生証の読み取りに失敗しました');

      const uid = tag.id;
      console.log('ステップ4: UID:', uid);
      setStatus('verifying');

      // Step2: GASで在校生確認＆カスタムトークン取得
      const result = await verifyStudentCard(uid);

      if (!result.success) {
        Alert.alert('認証失敗', result.message || '在校生として確認できませんでした');
        setStatus('error');
        return;
      }

      // Step3: カスタムトークンでFirebaseにログイン
      const userCredential = await signInWithCustomToken(auth, result.token);
      const firebaseUid = userCredential.user.uid;

      console.log('FirebaseUID:', firebaseUid);
      const exists = await checkUserExists(firebaseUid);
      console.log('ユーザー存在確認:', exists);

      setStatus('success');

      if (!exists) {
        // 初回ログイン：基本情報を自動保存してプロフィール設定へ
        await setDoc(doc(db, 'users', firebaseUid), {
          email: auth.currentUser?.email || '',
          affiliation: '学生', // ← 学生固定
          cardUid: uid,
          isEnrolled: true, // ← 在校生フラグ
          enrolledAt: new Date().toISOString(), // ← 在校生認証日時
          createdAt: new Date().toISOString(),
        });
        navigation.navigate('NfcProfile', { firebaseUid, cardUid: uid });
      } else {
        // 2回目以降：在校生フラグを更新
        await updateDoc(doc(db, 'users', firebaseUid), {
          isEnrolled: true,
          enrolledAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('NFCエラー:', error.message);
      Alert.alert('エラー', error.message || 'NFC読み取りに失敗しました');
      setStatus('error');
    } finally {
      // 必ずキャンセル処理を実行
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
    marginBottom: 48,
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
