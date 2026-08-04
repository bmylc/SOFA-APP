import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const FACULTIES = ['選択してください', '文学部', '法学部', '経済学部', '理工学部', '医学部', '工学部', '教育学部', 'その他'];

// NFC 認証で初回ログインした在校生のプロフィール設定（所属は「学生」固定）
export default function NfcProfileScreen({ route, navigation }) {
  const { firebaseUid } = route.params;
  const [name, setName] = useState('');
  const [faculty, setFaculty] = useState(FACULTIES[0]);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('エラー', '氏名を入力してください');
      return;
    }
    if (faculty === '選択してください') {
      Alert.alert('エラー', '学部を選択してください');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', firebaseUid), {
        name: name.trim(),
        faculty,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert('登録完了', 'プロフィールを登録しました！');
    } catch (error) {
      console.error('保存エラー:', error.message);
      Alert.alert('エラー', '保存に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>プロフィール設定</Text>
      <Text style={styles.subtitle}>
        NFC認証により在校生として登録されました。{'\n'}
        氏名と学部を入力してください。
      </Text>

      {/* 所属（固定表示） */}
      <Text style={styles.sectionTitle}>所属</Text>
      <View style={styles.fixedBadge}>
        <Text style={styles.fixedBadgeText}>🎓 学生（在校生認証済み）</Text>
      </View>

      {/* 氏名 */}
      <Text style={styles.sectionTitle}>氏名 *</Text>
      <TextInput
        style={styles.input}
        placeholder="山田 太郎"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
      />

      {/* 学部 */}
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

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>登録する</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  fixedBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#06534B',
  },
  fixedBadgeText: {
    color: '#06534B',
    fontSize: 15,
    fontWeight: 'bold',
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
    height: 55,
    justifyContent: 'center',
  },
  picker: {
    height: 55,
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
