import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Image, StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { uploadImage } from '../utils/uploadImage';
import { validatePrice, validateProductName, validateDescription, getPriceLimit } from '../utils/validators';
import { showError } from '../utils/errorHandler';
import locations from '../data/locations.json';

const CONDITIONS = [
  '未使用に近い',
  '目立った傷や汚れなし',
  'やや傷や汚れあり',
  '傷や汚れあり',
];

const CATEGORIES = [
  'レディース', 'メンズ', 'バッグ', 'シューズ', 'アクセサリー', 'その他',
];

export default function EditProductScreen({ route, navigation }) {
  const { product } = route.params;

  // 既存データを初期値として設定
  const [name, setName] = useState(product.name || '');
  const [price, setPrice] = useState(product.price ? String(product.price) : '');
  const [description, setDescription] = useState(product.description || '');
  const [condition, setCondition] = useState(product.condition || CONDITIONS[0]);
  const [category, setCategory] = useState(product.category || CATEGORIES[0]);
  const [imageUri, setImageUri] = useState(product.imageUrl || null);
  const [imageBase64, setImageBase64] = useState(null); // 新しい画像のBase64
  const [meetupLocation, setMeetupLocation] = useState(
    product.meetupLocation
      ? locations.locations.find(l => l.name === product.meetupLocation) || null
      : null
  );
  const [meetupDetail, setMeetupDetail] = useState(product.meetupDetail || '');
  const [showOtherInput, setShowOtherInput] = useState(
    product.meetupLocation === 'その他'
  );
  const [loading, setLoading] = useState(false);

  const priceLimit = getPriceLimit(category);

  const handleLocationSelect = (loc) => {
    setMeetupLocation(loc);
    if (loc.name === 'その他') {
      setShowOtherInput(true);
    } else {
      setShowOtherInput(false);
      setMeetupDetail('');
    }
  };

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

  const handleUpdate = async () => {
    const nameError = validateProductName(name);
    if (nameError) { Alert.alert('エラー', nameError); return; }

    const priceError = validatePrice(price, category);
    if (priceError) { Alert.alert('エラー', priceError); return; }

    const descriptionError = validateDescription(description);
    if (descriptionError) { Alert.alert('エラー', descriptionError); return; }

    if (!meetupLocation) {
      Alert.alert('エラー', '受け渡し場所を選択してください');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = product.imageUrl; // デフォルトは既存画像

      // 新しい画像が選択された場合のみアップロード
      if (imageBase64) {
        imageUrl = await uploadImage(imageBase64);
      }

      await updateDoc(doc(db, 'products', product.id), {
        name: name.trim(),
        price: parseInt(price),
        description: description.trim(),
        condition,
        category,
        imageUrl,
        meetupLocation: meetupLocation.name,
        meetupDetail: meetupDetail.trim(),
        updatedAt: serverTimestamp(), // ← 更新日時を記録
      });

      Alert.alert('完了', '商品情報を更新しました！', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      showError(error, handleUpdate);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* 商品画像 */}
      <Text style={styles.sectionTitle}>商品画像</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlayText}>タップして変更</Text>
            </View>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>タップして画像を選択</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 商品名 */}
      <Text style={styles.sectionTitle}>商品名</Text>
      <TextInput
        style={styles.input}
        placeholder="例：デニムジャケット"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
      />

      {/* カテゴリ */}
      <Text style={styles.sectionTitle}>カテゴリ</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryButton, category === c && styles.categoryButtonActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.categoryText, category === c && styles.categoryTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 価格 */}
      <Text style={styles.sectionTitle}>価格（円）</Text>
      <TextInput
        style={styles.input}
        placeholder="例：3800"
        placeholderTextColor="#999"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />
      <View style={styles.priceLimitContainer}>
        <Text style={styles.priceLimitText}>
          このカテゴリの出品上限：¥{priceLimit.toLocaleString()}
        </Text>
        {price && !isNaN(price) && parseInt(price) > priceLimit && (
          <Text style={styles.priceLimitError}>⚠️ 上限を超えています</Text>
        )}
      </View>

      {/* 商品の状態 */}
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

      {/* 受け渡し場所 */}
      <Text style={styles.sectionTitle}>
        受け渡し希望場所<Text style={styles.required}> *</Text>
      </Text>
      <View style={styles.locationButtons}>
        {locations.locations.map((loc) => (
          <TouchableOpacity
            key={loc.id}
            style={[
              styles.locationButton,
              meetupLocation?.id === loc.id && styles.locationButtonActive
            ]}
            onPress={() => handleLocationSelect(loc)}
          >
            <Text style={[
              styles.locationButtonText,
              meetupLocation?.id === loc.id && styles.locationButtonTextActive
            ]}>
              {loc.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* その他のときだけテキストボックス */}
      {showOtherInput && (
        <View style={styles.otherInputContainer}>
          <Text style={styles.sectionTitle}>場所を入力してください</Text>
          <TextInput
            style={styles.input}
            placeholder="例：大学近くのコンビニ前"
            placeholderTextColor="#999"
            value={meetupDetail}
            onChangeText={setMeetupDetail}
          />
        </View>
      )}

      {/* 商品説明 */}
      <Text style={styles.sectionTitle}>商品説明</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="商品の詳細を入力してください"
        placeholderTextColor="#999"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      {/* 更新ボタン */}
      <TouchableOpacity
        style={styles.updateButton}
        onPress={handleUpdate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.updateButtonText}>更新する</Text>
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
  required: {
    color: '#06534B',
    fontSize: 13,
  },
  imagePicker: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
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
    color: '#333', // ← 入力文字色も明示的に指定
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
    backgroundColor: '#06534B',
    borderColor: '#06534B',
  },
  conditionText: {
    fontSize: 14,
    color: '#333',
  },
  conditionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  locationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationButtonActive: {
    backgroundColor: '#06534B',
    borderColor: '#06534B',
  },
  locationButtonText: {
    fontSize: 13,
    color: '#555',
  },
  locationButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  otherInputContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  priceLimitContainer: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLimitText: {
    fontSize: 12,
    color: '#999',
  },
  priceLimitError: {
    fontSize: 12,
    color: '#06534B',
    fontWeight: 'bold',
  },
  updateButton: {
    backgroundColor: '#06534B',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#06534B',
    borderColor: '#06534B',
  },
  categoryText: {
    fontSize: 13,
    color: '#555',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
