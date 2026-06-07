import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DriverReport, Contact, AppSettings, TokenLogEntry } from './types';
import { DEFAULT_SETTINGS } from './defaults';

const KEYS = {
  entries: 'driver-report:entries',
  contacts: 'driver-report:contacts',
  settings: 'driver-report:settings',
  tokenLog: 'driver-report:openrouter-tokens',
  rrIndex: 'driver-report:openrouter-rr-index',
};

async function getItem<T>(key: string): Promise<T | null> {
  try {
    const val = await AsyncStorage.getItem(key);
    if (!val) return null;
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const storage = {
  async getEntries(): Promise<DriverReport[]> {
    return (await getItem<DriverReport[]>(KEYS.entries)) ?? [];
  },
  async saveEntries(entries: DriverReport[]): Promise<void> {
    await setItem(KEYS.entries, entries);
  },
  async getContacts(): Promise<Contact[]> {
    return (await getItem<Contact[]>(KEYS.contacts)) ?? [];
  },
  async saveContacts(contacts: Contact[]): Promise<void> {
    await setItem(KEYS.contacts, contacts);
  },
  async getSettings(): Promise<AppSettings> {
    const saved = await getItem<Partial<AppSettings>>(KEYS.settings);
    return { ...DEFAULT_SETTINGS, ...saved };
  },
  async saveSettings(settings: AppSettings): Promise<void> {
    await setItem(KEYS.settings, settings);
  },
  async getTokenLog(): Promise<TokenLogEntry[]> {
    return (await getItem<TokenLogEntry[]>(KEYS.tokenLog)) ?? [];
  },
  async appendTokenLog(entry: TokenLogEntry): Promise<void> {
    const log = await storage.getTokenLog();
    log.unshift(entry);
    await setItem(KEYS.tokenLog, log.slice(0, 500));
  },
  async clearTokenLog(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.tokenLog);
  },
  async getRRIndex(): Promise<number> {
    return (await getItem<number>(KEYS.rrIndex)) ?? 0;
  },
  async setRRIndex(idx: number): Promise<void> {
    await setItem(KEYS.rrIndex, idx);
  },
};
