import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Switch, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { getNotice, postNotice, updateNotice } from '../services/api';
import { COLORS, SHADOW } from '../constants/theme';

const CATEGORIES = ['Water', 'Electricity', 'Maintenance', 'Meeting', 'Election', 'Security', 'General', 'Other'];

const CATEGORY_ICONS = {
  Water: 'water', Electricity: 'flash', Maintenance: 'construct',
  Meeting: 'people', Election: 'checkmark-done-circle', Security: 'shield-checkmark',
  General: 'megaphone', Other: 'document-text',
};

export default function PostNoticeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [form, setForm] = useState({
    headline: '', body: '', category: 'General', isImportant: false, expiryDate: '', externalLink: ''
  });
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);

  useEffect(() => {
    if (id) {
      fetchNoticeDetails();
    }
  }, [id]);

  const fetchNoticeDetails = async () => {
    try {
      const res = await getNotice(id);
      const n = res.data.data;
      setForm({
        headline: n.headline,
        body: n.body,
        category: n.category,
        isImportant: n.isImportant,
        expiryDate: n.expiryDate ? new Date(n.expiryDate).toISOString().split('T')[0] : '',
        externalLink: n.externalLink || ''
      });
      setIsPoll(n.isPoll);
      if (n.isPoll && n.pollOptions) {
        setPollOptions(n.pollOptions.map(o => o.text));
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load notice for editing' });
    } finally {
      setFetching(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addPollOption = () => {
    if (pollOptions.length < 5) setPollOptions([...pollOptions, '']);
    else Toast.show({ type: 'info', text1: 'Max 5 options allowed' });
  };
  const updatePollOption = (text, index) => {
    const newOpts = [...pollOptions];
    newOpts[index] = text;
    setPollOptions(newOpts);
  };

  const [showCalendar, setShowCalendar] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());

  // Simple calendar math
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handlePrevYear = () => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
  const handleNextYear = () => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));

  const handleDateSelect = (day) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayStr = String(selected.getDate()).padStart(2, '0');
    const monthStr = String(selected.getMonth() + 1).padStart(2, '0');
    const yearStr = selected.getFullYear();
    set('expiryDate', `${yearStr}-${monthStr}-${dayStr}`);
    setShowCalendar(false);
  };

  const handlePost = async () => {
    if (!form.headline.trim()) {
      Toast.show({ type: 'error', text1: 'Headline is required' }); return;
    }
    if (!form.body.trim()) {
      Toast.show({ type: 'error', text1: 'Notice body is required' }); return;
    }
    setLoading(true);
    try {
      const payload = {
        headline: form.headline.trim(),
        body: form.body.trim(),
        category: form.category,
        isImportant: form.isImportant,
        isPoll: isPoll,
        expiryDate: form.expiryDate,
        externalLink: form.externalLink.trim() || null
      };
      
      if (isPoll) {
        const validOptions = pollOptions.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
          Toast.show({ type: 'error', text1: 'Polls require at least 2 options' });
          setLoading(false);
          return;
        }
        payload.pollOptions = JSON.stringify(validOptions);
      }

      if (id) {
        await updateNotice(id, payload);
        Toast.show({ type: 'success', text1: '📢 Notice updated!' });
      } else {
        await postNotice(payload);
        Toast.show({ type: 'success', text1: '📢 Notice posted!', text2: 'Residents will be notified.' });
      }
      router.back();
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Could not post notice' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{id ? 'Edit Notice' : 'Post New Notice'}</Text>
        </View>

        {fetching ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        ) : (
        <ScrollView style={styles.scroll}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Headline */}
          <View style={styles.fieldCard}>
            <Text style={styles.label}>📌 Short Headline *</Text>
            <Text style={styles.hint}>Shown first on every notice card (max 120 chars)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Water supply cut on 20th March"
              placeholderTextColor={COLORS.textMuted}
              value={form.headline}
              onChangeText={v => set('headline', v)}
              maxLength={120}
              multiline
            />
            <Text style={styles.charCount}>{form.headline.length}/120</Text>
          </View>
          
          {/* External Link / Document Link */}
          <View style={styles.fieldCard}>
            <Text style={styles.label}>🔗 External Document Link (Optional)</Text>
            <Text style={styles.hint}>Paste a Google Drive, Dropbox, or PDF URL (Fixes Render upload limit)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. https://drive.google.com/..."
              placeholderTextColor={COLORS.textMuted}
              value={form.externalLink}
              onChangeText={v => set('externalLink', v)}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Body */}
          <View style={styles.fieldCard}>
            <Text style={styles.label}>📝 Full Notice Body *</Text>
            <Text style={styles.hint}>Detailed information about the notice</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write the complete notice here..."
              placeholderTextColor={COLORS.textMuted}
              value={form.body}
              onChangeText={v => set('body', v)}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* Category */}
          <View style={styles.fieldCard}>
            <Text style={styles.label}>🏷️ Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBtn, form.category === cat && styles.catBtnActive]}
                  onPress={() => set('category', cat)}
                >
                  <Ionicons
                    name={CATEGORY_ICONS[cat]}
                    size={16}
                    color={form.category === cat ? COLORS.white : COLORS.primary}
                  />
                  <Text style={[styles.catBtnText, form.category === cat && { color: COLORS.white }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Important toggle */}
          <View style={styles.fieldCard}>
            <View style={styles.importantRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>🔴 Mark as IMPORTANT</Text>
                <Text style={styles.hint}>Water cuts, elections, annual meetings</Text>
              </View>
              <Switch
                value={form.isImportant}
                onValueChange={v => set('isImportant', v)}
                trackColor={{ false: COLORS.border, true: COLORS.important }}
                thumbColor={form.isImportant ? COLORS.white : COLORS.textMuted}
              />
            </View>
            {form.isImportant && (
              <View style={styles.importantPreview}>
                <Ionicons name="alert-circle" size={14} color={COLORS.important} />
                <Text style={styles.importantPreviewText}>IMPORTANT badge will appear</Text>
              </View>
            )}
          </View>

          {/* Interactive Poll toggle */}
          <View style={styles.fieldCard}>
            <View style={styles.importantRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>📊 Make this an Interactive Poll</Text>
                <Text style={styles.hint}>Ask residents to cast votes</Text>
              </View>
              <Switch
                value={isPoll}
                onValueChange={setIsPoll}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={isPoll ? COLORS.white : COLORS.textMuted}
              />
            </View>
            {isPoll && (
              <View style={{ marginTop: 16 }}>
                {pollOptions.map((opt, i) => (
                  <View key={i} style={[styles.inputWrap, { marginBottom: 10 }]}>
                    <Text style={{ paddingLeft: 14, color: COLORS.textMuted, fontWeight: '700' }}>#{i + 1}</Text>
                    <TextInput
                      style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]}
                      placeholder={`Option ${i + 1}`}
                      placeholderTextColor={COLORS.textMuted}
                      value={opt}
                      onChangeText={t => updatePollOption(t, i)}
                    />
                  </View>
                ))}
                {pollOptions.length < 5 && (
                  <TouchableOpacity style={styles.addOptionBtn} onPress={addPollOption}>
                    <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.addOptionText}>Add Option</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Expiry date */}
          <TouchableOpacity style={styles.fieldCard} onPress={() => setShowCalendar(true)}>
            <Text style={styles.label}>📅 Expiry Date (Optional)</Text>
            <Text style={styles.hint}>When should this notice be archived?</Text>
            <View style={styles.datePickerTrigger}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <Text style={[styles.dateValue, !form.expiryDate && { color: COLORS.textMuted }]}>
                {form.expiryDate ? new Date(form.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Select Expiry Date'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
            </View>
          </TouchableOpacity>

          {/* Simple Calendar Modal */}
          {showCalendar && (
            <View style={styles.calendarModal}>
               <View style={styles.calendarCard}>
                 <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={handlePrevYear}><Ionicons name="play-back" size={18} color={COLORS.primary} /></TouchableOpacity>
                    <TouchableOpacity onPress={handlePrevMonth}><Ionicons name="chevron-back" size={24} color={COLORS.primary} /></TouchableOpacity>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={styles.calendarMonth}>
                        {currentDate.toLocaleDateString('en-IN', { month: 'long' })}
                      </Text>
                      <Text style={styles.calendarYear}>{currentDate.getFullYear()}</Text>
                    </View>
                    <TouchableOpacity onPress={handleNextMonth}><Ionicons name="chevron-forward" size={24} color={COLORS.primary} /></TouchableOpacity>
                    <TouchableOpacity onPress={handleNextYear}><Ionicons name="play-forward" size={18} color={COLORS.primary} /></TouchableOpacity>
                 </View>

                 <View style={styles.weekHeader}>
                    {['S','M','T','W','T','F','S'].map((d,i) => <Text key={i} style={styles.weekText}>{d}</Text>)}
                 </View>

                 <View style={styles.daysGrid}>
                   {/* Empty spots for first day of month */}
                   {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => (
                     <View key={`empty-${i}`} style={styles.dayBtnEmpty} />
                   ))}
                   
                   {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }, (_, i) => i + 1).map(d => {
                     const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString();
                     const isPast = new Date(currentDate.getFullYear(), currentDate.getMonth(), d) < new Date(new Date().setHours(0,0,0,0));
                     
                     return (
                       <TouchableOpacity 
                         key={d} 
                         style={[styles.dayBtn, isToday && styles.dayBtnToday, isPast && { opacity: 0.3 }]} 
                         disabled={isPast}
                         onPress={() => handleDateSelect(d)}
                       >
                         <Text style={[styles.dayText, isToday && { color: COLORS.white }]}>{d}</Text>
                       </TouchableOpacity>
                     );
                   })}
                 </View>
                 <TouchableOpacity style={styles.cancelCalendar} onPress={() => setShowCalendar(false)}>
                   <Text style={{ color: COLORS.important, fontWeight: '700' }}>Cancel</Text>
                 </TouchableOpacity>
               </View>
            </View>
          )}

          {/* Post button */}
          <TouchableOpacity style={styles.postBtn} onPress={handlePost} disabled={loading}>
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <>
                <Ionicons name={id ? "save-outline" : "send"} size={20} color={COLORS.white} />
                <Text style={styles.postBtnText}>{id ? 'Save Changes' : 'Post Notice'}</Text>
              </>
            }
          </TouchableOpacity>
        </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  scroll: { flex: 1 },
  fieldCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 14, ...SHADOW },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  hint: { fontSize: 12, color: COLORS.textMuted, marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: COLORS.textPrimary, marginBottom: 4,
  },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.white,
  },
  catBtnActive: { backgroundColor: COLORS.primary },
  catBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  importantRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  importantPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.importantBg, padding: 8, borderRadius: 8, marginTop: 10,
  },
  importantPreviewText: { fontSize: 12, color: COLORS.important, fontWeight: '600' },
  addOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, alignSelf: 'flex-start' },
  addOptionText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
  },
  postBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, marginTop: 4,
  },
  postBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  datePickerTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F5F7FA', borderRadius: 12, padding: 14, marginTop: 8,
  },
  dateValue: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  calendarModal: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  },
  calendarCard: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 20, width: '92%', ...SHADOW,
  },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  calendarMonth: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  calendarYear: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 5 },
  weekText: { width: 40, textAlign: 'center', fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  dayBtn: {
    width: 40, height: 40, borderRadius: 20, margin: 2,
    backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center',
  },
  dayBtnEmpty: { width: 40, height: 40, margin: 2 },
  dayBtnToday: { backgroundColor: COLORS.primary },
  dayText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  cancelCalendar: { marginTop: 20, paddingVertical: 10, alignItems: 'center' },
});