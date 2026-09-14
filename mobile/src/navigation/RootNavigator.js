import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import SplashScreen from '../screens/SplashScreen';
import MainTabs from './MainTabs';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrdersScreen from '../screens/OrdersScreen';
import WishlistScreen from '../screens/WishlistScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import StaticPageScreen from '../screens/StaticPageScreen';
import { colors } from '../theme/theme';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { t } = useTranslation();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: '' }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: t('checkout') }} />
        <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: t('orders') }} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ title: t('wishlist') }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: t('login') }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: t('register') }} />
        <Stack.Screen
          name="About"
          component={StaticPageScreen}
          options={{ title: t('about') }}
          initialParams={{ title: t('about'), content: 'MYBRAND متجرك الشامل — قريبًا نضيف كل التفاصيل هنا.' }}
        />
        <Stack.Screen
          name="Contact"
          component={StaticPageScreen}
          options={{ title: t('contact') }}
          initialParams={{ title: t('contact'), content: 'راسلنا على البريد أو تابعنا على وسائل التواصل الاجتماعي.' }}
        />
        <Stack.Screen
          name="Privacy"
          component={StaticPageScreen}
          options={{ title: t('privacy_policy') }}
          initialParams={{
            title: t('privacy_policy'),
            content: 'سنوضح هنا كيف نتعامل مع بياناتك بمجرد جاهزية السياسة النهائية.',
          }}
        />
        <Stack.Screen
          name="Terms"
          component={StaticPageScreen}
          options={{ title: t('terms') }}
          initialParams={{ title: t('terms'), content: 'سنوضح هنا شروط استخدام المتجر بمجرد جاهزيتها.' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
