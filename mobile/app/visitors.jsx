import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { getVisitors, postVisitor } from '../services/api';
import { useAuth } from './_layout';
import { COLORS, SHADOW } from '../constants/theme';

export default function VisitorsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form state for Admin/Security
  const [form, setForm] = useState({ name: '', phone: '', flatNumber: '', purpose: 'General Visit' });
  const [submitting, setSubmitting] = useState(false);

  const fetchVisitors = async () => {
    try {
      const res = await getVisitors();
      setVisitors(res.data.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not fetch logs' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchVisitors(); }, []));

  const handleAddVisitor = async () => {
    if (!form.name || !form.phone || !form.flatNumber) {
      Toast.show({ type: 'error', text1: 'Name, phone, and flat number required' });
      return;
    }
    setSubmitting(true);
    try {
      await postVisitor(form);
      Toast.show({ type: 'success', text1: 'Visitor Logged', text2: `Passed for Flat ${form.flatNumber}` });
      setShowModal(false);
      setForm({ name: '', phone: '', flatNumber: '', purpose: 'General Visit' });
      fetchVisitors();
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Check connection' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconBox}><Ionicons name="person" size={20} color={COLORS.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.phone}>{item.phone} • Flat {item.flatNumber}</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>{item.status}</Text></View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.purpose}>{item.purpose}</Text>
        <Text style={styles.time}>{new Date(item.entryTime).toLocaleString([], {hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric'})}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user?.role === 'admin' ? 'Security Gate Logs' : 'My Visitors'}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : visitors.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="shield-checkmark-outline" size={60} color={COLORS.border} />
          <Text style={{ color: COLORS.textMuted, marginTop: 10, fontWeight: '700' }}>No visitors recorded yet.</Text>
        </View>
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={v => v._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      )}

      {user?.role === 'admin' && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {showModal && (
        <Modal transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Log New Visitor</Text>
              
              <TextInput style={styles.input} placeholder="Visitor Name" value={form.name} onChangeText={t => setForm({...form, name: t})} />
              <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={form.phone} onChangeText={t => setForm({...form, phone: t})} />
              <TextInput style={styles.input} placeholder="Target Flat (e.g. 101)" value={form.flatNumber} onChangeText={t => setForm({...form, flatNumber: t})} />
              <TextInput style={styles.input} placeholder="Purpose (e.g. Delivery)" value={form.purpose} onChangeText={t => setForm({...form, purpose: t})} />

              <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.border }]} onPress={() => setShowModal(false)}>
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.primary }]} onPress={handleAddVisitor} disabled={submitting}>
                  {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={{ color: COLORS.white, fontWeight: '700' }}>Authorize Entry</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: COLORS.primary, paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  backBtn: { padding: 4 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 12, ...SHADOW },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EBF2FF', justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  phone: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  badge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: COLORS.success, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  purpose: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  time: { fontSize: 12, color: COLORS.textMuted },
  fab: { position: 'absolute', right: 20, bottom: 28, backgroundColor: COLORS.primary, width: 58, height: 58, borderRadius: 30, justifyContent: 'center', alignItems: 'center', ...SHADOW },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 15 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  btn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }
});
