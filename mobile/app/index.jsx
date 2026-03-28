import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { padding: 0, backgroundColor: 'transparent', shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20 }]}>
        <Image source={require('../assets/icon.png')} style={{width: 140, height: 140, borderRadius: 36}} />
      </View>
      <Text style={styles.title}>SocietySphere</Text>
      <Text style={styles.subtitle}>Official notices for your society,{'\n'}delivered instantly to your phone.</Text>

      <View style={styles.featureRow}>
        {[
          { icon: 'alert-circle', label: 'Important Alerts' },
          { icon: 'language', label: 'Hindi · Marathi' },
          { icon: 'checkmark-circle', label: 'Acknowledge' },
        ].map((f) => (
          <View key={f.label} style={styles.featureItem}>
            <Ionicons name={f.icon} size={24} color={COLORS.accent} />
            <Text style={styles.featureLabel}>{f.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/login')}>
        <Text style={styles.btnPrimaryText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push('/register')}>
        <Text style={styles.btnSecondaryText}>Create Account</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>SMT. Indira Gandhi College of Engineering</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  iconWrap: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 40,
    padding: 22,
    marginBottom: 20,
  },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.white, letterSpacing: 0.5 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  featureRow: { flexDirection: 'row', gap: 24, marginVertical: 36 },
  featureItem: { alignItems: 'center', gap: 6 },
  featureLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600', textAlign: 'center' },
  btnPrimary: {
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  btnSecondary: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  footer: { position: 'absolute', bottom: 30, fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
});
