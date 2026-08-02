import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [userCache, setUserCache] = useState({});

  // メールアドレスから氏名を取得（キャッシュ付き）
  const getUserName = async (email) => {
    if (!email || email === 'system') return 'システム';

    // キャッシュに存在すればそれを返す
    if (userCache[email]) return userCache[email];

    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const name = snapshot.docs[0].data().name || email;
        setUserCache(prev => ({ ...prev, [email]: name }));
        return name;
      }
    } catch (error) {
      console.error(error);
    }
    return email;
  };

  return (
    <UserContext.Provider value={{ getUserName, userCache }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  return useContext(UserContext);
}