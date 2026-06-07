import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAppData } from '@/hooks/useAppData';
import { EntryCard } from '@/components/EntryCard';
import { SearchBar } from '@/components/SearchBar';
import { exportCsv } from '@/lib/csv';
import { formatDate, formatTime } from '@/lib/validation';
import type { DriverReport } from '@/lib/types';

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = formatDate(new Date());
  const yesterday = addDays(today, -1);
  if (dateStr === today) return 'היום';
  if (dateStr === yesterday) return 'אתמול';
  return d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function EntriesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { entries, updateEntry, deleteEntry, isLoaded } = useAppData();

  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    let list = entries.filter(e => e.date === selectedDate);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.carNumber.toLowerCase().includes(q) ||
        e.company.toLowerCase().includes(q) ||
        e.phone.includes(q),
      );
    }
    return list.sort((a, b) => b.entryTime.localeCompare(a.entryTime));
  }, [entries, selectedDate, search]);

  const openCount = filtered.filter(e => !e.exitTime).length;

  const handleExit = (entry: DriverReport) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateEntry({ ...entry, exitTime: formatTime(new Date()), updatedAt: new Date().toISOString() });
  };

  const handleExport = async () => {
    if (filtered.length === 0) return;
    setExporting(true);
    try {
      await exportCsv(filtered, `entries-${selectedDate}.csv`);
    } catch { /* ignore */ } finally {
      setExporting(false);
    }
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: topInset + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>דוח נהגים</Text>
          <View style={styles.headerActions}>
            {exporting
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <TouchableOpacity onPress={handleExport} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="download-outline" size={22} color={colors.mutedForeground} />
                </TouchableOpacity>}
            <TouchableOpacity
              onPress={() => router.push('/entry/new')}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addBtnText}>כניסה חדשה</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => setSelectedDate(d => addDays(d, 1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedDate(today)}>
            <Text style={[styles.dateText, { color: colors.foreground }]}>{formatDisplayDate(selectedDate)}</Text>
            {selectedDate !== today && (
              <Text style={[styles.dateSubText, { color: colors.mutedForeground }]}>{selectedDate}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedDate(d => addDays(d, -1))}
            disabled={selectedDate >= today}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-forward" size={22} color={selectedDate >= today ? colors.border : colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <Text style={[styles.statText, { color: colors.mutedForeground }]}>
            {filtered.length} רשומות
            {openCount > 0 && ` · ${openCount} בפנים`}
          </Text>
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="חיפוש לפי שם, רכב, חברה..." />

      {!isLoaded ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
            {search ? 'לא נמצאו תוצאות' : 'אין כניסות לתאריך זה'}
          </Text>
          {!search && (
            <TouchableOpacity
              onPress={() => router.push('/entry/new')}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.emptyBtnText}>הוסף כניסה ראשונה</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={e => e.id}
          renderItem={({ item }) => (
            <EntryCard
              entry={item}
              onPress={() => router.push(`/entry/${item.id}`)}
              onExit={() => handleExit(item)}
              onDelete={() => deleteEntry(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  dateSubText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  stats: { alignItems: 'flex-end' },
  statText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  list: { paddingVertical: 8, paddingBottom: 20 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
