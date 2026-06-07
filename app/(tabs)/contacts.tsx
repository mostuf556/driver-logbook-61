import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Platform, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAppData } from '@/hooks/useAppData';
import { ContactCard } from '@/components/ContactCard';
import { SearchBar } from '@/components/SearchBar';
import type { Contact } from '@/lib/types';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const EMPTY_CONTACT: Omit<Contact, 'id'> = {
  firstName: '', lastName: '', idNumber: '', phone: '', company: '',
};

export default function ContactsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { contacts, addContact, updateContact, deleteContact } = useAppData();
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState(EMPTY_CONTACT);

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(c =>
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.company.toLowerCase().includes(q),
    );
  }, [contacts, search]);

  const openAdd = () => {
    setEditingContact(null);
    setForm(EMPTY_CONTACT);
    setModalVisible(true);
  };

  const openEdit = (c: Contact) => {
    setEditingContact(c);
    setForm({ firstName: c.firstName, lastName: c.lastName, idNumber: c.idNumber, phone: c.phone, company: c.company });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() && !form.lastName.trim()) {
      Alert.alert('שגיאה', 'יש להזין לפחות שם פרטי או שם משפחה');
      return;
    }
    if (editingContact) {
      await updateContact({ ...editingContact, ...form });
    } else {
      await addContact({ id: genId(), ...form });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const Field = ({ label, value, onChange, keyboardType }: { label: string; value: string; onChange: (t: string) => void; keyboardType?: any }) => (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        style={[styles.fieldInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
        textAlign="right"
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: topInset + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>אנשי קשר</Text>
          <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>הוסף</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>{contacts.length} אנשי קשר</Text>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="חיפוש לפי שם, טלפון, חברה..." />

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {search ? 'לא נמצאו תוצאות' : 'אין אנשי קשר עדיין'}
          </Text>
          {!search && (
            <TouchableOpacity onPress={openAdd} style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.emptyBtnText}>הוסף איש קשר ראשון</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          renderItem={({ item }) => (
            <ContactCard
              contact={item}
              onEdit={() => openEdit(item)}
              onDelete={() => deleteContact(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editingContact ? 'עריכת איש קשר' : 'איש קשר חדש'}
            </Text>
            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.saveBtnText}>שמור</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Field label="שם פרטי" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
            <Field label="שם משפחה" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} />
            <Field label="ת.ז." value={form.idNumber} onChange={v => setForm(f => ({ ...f, idNumber: v }))} keyboardType="numeric" />
            <Field label="טלפון" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} keyboardType="phone-pad" />
            <Field label="חברה" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, paddingHorizontal: 16, paddingBottom: 12, gap: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  count: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  list: { paddingVertical: 8, paddingBottom: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 14,
  },
  modalTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  modalContent: { padding: 16, gap: 14 },
  fieldWrapper: { gap: 4 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'right' },
  fieldInput: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15, fontFamily: 'Inter_400Regular', writingDirection: 'rtl',
  },
});
