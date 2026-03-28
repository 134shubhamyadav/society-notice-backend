import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { getProfileHistory } from '../services/api';
import { COLORS, SHADOW } from '../constants/theme';

export default function ProfileHistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await getProfileHistory();
      setHistory(res.data.data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load history' });
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.userSection}>
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
      
      {item.profileEditHistory.map((log, idx) => (
        <View key={idx} style={styles.historyCard}>
          <View style={styles.logHeader}>
            <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(log.status) }]}>
              {log.status}
            </Text>
            <Text style={styles.logDate}>{new Date(log.at).toLocaleDateString()} at {new Date(log.at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
          </View>
          
          <View style={styles.changesGrid}>
            {log.changes.name && <ChangeRow label="Name" value={log.changes.name} />}
            {log.changes.flatNumber && <ChangeRow label="Flat" value={log.changes.flatNumber} />}
            {log.changes.gender && <ChangeRow label="Gender" value={log.changes.gender} />}
            {log.changes.phone && <ChangeRow label="Phone" value={log.changes.phone} />}
            {log.changes.personalEmail && <ChangeRow label="Email" value={log.changes.personalEmail} />}
            {log.changes.dob && <ChangeRow label="DOB" value={new Date(log.changes.dob).toLocaleDateString()} />}
          </View>
        </View>
      ))}
    </View>
  );

  const ChangeRow = ({ label, value }) => (
    <View style={styles.changeRow}>
      <Text style={styles.changeLabel}>{label}:</Text>
      <Text style={styles.changeValue}>{value}</Text>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return COLORS.success;
      case 'Rejected': return COLORS.important;
      case 'Pending': return COLORS.accent;
      default: return COLORS.primary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Edit History</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="list-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No edit history found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop : 40 },
  header: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, gap: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  userSection: { marginBottom: 24 },
  userName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  userEmail: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  historyCard: { 
    backgroundColor: COLORS.white, borderRadius: 12, padding: 12, 
    marginBottom: 8, ...SHADOW, borderWidth: 1, borderColor: COLORS.border 
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { 
    fontSize: 10, fontWeight: '800', color: COLORS.white, 
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, textTransform: 'uppercase' 
  },
  logDate: { fontSize: 11, color: COLORS.textMuted },
  changesGrid: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 8 },
  changeRow: { flexDirection: 'row', paddingVertical: 2 },
  changeLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, width: 50 },
  changeValue: { fontSize: 12, color: COLORS.textPrimary, fontWeight: '600' },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 12 }
});
