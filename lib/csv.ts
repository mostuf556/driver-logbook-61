import { Platform } from 'react-native';
import type { DriverReport } from './types';
import { calcDuration } from './validation';

const HEADERS = [
  'תאריך', 'שם פרטי', 'שם משפחה', 'ת.ז.', 'טלפון',
  'מספר רכב', 'שעת כניסה', 'שעת יציאה', 'זמן שהייה',
  'מאשר', 'חברה', 'שומר',
];

function escapeCell(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export function buildCsv(entries: DriverReport[]): string {
  const bom = '\uFEFF';
  const rows = [HEADERS.join(',')];
  for (const e of entries) {
    const duration = e.exitTime ? calcDuration(e.entryTime, e.exitTime) : '';
    rows.push([
      e.date, e.firstName, e.lastName, e.idNumber, e.phone,
      e.carNumber, e.entryTime, e.exitTime ?? '', duration,
      e.approverName, e.company, e.guardName,
    ].map(escapeCell).join(','));
  }
  return bom + rows.join('\n');
}

export async function exportCsv(entries: DriverReport[], filename: string): Promise<void> {
  const csv = buildCsv(entries);
  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  try {
    const FileSystem = await import('expo-file-system');
    const Sharing = await import('expo-sharing');
    const path = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
    }
  } catch (e) {
    console.error('CSV export error', e);
    throw e;
  }
}
