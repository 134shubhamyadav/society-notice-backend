import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { register as registerAPI, getSocieties } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOW } from '../constants/theme';

const ROLES = ['resident', 'admin'];

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'resident',
    societyName: '', flatNumber: '', adminKey: '', securityKey: '', gender: 'Male', phone: '', personalEmail: '', dob: ''
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2000, 0, 1)); // Default for DOB

  const [showPass, setShowPass] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [showSecurityKey, setShowSecurityKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [societies, setSocieties] = useState([]);
  const [showSocietyModal, setShowSocietyModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSocieties();
  }, []);

  const fetchSocieties = async () => {
    try {
      const res = await getSocieties();
      setSocieties(res.data.data);
    } catch {}
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handlePrevYear = () => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
  const handleNextYear = () => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));

  const handleDateSelect = (day) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayStr = String(selected.getDate()).padStart(2, '0');
    const monthStr = String(selected.getMonth() + 1).padStart(2, '0');
    const yearStr = selected.getFullYear();
    set('dob', `${yearStr}-${monthStr}-${dayStr}`);
    setShowCalendar(false);
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.societyName || !form.phone || !form.personalEmail || !form.dob) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields including DOB' });
      return;
    }
    if (form.password.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
      return;
    }
    if (form.role === 'admin') {
      if (!form.adminKey) {
        Toast.show({ type: 'error', text1: 'Admin secret key required!' });
        return;
      }
      if (!form.securityKey || form.securityKey.length < 4) {
        Toast.show({ type: 'error', text1: 'Personal Security Key required! (Min 4 chars)' });
        return;
      }
    }
    setLoading(true);
    try {
      const res = await registerAPI({ ...form, email: form.email.trim().toLowerCase() });
      await login(res.data.data);
      Toast.show({ type: 'success', text1: `Welcome, ${res.data.data.name}!` });
      router.replace('/home');
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Image source={require('../assets/icon.png')} style={{width: 54, height: 54, borderRadius: 14, marginBottom: 2}} />
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>Join your society portal</Text>
        </View>

        <View style={styles.card}>

          {/* Name */}
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Your full name"
              placeholderTextColor={COLORS.textMuted}
              value={form.name} onChangeText={v => set('name', v)} />
          </View>

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="10-digit mobile number"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              value={form.phone} onChangeText={v => set('phone', v)} />
          </View>

          {/* Society Email (Primary) */}
          <Text style={styles.label}>Society Email Address (Primary) *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="society@email.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address" autoCapitalize="none"
              value={form.email} onChangeText={v => set('email', v)} />
          </View>

          {/* Personal Email */}
          <Text style={styles.label}>Personal Email Address *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="at-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="personal@email.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address" autoCapitalize="none"
              value={form.personalEmail} onChangeText={v => set('personalEmail', v)} />
          </View>

          {/* Date of Birth */}
          <Text style={styles.label}>Date of Birth *</Text>
          <TouchableOpacity style={styles.inputWrap} onPress={() => setShowCalendar(true)}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <Text style={[styles.input, !form.dob && { color: COLORS.textMuted }]}>
              {form.dob ? new Date(form.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Select Birthday'}
            </Text>
          </TouchableOpacity>

          {/* Password */}
          <Text style={styles.label}>Password *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Min. 6 characters"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPass}
              value={form.password} onChangeText={v => set('password', v)} />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingRight: 12 }}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* State Selection */}
          <Text style={styles.label}>Select State *</Text>
          <TouchableOpacity style={styles.inputWrap} onPress={() => setShowStateModal(true)}>
            <Ionicons name="map-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <Text style={[styles.input, !selectedState && { color: COLORS.textMuted }]}>
              {selectedState || 'Select state'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} style={{ marginRight: 15 }} />
          </TouchableOpacity>

          {/* City Selection */}
          <Text style={styles.label}>Select City *</Text>
          <TouchableOpacity 
            style={[styles.inputWrap, !selectedState && { opacity: 0.5 }]} 
            onPress={() => selectedState ? setShowCityModal(true) : Toast.show({ type: 'info', text1: 'Select state first' })}>
            <Ionicons name="location-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <Text style={[styles.input, !selectedCity && { color: COLORS.textMuted }]}>
              {selectedCity || 'Select city'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} style={{ marginRight: 15 }} />
          </TouchableOpacity>

          {/* Society Name Selection */}
          <Text style={styles.label}>Select Your Society *</Text>
          <TouchableOpacity 
            style={[styles.inputWrap, !selectedCity && { opacity: 0.5 }]} 
            onPress={() => selectedCity ? setShowSocietyModal(true) : Toast.show({ type: 'info', text1: 'Select city first' })}>
            <Ionicons name="business-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <Text style={[styles.input, !form.societyName && { color: COLORS.textMuted }]}>
              {form.societyName || 'Select your society'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} style={{ marginRight: 15 }} />
          </TouchableOpacity>

          {/* Flat Number */}
          <Text style={styles.label}>Flat / House Number</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="home-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="e.g. A-204"
              placeholderTextColor={COLORS.textMuted}
              value={form.flatNumber} onChangeText={v => set('flatNumber', v)} />
          </View>

          {/* Gender Selection */}
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.roleRow}>
            {['Male', 'Female'].map(g => (
              <TouchableOpacity key={g}
                style={[styles.roleBtn, form.gender === g && styles.roleBtnActive]}
                onPress={() => set('gender', g)}>
                <Text style={[styles.roleBtnText, form.gender === g && { color: COLORS.white }]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Role selector */}
          <Text style={styles.label}>I am a...</Text>
          <View style={styles.roleRow}>
            {ROLES.map(r => (
              <TouchableOpacity key={r}
                style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
                onPress={() => set('role', r)}>
                <Ionicons
                  name={r === 'admin' ? 'shield-checkmark-outline' : 'people-outline'}
                  size={18} color={form.role === r ? COLORS.white : COLORS.primary} />
                <Text style={[styles.roleBtnText, form.role === r && { color: COLORS.white }]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Admin Secret Key — sirf tab dikhe jab Admin select ho */}
          {form.role === 'admin' && (
            <View>
              <Text style={styles.adminNote}>
                ⚠️ Admin accounts require a secret key. Contact your society manager for the key.
              </Text>
              <Text style={styles.label}>Admin Secret Key *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="key-outline" size={18} color={COLORS.important} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter admin secret key"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showAdminKey}
                  value={form.adminKey}
                  onChangeText={v => set('adminKey', v)}
                />
                <TouchableOpacity onPress={() => setShowAdminKey(!showAdminKey)} style={{ paddingRight: 12 }}>
                  <Ionicons name={showAdminKey ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Personal Security Key (For Recovery) *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.important} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Create a personal recovery PIN"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showSecurityKey}
                  value={form.securityKey}
                  onChangeText={v => set('securityKey', v)}
                />
                <TouchableOpacity onPress={() => setShowSecurityKey(!showSecurityKey)} style={{ paddingRight: 12 }}>
                  <Ionicons name={showSecurityKey ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.btnRegister} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.btnRegisterText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>Already have an account? <Text style={styles.loginBold}>Login</Text></Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* State Modal */}
      {showStateModal && (
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select State</Text>
            
            <View style={{ paddingHorizontal: 20 }}>
              <View style={styles.sheetSearchContainer}>
                <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginLeft: 12 }} />
                <TextInput 
                  style={styles.sheetSearchInput}
                  placeholder="Search state..." 
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 12 }}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView style={{ marginTop: 10, paddingHorizontal: 20 }}>
              {[...new Set(societies.map(s => s.state).filter(Boolean))]
                .filter(st => st.toLowerCase().includes(search.toLowerCase()))
                .sort()
                .map(st => (
                  <TouchableOpacity key={`state-${st}`} style={styles.sheetItem} onPress={() => {
                    setSelectedState(st);
                    setSelectedCity('');
                    set('societyName', '');
                    setSearch('');
                    setShowStateModal(false);
                  }}>
                    <View style={styles.sheetItemRow}>
                      <View style={styles.sheetIconBox}>
                        <Ionicons name="map" size={18} color={COLORS.primary} />
                      </View>
                      <Text style={styles.sheetItemName}>{st}</Text>
                    </View>
                    {selectedState === st && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => { setShowStateModal(false); setSearch(''); }}>
              <Text style={styles.sheetCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* City Modal */}
      {showCityModal && (
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select City in {selectedState}</Text>
            
            <View style={{ paddingHorizontal: 20 }}>
              <View style={styles.sheetSearchContainer}>
                <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginLeft: 12 }} />
                <TextInput 
                  style={styles.sheetSearchInput}
                  placeholder="Search city..." 
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 12 }}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView style={{ marginTop: 10, paddingHorizontal: 20 }}>
              {[...new Set(societies.filter(s => s.state === selectedState).map(s => s.city).filter(Boolean))]
                .filter(ct => ct.toLowerCase().includes(search.toLowerCase()))
                .sort()
                .map(ct => (
                  <TouchableOpacity key={`city-${ct}`} style={styles.sheetItem} onPress={() => {
                    setSelectedCity(ct);
                    set('societyName', '');
                    setSearch('');
                    setShowCityModal(false);
                  }}>
                    <View style={styles.sheetItemRow}>
                      <View style={styles.sheetIconBox}>
                        <Ionicons name="location" size={18} color={COLORS.primary} />
                      </View>
                      <Text style={styles.sheetItemName}>{ct}</Text>
                    </View>
                    {selectedCity === ct && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => { setShowCityModal(false); setSearch(''); }}>
              <Text style={styles.sheetCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Society Selection Modal */}
      {showSocietyModal && (
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheetContent, { height: '85%' }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Society in {selectedCity}</Text>
            
            <View style={{ paddingHorizontal: 20 }}>
              <View style={styles.sheetSearchContainer}>
                <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginLeft: 12 }} />
                <TextInput 
                  style={styles.sheetSearchInput}
                  placeholder="Search by society name..." 
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 12 }}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView style={{ marginTop: 10, paddingHorizontal: 20 }}>
              {societies.filter(s => 
                s.city === selectedCity && 
                s.name.toLowerCase().includes(search.toLowerCase())
              ).map(s => (
                <TouchableOpacity key={s._id} style={styles.sheetItem} onPress={() => {
                  set('societyName', s.name);
                  setSearch('');
                  setShowSocietyModal(false);
                }}>
                  <View style={styles.sheetItemRow}>
                    <View style={styles.sheetIconBox}>
                      <Ionicons name="business" size={18} color={COLORS.primary} />
                    </View>
                    <Text style={styles.sheetItemName}>{s.name}</Text>
                  </View>
                  {form.societyName === s.name && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => { setShowSocietyModal(false); setSearch(''); }}>
              <Text style={styles.sheetCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Simple Calendar Modal for DOB */}
      {showCalendar && (
        <View style={styles.calendarModal}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevYear}><Ionicons name="play-back" size={18} color={COLORS.primary} /></TouchableOpacity>
              <TouchableOpacity onPress={handlePrevMonth}><Ionicons name="chevron-back" size={24} color={COLORS.primary} /></TouchableOpacity>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={styles.calendarMonth}>{currentDate.toLocaleDateString('en-IN', { month: 'long' })}</Text>
                <Text style={styles.calendarYear}>{currentDate.getFullYear()}</Text>
              </View>
              <TouchableOpacity onPress={handleNextMonth}><Ionicons name="chevron-forward" size={24} color={COLORS.primary} /></TouchableOpacity>
              <TouchableOpacity onPress={handleNextYear}><Ionicons name="play-forward" size={18} color={COLORS.primary} /></TouchableOpacity>
            </View>

            <View style={styles.weekHeader}>
              {['S','M','T','W','T','F','S'].map((d,i) => <Text key={i} style={styles.weekText}>{d}</Text>)}
            </View>

            <View style={styles.daysGrid}>
              {blanks.map(b => <View key={`b-${b}`} style={styles.dayBox} />)}
              {days.map(d => {
                const isSelected = form.dob && new Date(form.dob).getDate() === d && new Date(form.dob).getMonth() === currentDate.getMonth() && new Date(form.dob).getFullYear() === currentDate.getFullYear();
                return (
                  <TouchableOpacity key={d} style={[styles.dayBox, isSelected && styles.dayBoxSelected]} onPress={() => handleDateSelect(d)}>
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.closeCalendar} onPress={() => setShowCalendar(false)}>
              <Text style={styles.closeCalendarText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { flexGrow: 1 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 28, gap: 6 },
  backBtn: { position: 'absolute', top: 58, left: 20, padding: 6 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  card: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 28, paddingTop: 30 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 14,
  },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, paddingHorizontal: 10, paddingVertical: 13, fontSize: 15, color: COLORS.textPrimary },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderRadius: 12, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: COLORS.white,
  },
  roleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  adminNote: { fontSize: 12, color: COLORS.important, marginBottom: 10, backgroundColor: COLORS.importantBg, padding: 10, borderRadius: 8 },
  btnRegister: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 6 },
  btnRegisterText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginText: { fontSize: 14, color: COLORS.textSecondary },
  loginBold: { color: COLORS.primary, fontWeight: '700' },
  // Calendar Styles
  calendarModal: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  calendarCard: { backgroundColor: COLORS.white, width: '90%', borderRadius: 20, padding: 20, ...SHADOW },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  calendarMonth: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  calendarYear: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  weekText: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, width: 35, textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  dayBox: { width: '14.28%', height: 40, justifyContent: 'center', alignItems: 'center' },
  dayBoxSelected: { backgroundColor: COLORS.primary, borderRadius: 10 },
  dayText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  dayTextSelected: { color: COLORS.white, fontWeight: '800' },
  closeCalendar: { marginTop: 20, padding: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border },
  closeCalendarText: { color: COLORS.important, fontWeight: '700' },
  // Society Modal Styles
  searchInput: { backgroundColor: '#F0F2F5', padding: 12, borderRadius: 10, marginTop: 15, fontSize: 14, color: COLORS.textPrimary },
  societyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  societyItemName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  societyItemCity: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  // Bottom Sheet Premium Styles
  sheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 2000 },
  sheetContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '70%', paddingBottom: Platform.OS === 'ios' ? 40 : 20, ...SHADOW },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primary, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  sheetSearchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 15, marginBottom: 15, height: 50 },
  sheetSearchInput: { flex: 1, paddingHorizontal: 12, fontSize: 15, color: COLORS.textPrimary },
  sheetItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sheetItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  sheetCloseBtn: { marginTop: 10, padding: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  sheetCloseText: { color: COLORS.important, fontWeight: '800', fontSize: 16 },
});