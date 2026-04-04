import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { COLORS } from '../constants/theme';
import AuthContext from '../context/AuthContext';

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadUser();
    
    // Android Notification Channel Setup
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'General Notices',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: COLORS.primary,
      });
      
      Notifications.setNotificationChannelAsync('important', {
        name: 'Important Notices',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: COLORS.important,
      });
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Import dynamically to avoid circular issues
      const { registerForPushNotifications } = require('../services/notifications');
      registerForPushNotifications();
    }
  }, [user]);

  useEffect(() => {
    // Listener for when a user clicks on a notification
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.noticeId) {
        router.push({ pathname: '/notice-detail', params: { id: data.noticeId } });
      }
    });

    return () => responseSub.remove();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'forgot-password';
    if (user && (segments[0] === 'index' || inAuthGroup || !segments[0])) {
      // Allow developer to stay on home if they are acting as something else
      router.replace(user.role === 'developer' ? '/developer/dashboard' : '/home');
    } else if (!user && !inAuthGroup && segments[0] !== 'index' && segments[0]) {
      router.replace('/');
    }
  }, [user, loading, segments]);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
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
        <Stack.Screen name="pending-approval" />
        <Stack.Screen name="admin/approve-residents" />
        <Stack.Screen name="developer/dashboard" />
      </Stack>
      <Toast />
    </AuthContext.Provider>
  );
}