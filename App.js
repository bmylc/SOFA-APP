import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FavoritesProvider } from './context/FavoritesContext';
import HomeScreen from './screens/HomeScreen';
import DetailScreen from './screens/DetailScreen';
import products from './products';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <FavoritesProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home"
           component={HomeScreen}
           options={{ title: '商品一覧' }} />
          <Stack.Screen name="Detail"
           component={DetailScreen}
           options={({route}) => ({
            title: route.params.name,
            headerStyle: {
              backgroundColor: '#fff'
            },
            headerTintColor: '#333'
           })} />
        </Stack.Navigator>
      </NavigationContainer>
    </FavoritesProvider>
  );
}
