import { DEFAULT_SETTINGS } from "./defaults";
import type { AppSettings, Contact, DriverReport, PendingImage } from "./types";

type LegacyDriver = Partial<DriverReport> & { driverName?: string };
type LegacyContact = Partial<Contact> & { driverName?: string };

function splitName(name: string): { firstName: string; lastName: string } {
  const t = (name || "").trim();
  if (!t) return { firstName: "", lastName: "" };
  const i = t.indexOf(" ");
  if (i < 0) return { firstName: t, lastName: "" };
  return { firstName: t.slice(0, i), lastName: t.slice(i + 1).trim() };
}

function migrateReport(r: LegacyDriver): DriverReport {
  if (r.firstName === undefined && r.lastName === undefined && r.driverName !== undefined) {
    const { firstName, lastName } = splitName(r.driverName);
    return { ...(r as DriverReport), firstName, lastName };
  }
  return {
    firstName: "",
    lastName: "",
    ...(r as DriverReport),
  };
}

function migrateContact(c: LegacyContact): Contact {
  if (c.firstName === undefined && c.lastName === undefined && c.driverName !== undefined) {
    const { firstName, lastName } = splitName(c.driverName);
    return { ...(c as Contact), firstName, lastName };
  }
  return { firstName: "", lastName: "", ...(c as Contact) };
}

const META_NS_KEY = "driver-report:namespace";

function getNamespace(): string {
  if (typeof window === "undefined") return DEFAULT_SETTINGS.storageNamespace;
  return window.localStorage.getItem(META_NS_KEY) || DEFAULT_SETTINGS.storageNamespace;
}

export function setNamespace(ns: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(META_NS_KEY, ns);
}

function k(key: string) {
  return `${getNamespace()}:${key}`;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(k(key));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(k(key), JSON.stringify(value));
}

// Settings
export function loadSettings(): AppSettings {
  const stored = read<Partial<AppSettings>>("settings", {});
  return { ...DEFAULT_SETTINGS, ...stored };
}
export function saveSettings(s: AppSettings) {
  setNamespace(s.storageNamespace || DEFAULT_SETTINGS.storageNamespace);
  write("settings", s);
}

// Reports
export function loadReports(): DriverReport[] {
  return read<LegacyDriver[]>("driver_reports", []).map(migrateReport);
}
export function saveReports(list: DriverReport[]) {
  write("driver_reports", list);
}

// Contacts
export function loadContacts(): Contact[] {
  return read<LegacyContact[]>("contacts", []).map(migrateContact);
}
export function saveContacts(list: Contact[]) {
  write("contacts", list);
}

// Pending images
export function loadPendingImages(): PendingImage[] {
  return read<PendingImage[]>("pending_images", []);
}
export function savePendingImages(list: PendingImage[]) {
  write("pending_images", list);
}

// Maintenance
export function purgeOldData(settings: AppSettings) {
  if (!settings.purgeOnAppLoad) return;
  const reports = loadReports();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - settings.retentionDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const kept = reports.filter((r) => {
    if (settings.keepOpenEntriesForever && !r.exitTime) return true;
    return r.date >= cutoffStr;
  });
  if (kept.length !== reports.length) saveReports(kept);

  // Pending images
  const imgs = loadPendingImages();
  const now = Date.now();
  const keepImgs = imgs.filter(
    (i) => now - new Date(i.capturedAt).getTime() < settings.imageRetentionHours * 3600_000,
  );
  if (keepImgs.length !== imgs.length) savePendingImages(keepImgs);
}

export function exportAllJson(): string {
  return JSON.stringify(
    {
      settings: loadSettings(),
      driver_reports: loadReports(),
      contacts: loadContacts(),
    },
    null,
    2,
  );
}

export function importAllJson(json: string) {
  const data = JSON.parse(json);
  if (data.settings) saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
  if (Array.isArray(data.driver_reports)) saveReports(data.driver_reports);
  if (Array.isArray(data.contacts)) saveContacts(data.contacts);
}

export function clearAll() {
  if (typeof window === "undefined") return;
  ["settings", "driver_reports", "contacts", "pending_images"].forEach((key) =>
    window.localStorage.removeItem(k(key)),
  );
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}