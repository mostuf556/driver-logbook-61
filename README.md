# דוח נהגים — Driver Gate Report

A Hebrew-first RTL web app for managing driver entry/exit records at a gated facility. Runs entirely in the browser with all data persisted in `localStorage` — no backend required.

## Features

### Entry Management
- Create, edit, and delete driver entry records (name, ID, phone, car number, company, approver, guard)
- Record entry and exit times; auto-fill today's date and current time
- Quick exit search for open entries by partial plate, driver name, ID, phone, or company
- One-click exit from matching open entries
- Live on-site badge for open entries with elapsed time
- Overnight crossing support and configurable time rounding

### CSV Export & Import
- Export records for a specific date or all records to CSV
- Import driver records from CSV with automatic header detection (Hebrew and English column names)
- Automatic duplicate detection on import: skips records with matching date + car number + entry time
- Configurable export columns, header text, order, delimiter, and BOM
- Phone numbers can be exported as Excel-safe quoted formulas to preserve leading zeros

### Contacts
- Full CRUD contact management page
- Search contacts and manage multiple license plates per contact
- Export/import contacts as CSV with duplicate detection
- Auto-update contacts from saved entries using configurable upsert key and fields

### OCR — License Plate Recognition
- Capture a plate photo by camera or upload from gallery
- Uses OpenRouter vision API with configurable model, prompt, and base URL
- Supports multiple API keys with automatic round-robin rotation
- Optional confirmation before applying recognized plate text
- Persisted token usage log with per-call details and clearable history
- Missing API key errors link directly to the Settings page

### Settings
- Date format, RTL/LTR direction, theme (light, dark, blue, green, warm, system)
- Form defaults for company, approver, guard, date, and entry time
- Required-field toggles and validation rules for phone, ID, and car number
- Autocomplete configuration: enabled fields, match mode, min chars, and max suggestions
- Retention policy for old records and pending OCR images
- Full JSON backup export/import

### Logs & Debug
- Debug mode via `#debug` URL hash or header toggle
- Error log viewer with copy, download, and clear controls

## Tech Stack

- **React 19** with **TanStack Start** (file-based routing)
- **TanStack Router** for client-side navigation
- **Tailwind CSS v4** with CSS variable themes
- **shadcn/ui** component library (Radix UI primitives)
- **Sonner** for toast notifications
- **OpenRouter** for OCR
- All data persisted locally in `localStorage` with a namespace-aware storage layer

## Project Structure

```
src/
  components/       # Shared UI components (AppLayout, EntriesTable, PlateOcrDialog, …)
  hooks/            # React hooks (use-app-data, use-debug-mode, use-theme, …)
  lib/              # Pure logic (csv, openrouter, storage, time, types, validation)
  routes/           # File-based pages (home, contacts, entries/[id], logs, settings)
```

## Run locally

```bash
npm install
npm run dev
```

## Roadmap

- **Cloud sync** — optional Supabase backend so data survives device wipe and supports multi-device
- **Multi-site / multi-guard** — tenant isolation so multiple gates share one deployment
- **Offline-first PWA** — service worker + IndexedDB for larger datasets and true offline support
- **Bulk operations** — multi-select entries for bulk exit, delete, or export
- **Reporting dashboard** — daily/weekly/monthly charts (peak hours, top companies, avg dwell time)
- **Shift management** — define guard shifts; entries automatically associated with the active shift
- **Plate recognition improvements** — camera preview with crop, batch OCR, confidence score display
- **QR / barcode scan** — scan a driver's QR badge instead of manual data entry
- **Audit log** — immutable record of who changed what and when
- **Push notifications** — alert when a driver has been on site longer than a threshold
- **Print / PDF export** — formatted daily report for physical sign-off
- **LDAP / Active Directory integration** — auto-lookup driver details from corporate directory
- **Two-way SMS** — send driver an entry confirmation / exit reminder via Twilio or similar
- Better quick search: support open-entry lookup by driver name, ID, phone, and plate digits
- Mobile optimization to reduce horizontal scrolling on narrow screens
- Language toggle in the header for English / Hebrew switching
- Contact management improvements: support multiple car licenses and a dedicated license field
- Improved open-entry presentation: hide exit/total columns until exit is recorded
- Bug reports and feature requests: https://github.com/mostuf556/driver-logbook-61/issues
