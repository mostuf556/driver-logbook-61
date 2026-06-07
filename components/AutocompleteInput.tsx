import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Platform,
  KeyboardTypeOptions,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  suggestions: string[];
  onSelectSuggestion?: (val: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  required?: boolean;
  editable?: boolean;
}

export function AutocompleteInput({
  label,
  value,
  onChangeText,
  suggestions,
  onSelectSuggestion,
  placeholder,
  keyboardType = 'default',
  required,
  editable = true,
}: Props) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const filtered = focused && value.length >= 1
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s !== value).slice(0, 6)
    : [];
  const showDropdown = filtered.length > 0;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label}{required ? ' *' : ''}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        editable={editable}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: focused ? colors.primary : colors.border,
            color: colors.foreground,
          },
        ]}
        textAlign="right"
      />
      {showDropdown && (
        <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground }]}>
          {filtered.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                onChangeText(item);
                onSelectSuggestion?.(item);
                setFocused(false);
              }}
              style={[styles.dropdownItem, i < filtered.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <Text style={[styles.dropdownText, { color: colors.foreground }]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
    zIndex: 10,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    writingDirection: 'rtl',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 999,
    borderWidth: 1,
    borderRadius: 10,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
  },
});
