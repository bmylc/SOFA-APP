import { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);

  // ログイン中のユーザーのお気に入りをFirestoreからリアルタイム取得
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, 'users', auth.currentUser.uid, 'favorites'),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFavorites(data);
      }
    );

    return unsubscribe;
  }, [auth.currentUser]);

  // お気に入りに追加
  const addFavorite = async (product) => {
    if (!auth.currentUser) return;
    try {
      await setDoc(
        doc(db, 'users', auth.currentUser.uid, 'favorites', product.id),
        {
          name: product.name,
          price: product.price,
          description: product.description || '',
          seller: product.seller || '',
          condition: product.condition || '',
          imageUrl: product.imageUrl || '',
          meetupLocation: product.meetupLocation || '',
          meetupDetail: product.meetupDetail || '',
        }
      );
    } catch (error) {
      console.error('お気に入り追加エラー:', error);
    }
  };

  // お気に入りから削除
  const removeFavorite = async (id) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(
        doc(db, 'users', auth.currentUser.uid, 'favorites', id)
      );
    } catch (error) {
      console.error('お気に入り削除エラー:', error);
    }
  };

  const isFavorite = (id) => {
    return favorites.some((item) => item.id === id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}