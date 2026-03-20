import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// NOTE: Replace with your actual IP address when testing on a physical device.
// 'localhost' works for the iOS simulator, but for Android emulator, use '10.0.2.2'.
const API_URL = "http://10.0.2.2:5002/api/v1";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;