import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOW } from '../constants/theme';
import { devSwitchContext } from '../services/api';
import Toast from 'react-native-toast-message';

import { useRouter } from 'expo-router';

export default function DevBanner() {
  const { user, updateUser } = useAuth();
  const router = useRouter();

  const isDevAccount = user?.email?.endsWith('@societysphere.com');
  if (!isDevAccount) return null;

  const resetToDev = async () => {
    try {
      const res = await devSwitchContext('developer', 'Developer HQ');
      await updateUser(res.data.data);
      Toast.show({ type: 'success', text1: 'Developer Context Restored' });
      router.replace('/developer/dashboard');
    } catch {
      Toast.show({ type: 'error', text1: 'Reset failed' });
    }
  };

  return (
    <View style={styles.banner}>
      <TouchableOpacity style={styles.content} onPress={() => router.replace('/developer/dashboard')}>
        <Ionicons name="construct" size={14} color={COLORS.white} />
        <Text style={styles.text}>
          <Text style={styles.bold}>{user.role.toUpperCase()}</Text> | {user.societyName}
        </Text>
        <Ionicons name="open-outline" size={12} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.resetBtn} onPress={resetToDev}>
        <Text style={styles.resetText}>RESET</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 40, left: 20, right: 20, zIndex: 10000,
    backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', padding: 8, paddingHorizontal: 12,
    justifyContent: 'space-between', borderLeftWidth: 4, borderLeftColor: COLORS.important,
    ...SHADOW
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { color: COLORS.white, fontSize: 11, fontWeight: '500' },
  bold: { fontWeight: '900', color: COLORS.important },
  resetBtn: { backgroundColor: COLORS.important, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  resetText: { color: COLORS.white, fontSize: 10, fontWeight: '900' }
});
