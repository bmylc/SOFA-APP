import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert, ActivityIndicator
} from 'react-native';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useFavorites } from '../context/FavoritesContext';

export default function MyPageScreen({ navigation }) {
  const { favorites } = useFavorites();
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]); // 選択中のID
  const [selectMode, setSelectMode] = useState(false); // 選択モード

  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      where('seller', '==', auth.currentUser.email)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMyProducts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedIds([]); // 選択モード切替時にリセット
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === myProducts.length) {
      setSelectedIds([]); // 全解除
    } else {
      setSelectedIds(myProducts.map(p => p.id)); // 全選択
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      Alert.alert('エラー', '商品を選択してください');
      return;
    }
    Alert.alert(
      '一括取り消し',
      `${selectedIds.length}件の出品を取り消しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '取り消す',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                selectedIds.map(id => deleteDoc(doc(db, 'products', id)))
              );
              setSelectedIds([]);
              setSelectMode(false);
              Alert.alert('完了', '出品を取り消しました');
            } catch (error) {
              Alert.alert('エラー', '取り消しに失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (id) => {
    Alert.alert(
      '出品取り消し',
      'この商品の出品を取り消しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '取り消す',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'products', id));
              Alert.alert('完了', '出品を取り消しました');
            } catch (error) {
              Alert.alert('エラー', '取り消しに失敗しました');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>マイページ</Text>

      {/* 出品中の商品 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          出品中の商品（{myProducts.length}件）
        </Text>
        {myProducts.length > 0 && (
          <TouchableOpacity onPress={toggleSelectMode}>
            <Text style={styles.selectModeButton}>
              {selectMode ? 'キャンセル' : '選択'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 選択モード時のツールバー */}
      {selectMode && (
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={selectAll}>
            <Text style={styles.toolbarButton}>
              {selectedIds.length === myProducts.length ? '全解除' : '全選択'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.selectedCount}>
            {selectedIds.length}件選択中
          </Text>
          <TouchableOpacity
            style={[styles.bulkDeleteButton, selectedIds.length === 0 && styles.bulkDeleteButtonDisabled]}
            onPress={handleBulkDelete}
          >
            <Text style={styles.bulkDeleteButtonText}>一括取り消し</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#FF6B6B" />
      ) : myProducts.length === 0 ? (
        <Text style={styles.empty}>出品中の商品はありません</Text>
      ) : (
        myProducts.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.productRow,
              selectedIds.includes(item.id) && styles.productRowSelected
            ]}
            onPress={() => {
              if (selectMode) {
                toggleSelect(item.id);
              } else {
                navigation.navigate('Detail', {
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  description: item.description,
                  seller: item.seller,
                  condition: item.condition,
                  imageUrl: item.imageUrl,
                });
              }
            }}
            onLongPress={() => {
              if (!selectMode) {
                setSelectMode(true);
                toggleSelect(item.id);
              }
            }}
          >
            {/* チェックボックス */}
            {selectMode && (
              <View style={[
                styles.checkbox,
                selectedIds.includes(item.id) && styles.checkboxSelected
              ]}>
                {selectedIds.includes(item.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            )}

            <Image
              source={{ uri: item.imageUrl || 'https://picsum.photos/200' }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>
                ¥{item.price.toLocaleString()}
              </Text>
            </View>

            {!selectMode && (
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate('EditProduct', {
                    product: {
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      description: item.description,
                      condition: item.condition,
                      category: item.category,
                      imageUrl: item.imageUrl,
                      meetupLocation: item.meetupLocation,
                      meetupDetail: item.meetupDetail,
                    }
                  })}
                >
                  <Text style={styles.editButtonText}>編集</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={styles.deleteButtonText}>取り消し</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}

      {/* お気に入り */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
        お気に入り（{favorites.length}件）
      </Text>
      {favorites.length === 0 ? (
        <Text style={styles.empty}>お気に入りはまだありません</Text>
      ) : (
        favorites.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>¥{item.price.toLocaleString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
  },
  selectModeButton: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
  },
  toolbarButton: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
  },
  bulkDeleteButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  bulkDeleteButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bulkDeleteButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 16,
    marginBottom: 16,
    fontSize: 14,
  },
  productRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
  },
  productRowSelected: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: 'bold',
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4ECDC4',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editButtonText: {
    color: '#4ECDC4',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
