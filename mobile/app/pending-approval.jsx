import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOW } from '../constants/theme';
import { getMe } from '../services/api';
import Toast from 'react-native-toast-message';
import { useState } from 'react';

export default function PendingApproval() {
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await getMe();
      if (res.data.data.isApproved) {
        await login(res.data.data);
        Toast.show({ type: 'success', text1: 'Account Approved! Welcome.' });
        router.replace('/home');
      } else {
        Toast.show({ type: 'info', text1: 'Still pending admin approval.' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to refresh status.' });
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="time-outline" size={50} color={COLORS.primary} />
        </View>
        
        <Text style={styles.title}>Account Pending</Text>
        <Text style={styles.subtitle}>
          Your registration for <Text style={{fontWeight: '700', color: COLORS.primary}}>{user?.societyName}</Text> is currently 
          waiting for Admin verification.
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.textMuted} />
          <Text style={styles.infoText}>
            You will get full access once the society manager approves your account.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.btn, checking && { opacity: 0.7 }]} 
          onPress={checkStatus}
          disabled={checking}
        >
          <Text style={styles.btnText}>{checking ? 'Checking...' : 'Refresh Status'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
          <Text style={styles.btnLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: COLORS.white, borderRadius: 30, padding: 30, alignItems: 'center', ...SHADOW },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 10 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  infoBox: { flexDirection: 'row', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, gap: 10, marginBottom: 30 },
  infoText: { flex: 1, fontSize: 13, color: COLORS.textMuted },
  btn: { backgroundColor: COLORS.primary, width: '100%', paddingVertical: 16, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  btnLogout: { paddingVertical: 10 },
  btnLogoutText: { color: COLORS.important, fontWeight: '600' }
});
