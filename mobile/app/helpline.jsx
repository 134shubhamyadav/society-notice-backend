import { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Linking, ActivityIndicator, Modal, TextInput, Alert, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { getHelplines, postHelpline, updateHelpline, deleteHelpline, resetHelplines } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOW } from '../constants/theme';

export default function HelplineScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [helplines, setHelplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ category: '', icon: 'call', color: '#4361EE', contacts: [] });

  useEffect(() => {
    fetchHelplines();
  }, []);

  const fetchHelplines = async () => {
    try {
      const res = await getHelplines();
      setHelplines(res.data.data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load helplines' });
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSave = async () => {
    if (!form.category || form.contacts.length === 0) {
      Toast.show({ type: 'error', text1: 'Category and at least one contact required' });
      return;
    }
    try {
      if (editingId) {
        await updateHelpline(editingId, form);
        Toast.show({ type: 'success', text1: 'Helpline updated' });
      } else {
        await postHelpline(form);
        Toast.show({ type: 'success', text1: 'Helpline added' });
      }
      setModalVisible(false);
      fetchHelplines();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Save failed' });
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this entire category?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteHelpline(id);
          fetchHelplines();
        } catch (err) { Toast.show({ type: 'error', text1: 'Delete failed' }); }
      }}
    ]);
  };

  const addContactRow = () => {
    setForm({ ...form, contacts: [...form.contacts, { name: '', phone: '', desk: '' }] });
  };

  const updateContact = (index, field, val) => {
    const newContacts = [...form.contacts];
    newContacts[index][field] = val;
    setForm({ ...form, contacts: newContacts });
  };

  const removeContact = (index) => {
    const newContacts = form.contacts.filter((_, i) => i !== index);
    setForm({ ...form, contacts: newContacts });
  };

  const renderCategory = ({ item }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
          <Ionicons name={item.icon} size={20} color={item.color} />
        </View>
        <Text style={styles.sectionTitle}>{item.category}</Text>
        {user?.role === 'admin' && (
          <View style={{ flexDirection: 'row', marginLeft: 'auto', gap: 10 }}>
            <TouchableOpacity onPress={() => { setEditingId(item._id); setForm(item); setModalVisible(true); }}>
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id)}>
              <Ionicons name="trash-outline" size={20} color={COLORS.important} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {item.contacts.map((contact, index) => (
        <View key={index} style={styles.contactCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <View style={styles.deskRow}>
              <Ionicons name="information-circle-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.contactDesk}>{contact.desk}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.callBtn, { backgroundColor: item.color }]} 
            onPress={() => handleCall(contact.phone)}
          >
            <Ionicons name="call" size={18} color={COLORS.white} />
            <Text style={styles.callBtnText}>{contact.phone}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Helplines</Text>
        {user?.role === 'admin' && (
          <TouchableOpacity 
            style={styles.addBtn} 
            onPress={() => { setEditingId(null); setForm({ category: '', icon: 'call', color: '#4361EE', contacts: [{name:'', phone:'', desk:''}] }); setModalVisible(true); }}
          >
            <Ionicons name="add" size={26} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={helplines}
          keyExtractor={item => item._id}
          renderItem={renderCategory}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No helplines added yet.</Text>}
          ListHeaderComponent={() => (
            <View style={styles.infoBox}>
              <Ionicons name="alert-circle" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Tap on the number to call directly. Use these for society matters only.
              </Text>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Helpline' : 'Add Helpline'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={26} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            <Text style={styles.label}>Category Name (e.g. Maintenance)</Text>
            <TextInput 
              style={styles.input} 
              value={form.category} 
              onChangeText={v => setForm({...form, category: v})} 
              placeholder="Enter category"
            />

            <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Icon Link (Ionicons)</Text>
                <TextInput style={styles.input} value={form.icon} onChangeText={v => setForm({...form, icon: v})} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Theme Color (Hex)</Text>
                <TextInput style={styles.input} value={form.color} onChangeText={v => setForm({...form, color: v})} />
              </View>
            </View>

            <Text style={[styles.label, { marginBottom: 10 }]}>Contacts</Text>
            {form.contacts.map((c, i) => (
              <View key={i} style={styles.editContactCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontWeight: '700' }}>Contact #{i+1}</Text>
                  <TouchableOpacity onPress={() => removeContact(i)}>
                    <Ionicons name="remove-circle" size={20} color={COLORS.important} />
                  </TouchableOpacity>
                </View>
                <TextInput style={styles.miniInput} placeholder="Name" value={c.name} onChangeText={v => updateContact(i, 'name', v)} />
                <TextInput style={styles.miniInput} placeholder="Phone Number" value={c.phone} onChangeText={v => updateContact(i, 'phone', v)} />
                <TextInput style={styles.miniInput} placeholder="Availability (e.g. 24/7)" value={c.desk} onChangeText={v => updateContact(i, 'desk', v)} />
              </View>
            ))}

            <TouchableOpacity style={styles.addContactBtn} onPress={addContactRow}>
              <Ionicons name="add-circle" size={20} color={COLORS.primary} />
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Add Another Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 16 }}>SAVE HELPLINE</Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 20 }} />
            
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.primary, marginTop: 0 }]} 
              onPress={() => {
                Alert.alert('Quick Setup', 'Restore all default society helplines? This will clear current ones.', [
                  { text: 'Cancel' },
                  { text: 'Reset All', style: 'destructive', onPress: async () => {
                    try {
                      await resetHelplines();
                      Toast.show({ type: 'success', text1: 'Defaults restored!' });
                      setModalVisible(false);
                      fetchHelplines();
                    } catch (err) { Toast.show({ type: 'error', text1: 'Reset failed' }); }
                  }}
                ]);
              }}
            >
              <Text style={{ color: COLORS.primary, fontWeight: '800' }}>QUICK SETUP (DEFAULT CONTACTS)</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingTop: 55, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white, flex: 1 },
  addBtn: { padding: 4 },
  infoBox: {
    backgroundColor: COLORS.white, padding: 16, borderRadius: 12, marginBottom: 20,
    flexDirection: 'row', gap: 12, alignItems: 'center', ...SHADOW
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 0.5, textTransform: 'uppercase' },
  contactCard: {
    backgroundColor: COLORS.white, padding: 16, borderRadius: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', ...SHADOW
  },
  contactName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  deskRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contactDesk: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10,
    paddingHorizontal: 14, borderRadius: 10, ...SHADOW
  },
  callBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 15 },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 8 },
  input: { backgroundColor: COLORS.white, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20, fontSize: 16 },
  editContactCard: { backgroundColor: COLORS.white, padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border },
  miniInput: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 8, marginBottom: 10, fontSize: 14 },
  addContactBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', marginVertical: 10 },
  saveBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 14, alignItems: 'center', marginVertical: 30, ...SHADOW }
});
