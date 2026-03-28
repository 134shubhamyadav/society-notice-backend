import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { postComplaint } from '../services/api';
import { COLORS, SHADOW } from '../constants/theme';

const CATEGORIES = ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Security', 'Other'];

export default function PostComplaintScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', category: 'Other' });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      Toast.show({ type: 'error', text1: 'Title and description are required' });
      return;
    }
    setLoading(true);
    try {
      await postComplaint(form);
      Toast.show({ type: 'success', text1: 'Complaint Raised', text2: 'Admins have been notified' });
      router.back();
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Could not submit complaint' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Raise Complaint</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.card}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBtn, form.category === cat && styles.catBtnActive]}
                  onPress={() => set('category', cat)}
                >
                  <Text style={[styles.catBtnText, form.category === cat && { color: COLORS.white }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Issue Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., Leaking pipe in the kitchen"
              placeholderTextColor={COLORS.textMuted}
              value={form.title}
              onChangeText={t => set('title', t)}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Detailed Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the issue clearly..."
              placeholderTextColor={COLORS.textMuted}
              value={form.description}
              onChangeText={t => set('description', t)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitBtnText}>Submit Complaint</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  backBtn: { padding: 4 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, ...SHADOW },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary },
  catBtnActive: { backgroundColor: COLORS.primary },
  catBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 15, color: COLORS.textPrimary },
  textArea: { minHeight: 120 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
