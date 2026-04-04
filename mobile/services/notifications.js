import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { savePushToken } from './api';

// How notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register device for push notifications and save token to backend
 */
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  // Create notification channels for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General Notices',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1565C0',
    });

    await Notifications.setNotificationChannelAsync('important', {
      name: 'Important Notices',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#C62828',
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission denied');
    return null;
  }

  let token;
  try {
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId || '3cc0ff78-81c7-4f59-a470-ee8bdb531926',
    })).data;
  } catch (err) {
    console.error('Push Token Error:', err);
    return null;
  }

  // Save token only if we have an active session
  try {
    const activeToken = await AsyncStorage.getItem('token');
    if (activeToken) {
      await savePushToken(token);
      console.log('Push token synced successfully');
      Toast.show({ type: 'success', text1: 'Push Notifications Active ✅', text2: 'Token synced with account' });
    } else {
      console.warn('No active session, token not synced');
    }
  } catch (err) {
    if (err?.response?.status !== 401) {
      console.warn('Could not save push token:', err.message);
      Toast.show({ type: 'error', text1: 'Push Sync Failed ❌', text2: err.message });
    }
  }


  return token;
}
