import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Switch, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAppData } from '@/hooks/useAppData';
import type { AppSettings } from '@/lib/types';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, saveSettings } = useAppData();
  const [form, setForm] = useState<AppSettings>(settings);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    await saveSettings(form);
    setDirty(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const Field = ({ label, value, onChange, placeholder, keyboardType, secureTextEntry }: {
    label: string; value: string; onChange: (t: string) => void;
    placeholder?: string; keyboardType?: any; secureTextEntry?: boolean;
  }) => (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={v => { onChange(v); setDirty(true); }}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        textAlign="right"
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );

  const ToggleRow = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
      <Switch
        value={value}
        onValueChange={v => { onChange(v); setDirty(true); }}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor="#fff"
      />
      <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground, backgroundColor: colors.background }]}>{title}</Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: topInset + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>הגדרות</Text>
        {dirty && (
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.saveBtnText}>שמור</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 20 }]} showsVerticalScrollIndicator={false}>

        <SectionHeader title="OCR — זיהוי לוחית רכב" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardContent}>
            <Field label="מפתח API (OpenRouter)" value={form.openRouterApiKey}
              onChange={v => update('openRouterApiKey', v)} placeholder="sk-or-..." secureTextEntry />
            <Field label="מודל" value={form.openRouterModel}
              onChange={v => update('openRouterModel', v)} placeholder="google/gemini-flash-1.5" />
            <Field label="Base URL" value={form.openRouterBaseUrl}
              onChange={v => update('openRouterBaseUrl', v)} />
            <ToggleRow label="מילוי אוטומטי של לוחית" value={form.ocrAutoFillCarNumber}
              onChange={v => update('ocrAutoFillCarNumber', v)} />
          </View>
        </View>

        <SectionHeader title="מפתחות API מרובים (Round-Robin)" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardContent}>
            {(form.openRouterApiKeys ?? []).map((key, idx) => (
              <View key={idx} style={styles.multiKeyRow}>
                <TextInput
                  value={key}
                  onChangeText={v => {
                    const next = [...(form.openRouterApiKeys ?? [])];
                    next[idx] = v;
                    update('openRouterApiKeys', next);
                  }}
                  placeholder={`מפתח ${idx + 1} — sk-or-...`}
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry
                  style={[styles.fieldInput, { flex: 1, backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  textAlign="right"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => {
                    const next = (form.openRouterApiKeys ?? []).filter((_, i) => i !== idx);
                    update('openRouterApiKeys', next);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => update('openRouterApiKeys', [...(form.openRouterApiKeys ?? []), ''])}
              style={[styles.addKeyBtn, { borderColor: colors.border }]}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={[styles.addKeyBtnText, { color: colors.primary }]}>הוסף מפתח</Text>
            </TouchableOpacity>
          </View>
        </View>

        <SectionHeader title="ברירות מחדל לטופס" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardContent}>
            <Field label="שם שומר ברירת מחדל" value={form.defaultGuard}
              onChange={v => update('defaultGuard', v)} />
            <Field label="שם מאשר ברירת מחדל" value={form.defaultApprover}
              onChange={v => update('defaultApprover', v)} />
            <Field label="חברה ברירת מחדל" value={form.defaultCompany}
              onChange={v => update('defaultCompany', v)} />
            <ToggleRow label="מילוי אוטומטי של תאריך" value={form.autoFillDate}
              onChange={v => update('autoFillDate', v)} />
            <ToggleRow label="מילוי אוטומטי של שעת כניסה" value={form.autoFillEntryTime}
              onChange={v => update('autoFillEntryTime', v)} />
          </View>
        </View>

        <SectionHeader title="שדות חובה" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardContent}>
            <ToggleRow label="מספר רכב חובה" value={form.requireCarNumber}
              onChange={v => update('requireCarNumber', v)} />
            <ToggleRow label="טלפון חובה" value={form.requirePhone}
              onChange={v => update('requirePhone', v)} />
            <ToggleRow label="ת.ז. חובה" value={form.requireIdNumber}
              onChange={v => update('requireIdNumber', v)} />
            <ToggleRow label="מאשר חובה" value={form.requireApprover}
              onChange={v => update('requireApprover', v)} />
            <ToggleRow label="שומר חובה" value={form.requireGuard}
              onChange={v => update('requireGuard', v)} />
            <ToggleRow label="אמת ת.ז. ישראלית" value={form.validateIsraeliId}
              onChange={v => update('validateIsraeliId', v)} />
          </View>
        </View>

        <SectionHeader title="שמירת נתונים" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardContent}>
            <Field label="ימי שמירה" value={String(form.retentionDays)}
              onChange={v => update('retentionDays', parseInt(v) || 30)}
              keyboardType="numeric" />
          </View>
        </View>

        {dirty && (
          <TouchableOpacity onPress={handleSave} style={[styles.saveFooterBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.saveFooterBtnText}>שמור הגדרות</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, paddingHorizontal: 16, paddingBottom: 12,
  },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  content: { gap: 0 },
  sectionHeader: {
    fontSize: 12, fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6,
    textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  card: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  cardContent: { padding: 14, gap: 12 },
  fieldWrapper: { gap: 4 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'right' },
  fieldInput: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15, fontFamily: 'Inter_400Regular',
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    gap: 10, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: { fontSize: 15, fontFamily: 'Inter_400Regular', flex: 1, textAlign: 'right' },
  multiKeyRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addKeyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 8, borderWidth: 1,
    justifyContent: 'center',
  },
  addKeyBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  saveFooterBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 20, paddingVertical: 14, borderRadius: 12,
  },
  saveFooterBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
