import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { getPasswordRequests, approvePassword } from '../services/api';
import { COLORS, SHADOW } from '../constants/theme';

export default function PasswordRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await getPasswordRequests();
      setRequests(res.data.data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not fetch requests' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (userId, userName) => {
    try {
      await approvePassword(userId);
      Toast.show({ type: 'success', text1: 'Approved', text2: `${userName}'s password updated!` });
      setRequests(reqs => reqs.filter(r => r._id !== userId));
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to approve' });
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.details}>{item.email}  |  Flat: {item.flatNumber}</Text>
        <Text style={styles.status}>Status: <Text style={{ color: COLORS.accent }}>Pending</Text></Text>
      </View>
      <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item._id, item.name)}>
        <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
        <Text style={styles.approveText}>Approve</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Password Requests</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : requests.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="shield-checkmark" size={60} color={COLORS.border} />
          <Text style={styles.emptyText}>No pending password resets.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', ...SHADOW },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  details: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  status: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  approveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, gap: 6 },
  approveText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyText: { marginTop: 12, fontSize: 16, color: COLORS.textMuted, fontWeight: '600' },
});
