import { useCallback, useEffect, useState } from "react";
import {
  loadContacts,
  loadReports,
  loadSettings,
  purgeOldData,
  saveContacts,
  saveReports,
  saveSettings,
} from "@/lib/storage";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import type { AppSettings, Contact, DriverReport } from "@/lib/types";

let listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

export function useAppData() {
  // SSR-safe: start with defaults, hydrate from localStorage after mount.
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [reports, setReports] = useState<DriverReport[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const s = loadSettings();
      purgeOldData(s);
      setSettings(s);
      setReports(loadReports());
      setContacts(loadContacts());
    } catch (e) {
      console.error("useAppData hydrate failed", e);
    }
    setHydrated(true);
    const handler = () => {
      setSettings(loadSettings());
      setReports(loadReports());
      setContacts(loadContacts());
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const updateSettings = useCallback((s: AppSettings) => {
    saveSettings(s);
    setSettings(s);
    notify();
  }, []);
  const updateReports = useCallback((r: DriverReport[]) => {
    saveReports(r);
    setReports(r);
    notify();
  }, []);
  const updateContacts = useCallback((c: Contact[]) => {
    saveContacts(c);
    setContacts(c);
    notify();
  }, []);

  return { settings, reports, contacts, hydrated, updateSettings, updateReports, updateContacts };
}
