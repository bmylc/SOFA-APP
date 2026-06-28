import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCmt8T8VMQx7bHUSxXbwtwKqobCzSECGoo",
  authDomain: "fleamarketapp-s-database.firebaseapp.com",
  databaseURL: "https://fleamarketapp-s-database-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fleamarketapp-s-database",
  storageBucket: "fleamarketapp-s-database.firebasestorage.app",
  messagingSenderId: "45490144216",
  appId: "1:45490144216:web:41294a20926b23b9b728ad"
};

// 既に初期化済みの場合は既存のアプリを使う
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getApps().length === 0
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : getAuth(app);

console.log('Firebase接続確認:', db ? '接続済み' : '未接続');
console.log('Auth接続確認:', auth ? '接続済み' : '未接続');
