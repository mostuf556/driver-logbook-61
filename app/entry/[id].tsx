import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAppData } from '@/hooks/useAppData';
import { EntryForm } from '@/components/EntryForm';
import { Stack } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { entries, updateEntry } = useAppData();
  const entry = entries.find(e => e.id === id);

  if (!entry) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>רשומה לא נמצאה</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `${entry.firstName} ${entry.lastName}` }} />
      <EntryForm
        initial={entry}
        onSave={async (updated) => {
          await updateEntry(updated);
          router.back();
        }}
        onCancel={() => router.back()}
        showExitTime={true}
      />
    </>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
});
