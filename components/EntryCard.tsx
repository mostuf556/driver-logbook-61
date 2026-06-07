import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { calcDuration, formatTime } from '@/lib/validation';
import type { DriverReport } from '@/lib/types';

interface Props {
  entry: DriverReport;
  onPress: () => void;
  onExit: () => void;
  onDelete: () => void;
}

export function EntryCard({ entry, onPress, onExit, onDelete }: Props) {
  const colors = useColors();
  const hasExit = !!entry.exitTime;
  const duration = hasExit ? calcDuration(entry.entryTime, entry.exitTime!) : null;

  const confirmDelete = () => {
    Alert.alert('מחיקת רשומה', 'האם למחוק רשומה זו?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחיקה', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {entry.firstName} {entry.lastName}
          </Text>
          {!hasExit && (
            <View style={[styles.badge, { backgroundColor: colors.success + '22' }]}>
              <Text style={[styles.badgeText, { color: colors.success }]}>בפנים</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={confirmDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Ionicons name="car-outline" size={14} color={colors.mutedForeground} />
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>{entry.carNumber || '—'}</Text>
        {!!entry.company && (
          <>
            <Text style={[styles.dot, { color: colors.border }]}>·</Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{entry.company}</Text>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.timeRow}>
          <Ionicons name="enter-outline" size={14} color={colors.primary} />
          <Text style={[styles.time, { color: colors.primary }]}>{entry.entryTime}</Text>
          {hasExit && (
            <>
              <Ionicons name="exit-outline" size={14} color={colors.mutedForeground} style={{ marginStart: 8 }} />
              <Text style={[styles.time, { color: colors.mutedForeground }]}>{entry.exitTime}</Text>
              {duration && (
                <Text style={[styles.duration, { color: colors.mutedForeground }]}>({duration})</Text>
              )}
            </>
          )}
        </View>
        {!hasExit && (
          <TouchableOpacity
            onPress={onExit}
            style={[styles.exitBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Ionicons name="exit-outline" size={14} color="#fff" />
            <Text style={styles.exitBtnText}>יציאה</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 14,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    marginHorizontal: 4,
    fontSize: 16,
  },
  meta: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  duration: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginStart: 4,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  exitBtnText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
