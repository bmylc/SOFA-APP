import './firebase';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { FavoritesProvider } from './context/FavoritesContext';
import HomeScreen from './screens/HomeScreen';
import DetailScreen from './screens/DetailScreen';
import SearchScreen from './screens/SearchScreen';
import MyPageScreen from './screens/MyPageScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ホームのスタックナビゲーター
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: '商品一覧' }}
      />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={({ route }) => ({
          title: route.params.name,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#333',
        })}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <FavoritesProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#FF6B6B',
            tabBarInactiveTintColor: '#999',
            headerShown: false,
          }}
        >
          <Tab.Screen
            name="HomeTab"
            component={HomeStack}
            options={{
              title: 'ホーム',
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
            }}
          />
          <Tab.Screen
            name="Search"
            component={SearchScreen}
            options={{
              title: '検索',
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔍</Text>,
              headerShown: true,
              headerTitle: '検索',
            }}
          />
          <Tab.Screen
            name="MyPage"
            component={MyPageScreen}
            options={{
              title: 'マイページ',
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
              headerShown: true,
              headerTitle: 'マイページ',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </FavoritesProvider>
  );
}
