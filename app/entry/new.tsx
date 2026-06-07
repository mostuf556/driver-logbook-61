import { useRouter } from 'expo-router';
import { useAppData } from '@/hooks/useAppData';
import { EntryForm } from '@/components/EntryForm';
import { Stack } from 'expo-router';

export default function NewEntryScreen() {
  const router = useRouter();
  const { addEntry } = useAppData();

  return (
    <>
      <Stack.Screen options={{ title: 'כניסה חדשה' }} />
      <EntryForm
        onSave={async (entry) => {
          await addEntry(entry);
          router.back();
        }}
        onCancel={() => router.back()}
        showExitTime={false}
      />
    </>
  );
}
