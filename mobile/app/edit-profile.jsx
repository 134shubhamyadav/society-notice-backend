import { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Switch, Modal 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { requestProfileEdit } from '../services/api';
import { COLORS, SHADOW } from '../constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: '', flatNumber: '', gender: 'Male', 
    phone: '', personalEmail: '', dob: '', showBirthdayUI: false, position: '' 
  });
  const [loading, setLoading] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        flatNumber: user.flatNumber || '',
        gender: user.gender || 'Male',
        phone: user.phone || '',
        personalEmail: user.personalEmail || '',
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
        showBirthdayUI: user.showBirthdayUI || false,
        position: user.position || 'Society Admin'
      });
    }
  }, [user]);

  const setUpdate = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleFinalSave = async () => {
    setLoading(true);
    try {
      console.log('Sending Profile Update:', form);
      const res = await requestProfileEdit(form);
      
      if (res.data.success) {
        if (updateUser) await updateUser(res.data.data);
        Toast.show({ type: 'success', text1: 'Profile Updated Successfully!' });
        router.back();
      } else {
        throw new Error(res.data.message || 'Server returned failure');
      }
    } catch (err) {
      console.error('Profile Update Error:', err);
      const errMsg = err?.response?.data?.message || err.message || 'Network/Server Error';
      Alert.alert('Update Failed ❌', `${errMsg}\n\nPlease share this message with support.`);
      Toast.show({ type: 'error', text1: 'Update Failed' });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'name', label: 'Full Name', icon: 'person', val: form.name },
    { id: 'flatNumber', label: 'Flat Number', icon: 'home', val: form.flatNumber },
    { id: 'phone', label: 'Phone Number', icon: 'call', val: form.phone || 'Enter phone' },
    { id: 'personalEmail', label: 'Email Address', icon: 'mail', val: form.personalEmail || 'Enter email' },
    { id: 'dob', label: 'Birthday', icon: 'gift', val: form.dob || 'Select date' },
    { id: 'gender', label: 'Gender', icon: 'transgender', val: form.gender },
    ...(user?.role === 'admin' ? [{ id: 'position', label: 'Position / Title', icon: 'briefcase', val: form.position }] : []),
  ];

  const [showYearList, setShowYearList] = useState(false);

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const handleDateSelect = (d) => {
    const sel = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), d);
    const today = new Date();
    
    if (sel > today) {
      Alert.alert('Invalid Date', 'Future dates are not allowed.');
      return;
    }

    const age = today.getFullYear() - sel.getFullYear();
    const m = today.getMonth() - sel.getMonth();
    if (age < 13 || (age === 13 && m < 0) || (age === 13 && m === 0 && today.getDate() < sel.getDate())) {
      Alert.alert('Age Restriction', 'You must be at least 13 years old to use this app.');
      return;
    }

    const yr = sel.getFullYear();
    const mt = String(sel.getMonth() + 1).padStart(2, '0');
    const dy = String(sel.getDate()).padStart(2, '0');
    setUpdate('dob', `${yr}-${mt}-${dy}`);
    setShowCalendar(false);
  };

  const years = Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i);

  // Edit Field View
  if (selectedField) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setSelectedField(null); setShowYearList(false); }}><Ionicons name="arrow-back" size={24} color={COLORS.white} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Update {selectedField}</Text>
        </View>
        <View style={{ padding: 24 }}>
          {selectedField === 'gender' ? (
            <View style={{ flexDirection: 'row', gap: 15 }}>
              {['Male', 'Female'].map(g => (
                <TouchableOpacity key={g} 
                  style={[styles.genderBox, form.gender === g && { backgroundColor: COLORS.primary }]}
                  onPress={() => setUpdate('gender', g)}>
                  <Text style={{ color: form.gender === g ? COLORS.white : COLORS.textPrimary, fontWeight: '700' }}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : selectedField === 'dob' ? (
             <TouchableOpacity style={styles.bigInput} onPress={() => setShowCalendar(true)}>
               <Text style={{ fontSize: 18, color: form.dob ? COLORS.textPrimary : COLORS.textMuted }}>
                 {form.dob || 'Tap to select birthday'}
               </Text>
             </TouchableOpacity>
          ) : (
            <TextInput 
              style={styles.bigInput} 
              value={form[selectedField]} 
              onChangeText={v => setUpdate(selectedField, v)}
              placeholder={`Enter ${selectedField}`}
              autoFocus
            />
          )}
          <TouchableOpacity style={styles.doneBtn} onPress={() => setSelectedField(null)}>
            <Text style={{ color: COLORS.white, fontWeight: '800' }}>DONE</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Modal */}
        {showCalendar && (
          <Modal visible={showCalendar} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.calCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                   <TouchableOpacity onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}><Ionicons name="chevron-back" size={24} color={COLORS.primary} /></TouchableOpacity>
                   
                   <TouchableOpacity onPress={() => setShowYearList(!showYearList)} style={{ alignItems: 'center' }}>
                     <Text style={{ fontWeight: '800', fontSize: 16 }}>{calendarDate.toLocaleDateString('en-IN', { month: 'long' })}</Text>
                     <Text style={{ fontWeight: '900', fontSize: 18, color: COLORS.primary }}>{calendarDate.getFullYear()} ▾</Text>
                   </TouchableOpacity>

                   <TouchableOpacity onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}><Ionicons name="chevron-forward" size={24} color={COLORS.primary} /></TouchableOpacity>
                </View>

                {showYearList ? (
                   <View style={{ height: 250 }}>
                     <ScrollView>
                       {years.map(y => (
                         <TouchableOpacity key={y} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' }} 
                           onPress={() => { setCalendarDate(new Date(y, calendarDate.getMonth(), 1)); setShowYearList(false); }}>
                           <Text style={{ fontWeight: '700', color: y === calendarDate.getFullYear() ? COLORS.primary : COLORS.textPrimary }}>{y}</Text>
                         </TouchableOpacity>
                       ))}
                     </ScrollView>
                   </View>
                ) : (
                   <View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {Array.from({ length: getFirstDayOfMonth(calendarDate.getFullYear(), calendarDate.getMonth()) }).map((_, i) => <View key={i} style={{ width: 40, height: 40 }} />)}
                      {Array.from({ length: getDaysInMonth(calendarDate.getFullYear(), calendarDate.getMonth()) }, (_, i) => i + 1).map(d => {
                        const isFuture = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), d) > new Date();
                        return (
                          <TouchableOpacity key={d} 
                            style={[styles.day, isFuture && { opacity: 0.2 }]} 
                            onPress={() => !isFuture && handleDateSelect(d)}
                            disabled={isFuture}>
                            <Text style={{ fontWeight: '700' }}>{d}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <TouchableOpacity onPress={() => setShowCalendar(false)} style={{ marginTop: 20, alignSelf: 'center' }}><Text style={{ color: COLORS.important, fontWeight: '800' }}>CANCEL</Text></TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={26} color={COLORS.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {menuItems.map(item => (
          <TouchableOpacity key={item.id} style={styles.row} onPress={() => setSelectedField(item.id)}>
             <Ionicons name={item.icon} size={22} color={COLORS.primary} style={styles.rowIcon} />
             <View style={{ flex: 1 }}>
               <Text style={styles.rowLabel}>{item.label}</Text>
               <Text style={styles.rowValue}>{item.val}</Text>
             </View>
             <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}



        <TouchableOpacity 
          style={[styles.saveAllBtn, loading && { opacity: 0.7 }]} 
          onPress={handleFinalSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>SAVE ALL CHANGES</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* DOB Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
               <TouchableOpacity onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}><Ionicons name="chevron-back" size={24} color={COLORS.primary} /></TouchableOpacity>
               <Text style={{ fontWeight: '800', fontSize: 16 }}>{calendarDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Text>
               <TouchableOpacity onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}><Ionicons name="chevron-forward" size={24} color={COLORS.primary} /></TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {Array.from({ length: getFirstDayOfMonth(calendarDate.getFullYear(), calendarDate.getMonth()) }).map((_, i) => <View key={i} style={{ width: 40, height: 40 }} />)}
              {Array.from({ length: getDaysInMonth(calendarDate.getFullYear(), calendarDate.getMonth()) }, (_, i) => i + 1).map(d => (
                <TouchableOpacity key={d} style={styles.day} onPress={() => handleDateSelect(d)}>
                  <Text style={{ fontWeight: '700' }}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowCalendar(false)} style={{ marginTop: 20, alignSelf: 'center' }}><Text style={{ color: COLORS.important, fontWeight: '800' }}>CANCEL</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { backgroundColor: COLORS.primary, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 15 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 15, marginBottom: 12, ...SHADOW },
  rowIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EDF2FF', textAlign: 'center', textAlignVertical: 'center', marginRight: 12 },
  rowLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  rowValue: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '600', marginTop: 2 },
  saveAllBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, marginTop: 10, alignItems: 'center', ...SHADOW },
  saveText: { color: COLORS.white, fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  bigInput: { backgroundColor: COLORS.white, padding: 18, borderRadius: 15, fontSize: 18, fontWeight: '600', borderWidth: 1, borderColor: COLORS.border },
  doneBtn: { backgroundColor: COLORS.success, padding: 15, borderRadius: 15, marginTop: 20, alignItems: 'center' },
  genderBox: { flex: 1, padding: 18, borderRadius: 15, backgroundColor: COLORS.white, alignItems: 'center', ...SHADOW },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  calCard: { backgroundColor: COLORS.white, padding: 20, borderRadius: 20, width: '90%' },
  day: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', margin: 2, backgroundColor: '#F0F2F5', borderRadius: 20 },
});
