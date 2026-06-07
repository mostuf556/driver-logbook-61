import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAppData } from '@/hooks/useAppData';
import { AutocompleteInput } from './AutocompleteInput';
import { extractPlateNumber } from '@/lib/openrouter';
import { formatDate, formatTime, validateIsraeliId } from '@/lib/validation';
import type { DriverReport } from '@/lib/types';

interface Props {
  initial?: Partial<DriverReport>;
  onSave: (r: DriverReport) => void;
  onCancel: () => void;
  showExitTime?: boolean;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function EntryForm({ initial, onSave, onCancel, showExitTime = false }: Props) {
  const colors = useColors();
  const { contacts, settings } = useAppData();
  const now = new Date();

  const [date, setDate] = useState(initial?.date ?? (settings.autoFillDate ? formatDate(now) : ''));
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [idNumber, setIdNumber] = useState(initial?.idNumber ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [carNumber, setCarNumber] = useState(initial?.carNumber ?? '');
  const [entryTime, setEntryTime] = useState(initial?.entryTime ?? (settings.autoFillEntryTime ? formatTime(now) : ''));
  const [exitTime, setExitTime] = useState(initial?.exitTime ?? '');
  const [approverName, setApproverName] = useState(initial?.approverName ?? settings.defaultApprover);
  const [company, setCompany] = useState(initial?.company ?? settings.defaultCompany);
  const [guardName, setGuardName] = useState(initial?.guardName ?? settings.defaultGuard);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const firstNames = [...new Set(contacts.map(c => c.firstName).filter(Boolean))];
  const lastNames = [...new Set(contacts.map(c => c.lastName).filter(Boolean))];
  const companies = [...new Set(contacts.map(c => c.company).filter(Boolean))];
  const approvers = [...new Set(contacts.map(c => `${c.firstName} ${c.lastName}`).filter(s => s.trim()))];

  const fillFromContact = useCallback((firstName: string) => {
    const match = contacts.find(c => c.firstName === firstName);
    if (!match) return;
    setLastName(match.lastName || lastName);
    setIdNumber(match.idNumber || idNumber);
    setPhone(match.phone || phone);
    setCompany(match.company || company);
  }, [contacts, lastName, idNumber, phone, company]);

  const handleOcr = async () => {
    const keys = (settings.openRouterApiKeys ?? []).filter(Boolean);
    const hasKey = keys.length > 0 || !!settings.openRouterApiKey;
    if (!hasKey) {
      Alert.alert('חסר מפתח API', 'הגדר מפתח OpenRouter בהגדרות כדי לזהות לוחיות אוטומטית.');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (galleryStatus.status !== 'granted') {
        Alert.alert('הרשאה נדרשת', 'יש לאשר גישה למצלמה או לגלריה.');
        return;
      }
    }

    Alert.alert('זיהוי לוחית', 'בחר מקור', [
      {
        text: 'מצלמה',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            base64: true,
          });
          if (!result.canceled && result.assets[0]) {
            await processImage(result.assets[0].base64 ?? '', result.assets[0].mimeType ?? 'image/jpeg');
          }
        },
      },
      {
        text: 'גלריה',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            base64: true,
          });
          if (!result.canceled && result.assets[0]) {
            await processImage(result.assets[0].base64 ?? '', result.assets[0].mimeType ?? 'image/jpeg');
          }
        },
      },
      { text: 'ביטול', style: 'cancel' },
    ]);
  };

  const processImage = async (base64: string, mimeType: string) => {
    setOcrLoading(true);
    try {
      const dataUrl = `data:${mimeType};base64,${base64}`;
      const { plate } = await extractPlateNumber(dataUrl, settings);
      if (plate && plate !== 'NOT_FOUND') {
        setCarNumber(plate);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('לא זוהתה לוחית', 'לא הצלחנו לזהות לוחית רכב בתמונה.');
      }
    } catch (e: any) {
      Alert.alert('שגיאת OCR', e.message ?? 'אירעה שגיאה בזיהוי הלוחית.');
    } finally {
      setOcrLoading(false);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'שם פרטי נדרש';
    if (!lastName.trim()) errs.lastName = 'שם משפחה נדרש';
    if (!date.trim()) errs.date = 'תאריך נדרש';
    if (!entryTime.trim()) errs.entryTime = 'שעת כניסה נדרשת';
    if (settings.requireCarNumber && !carNumber.trim()) errs.carNumber = 'מספר רכב נדרש';
    if (settings.requirePhone && !phone.trim()) errs.phone = 'טלפון נדרש';
    if (settings.requireIdNumber && !idNumber.trim()) errs.idNumber = 'ת.ז. נדרשת';
    if (settings.requireApprover && !approverName.trim()) errs.approverName = 'מאשר נדרש';
    if (settings.requireGuard && !guardName.trim()) errs.guardName = 'שומר נדרש';
    if (settings.validateIsraeliId && idNumber && !validateIsraeliId(idNumber)) {
      errs.idNumber = 'ת.ז. לא תקינה';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const now = new Date().toISOString();
    const report: DriverReport = {
      id: initial?.id ?? genId(),
      date: date.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      idNumber: idNumber.trim(),
      phone: phone.trim(),
      carNumber: carNumber.trim(),
      entryTime: entryTime.trim(),
      exitTime: exitTime.trim() || null,
      approverName: approverName.trim(),
      company: company.trim(),
      guardName: guardName.trim(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(report);
  };

  const Field = ({
    label, value, onChange, placeholder, keyboardType, required, error, children,
  }: {
    label: string; value?: string; onChange?: (t: string) => void;
    placeholder?: string; keyboardType?: any; required?: boolean;
    error?: string; children?: React.ReactNode;
  }) => (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label}{required ? ' *' : ''}
      </Text>
      {children ?? (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: error ? colors.destructive : colors.border,
              color: colors.foreground,
            },
          ]}
          textAlign="right"
        />
      )}
      {error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}
    </View>
  );

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.grid}>
        <View style={styles.half}>
          <AutocompleteInput
            label="שם פרטי *"
            value={firstName}
            onChangeText={setFirstName}
            suggestions={firstNames}
            onSelectSuggestion={fillFromContact}
            required
          />
          {errors.firstName && <Text style={[styles.error, { color: colors.destructive }]}>{errors.firstName}</Text>}
        </View>
        <View style={styles.half}>
          <AutocompleteInput
            label="שם משפחה *"
            value={lastName}
            onChangeText={setLastName}
            suggestions={lastNames}
          />
          {errors.lastName && <Text style={[styles.error, { color: colors.destructive }]}>{errors.lastName}</Text>}
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.half}>
          <Field label="ת.ז." value={idNumber} onChange={setIdNumber}
            placeholder="123456789" keyboardType="numeric" error={errors.idNumber} />
        </View>
        <View style={styles.half}>
          <Field label="טלפון" value={phone} onChange={setPhone}
            placeholder="050..." keyboardType="phone-pad" error={errors.phone} />
        </View>
      </View>

      <Field label="מספר רכב" error={errors.carNumber}>
        <View style={styles.carRow}>
          <TextInput
            value={carNumber}
            onChangeText={setCarNumber}
            placeholder="123-45-678"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              styles.carInput,
              {
                backgroundColor: colors.card,
                borderColor: errors.carNumber ? colors.destructive : colors.border,
                color: colors.foreground,
              },
            ]}
            textAlign="right"
            autoCapitalize="characters"
          />
          <TouchableOpacity
            onPress={handleOcr}
            style={[styles.ocrBtn, { backgroundColor: colors.primary }]}
            disabled={ocrLoading}
            activeOpacity={0.8}
          >
            {ocrLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="camera" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </Field>

      <AutocompleteInput
        label="חברה"
        value={company}
        onChangeText={setCompany}
        suggestions={companies}
      />

      <View style={styles.grid}>
        <View style={styles.half}>
          <Field label="תאריך *" value={date} onChange={setDate}
            placeholder="2024-01-15" error={errors.date} />
        </View>
        <View style={styles.half}>
          <Field label="שעת כניסה *" value={entryTime} onChange={setEntryTime}
            placeholder="08:30" keyboardType="numbers-and-punctuation" error={errors.entryTime} />
        </View>
      </View>

      {showExitTime && (
        <View style={styles.grid}>
          <View style={styles.half}>
            <Field label="שעת יציאה" value={exitTime} onChange={setExitTime}
              placeholder="17:00" keyboardType="numbers-and-punctuation" />
          </View>
          <View style={styles.half}>
            <TouchableOpacity
              onPress={() => setExitTime(formatTime(new Date()))}
              style={[styles.nowBtn, { backgroundColor: colors.accent + '22', borderColor: colors.accent }]}
            >
              <Ionicons name="time-outline" size={16} color={colors.accent} />
              <Text style={[styles.nowBtnText, { color: colors.accent }]}>עכשיו</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <AutocompleteInput
        label="מאשר"
        value={approverName}
        onChangeText={setApproverName}
        suggestions={approvers}
      />

      <Field label="שומר" value={guardName} onChange={setGuardName} />

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>שמור</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCancel}
          style={[styles.cancelBtn, { borderColor: colors.border }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>ביטול</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  grid: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, zIndex: 1 },
  fieldWrapper: { gap: 4 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'right' },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15, fontFamily: 'Inter_400Regular', writingDirection: 'rtl',
  },
  error: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  carRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  carInput: { flex: 1 },
  ocrBtn: {
    width: 46, height: 46, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  nowBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, borderWidth: 1, borderRadius: 10,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10, marginTop: 21,
  },
  nowBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  saveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 12,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  cancelBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  cancelBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium' },
});
