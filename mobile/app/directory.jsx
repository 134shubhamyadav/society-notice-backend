import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { getDirectory } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOW } from '../constants/theme';

export default function DirectoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await getDirectory();
      setUsers(res.data.data.filter(u => u._id !== user?._id)); // Don't show self in directory list for clean look
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load directory' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePress = (item) => {
    if (user?.role === 'admin') {
      router.push(`/resident-details/${item._id}`);
    } else {
      Toast.show({ 
        type: 'info', 
        text1: '🔒 Access Restricted', 
        text2: 'Full profile details are visible to Admins only.' 
      });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => handlePress(item)}>
    <View style={[styles.avatar, item.role === 'admin' && styles.avatarAdmin]}>
      <Ionicons 
        name={item.role === 'admin' ? 'shield-checkmark' : 'person'} 
        size={22} color={COLORS.white} 
      />
    </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.flat}>Flat / Unit: <Text style={{ color: COLORS.primary }}>{item.flatNumber || 'N/A'}</Text></Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      {item.role === 'admin' ? (
        <View style={styles.adminBadge}>
          <Text style={styles.adminText}>ADMIN</Text>
        </View>
      ) : (
        user?.role === 'admin' && <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Ionicons name="people" size={24} color={COLORS.white} style={{ marginRight: 8 }} />
        <Text style={styles.headerTitle}>Society Directory</Text>
      </View>

      <View style={styles.headerInfo}>
        <Text style={styles.headerInfoText}>Registered Members: {users.length}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="sad-outline" size={60} color={COLORS.border} />
          <Text style={styles.emptyText}>No members found.</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingTop: 55, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center'
  },
  headerInfo: {
    backgroundColor: COLORS.primaryDark, paddingVertical: 8, paddingHorizontal: 20,
    alignItems: 'center', justifyContent: 'center'
  },
  headerInfoText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  backBtn: { padding: 4, marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 14, ...SHADOW
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center'
  },
  avatarAdmin: { backgroundColor: COLORS.accent },
  name: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  flat: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 2 },
  email: { fontSize: 12, color: COLORS.textMuted },
  adminBadge: {
    position: 'absolute', top: 16, right: 16, backgroundColor: COLORS.importantBg,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#FFCDD2'
  },
  adminText: { fontSize: 10, fontWeight: '800', color: COLORS.important, letterSpacing: 0.5 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 16, color: COLORS.textMuted, fontWeight: '600' }
});
