import type { AppSettings, CsvColumn } from "./types";

export const DEFAULT_CSV_COLUMNS: CsvColumn[] = [
  { key: "date", header: "תאריך", enabled: true },
  { key: "firstName", header: "שם פרטי", enabled: true },
  { key: "lastName", header: "שם משפחה", enabled: true },
  { key: "idNumber", header: "תעודת זהות", enabled: true },
  { key: "phone", header: "טלפון", enabled: true },
  { key: "carNumber", header: "מספר רכב", enabled: true },
  { key: "entryTime", header: "שעת כניסה", enabled: true },
  { key: "exitTime", header: "שעת יציאה", enabled: true },
  { key: "totalTime", header: "סהכ זמן", enabled: true },
  { key: "approverName", header: "שם המאשר", enabled: true },
  { key: "company", header: "חברה", enabled: true },
  { key: "guardName", header: "שם השומר", enabled: true },
];

// Paper OCR import: column order = field meaning. Editable in Settings.
// Order is: date, fullName, idOrPhone, carNumber, entryTime, exitTime,
// approverName, company, guardName.
export const DEFAULT_PAPER_OCR_COLUMNS: string[] = [
  "תאריך",
  "שם הנהג",
  "תעודת זהות",
  "מספר רכב",
  "שעת כניסה",
  "שעת יציאה",
  "שם המאשר",
  "חברה",
  "שם השומר",
];

export const DEFAULT_PAPER_OCR_PROMPT =
  "Extract every driver-log row from this image. Return STRICT JSON with shape {\"rows\":[[...]]} where each inner array's values map IN ORDER to the columns: {{COLUMNS}}. Dates as YYYY-MM-DD, times as HH:mm (24h). Use empty string for missing values. No prose, no markdown, no explanation.";

export const DEFAULT_SETTINGS: AppSettings = {
  direction: "rtl",
  language: "he",
  theme: "light",
  dateFormat: "dd/mm/yyyy",
  timeFormat: "HH:mm",

  retentionDays: 30,
  keepOpenEntriesForever: true,
  purgeOnAppLoad: true,
  imageRetentionHours: 0,

  autoFillDate: true,
  autoFillEntryTime: true,
  defaultCompany: "",
  defaultApprover: "",
  defaultGuard: "",
  requireApprover: false,
  requireGuard: false,
  requireCarNumber: true,
  requirePhone: false,
  requireIdNumber: true,
  allowOvernight: true,
  roundTimesToMinutes: 1,
  liveOnSiteBadge: true,

  phoneMinLength: 9,
  phoneMaxLength: 15,
  phoneAllowedPrefixes: "0,+972",
  idNumberLength: 9,
  validateIsraeliId: false,
  carNumberMinLength: 5,
  carNumberMaxLength: 10,
  carNumberAllowedChars: "^[0-9-]+$",

  autocompleteEnabled: true,
  autocompleteMinChars: 1,
  autocompleteMaxSuggestions: 8,
  autocompleteFields: [
    "firstName",
    "lastName",
    "idNumber",
    "phone",
    "company",
    "carNumber",
    "approverName",
    "guardName",
  ],
  autoFillOnSelect: true,
  matchMode: "substring",
  caseSensitive: false,

  autoUpdateContactsOnSave: true,
  contactUpsertKey: "idNumber",
  contactFields: ["firstName", "lastName", "idNumber", "phone", "company", "carNumbers"],
  confirmBeforeContactOverwrite: false,
  contactsFilenamePattern: "contact_list_dd_mm_yyyy",

  csvFilenamePattern: "driver_report_dd_mm_yyyy",
  csvDelimiter: ",",
  csvIncludeBom: true,
  csvQuotePhone: true,
  csvColumns: DEFAULT_CSV_COLUMNS,
  csvIncludeOpenEntries: true,

  openRouterApiKey: "",
  openRouterApiKeys: [],
  openRouterBaseUrl: "https://openrouter.ai/api/v1",
  openRouterModel: "google/gemini-2.5-flash",
  ocrPrompt: "Extract only the license plate number from this image. Return only the plate digits/characters, no other text.",
  ocrAutoFillCarNumber: true,
  ocrRequireConfirmation: true,
  ocrMaxImageSizeMB: 5,

  paperOcrColumns: DEFAULT_PAPER_OCR_COLUMNS,
  paperPhoneSeparator: "-",
  paperOcrPrompt: DEFAULT_PAPER_OCR_PROMPT,

  storageNamespace: "driver-report",

  showDebugToggle: true,
};