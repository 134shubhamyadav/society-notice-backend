import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { getTrashNotices, restoreTrashNotice, deleteTrashNotice } from '../services/api';
import { COLORS, SHADOW } from '../constants/theme';

export default function TrashBinScreen() {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const res = await getTrashNotices();
      setNotices(res.data.data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load trash' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (id) => {
    Alert.alert('Restore Notice', 'This notice will be moved back to the main board.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', onPress: async () => {
          try {
            await restoreTrashNotice(id);
            Toast.show({ type: 'success', text1: 'Notice restored successfully' });
            fetchTrash();
          } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to restore notice' });
          }
        } 
      }
    ]);
  };

  const handlePermanentDelete = (id) => {
    Alert.alert('Permanent Delete', 'This action cannot be undone. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteTrashNotice(id);
            Toast.show({ type: 'success', text1: 'Notice permanently deleted' });
            fetchTrash();
          } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to delete' });
          }
        } 
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, item.status === 'expired' ? styles.badgeExpired : styles.badgeDeleted]}>
          <Text style={styles.badgeText}>{item.status === 'expired' ? 'Expired' : 'Deleted'}</Text>
        </View>
        <Text style={styles.date}>{new Date(item.archivedAt).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.headline} numberOfLines={2}>{item.headline}</Text>
      <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.restoreBtn} onPress={() => handleRestore(item._id)}>
          <Ionicons name="refresh-outline" size={16} color={COLORS.white} />
          <Text style={styles.btnText}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handlePermanentDelete(item._id)}>
          <Ionicons name="trash-outline" size={16} color={COLORS.important} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trash Bin</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={notices}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="trash-bin-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Trash is empty</Text>
              <Text style={styles.emptySubText}>Notices in trash are deleted after 30 days.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  header: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, gap: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '600', marginTop: 12 },
  emptySubText: { fontSize: 13, color: COLORS.textMuted, marginTop: 6 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16, ...SHADOW },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeExpired: { backgroundColor: '#FFF3E0' },
  badgeDeleted: { backgroundColor: '#FFEBEE' },
  badgeText: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary },
  date: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  headline: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  body: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 12 },
  restoreBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.success, paddingVertical: 10, borderRadius: 8 
  },
  btnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: COLORS.important, paddingVertical: 10, borderRadius: 8
  },
  deleteBtnText: { color: COLORS.important, fontWeight: '600', fontSize: 14 }
});
