import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { forgotPasswordResident, forgotPasswordAdmin } from '../services/api';
import { COLORS } from '../constants/theme';

const ROLES = ['resident', 'admin'];

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [role, setRole] = useState('resident');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !newPassword.trim()) {
      Toast.show({ type: 'error', text1: 'Email and new password are required' });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
      return;
    }
    if (role === 'admin' && !securityKey) {
      Toast.show({ type: 'error', text1: 'Personal Security Key is required for Admins' });
      return;
    }

    setLoading(true);
    try {
      if (role === 'resident') {
        const res = await forgotPasswordResident({ email: email.trim().toLowerCase(), newPassword });
        Toast.show({ type: 'success', text1: 'Request Sent', text2: res.data.message });
      } else {
        const res = await forgotPasswordAdmin({ email: email.trim().toLowerCase(), securityKey, newPassword });
        Toast.show({ type: 'success', text1: 'Success!', text2: res.data.message });
      }
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Failed to submit request' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Ionicons name="lock-open" size={42} color={COLORS.white} />
          <Text style={styles.headerTitle}>Recover Password</Text>
          <Text style={styles.headerSub}>Reset your account access</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>I am a...</Text>
          <View style={styles.roleRow}>
            {ROLES.map(r => (
              <TouchableOpacity key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => setRole(r)}>
                <Ionicons
                  name={r === 'admin' ? 'shield-checkmark-outline' : 'people-outline'}
                  size={18} color={role === r ? COLORS.white : COLORS.primary} />
                <Text style={[styles.roleBtnText, role === r && { color: COLORS.white }]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Email Address *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="you@email.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {role === 'admin' && (
            <>
              <Text style={styles.label}>Personal Security Key *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="shield-checkmark" size={18} color={COLORS.important} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your secret recovery PIN"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                  value={securityKey}
                  onChangeText={setSecurityKey}
                />
              </View>
            </>
          )}

          <Text style={styles.label}>New Password *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter new password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPass}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingRight: 12 }}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnSubmitText}>{role === 'resident' ? 'Send Request to Admin' : 'Reset Password Now'}</Text>}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { flexGrow: 1 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30, gap: 8 },
  backBtn: { position: 'absolute', top: 55, left: 16, padding: 8 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: COLORS.white },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  card: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 28, paddingTop: 32 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 15, color: COLORS.textPrimary },
  btnSubmit: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  btnSubmitText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: COLORS.white },
  roleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
