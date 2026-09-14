import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import SearchScreen from '../screens/SearchScreen';
import CartScreen from '../screens/CartScreen';
import AccountScreen from '../screens/AccountScreen';
import { useCart } from '../context/CartContext';
import { colors } from '../theme/theme';

const Tab = createBottomTabNavigator();

const icons = { Home: '🏠', Categories: '🗂️', Search: '🔍', Cart: '🛒', Account: '👤' };

export default function MainTabs() {
  const { t } = useTranslation();
  const { itemsCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{icons[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('home') }} />
      <Tab.Screen name="Categories" component={CategoriesScreen} options={{ title: t('categories') }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: t('search') }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: t('cart'),
          tabBarBadge: itemsCount > 0 ? itemsCount : undefined,
        }}
      />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: t('account') }} />
    </Tab.Navigator>
  );
}
