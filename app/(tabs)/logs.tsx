import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { storage } from '@/lib/storage';
import type { TokenLogEntry } from '@/lib/types';

export default function LogsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<TokenLogEntry[]>([]);

  const load = useCallback(() => {
    storage.getTokenLog().then(setLogs);
  }, []);

  useFocusEffect(load);

  const totalTokens = logs.reduce((s, e) => s + e.total_tokens, 0);

  const handleClear = () => {
    Alert.alert('ניקוי לוגים', 'האם לנקות את כל נתוני השימוש?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'נקה', style: 'destructive', onPress: async () => {
          await storage.clearTokenLog();
          setLogs([]);
        },
      },
    ]);
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: topInset + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>לוגי שימוש</Text>
          {logs.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={22} color={colors.destructive} />
            </TouchableOpacity>
          )}
        </View>
        {logs.length > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: colors.primary + '11', borderColor: colors.primary + '33' }]}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>סה״כ טוקנים</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalTokens.toLocaleString()}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{logs.length} בקשות</Text>
          </View>
        )}
      </View>

      {logs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="analytics-outline" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            אין נתוני שימוש עדיין.{'\n'}השתמש בזיהוי לוחיות (OCR) כדי לראות כאן סטטיסטיקות.
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.logRow}>
                <Text style={[styles.logModel, { color: colors.foreground }]}>{item.model}</Text>
                <Text style={[styles.logTotal, { color: colors.primary }]}>{item.total_tokens} טוקנים</Text>
              </View>
              <View style={styles.logRow}>
                <Text style={[styles.logMeta, { color: colors.mutedForeground }]}>
                  {new Date(item.at).toLocaleString('he-IL')}
                </Text>
                <Text style={[styles.logMeta, { color: colors.mutedForeground }]}>
                  ↑{item.prompt_tokens} ↓{item.completion_tokens}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 10, borderWidth: 1,
    justifyContent: 'center',
  },
  summaryLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  summaryValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  list: { padding: 16, gap: 8 },
  logCard: {
    borderRadius: 10, borderWidth: 1, padding: 12, gap: 4,
  },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logModel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  logTotal: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  logMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
});
