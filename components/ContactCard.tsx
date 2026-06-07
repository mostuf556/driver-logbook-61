import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { Contact } from '@/lib/types';

interface Props {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContactCard({ contact, onEdit, onDelete }: Props) {
  const colors = useColors();

  const confirmDelete = () => {
    Alert.alert('מחיקת איש קשר', `למחוק את ${contact.firstName} ${contact.lastName}?`, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחיקה', style: 'destructive', onPress: onDelete },
    ]);
  };

  const initials = `${contact.firstName[0] ?? ''}${contact.lastName[0] ?? ''}`.toUpperCase();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: colors.primary + '22' }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {contact.firstName} {contact.lastName}
        </Text>
        <View style={styles.metaRow}>
          {!!contact.phone && (
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{contact.phone}</Text>
          )}
          {!!contact.company && (
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>· {contact.company}</Text>
          )}
        </View>
        {!!contact.idNumber && (
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>ת.ז. {contact.idNumber}</Text>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={20} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 4,
  },
  meta: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  actions: {
    flexDirection: 'column',
    gap: 12,
  },
});
