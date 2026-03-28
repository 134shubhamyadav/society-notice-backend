import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { getComplaints, updateComplaint } from '../services/api';
import { useAuth } from './_layout';
import { COLORS, SHADOW } from '../constants/theme';

export default function ComplaintsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = async () => {
    try {
      const res = await getComplaints();
      setComplaints(res.data.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not fetch complaints' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchComplaints(); }, []));

  const handleUpdate = async (status) => {
    setSubmitting(true);
    try {
      await updateComplaint(selected._id, { status, adminReply: replyText });
      Toast.show({ type: 'success', text1: 'Ticket Updated' });
      setSelected(null);
      fetchComplaints();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update ticket' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => {
    const statusColor = item.status === 'Open' ? COLORS.important : item.status === 'In Progress' ? COLORS.primary : COLORS.success;
    return (
      <TouchableOpacity style={styles.card} onPress={() => { setSelected(item); setReplyText(item.adminReply || ''); }}>
        <View style={styles.cardHeader}>
          <Text style={[styles.statusBadge, { backgroundColor: statusColor + '20', color: statusColor }]}>
            {item.status}
          </Text>
          <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{item.category}</Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.metaText}>{item.residentName} ({item.flatNumber})</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Helpdesk</Text>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : complaints.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="construct-outline" size={60} color={COLORS.border} />
          <Text style={styles.emptyText}>No complaints raised.</Text>
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchComplaints(); }} />}
        />
      )}

      {user?.role === 'resident' && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/post-complaint')}>
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Admin Action Modal */}
      {selected && (
        <Modal transparent animationType="fade" visible={!!selected}>
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Manage Ticket</Text>
              <Text style={styles.modalSub}>{selected.title}</Text>
              <Text style={styles.modalDesc}>{selected.description}</Text>
              
              {user?.role === 'admin' ? (
                <>
                  <Text style={styles.label}>Admin Reply</Text>
                  <TextInput
                    style={[styles.input, { height: 80 }]}
                    placeholder="Type response..."
                    value={replyText}
                    onChangeText={setReplyText}
                    multiline
                  />
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.success }]} onPress={() => handleUpdate('Resolved')} disabled={submitting}>
                      <Text style={styles.actionBtnText}>Mark Resolved</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} onPress={() => handleUpdate('In Progress')} disabled={submitting}>
                      <Text style={styles.actionBtnText}>In Progress</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.replyBox}>
                  <Text style={styles.label}>Admin Reply:</Text>
                  <Text style={{ color: COLORS.textPrimary }}>{selected.adminReply || 'No reply yet.'}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  backBtn: { padding: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, marginTop: 10, fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, ...SHADOW },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  dateText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  description: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  metaRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  metaText: { fontSize: 12, color: COLORS.textMuted },
  fab: { position: 'absolute', right: 20, bottom: 28, backgroundColor: COLORS.primary, width: 58, height: 58, borderRadius: 30, justifyContent: 'center', alignItems: 'center', ...SHADOW, elevation: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.white, width: '100%', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  modalDesc: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { color: COLORS.white, fontWeight: '700' },
  closeBtn: { marginTop: 16, paddingVertical: 12, alignItems: 'center' },
  closeBtnText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 15 },
  replyBox: { backgroundColor: '#F5F7FA', padding: 12, borderRadius: 8, marginTop: 10 },
});
