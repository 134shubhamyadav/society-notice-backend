import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getNotices } from '../services/api';
import { COLORS, SHADOW } from '../constants/theme';

export default function CalendarScreen() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await getNotices();
      // Filter out notices that act like events (Meetings, Elections, or anything expiring in the future)
      const data = res.data.data.filter(n => n.category === 'Meeting' || n.category === 'Election' || n.expiryDate);
      
      const sorted = data.sort((a, b) => {
        const dateA = a.expiryDate ? new Date(a.expiryDate) : new Date(a.createdAt);
        const dateB = b.expiryDate ? new Date(b.expiryDate) : new Date(b.createdAt);
        return dateA - dateB;
      });

      setEvents(sorted);
    } catch {
      // Keep running
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchEvents(); }, []));

  const renderItem = ({ item }) => {
    const targetDate = item.expiryDate ? new Date(item.expiryDate) : new Date(item.createdAt);
    const day = targetDate.getDate();
    const month = targetDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    
    return (
      <View style={styles.card}>
        <View style={styles.dateBox}>
          <Text style={styles.dateMonth}>{month}</Text>
          <Text style={styles.dateDay}>{day}</Text>
        </View>
        <TouchableOpacity style={styles.contentBox} onPress={() => router.push({ pathname: '/notice-detail', params: { id: item._id } })}>
          <Text style={styles.title} numberOfLines={1}>{item.headline}</Text>
          <View style={styles.catRow}>
            <Ionicons name={item.category === 'Meeting' ? 'people' : 'calendar'} size={12} color={COLORS.primaryLight} />
            <Text style={styles.catText}>{item.category}</Text>
          </View>
          <Text style={styles.desc} numberOfLines={2}>{item.body}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Ionicons name="calendar" size={24} color={COLORS.white} />
        <Text style={styles.headerTitle}>Society Calendar</Text>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : events.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="calendar-outline" size={60} color={COLORS.border} />
          <Text style={{ color: COLORS.textMuted, marginTop: 10, fontWeight: '700' }}>No upcoming events scheduled.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: COLORS.primary, paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  backBtn: { padding: 4 },
  card: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 14, marginBottom: 16, ...SHADOW, overflow: 'hidden' },
  dateBox: { backgroundColor: '#EBF2FF', width: 70, justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  dateMonth: { fontSize: 13, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  dateDay: { fontSize: 26, fontWeight: '900', color: COLORS.primaryDark },
  contentBox: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  catText: { fontSize: 11, fontWeight: '700', color: COLORS.primaryLight, textTransform: 'uppercase' },
  desc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 }
});
