export interface DriverReport {
  id: string;
  date: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  phone: string;
  carNumber: string;
  entryTime: string;
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

export interface TokenLogEntry {
  at: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface AppSettings {
  openRouterApiKey: string;
  openRouterApiKeys: string[];
  openRouterBaseUrl: string;
  openRouterModel: string;
  ocrPrompt: string;
  ocrAutoFillCarNumber: boolean;
  ocrMaxImageSizeMB: number;
  defaultGuard: string;
  defaultApprover: string;
  defaultCompany: string;
  retentionDays: number;
  autoFillEntryTime: boolean;
  autoFillDate: boolean;
  requireApprover: boolean;
  requireGuard: boolean;
  requireCarNumber: boolean;
  requirePhone: boolean;
  requireIdNumber: boolean;
  validateIsraeliId: boolean;
}
