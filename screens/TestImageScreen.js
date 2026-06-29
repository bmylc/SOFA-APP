import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../utils/uploadImage';

export default function TestImageScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const pickImage = async () => {
    // まずパーミッションを確認
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('エラー', 'ギャラリーへのアクセスを許可してください');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true, // ← Base64を直接取得する
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64); // ← Base64を保存
    }
  };

  const handleUpload = async () => {
    if (!imageBase64) {
      Alert.alert('エラー', '画像を選択してください');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(imageBase64); // ← Base64を直接渡す
      setUploadedUrl(url);
      Alert.alert('成功', '画像のアップロードが完了しました！');
    } catch (error) {
      Alert.alert('エラー', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>画像アップロードテスト</Text>

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>画像を選択</Text>
      </TouchableOpacity>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.image} />
      )}

      {imageUri && (
        <TouchableOpacity
          style={[styles.button, styles.uploadButton]}
          onPress={handleUpload}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>
            {uploading ? 'アップロード中...' : 'アップロード'}
          </Text>
        </TouchableOpacity>
      )}

      {uploading && <ActivityIndicator size="large" color="#FF6B6B" />}

      {uploadedUrl && (
        <Text style={styles.urlText}>✅ アップロード完了！</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#4ECDC4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  urlText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
});
