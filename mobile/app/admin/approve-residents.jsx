import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../../constants/theme';
import { getPendingResidents, approveResident, rejectResident } from '../../services/api';
import Toast from 'react-native-toast-message';
import { useState, useEffect } from 'react';

export default function ApproveResidents() {
  const router = useRouter();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await getPendingResidents();
      setResidents(res.data.data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to fetch pending residents' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, name) => {
    try {
      await approveResident(id);
      Toast.show({ type: 'success', text1: `${name} Approved! ✅` });
      setResidents(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Approval failed' });
    }
  };

  const handleReject = (id, name) => {
    Alert.alert(
      'Reject Resident',
      `Are you sure you want to REJECT ${name}? This will DELETE their account permanently.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject & Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectResident(id);
              Toast.show({ type: 'info', text1: `${name} Rejected and deleted.` });
              setResidents(prev => prev.filter(r => r._id !== id));
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Rejection failed' });
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Approvals</Text>
        <Text style={styles.headerSub}>{residents.length} new residents waiting</Text>
      </View>

      <FlatList
        data={residents}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={60} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>All caught up! No pending requests.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.residentCard}>
            <View style={styles.resInfo}>
              <Text style={styles.resName}>{item.name}</Text>
              <Text style={styles.resEmail}>{item.email}</Text>
              <View style={styles.row}>
                <Ionicons name="home-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.resFlat}>Flat: {item.flatNumber || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.actions}>
              <TouchableOpacity style={styles.btnApprove} onPress={() => handleApprove(item._id, item.name)}>
                <Ionicons name="checkmark" size={20} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnReject} onPress={() => handleReject(item._id, item.name)}>
                <Ionicons name="trash-outline" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: COLORS.primary, padding: 25, paddingTop: 60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, ...SHADOW },
  backBtn: { marginBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  list: { padding: 20 },
  empty: { marginTop: 100, alignItems: 'center' },
  emptyText: { marginTop: 15, fontSize: 15, color: COLORS.textMuted, fontWeight: '600' },
  residentCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 18, marginBottom: 15, flexDirection: 'row', alignItems: 'center', ...SHADOW },
  resInfo: { flex: 1 },
  resName: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  resEmail: { fontSize: 13, color: COLORS.textMuted, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  resFlat: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10 },
  btnApprove: { backgroundColor: '#2ECC71', width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnReject: { backgroundColor: COLORS.important, width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
