import type { AppSettings } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  openRouterApiKey: '',
  openRouterApiKeys: [],
  openRouterBaseUrl: 'https://openrouter.ai/api/v1',
  openRouterModel: 'google/gemini-flash-1.5',
  ocrPrompt:
    'Extract the license plate number from this image. Return only the plate number characters with no spaces, dashes, or extra text. If you cannot find a plate, return "NOT_FOUND".',
  ocrAutoFillCarNumber: true,
  ocrMaxImageSizeMB: 1,
  defaultGuard: '',
  defaultApprover: '',
  defaultCompany: '',
  retentionDays: 30,
  autoFillEntryTime: true,
  autoFillDate: true,
  requireApprover: false,
  requireGuard: false,
  requireCarNumber: false,
  requirePhone: false,
  requireIdNumber: false,
  validateIsraeliId: false,
};
