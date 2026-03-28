import { useEffect, createContext, useContext, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { COLORS } from '../constants/theme';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadUser();
    const sub = Notifications.addNotificationResponseReceivedListener(() => {});
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'forgot-password';
    if (user && (segments[0] === 'index' || inAuthGroup || !segments[0])) {
      router.replace('/home');
    } else if (!user && !inAuthGroup && segments[0] !== 'index' && segments[0]) {
      router.replace('/');
    }
  }, [user, loading, segments]);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setLoading(false);
  };

  const login = async (userData) => {
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('token', userData.token);
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['user', 'token']);
    setUser(null);
  };

  const updateUser = async (newData) => {
    const updatedUser = { ...user, ...newData };
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="home" />
        <Stack.Screen name="notice-detail" />
        <Stack.Screen name="post-notice" />
        <Stack.Screen name="ack-list" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="password-requests" />
        <Stack.Screen name="complaints" />
        <Stack.Screen name="post-complaint" />
        <Stack.Screen name="directory" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="visitors" />
      </Stack>
      <Toast />
    </AuthContext.Provider>
  );
}