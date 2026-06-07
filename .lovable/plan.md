# Driver Report App — Plan (v3)

Hebrew/RTL web app stored in browser localStorage. No backend. Log driver gate entries, manage contacts per company, export daily CSV. Optional OpenRouter image OCR for car plate numbers. **Anything tweakable lives in `/settings` so the user has full control without code changes.**

## Core Workflow (gate flow)

1. Driver arrives → **"כניסה חדשה"** → `date`+`entryTime` auto-filled with now. Record is **open** (no exitTime).
2. Driver leaves → **"יציאה"** button on the open row sets `exitTime = now` and recomputes `סהכ זמן`.
3. **"ערוך"** on any row for manual edits.

Dashboard sections: Open entries (on-site) → Today's closed → History (collapsible, filterable).

## Pages

`/` dashboard · `/entries/new` · `/entries/$id` · `/contacts` · `/settings`

## Full Config (`/settings`)

All values stored in localStorage under `settings`. Reset-to-defaults button. Import/export settings as JSON.

### General
- `language` (he) — reserved for future
- `direction` (rtl/ltr) — default rtl
- `theme` (light/dark/system) — default light
- `dateFormat` (`dd/mm/yyyy` | `yyyy-mm-dd` | `dd.mm.yyyy`)
- `timeFormat` (`HH:mm` | `h:mm a`)
- `timezone` (default: browser)
- `weekStart` (sun/mon)

### Retention & cleanup
- `retentionDays` (default 30) — purge closed reports older than this
- `keepOpenEntriesForever` (true) — never auto-purge on-site records
- `purgeOnAppLoad` (true)
- `imageRetentionHours` (default 0 = delete immediately on confirm)

### Entry form defaults & behavior
- `autoFillDate` (true), `autoFillEntryTime` (true)
- `defaultCompany`, `defaultApprover` (שם המאשר), `defaultGuard` (שם השומר)
- `requireApprover`, `requireGuard`, `requireCarNumber`, `requirePhone`, `requireIdNumber` (booleans)
- `allowOvernight` (true) — if exit < entry, count as next-day
- `roundTimesToMinutes` (1 | 5 | 15)
- `liveOnSiteBadge` (true) — show running clock on open rows

### Validation
- `phoneMinLength` (9), `phoneMaxLength` (10)
- `phoneAllowedPrefixes` (e.g. `0,+972`)
- `idNumberLength` (9), `validateIsraeliId` (true)
- `carNumberMinLength` (5), `carNumberMaxLength` (8)
- `carNumberAllowedChars` (regex, default digits+dash)

### Auto-complete (field-scoped)
- `autocompleteEnabled` (true)
- `autocompleteMinChars` (1)
- `autocompleteMaxSuggestions` (8)
- `autocompleteFields` — checklist of {driverName, idNumber, phone, company, carNumber, approverName, guardName} (each toggleable)
- `autoFillOnSelect` (true) — selecting a suggestion fills sibling fields from same contact
- `matchMode` (`prefix` | `substring`) per field
- `caseSensitive` (false)

### Contacts auto-update
- `autoUpdateContactsOnSave` (true)
- `contactUpsertKey` (`idNumber` | `phone` | `name+company`)
- `contactFields` — checklist of which fields to persist to contacts (default: driverName, idNumber, phone, company; excludes date/times)
- `confirmBeforeContactOverwrite` (false)

### CSV export
- `csvFilenamePattern` (default `driver_report_dd_mm_yyyy`)
- `csvDelimiter` (`,` | `;` | `\t`)
- `csvIncludeBom` (true) — UTF-8 BOM for Excel
- `csvQuotePhone` (true) — preserve leading 0
- `csvColumns` — ordered, toggleable list with Hebrew header overrides for each:
  תאריך, שם הנהג, תעודת זהות, טלפון, מספר הרכב, שעת כניסה, שעת יציאה, סהכ זמן, שם המאשר, חברה, שם השומר
- `csvDateFormat`, `csvTimeFormat` (mirror General or override)
- `csvIncludeOpenEntries` (false)
- `csvAllRangeDefault` (`today` | `last7` | `last30` | `all`)

### OpenRouter OCR
- `openRouterApiKey` (string, device-local — clear warning)
- `openRouterBaseUrl` (`https://openrouter.ai/api/v1`)
- `openRouterModel` (default `google/gemini-2.5-flash`)
- `ocrPrompt` (editable system prompt, default: "Return only the license plate digits, no other text.")
- `ocrAutoFillCarNumber` (true)
- `ocrRequireConfirmation` (true)
- `ocrMaxImageSizeMB` (5) — client-side downscale above this
- `ocrAllowedMimeTypes` (jpeg, png, webp)

### Storage
- `storageNamespace` (default `driver-report`) — to run multiple instances per browser
- Manual buttons: Export all data (JSON), Import (JSON), Clear all (with confirm).

## Data Model

`driver_reports[]`, `contacts[]`, `settings`, `pending_images[]`.

```
driver_report: { id, date, driverName, idNumber, phone, carNumber,
  entryTime, exitTime|null, approverName, company, guardName,
  createdAt, updatedAt }
contact: { id, driverName, idNumber, phone, company }
```

`סהכ זמן` is always computed at render time from `entryTime`/`exitTime` (+overnight rule).

## Auto-complete behavior
Per-field combobox (shadcn `command`). Matches **only same-field values from contacts**. Selecting fills siblings from that contact if `autoFillOnSelect`. No cross-field matching ever.

## Retention
On load (if `purgeOnAppLoad`): drop closed reports older than `today - retentionDays`. Open kept if `keepOpenEntriesForever`. Expire `pending_images` past `imageRetentionHours`.

## OpenRouter flow
Camera/file → base64 → POST to `${openRouterBaseUrl}/chat/completions` with `openRouterModel` + `ocrPrompt`. Show preview + editable extracted text. On confirm: write `carNumber`, then delete now or after `imageRetentionHours`.

## UI / Design
`<html lang="he" dir="rtl">`. Tailwind + shadcn (Card, Table, Dialog, Select, Command/Popover, Input, Form, Sonner). Light neutral palette, no purple. Mobile-first; table → card list on narrow screens. Settings page grouped by accordion sections matching the config groups above.

## Technical

Stack: existing TanStack Start, client-only.

New files:
- `src/lib/types.ts`, `src/lib/defaults.ts` (default settings)
- `src/lib/storage.ts` (namespaced localStorage + purge)
- `src/lib/settings.ts` (typed getter/setter, JSON import/export)
- `src/lib/csv.ts` (configurable delimiter/columns/BOM/filename pattern)
- `src/lib/time.ts`, `src/lib/format.ts` (date/time formatters)
- `src/lib/validation.ts` (configurable phone/id/car validators, optional Israeli-ID check digit)
- `src/lib/contacts.ts` (upsert by configured key, suggestion index)
- `src/lib/openrouter.ts`
- `src/components/FieldAutocomplete.tsx`, `EntryForm.tsx`, `EntriesTable.tsx`, `LeaveButton.tsx`, `PlateOcrDialog.tsx`, `ContactsManager.tsx`, `SettingsForm.tsx` (grouped accordion)
- Routes: replace `src/routes/index.tsx`; add `entries.new.tsx`, `entries.$id.tsx`, `contacts.tsx`, `settings.tsx`

No new deps.

## Out of Scope (confirm if wanted)
Multi-device sync · printing/PDF · server-side OCR proxy · multi-user auth.

Approve and I'll build.
