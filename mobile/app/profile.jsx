import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOW } from '../constants/theme';
import { contactSupport } from '../services/api';
import Toast from 'react-native-toast-message';
import { useState } from 'react';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [showSupport, setShowSupport] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');
  const [sending, setSending] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: () => {
          logout();
          router.replace('/');
        }
      }
    ]);
  };

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity 
          onPress={() => router.push('/edit-profile')} 
          style={{ marginLeft: 'auto', padding: 4 }}
        >
          <Ionicons name="create-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons 
              name={user?.role === 'admin' ? 'shield-checkmark' : 'person'} 
              size={42} color={COLORS.white} 
            />
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={[styles.roleBadge, user?.role === 'admin' && styles.roleBadgeAdmin]}>
            <Ionicons
              name={user?.role === 'admin' ? 'shield-checkmark' : 'people'}
              size={13} color={user?.role === 'admin' ? COLORS.accent : COLORS.primary}
            />
            <Text style={[styles.roleText, user?.role === 'admin' && { color: COLORS.accent }]}>
              {user?.role === 'admin' ? 'Society Admin' : 'Resident'}
            </Text>
          </View>
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>
          <InfoRow icon="mail-outline" label="Society Email" value={user?.email} />
          <InfoRow icon="at-outline" label="Personal Email" value={user?.personalEmail} />
          <InfoRow icon="call-outline" label="Phone" value={user?.phone} />
          <InfoRow icon="calendar-outline" label="Date of Birth" value={user?.dob ? new Date(user.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Not set'} />
          <InfoRow icon="business-outline" label="Society" value={user?.societyName} />
          <InfoRow icon="home-outline" label="Flat / Unit" value={user?.flatNumber || 'Not set'} />
          <InfoRow icon="shield-outline" label="Role" value={user?.role === 'admin' ? 'Administrator' : 'Resident'} />
        </View>

        {/* Society Directory & Helpdesk card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Society Features</Text>
          <TouchableOpacity style={styles.directoryBtn} onPress={() => router.push('/directory')}>
            <View style={styles.directoryIconWrap}>
              <Ionicons name="people" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.directoryText}>Resident Directory</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 6 }} />
          <TouchableOpacity style={styles.directoryBtn} onPress={() => router.push('/complaints')}>
            <View style={styles.directoryIconWrap}>
              <Ionicons name="construct" size={18} color={COLORS.important} />
            </View>
            <Text style={styles.directoryText}>Helpdesk Tickets</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 6 }} />
          <TouchableOpacity style={styles.directoryBtn} onPress={() => router.push('/calendar')}>
            <View style={styles.directoryIconWrap}>
              <Ionicons name="calendar" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.directoryText}>Event Calendar</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 6 }} />
          <TouchableOpacity style={styles.directoryBtn} onPress={() => router.push('/visitors')}>
            <View style={styles.directoryIconWrap}>
              <Ionicons name="shield-checkmark" size={18} color={COLORS.primaryDark} />
            </View>
            <Text style={styles.directoryText}>{user?.role === 'admin' ? 'Gate Security Logs' : 'My Visitors'}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 6 }} />
          <TouchableOpacity style={styles.directoryBtn} onPress={() => setShowSupport(true)}>
            <View style={styles.directoryIconWrap}>
              <Ionicons name="help-buoy-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.directoryText}>Contact Developer Support</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {user?.role === 'resident' && (
            <>
              {/* Other resident-specific society features if any */}
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 6 }} />
              <TouchableOpacity style={styles.directoryBtn} onPress={() => router.push('/profile-requests')}>
                <View style={styles.directoryIconWrap}>
                  <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.directoryText}>Profile Edit Requests</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 6 }} />
              <TouchableOpacity style={styles.directoryBtn} onPress={() => router.push('/profile-history')}>
                <View style={styles.directoryIconWrap}>
                  <Ionicons name="time-outline" size={18} color={COLORS.primaryDark} />
                </View>
                <Text style={styles.directoryText}>Profile Edit History</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 6 }} />
              <TouchableOpacity style={styles.directoryBtn} onPress={() => router.push('/trash-bin')}>
                <View style={styles.directoryIconWrap}>
                  <Ionicons name="trash-bin-outline" size={18} color={COLORS.important} />
                </View>
                <Text style={styles.directoryText}>Trash Bin (Expired/Deleted)</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 6 }} />
              <TouchableOpacity style={styles.directoryBtn} onPress={() => router.push('/password-requests')}>
                <View style={styles.directoryIconWrap}>
                  <Ionicons name="key-outline" size={18} color={COLORS.accent} />
                </View>
                <Text style={styles.directoryText}>Password Reset Requests</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* App info card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About App</Text>
          <InfoRow icon="information-circle-outline" label="App Name" value="SocietyNotice" />
          <InfoRow icon="code-slash-outline" label="Version" value="1.0.0" />
          <InfoRow icon="school-outline" label="College" value="SMT. Indira Gandhi College of Engineering" />
          <InfoRow icon="people-outline" label="Project Team" value="SocietySphere Development Team" />
          <InfoRow icon="person-outline" label="Guide" value="Dr. K.T. Patil" />
        </View>

        {/* Developer Shortcut (Only for @societysphere.com users) */}
        {user?.email?.endsWith('@societysphere.com') && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Platform Tools</Text>
            <TouchableOpacity style={styles.directoryBtn} onPress={() => router.replace('/developer/dashboard')}>
              <View style={[styles.directoryIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="construct" size={18} color="#15803D" />
              </View>
              <Text style={styles.directoryText}>Open Developer Portal</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.important} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Support Modal */}
      {showSupport && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Contact Support</Text>
            <Text style={styles.modalSub}>Describe your issue or feedback in detail. Our developers will review it.</Text>
            <TextInput 
              style={styles.modalInput}
              placeholder="How can we help you?"
              multiline
              numberOfLines={4}
              value={supportMsg}
              onChangeText={setSupportMsg}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowSupport(false); setSupportMsg(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSend, sending && { opacity: 0.7 }]} 
                onPress={async () => {
                  if(!supportMsg.trim()) return Toast.show({ type: 'error', text1: 'Message cannot be empty' });
                  setSending(true);
                  try {
                    await contactSupport(supportMsg);
                    Toast.show({ type: 'success', text1: 'Support request sent!' });
                    setShowSupport(false);
                    setSupportMsg('');
                  } catch {
                    Toast.show({ type: 'error', text1: 'Failed to send request' });
                  } finally {
                    setSending(false);
                  }
                }}
                disabled={sending}
              >
                <Text style={styles.modalSendText}>{sending ? 'Sending...' : 'Send Message'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, gap: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: COLORS.white, ...SHADOW,
  },
  avatarText: { fontSize: 36, fontWeight: '900', color: COLORS.white },
  userName: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EBF2FF', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  roleBadgeAdmin: { backgroundColor: '#FFF8E1' },
  roleText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 14, ...SHADOW },
  cardTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EBF2FF', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600', marginTop: 1 },
  directoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  directoryIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E8EAF6', justifyContent: 'center', alignItems: 'center' },
  directoryText: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: COLORS.important, borderRadius: 14, paddingVertical: 14,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.important },
  // Modal Styles
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20, zIndex: 1000 },
  modalCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 25, ...SHADOW },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 8 },
  modalSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20, lineHeight: 18 },
  modalInput: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 15, fontSize: 15, color: COLORS.textPrimary, borderHorizontalWidth: 1, borderColor: '#E9ECEF', textAlignVertical: 'top', minHeight: 120, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#F1F3F5' },
  modalCancelText: { fontWeight: '700', color: COLORS.textSecondary },
  modalSend: { flex: 2, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: COLORS.primary },
  modalSendText: { fontWeight: '700', color: COLORS.white },
});
