import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// لا تضع أي مفاتيح سرية هنا - فقط رابط الـ API العام
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('mybrand_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
