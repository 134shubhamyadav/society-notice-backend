import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../../constants/theme';
import { getDevSocieties, addSociety, deleteSociety, getSupportTickets, updateTicketStatus, devSwitchContext } from '../../services/api';
import Toast from 'react-native-toast-message';
import { useState, useEffect } from 'react';

export default function DeveloperDashboard() {
  const router = useRouter();
  const { updateUser, logout } = useAuth();
  const [tab, setTab] = useState('societies'); // 'societies', 'support', or 'testing'
  const [societies, setSocieties] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Society Form
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('Maharashtra');

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'societies') {
        const res = await getDevSocieties();
        setSocieties(res.data.data);
      } else {
        const res = await getSupportTickets();
        setTickets(res.data.data);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: `Failed to load ${tab}` });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out of the Developer Portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/login');
      }}
    ]);
  };

  const handleSwitchContext = async (role, societyName) => {
    setLoading(true);
    try {
      const res = await devSwitchContext(role, societyName);
      await updateUser(res.data.data);
      Toast.show({ type: 'success', text1: `Switched to ${role} view!` });
      router.replace('/home');
    } catch {
      Toast.show({ type: 'error', text1: 'Switch failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSociety = async () => {
    if (!newName || !newCity || !newState) return Toast.show({ type: 'error', text1: 'Name, City and State required' });
    try {
      const res = await addSociety({ name: newName, city: newCity, state: newState });
      setSocieties([res.data.data, ...societies]);
      setNewName(''); setNewCity('');
      Toast.show({ type: 'success', text1: 'Society added to dashboard! 🎉' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to add society' });
    }
  };

  const handleDeleteSociety = (id, name) => {
    Alert.alert('Remove Society', `Delete ${name} from the dropdown list?`, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteSociety(id);
          setSocieties(prev => prev.filter(s => s._id !== id));
        } catch { Toast.show({ type: 'error', text1: 'Delete failed' }); }
      }}
    ]);
  };

  const handleUpdateTicket = async (id, status) => {
    try {
      await updateTicketStatus(id, status);
      setTickets(prev => prev.map(t => t._id === id ? { ...t, status } : t));
      Toast.show({ type: 'success', text1: `Ticket marked as ${status}` });
    } catch { Toast.show({ type: 'error', text1: 'Update failed' }); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.headerTitle}>Developer Portal</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Manage platform infrastructure</Text>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'societies' && styles.tabActive]} onPress={() => setTab('societies')}>
            <Text style={[styles.tabText, tab === 'societies' && styles.tabTextActive]}>Societies</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'support' && styles.tabActive]} onPress={() => setTab('support')}>
            <Text style={[styles.tabText, tab === 'support' && styles.tabTextActive]}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'testing' && styles.tabActive]} onPress={() => setTab('testing')}>
            <Text style={[styles.tabText, tab === 'testing' && styles.tabTextActive]}>Testing</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'testing' && (
        <View style={{ flex: 1 }}>
          <FlatList
            data={societies}
            keyExtractor={s => s._id}
            ListHeaderComponent={() => (
              <View style={{ padding: 20, paddingBottom: 10 }}>
                <Text style={styles.formTitle}>Emulation & Testing Tools</Text>
                <Text style={styles.itemSub}>Switch your role and society temporarily to test the app as different users.</Text>
                
                <View style={{ marginTop: 20 }}>
                  <Text style={styles.label}>1. Select Target Role</Text>
                  <View style={styles.testRow}>
                    <TouchableOpacity style={styles.testBtn} onPress={() => handleSwitchContext('admin', societies[0]?.name || 'Sunrise Apartments')}>
                      <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
                      <Text style={styles.testBtnText}>As Admin</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.testBtn} onPress={() => handleSwitchContext('resident', societies[0]?.name || 'Sunrise Apartments')}>
                      <Ionicons name="people" size={20} color={COLORS.primary} />
                      <Text style={styles.testBtnText}>As Resident</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ marginTop: 25 }}>
                  <Text style={styles.label}>2. Teleport to Society</Text>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item: s }) => (
              <TouchableOpacity key={s._id} style={[styles.itemCard, { marginHorizontal: 20 }]} onPress={() => handleSwitchContext('resident', s.name)}>
                <View>
                  <Text style={styles.itemName}>{s.name}</Text>
                  <Text style={styles.itemSub}>{s.city}, {s.state}</Text>
                </View>
                <Ionicons name="airplane-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {tab === 'societies' && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add New Society</Text>
          <TextInput style={styles.input} placeholder="Society Name" value={newName} onChangeText={setNewName} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="City" value={newCity} onChangeText={setNewCity} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="State" value={newState} onChangeText={setNewState} />
          </View>
          <TouchableOpacity style={styles.btnAdd} onPress={handleAddSociety}>
            <Text style={styles.btnAddText}>Register Society</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={COLORS.primary} size="large" />
      ) : (
        tab !== 'testing' && (
          <FlatList
            data={tab === 'societies' ? societies : tickets}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            tab === 'societies' ? (
              <View style={styles.itemCard}>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSub}>{item.city}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteSociety(item._id, item.name)}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.important} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketName}>{item.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'Resolved' ? '#DCFCE7' : '#FEF3C7' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'Resolved' ? '#166534' : '#92400E' }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.ticketEmail}>{item.email}</Text>
                <Text style={styles.ticketMsg}>{item.message}</Text>
                <View style={styles.ticketActions}>
                  <TouchableOpacity style={styles.ticketBtn} onPress={() => handleUpdateTicket(item._id, 'Resolved')}>
                    <Text style={styles.ticketBtnText}>Mark Resolved</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.ticketBtn, { backgroundColor: '#F3F4F6' }]} onPress={() => handleUpdateTicket(item._id, 'In Progress')}>
                    <Text style={[styles.ticketBtnText, { color: COLORS.textPrimary }]}>In Progress</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          )}
        />
      )
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { backgroundColor: COLORS.primary, padding: 25, paddingTop: 60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, ...SHADOW },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 20 },
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 5 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: COLORS.white },
  tabText: { fontSize: 14, color: COLORS.white, fontWeight: '700' },
  tabTextActive: { color: COLORS.primary },
  formCard: { backgroundColor: COLORS.white, margin: 20, padding: 20, borderRadius: 20, ...SHADOW },
  formTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 15 },
  input: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  btnAdd: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  btnAddText: { color: COLORS.white, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '800', color: COLORS.textMuted, marginBottom: 10, textTransform: 'uppercase' },
  testRow: { flexDirection: 'row', gap: 15 },
  testBtn: { flex: 1, backgroundColor: COLORS.white, padding: 20, borderRadius: 15, alignItems: 'center', gap: 8, ...SHADOW },
  testBtnText: { fontWeight: '800', color: COLORS.textPrimary },
  itemCard: { backgroundColor: COLORS.white, padding: 16, borderRadius: 15, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOW },
  itemName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  itemSub: { fontSize: 13, color: COLORS.textMuted },
  ticketCard: { backgroundColor: COLORS.white, padding: 16, borderRadius: 20, marginBottom: 15, ...SHADOW },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ticketName: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  ticketEmail: { fontSize: 13, color: COLORS.primary, marginBottom: 10 },
  ticketMsg: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 15 },
  ticketActions: { flexDirection: 'row', gap: 10 },
  ticketBtn: { flex: 1, backgroundColor: '#EFF6FF', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  ticketBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800' }
});
