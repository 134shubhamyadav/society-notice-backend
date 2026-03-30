import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { login as loginAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [pressCount, setPressCount] = useState(0);

  const handleLogoPress = () => {
    const newCount = pressCount + 1;
    setPressCount(newCount);
    if (newCount >= 5) {
      setDevMode(!devMode);
      setPressCount(0);
      Toast.show({ type: 'info', text1: devMode ? 'Developer Mode OFF' : 'Developer Mode ON 🛠️' });
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter email and password' });
      return;
    }
    setLoading(true);
    try {
      const res = await loginAPI({ email: email.trim().toLowerCase(), password });
      const userData = res.data.data;
      
      await login(userData);

      // REDIRECTION LOGIC
      if (userData.role === 'developer') {
        router.replace('/developer/dashboard');
      } else if (userData.role === 'resident' && !userData.isApproved) {
        router.replace('/pending-approval');
      } else {
        router.replace('/home');
      }
      
      Toast.show({ type: 'success', text1: `Welcome, ${userData.name}!` });
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleLogoPress}>
            <Image source={require('../assets/icon.png')} style={{width: 64, height: 64, borderRadius: 16, marginBottom: 4}} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SocietySphere {devMode && <Text style={{fontSize: 12, color: COLORS.important}}>(DEV)</Text>}</Text>
          <Text style={styles.headerSub}>Login to your account</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back 👋</Text>

          <Text style={styles.label}>Email Address</Text>
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

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingRight: 12 }}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/forgot-password')} style={{ alignItems: 'flex-end', marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnLogin} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.btnLoginText}>Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register')} style={styles.registerLink}>
            <Text style={styles.registerText}>Don't have an account? <Text style={styles.registerBold}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { flexGrow: 1 },
  header: { alignItems: 'center', paddingTop: 70, paddingBottom: 30, gap: 8 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: COLORS.white },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  card: {
    flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 30,
    borderTopRightRadius: 30, padding: 28, paddingTop: 32,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 15, color: COLORS.textPrimary },
  btnLogin: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnLoginText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  registerLink: { alignItems: 'center', marginTop: 20 },
  registerText: { fontSize: 14, color: COLORS.textSecondary },
  registerBold: { color: COLORS.primary, fontWeight: '700' },
});
