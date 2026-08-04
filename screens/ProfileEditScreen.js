import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const AFFILIATIONS = ['学生', '教授・教職員', 'OB・OG', '受験生', 'その他'];
const FACULTIES = ['選択してください','工学部','システム理工学部', 'デザイン工学部','建築学部'];

export default function ProfileEditScreen({ navigation }) {
  const [name, setName] = useState('');
  const [affiliation, setAffiliation] = useState(AFFILIATIONS[0]);
  const [faculty, setFaculty] = useState(FACULTIES[0]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.name || '');
          setAffiliation(data.affiliation || AFFILIATIONS[0]);
          setFaculty(data.faculty || FACULTIES[0]);
        }
      } catch (error) {
        console.error('プロフィール取得エラー:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('エラー', 'ニックネームを入力してください');
      return;
    }
    if ((affiliation === '学生' || affiliation === 'OB・OG') && faculty === '選択してください') {
      Alert.alert('エラー', '学部を選択してください');
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        name: name.trim(),
        email: auth.currentUser.email || '',
        affiliation,
        faculty: (affiliation === '学生' || affiliation === 'OB・OG') ? faculty : '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      Alert.alert('完了', 'プロフィールを更新しました！', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('エラー', '保存に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06534B" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* 氏名 */}
      <Text style={styles.sectionTitle}>ニックネーム *</Text>
      <TextInput
        style={styles.input}
        placeholder="アプリで表示する名前"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
      />

      {/* 所属（プルダウン） */}
      <Text style={styles.sectionTitle}>所属 *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={affiliation}
          onValueChange={(value) => {
            setAffiliation(value);
            setFaculty(FACULTIES[0]); // 所属変更時に学部をリセット
          }}
          style={styles.picker}
        >
          {AFFILIATIONS.map((a) => (
            <Picker.Item key={a} label={a} value={a} />
          ))}
        </Picker>
      </View>

      {/* 学部（学生・OBのみ表示） */}
      {(affiliation === '学生' || affiliation === 'OB・OG') && (
        <>
          <Text style={styles.sectionTitle}>学部 *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={faculty}
              onValueChange={(value) => setFaculty(value)}
              style={styles.picker}
            >
              {FACULTIES.map((f) => (
                <Picker.Item key={f} label={f} value={f} />
              ))}
            </Picker>
          </View>
        </>
      )}

      {/* 保存ボタン */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>保存する</Text>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#f5f5f5',
    padding: 24,
    paddingBottom: 48,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 0.5,
    borderColor: '#ddd',
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#ddd',
    overflow: 'hidden',
    height: 55, // ← 追加
    justifyContent: 'center', // ← 追加
  },
  picker: {
    height: 55, // ← 50から55に変更
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#06534B',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});