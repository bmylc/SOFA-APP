import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Image, StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { uploadImage } from '../utils/uploadImage';
import { showError } from '../utils/errorHandler';
import { validatePrice, validateProductName, validateDescription, getPriceLimit } from '../utils/validators';
import locations from '../data/locations.json';

const CONDITIONS = [
  '未使用に近い',
  '目立った傷や汚れなし',
  'やや傷や汚れあり',
  '傷や汚れあり',
];

const CATEGORIES = [
  '教科書',
  '参考書',
  'スマホ・タブレット',
  'PC',
  '授業に必要な衣類・道具',
  '文房具',
  '衣類(メンズ)',
  '衣類(レディース)',
  'その他',
];

export default function SellScreen({ navigation }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [meetupLocation, setMeetupLocation] = useState(null); // ← 選択した建物
  const [meetupDetail, setMeetupDetail] = useState('');       // ← 自由記述
  const [showOtherInput, setShowOtherInput] = useState(false);

  // 場所選択ハンドラー
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

  const priceLimit = getPriceLimit(category);

  const handleSell = async () => {
    const nameError = validateProductName(name);
    if (nameError) { Alert.alert('エラー', nameError); return; }

    const priceError = validatePrice(price);
    if (priceError) { Alert.alert('エラー', priceError); return; }

    const descriptionError = validateDescription(description);
    if (descriptionError) { Alert.alert('エラー', descriptionError); return; }

    if (!imageBase64) {
      Alert.alert('エラー', '商品画像を選択してください');
      return;
    }

    if (!meetupLocation) {
      Alert.alert('エラー', '受け渡し場所を選択してください');
      return;
    }


  setLoading(true);
  try {
    const imageUrl = await uploadImage(imageBase64);
    await addDoc(collection(db, 'products'), {
      name: name.trim(),
      price: parseInt(price),
      description: description.trim(),
      condition,
      category,
      imageUrl,
      seller: auth.currentUser.email,
      status: 'available',
      meetupLocation: meetupLocation.name,   // ← 建物名
      meetupDetail: meetupDetail.trim(),      // ← 自由記述
      createdAt: serverTimestamp(),
    });
    Alert.alert('成功', '出品しました！', [
      {
        text: 'OK', onPress: () => {
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
    showError(error, handleSell); // ← 再試行ボタン付きエラー
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
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.sectionTitle}>カテゴリ</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {CATEGORIES.filter(c => c !== 'すべて').map((c) => (
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

      <Text style={styles.sectionTitle}>価格（円）</Text>
      <TextInput
        style={styles.input}
        placeholder="例：3800"
        placeholderTextColor="#999"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />
      
      {/* ← 上限金額をリアルタイム表示 */}
      <View style={styles.priceLimitContainer}>
        <Text style={styles.priceLimitText}>
          このカテゴリの出品上限：¥{priceLimit.toLocaleString()}
        </Text>
        {price && !isNaN(price) && parseInt(price) > priceLimit && (
          <Text style={styles.priceLimitError}>
            ⚠️ 上限を超えています
          </Text>
        )}
      </View>

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
        placeholderTextColor="#999"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

    {/* 受け渡し場所 */}
    <Text style={styles.sectionTitle}>
      受け渡し希望場所
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

    {/* その他を選んだときだけテキストボックス */}
    {showOtherInput && (
      <View style={styles.otherInputContainer}>
        <Text style={styles.sectionTitle}>場所を入力してください</Text>
        <TextInput
          style={styles.input}
          placeholder="例：大宮駅"
          value={meetupDetail}
          onChangeText={setMeetupDetail}
        />
      </View>
    )}

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
    backgroundColor: '#fff', // ← 白背景を明示的に指定
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 0.5,
    borderColor: '#ddd',
    color: '#333',
    placeholderTextColor:'#333' ,// ← 入力文字色も明示的に指定
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
  sellButton: {
    backgroundColor: '#06534B',
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
  categoryButton: {
  backgroundColor: '#fff',
  borderRadius: 20,
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderWidth: 0.5,
  borderColor: '#ddd',
  },
  categoryButtonActive: {
  backgroundColor: '#06534B',
  borderColor: '#06534B',
  },
  categoryText: {
  fontSize: 13,
  color: '#333',
  },
  categoryTextActive: {
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
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  locationButtonActive: {
    backgroundColor: '#06534B',
    borderColor: '#06534B',
  },
  locationButtonText: {
    fontSize: 13,
    color: '#333',
  },
  locationButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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
});