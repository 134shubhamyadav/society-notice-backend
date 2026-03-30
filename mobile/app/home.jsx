import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, BackHandler, Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import NoticeCard from '../components/NoticeCard';
import { getNotices, triggerSOS } from '../services/api';
import { registerForPushNotifications } from '../services/notifications';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOW } from '../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Back press pe app band ho — logout nahi
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        BackHandler.exitApp();
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      fetchNotices();
      return () => backHandler.remove();
    }, [])
  );

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await getNotices();
      const data = res.data?.data;
      if (Array.isArray(data)) {
        const important = data.filter(n => n.isImportant);
        const normal = data.filter(n => !n.isImportant);
        setNotices([...important, ...normal]);
      } else {
        console.warn('Invalid notice data format:', res.data);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load notices', text2: err?.response?.data?.message || err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotices();
  }, []);

  const handleSOS = () => {
    Alert.alert(
      '🚨 TRIGGER SOS EMERGENCY',
      'This will instantly sound an alarm to EVERY resident and guard in the society. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'PULL ALARM', style: 'destructive', onPress: async () => {
            try {
              await triggerSOS();
              Toast.show({ type: 'success', text1: 'SOS Triggered Successfully!', text2: 'Neighbors have been alerted.' });
              fetchNotices(); // Refresh to show new SOS notice
            } catch (err) {
              const errMsg = err?.response?.data?.message || err.message;
              Toast.show({ type: 'error', text1: 'Failed to trigger SOS', text2: errMsg });
            }
          }
        }
      ]
    );
  };

  const importantCount = notices.filter(n => n.isImportant).length;



  const ListHeader = () => (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.name?.split(' ')[0]} 👋
          </Text>
          <Text style={styles.society}>{user?.societyName}</Text>
        </View>
        <View style={styles.headerRight}>
          {user?.role === 'admin' && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.postBtn} onPress={() => router.push('/admin/approve-residents')}>
                <Ionicons name="people-circle-outline" size={20} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.postBtn} onPress={() => router.push('/password-requests')}>
                <Ionicons name="key-outline" size={20} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.postBtn} onPress={() => router.push('/post-notice')}>
                <Ionicons name="add" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileBtn}>
            <Ionicons name="person-circle-outline" size={32} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.statsBar, { backgroundColor: COLORS.important, marginTop: 16, marginBottom: 4, paddingVertical: 14, ...SHADOW }]} 
        onLongPress={handleSOS}
        onPress={() => Toast.show({ type: 'info', text1: 'Hold button for 2 seconds to trigger SOS' })}
        activeOpacity={0.7}
      >
        <Ionicons name="warning" size={20} color={COLORS.white} />
        <Text style={{ color: COLORS.white, fontWeight: '900', textAlign: 'center', fontSize: 13, letterSpacing: 1 }}>EMERGENCY SOS PANIC BUTTON</Text>
        <Ionicons name="warning" size={20} color={COLORS.white} />
      </TouchableOpacity>

      <View style={styles.quickAccessRow}>
        <TouchableOpacity style={styles.quickAccessItem} onPress={() => router.push('/directory')}>
          <View style={[styles.quickAccessIcon, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="people" size={22} color="#4361EE" />
          </View>
          <Text style={styles.quickAccessLabel}>Directory</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAccessItem} onPress={() => router.push('/helpline')}>
          <View style={[styles.quickAccessIcon, { backgroundColor: '#F0FFF4' }]}>
            <Ionicons name="call" size={22} color="#2A9D8F" />
          </View>
          <Text style={styles.quickAccessLabel}>Helpline</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAccessItem} onPress={() => router.push('/complaints')}>
          <View style={[styles.quickAccessIcon, { backgroundColor: '#FFF5F5' }]}>
            <Ionicons name="construct" size={22} color="#E63946" />
          </View>
          <Text style={styles.quickAccessLabel}>Helpdesk</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAccessItem} onPress={() => router.push('/visitors')}>
          <View style={[styles.quickAccessIcon, { backgroundColor: '#FAF5FF' }]}>
            <Ionicons name="shield-checkmark" size={22} color="#9B51E0" />
          </View>
          <Text style={styles.quickAccessLabel}>Visitors</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{notices.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: COLORS.important }]}>{importantCount}</Text>
          <Text style={styles.statLabel}>Important</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: COLORS.success }]}>{notices.length - importantCount}</Text>
          <Text style={styles.statLabel}>General</Text>
        </View>
      </View>

      {importantCount > 0 && (
        <View style={styles.sectionHeader}>
          <Ionicons name="alert-circle" size={16} color={COLORS.important} />
          <Text style={[styles.sectionTitle, { color: COLORS.important }]}>Important Notices</Text>
        </View>
      )}
    </View>
  );

  const SectionBreak = ({ index }) => {
    if (index === importantCount && importantCount > 0 && index < notices.length) {
      return (
        <View style={styles.sectionHeader}>
          <Ionicons name="megaphone-outline" size={16} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>All Notices (Latest First)</Text>
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading notices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />
      <FlatList
        data={notices}
        keyExtractor={item => item._id}
        ListHeaderComponent={ListHeader}
        renderItem={({ item, index }) => (
          <View>
            <SectionBreak index={index} />
            <NoticeCard
              notice={item}
              onPress={() => router.push({ pathname: '/notice-detail', params: { id: item._id } })}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No notices yet</Text>
            <Text style={styles.emptyText}>
              {user?.role === 'admin' ? 'Tap + to post the first notice.' : 'Your society admin hasn\'t posted any notices yet.'}
            </Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />

      {user?.role === 'admin' && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/post-notice')}>
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: COLORS.textSecondary, fontSize: 14 },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 54, paddingBottom: 20, paddingHorizontal: 20,
  },
  greeting: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  society: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10,
    padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  profileBtn: { padding: 2 },
  statsBar: {
    flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 16,
    marginTop: -1, borderRadius: 16, padding: 16, ...SHADOW,
    marginBottom: 16, alignItems: 'center',
  },
  quickAccessRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 20, marginTop: 10,
  },
  quickAccessItem: { alignItems: 'center', width: '18%' },
  quickAccessIcon: {
    width: 50, height: 50, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    ...SHADOW
  },
  quickAccessLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  fab: {
    position: 'absolute', right: 20, bottom: 28,
    backgroundColor: COLORS.primary, borderRadius: 30,
    width: 58, height: 58, justifyContent: 'center', alignItems: 'center',
    ...SHADOW, elevation: 8,
  },
  premiumBirthdayCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden', ...SHADOW },
  bdayGlass: { padding: 20, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  bdayTitle: { fontSize: 22, fontWeight: '900', color: COLORS.white, marginBottom: 8 },
  bdayMsg: { fontSize: 14, color: COLORS.white, textAlign: 'center', lineHeight: 20, opacity: 0.9 },
  balloonRow: { flexDirection: 'row', gap: 15, marginTop: 15 },
  bIcon: { fontSize: 20 },
});