import { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { FavoritesProvider } from './context/FavoritesContext';
import { UserProvider } from './context/UserContext';

// 既存の画面
import HomeScreen from './screens/HomeScreen';
import DetailScreen from './screens/DetailScreen';
import SearchScreen from './screens/SearchScreen';
import MyPageScreen from './screens/MyPageScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import SellScreen from './screens/SellScreen';
import ChatScreen from './screens/ChatScreen';
import ChatListScreen from './screens/ChatListScreen';
import EditProductScreen from './screens/EditProductScreen';
import ProfileEditScreen from './screens/ProfileEditScreen';
import BannedScreen from './screens/BannedScreen';
import NfcLoginScreen from './screens/NfcLoginScreen';

// 新規画面
import HomeSelectScreen from './screens/HomeSelectScreen';
import CampusScreen from './screens/CampusScreen';
import AdvertiserListScreen from './screens/AdvertiserListScreen';
import AdvertiserDetailScreen from './screens/AdvertiserDetailScreen';

const Stack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const CampusStackNavigator = createNativeStackNavigator(); // ← 追加
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: '商品一覧' }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="NfcLogin"
        component={NfcLoginScreen}
        options={{
          headerShown: true,
          title: '学生証ログイン',
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#333',
        }}
      />
    </Stack.Navigator>
  );
}

function MainTab() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#06534B',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={({ navigation }) => ({
          title: 'ホーム',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
          headerShown: true,
          headerTitle: 'フリマ',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('HomeSelect')}
              style={{ marginLeft: 16 }}
            >
              <Text style={{ color: '#06534B', fontSize: 14, fontWeight: 'bold' }}>
                ← トップ
              </Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={({ navigation }) => ({
          title: '検索',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔍</Text>,
          headerShown: true,
          headerTitle: '検索',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('HomeSelect')}
              style={{ marginLeft: 16 }}
            >
              <Text style={{ color: '#06534B', fontSize: 14, fontWeight: 'bold' }}>
                ← トップ
              </Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={({ navigation }) => ({
          title: 'マイページ',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
          headerShown: true,
          headerTitle: 'マイページ',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('HomeSelect')}
              style={{ marginLeft: 16 }}
            >
              <Text style={{ color: '#06534B', fontSize: 14, fontWeight: 'bold' }}>
                ← トップ
              </Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen
        name="Sell"
        component={SellScreen}
        options={({ navigation }) => ({
          title: '出品',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📷</Text>,
          headerShown: true,
          headerTitle: '出品する',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('HomeSelect')}
              style={{ marginLeft: 16 }}
            >
              <Text style={{ color: '#06534B', fontSize: 14, fontWeight: 'bold' }}>
                ← トップ
              </Text>
            </TouchableOpacity>
          ),
        })}
      />
    </Tab.Navigator>
  );
}

// ← CampusStack を追加
function CampusStack() {
  return (
    <CampusStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <CampusStackNavigator.Screen name="CampusHome" component={CampusScreen} />
      <CampusStackNavigator.Screen name="AdvertiserList" component={AdvertiserListScreen} />
      <CampusStackNavigator.Screen name="AdvertiserDetail" component={AdvertiserDetailScreen} />
    </CampusStackNavigator.Navigator>
  );
}

function MainScreen() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      {/* ← HomeSelect を最初の画面に */}
      <MainStack.Screen name="HomeSelect" component={HomeSelectScreen} />
      <MainStack.Screen name="Flea" component={MainTab} />
      <MainStack.Screen name="Campus" component={CampusStack} />
      <MainStack.Screen
        name="Detail"
        component={DetailScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params.name,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#333',
        })}
      />
      <MainStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params.productName,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#333',
        })}
      />
      <MainStack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          headerShown: true,
          title: 'オファー一覧',
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#333',
        }}
      />
      <MainStack.Screen
        name="EditProduct"
        component={EditProductScreen}
        options={{
          headerShown: true,
          title: '商品を編集',
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#333',
        }}
      />
      <MainStack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{
          headerShown: true,
          title: 'プロフィール編集',
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#333',
        }}
      />
    </MainStack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('ログインユーザーUID:', user.uid);
        setUser(user);
        setLoading(false);

        const userRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userRef, (snap) => {
          console.log('Firestoreドキュメント存在:', snap.exists());
          if (snap.exists()) {
            setIsBanned(snap.data().banned === true);
          }
        });

        return unsubscribeUser;
      } else {
        setUser(null);
        setIsBanned(false);
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#06534B" />
      </View>
    );
  }

  return (
    <FavoritesProvider>
      <UserProvider>
        <NavigationContainer>
          {!user ? (
            <AuthStack />
          ) : isBanned ? (
            <BannedScreen />
          ) : (
            <MainScreen />
          )}
        </NavigationContainer>
      </UserProvider>
    </FavoritesProvider>
  );
}