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
import type { AppSettings, Contact, DriverReport } from "@/lib/types";

let listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

export function useAppData() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [reports, setReports] = useState<DriverReport[]>(() => loadReports());
  const [contacts, setContacts] = useState<Contact[]>(() => loadContacts());

  useEffect(() => {
    purgeOldData(loadSettings());
    setReports(loadReports());
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
    notify();
  }, []);
  const updateReports = useCallback((r: DriverReport[]) => {
    saveReports(r);
    notify();
  }, []);
  const updateContacts = useCallback((c: Contact[]) => {
    saveContacts(c);
    notify();
  }, []);

  return { settings, reports, contacts, updateSettings, updateReports, updateContacts };
}