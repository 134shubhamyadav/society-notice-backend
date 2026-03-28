import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { getNotices, bookmarkNotice } from '../services/api';
import { useAuth } from './_layout';
import NoticeCard from '../components/NoticeCard';
import { COLORS } from '../constants/theme';

export default function BookmarksScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchBookmarks();
    }, [])
  );

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const res = await getBookmarks();
      setNotices(res.data.data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load bookmarks' });
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (id) => {
    try {
      const res = await bookmarkNotice(id);
      if (updateUser) await updateUser({ bookmarks: res.data.bookmarks });
      fetchBookmarks(); // Reload to remove from list if un-bookmarked
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to update bookmark' });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookmarks</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={notices}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <NoticeCard
              notice={item}
              isBookmarked={true}
              onBookmark={() => handleBookmark(item._id)}
              onPress={() => router.push({ pathname: '/notice-detail', params: { id: item._id } })}
            />
          )}
          contentContainerStyle={{ paddingVertical: 16 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="bookmark-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>You haven't bookmarked any notices yet.</Text>
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
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 12, textAlign: 'center', paddingHorizontal: 40 }
});
