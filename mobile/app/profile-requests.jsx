import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { getProfileRequests, approveProfileRequest } from '../services/api';
import { COLORS, SHADOW } from '../constants/theme';

export default function ProfileRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await getProfileRequests();
      setRequests(res.data.data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load requests' });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (userId, action) => {
    Alert.alert(
      `${action} Request`, 
      `Are you sure you want to ${action.toLowerCase()} this profile change?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: action, style: action === 'Approve' ? 'default' : 'destructive', onPress: async () => {
            try {
              await approveProfileRequest(userId, action);
              Toast.show({ type: 'success', text1: `Request ${action.toLowerCase()}d successfully` });
              fetchRequests();
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Operation failed' });
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Ionicons 
            name="person-circle-outline" 
            size={40} color={COLORS.primary} 
          />
          <View>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.changeTable}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Field</Text>
          <Text style={styles.tableHeaderText}>Current</Text>
          <Text style={styles.tableHeaderText}>Requested</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.fieldName}>Name</Text>
          <Text style={styles.oldValue}>{item.name}</Text>
          <Text style={styles.newValue}>{item.profileEditRequest.changes.name}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.fieldName}>Flat</Text>
          <Text style={styles.oldValue}>{item.flatNumber || '-'}</Text>
          <Text style={styles.newValue}>{item.profileEditRequest.changes.flatNumber || '-'}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.fieldName}>Gender</Text>
          <Text style={styles.oldValue}>{item.gender}</Text>
          <Text style={styles.newValue}>{item.profileEditRequest.changes?.gender || '-'}</Text>
        </View>

        {item.profileEditRequest.changes?.phone && (
          <View style={styles.tableRow}>
            <Text style={styles.fieldName}>Phone</Text>
            <Text style={styles.oldValue}>-</Text>
            <Text style={styles.newValue}>{item.profileEditRequest.changes.phone}</Text>
          </View>
        )}

        {item.profileEditRequest.changes?.personalEmail && (
          <View style={styles.tableRow}>
            <Text style={styles.fieldName}>Email</Text>
            <Text style={styles.oldValue}>-</Text>
            <Text style={styles.newValue}>{item.profileEditRequest.changes.personalEmail}</Text>
          </View>
        )}

        {item.profileEditRequest.changes?.dob && (
          <View style={styles.tableRow}>
            <Text style={styles.fieldName}>DOB</Text>
            <Text style={styles.oldValue}>-</Text>
            <Text style={styles.newValue}>{new Date(item.profileEditRequest.changes.dob).toLocaleDateString()}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.approveBtn} 
          onPress={() => handleAction(item._id, 'Approve')}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} />
          <Text style={styles.btnText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rejectBtn} 
          onPress={() => handleAction(item._id, 'Reject')}
        >
          <Ionicons name="close-circle-outline" size={18} color={COLORS.important} />
          <Text style={styles.rejectBtnText}>Reject</Text>
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
        <Text style={styles.headerTitle}>Profile Edit Requests</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="person-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No pending requests</Text>
              <Text style={styles.emptySubText}>All profile update requests have been processed.</Text>
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
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 16, ...SHADOW },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  userEmail: { fontSize: 12, color: COLORS.textMuted },
  changeTable: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 12, marginBottom: 16 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 6, marginBottom: 8 },
  tableHeaderText: { flex: 1, fontSize: 11, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 4 },
  fieldName: { flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  oldValue: { flex: 1, fontSize: 12, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  newValue: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.success },
  actionRow: { flexDirection: 'row', gap: 12 },
  approveBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.success, paddingVertical: 12, borderRadius: 10 
  },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 2, borderColor: COLORS.important, paddingVertical: 12, borderRadius: 10
  },
  rejectBtnText: { color: COLORS.important, fontWeight: '700', fontSize: 14 }
});
