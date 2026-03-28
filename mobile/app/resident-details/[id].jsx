import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Linking, Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import { getUserDetails } from '../../services/api';
import { COLORS, SHADOW } from '../../constants/theme';
import Toast from 'react-native-toast-message';

export default function ResidentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🛡️ Privacy Protection: Prevent screenshots
  useEffect(() => {
    async function activate() {
      if (Platform.OS !== 'web') {
        const isAvailable = await ScreenCapture.isAvailableAsync();
        if (isAvailable) {
          await ScreenCapture.preventScreenCaptureAsync();
        }
      }
    }
    activate();

    return () => {
      if (Platform.OS !== 'web') {
        ScreenCapture.allowScreenCaptureAsync();
      }
    };
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await getUserDetails(id);
        setResident(res.data.data);
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Failed to load details' });
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const InfoRow = ({ icon, label, value, onCopy }) => (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || 'Not provided'}</Text>
      </View>
      {onCopy && value && (
        <TouchableOpacity onPress={() => onCopy(value)} style={styles.actionBtn}>
          <Ionicons name="call" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!resident) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resident Profile</Text>
        <View style={styles.privacyBadge}>
          <Ionicons name="shield-checkmark" size={12} color={COLORS.white} />
          <Text style={styles.privacyText}>SECURE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, resident.role === 'admin' && styles.avatarAdmin]}>
            <Ionicons 
              name={resident.role === 'admin' ? 'shield-checkmark' : 'person'} 
              size={40} color={COLORS.white} 
            />
          </View>
          <Text style={styles.name}>{resident.name}</Text>
          <View style={styles.roleChip}>
            <Text style={styles.roleText}>{resident.role.toUpperCase()}</Text>
          </View>
          
          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={16} color={COLORS.important} />
            <Text style={styles.warningText}>Screenshots are disabled for privacy.</Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <InfoRow icon="call-outline" label="Phone Number" value={resident.phone} 
            onCopy={(v) => Linking.openURL(`tel:${v}`)} />
          <InfoRow icon="mail-outline" label="Society Email" value={resident.email} />
          <InfoRow icon="at-outline" label="Personal Email" value={resident.personalEmail} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Residency Details</Text>
          <InfoRow icon="business-outline" label="Society Name" value={resident.societyName} />
          <InfoRow icon="home-outline" label="Flat / Unit Number" value={resident.flatNumber} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <InfoRow icon="transgender-outline" label="Gender" value={resident.gender} />
          <InfoRow icon="calendar-outline" label="Date of Birth" 
            value={resident.dob ? new Date(resident.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : null} />
        </View>

        <Text style={styles.footerNote}>
          Data accessed by: Admin on {new Date().toLocaleString()}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingTop: 55, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  privacyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
  },
  privacyText: { fontSize: 10, fontWeight: '900', color: COLORS.white },
  scroll: { padding: 20 },
  profileCard: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 24, alignItems: 'center',
    marginBottom: 20, ...SHADOW
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12
  },
  avatarAdmin: { backgroundColor: COLORS.accent },
  name: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 6 },
  roleChip: {
    backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 16
  },
  roleText: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1 },
  warningBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#FEE2E2'
  },
  warningText: { fontSize: 11, fontWeight: '700', color: COLORS.important },
  section: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, ...SHADOW
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '800', color: COLORS.primary, marginBottom: 16,
    textTransform: 'uppercase', letterSpacing: 0.5
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  iconBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F7FF',
    justifyContent: 'center', alignItems: 'center'
  },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginBottom: 2 },
  value: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  actionBtn: { padding: 8, backgroundColor: '#F0F7FF', borderRadius: 8 },
  footerNote: {
    textAlign: 'center', fontSize: 10, color: COLORS.textMuted, marginTop: 10, fontStyle: 'italic'
  }
});
