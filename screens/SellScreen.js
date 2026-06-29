import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Image, StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { uploadImage } from '../utils/uploadImage';

const CONDITIONS = [
  '未使用に近い',
  '目立った傷や汚れなし',
  'やや傷や汚れあり',
  '傷や汚れあり',
];

export default function SellScreen({ navigation }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
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
      base64: true,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64);
    }
  };

  const handleSell = async () => {
    if (!name || !price || !description || !imageBase64) {
      Alert.alert('エラー', 'すべての項目を入力してください');
      return;
    }
    if (isNaN(price)) {
      Alert.alert('エラー', '価格は数字で入力してください');
      return;
    }
    setLoading(true);
    try {
      // 画像をCloudinaryにアップロード
      const imageUrl = await uploadImage(imageBase64);

      // Firestoreに商品データを保存
      await addDoc(collection(db, 'products'), {
        name,
        price: parseInt(price),
        description,
        condition,
        imageUrl,
        seller: auth.currentUser.email,
        createdAt: serverTimestamp(),
      });

      Alert.alert('成功', '出品しました！', [
        {
          text: 'OK',
          onPress: () => {
            // 入力をリセット
            setName('');
            setPrice('');
            setDescription('');
            setCondition(CONDITIONS[0]);
            setImageUri(null);
            setImageBase64(null);
            navigation.goBack();
          }
        }
      ]);
    } catch (error) {
      Alert.alert('エラー', '出品に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>商品画像</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>タップして画像を選択</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>商品名</Text>
      <TextInput
        style={styles.input}
        placeholder="例：デニムジャケット"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.sectionTitle}>価格（円）</Text>
      <TextInput
        style={styles.input}
        placeholder="例：3800"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <Text style={styles.sectionTitle}>商品の状態</Text>
      <View style={styles.conditionContainer}>
        {CONDITIONS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.conditionButton, condition === c && styles.conditionButtonActive]}
            onPress={() => setCondition(c)}
          >
            <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>商品説明</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="商品の詳細を入力してください"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={styles.sellButton}
        onPress={handleSell}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sellButtonText}>出品する</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  imagePicker: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    minHeight: 200,
  },
  imagePlaceholderText: {
    color: '#999',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  conditionContainer: {
    gap: 8,
  },
  conditionButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  conditionButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  conditionText: {
    fontSize: 14,
    color: '#333',
  },
  conditionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sellButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  sellButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
