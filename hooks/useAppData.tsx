import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { DEFAULT_SETTINGS } from '@/lib/defaults';
import type { DriverReport, Contact, AppSettings } from '@/lib/types';

interface AppDataContextType {
  entries: DriverReport[];
  contacts: Contact[];
  settings: AppSettings;
  isLoaded: boolean;
  saveSettings: (s: AppSettings) => Promise<void>;
  addEntry: (entry: DriverReport) => Promise<void>;
  updateEntry: (entry: DriverReport) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addContact: (c: Contact) => Promise<void>;
  updateContact: (c: Contact) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

const Ctx = createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<DriverReport[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      storage.getEntries(),
      storage.getContacts(),
      storage.getSettings(),
    ]).then(([e, c, s]) => {
      setEntries(e);
      setContacts(c);
      setSettings(s);
      setIsLoaded(true);
    });
  }, []);

  const saveSettings = useCallback(async (s: AppSettings) => {
    setSettings(s);
    await storage.saveSettings(s);
  }, []);

  const addEntry = useCallback(async (entry: DriverReport) => {
    setEntries(prev => {
      const next = [entry, ...prev];
      storage.saveEntries(next);
      return next;
    });
  }, []);

  const updateEntry = useCallback(async (entry: DriverReport) => {
    setEntries(prev => {
      const next = prev.map(e => (e.id === entry.id ? entry : e));
      storage.saveEntries(next);
      return next;
    });
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      storage.saveEntries(next);
      return next;
    });
  }, []);

  const addContact = useCallback(async (c: Contact) => {
    setContacts(prev => {
      const next = [c, ...prev];
      storage.saveContacts(next);
      return next;
    });
  }, []);

  const updateContact = useCallback(async (c: Contact) => {
    setContacts(prev => {
      const next = prev.map(x => (x.id === c.id ? c : x));
      storage.saveContacts(next);
      return next;
    });
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    setContacts(prev => {
      const next = prev.filter(x => x.id !== id);
      storage.saveContacts(next);
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{
      entries, contacts, settings, isLoaded,
      saveSettings,
      addEntry, updateEntry, deleteEntry,
      addContact, updateContact, deleteContact,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
