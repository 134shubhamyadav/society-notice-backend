import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAckList } from '../services/api';
import { COLORS, SHADOW } from '../constants/theme';

export default function AckListScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAckList(id)
      .then(res => setList(res.data.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Who Acknowledged</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{list.length}</Text>
        </View>
      </View>

      {loading
        ? <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} size="large" />
        : <FlatList
          data={list}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={50} color={COLORS.border} />
              <Text style={styles.emptyText}>No residents have acknowledged yet</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.item}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.time}>
                  {new Date(item.at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true
                  })}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
            </View>
          )}
        />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.white },
  countBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14,
    marginBottom: 10, ...SHADOW,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  time: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center' },
});
