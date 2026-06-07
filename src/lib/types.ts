export interface DriverReport {
  id: string;
  date: string; // YYYY-MM-DD
  firstName: string;
  lastName: string;
  idNumber: string;
  phone: string;
  carNumber: string;
  entryTime: string; // HH:mm
  exitTime: string | null;
  approverName: string;
  company: string;
  guardName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  phone: string;
  company: string;
}

export interface PendingImage {
  id: string;
  reportId: string;
  dataUrl: string;
  capturedAt: string; // ISO
}

export type AutocompleteField =
  | "firstName"
  | "lastName"
  | "idNumber"
  | "phone"
  | "company"
  | "carNumber"
  | "approverName"
  | "guardName";

export type CsvColumnKey =
  | "date"
  | "firstName"
  | "lastName"
  | "idNumber"
  | "phone"
  | "carNumber"
  | "entryTime"
  | "exitTime"
  | "totalTime"
  | "approverName"
  | "company"
  | "guardName";

export interface CsvColumn {
  key: CsvColumnKey;
  header: string;
  enabled: boolean;
}

export interface AppSettings {
  // General
  direction: "rtl" | "ltr";
  theme: "light" | "dark" | "blue" | "green" | "warm" | "system";
  dateFormat: "dd/mm/yyyy" | "yyyy-mm-dd" | "dd.mm.yyyy";
  timeFormat: "HH:mm" | "h:mm a";

  // Retention
  retentionDays: number;
  keepOpenEntriesForever: boolean;
  purgeOnAppLoad: boolean;
  imageRetentionHours: number;

  // Entry defaults
  autoFillDate: boolean;
  autoFillEntryTime: boolean;
  defaultCompany: string;
  defaultApprover: string;
  defaultGuard: string;
  requireApprover: boolean;
  requireGuard: boolean;
  requireCarNumber: boolean;
  requirePhone: boolean;
  requireIdNumber: boolean;
  allowOvernight: boolean;
  roundTimesToMinutes: 1 | 5 | 15;
  liveOnSiteBadge: boolean;

  // Validation
  phoneMinLength: number;
  phoneMaxLength: number;
  phoneAllowedPrefixes: string; // comma-separated
  idNumberLength: number;
  validateIsraeliId: boolean;
  carNumberMinLength: number;
  carNumberMaxLength: number;
  carNumberAllowedChars: string; // regex source

  // Autocomplete
  autocompleteEnabled: boolean;
  autocompleteMinChars: number;
  autocompleteMaxSuggestions: number;
  autocompleteFields: AutocompleteField[];
  autoFillOnSelect: boolean;
  matchMode: "prefix" | "substring";
  caseSensitive: boolean;

  // Contacts
  autoUpdateContactsOnSave: boolean;
  contactUpsertKey: "idNumber" | "phone" | "name+company";
  contactFields: ("firstName" | "lastName" | "idNumber" | "phone" | "company")[];
  confirmBeforeContactOverwrite: boolean;
  contactsFilenamePattern: string;

  // CSV
  csvFilenamePattern: string;
  csvDelimiter: "," | ";" | "\t";
  csvIncludeBom: boolean;
  csvQuotePhone: boolean;
  csvColumns: CsvColumn[];
  csvIncludeOpenEntries: boolean;

  // OpenRouter
  openRouterApiKey: string;
  openRouterBaseUrl: string;
  openRouterModel: string;
  ocrPrompt: string;
  ocrAutoFillCarNumber: boolean;
  ocrRequireConfirmation: boolean;
  ocrMaxImageSizeMB: number;

  // Storage
  storageNamespace: string;

  // Debug
  showDebugToggle: boolean;
}