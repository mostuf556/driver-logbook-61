# דוח נהגים — Driver Gate Report

A Hebrew-first RTL web app for managing driver entry/exit records at a gated facility. Runs entirely in the browser with all data persisted in `localStorage` — no backend required.

## Features

### Entry Management
- Create, edit, and delete driver entry records (name, ID, phone, car number, company, approver, guard)
- Record entry and exit times; auto-fill today's date and current time
- "Quick exit" search by partial plate number on the home page
- Live on-site badge with elapsed time for open (not-yet-exited) entries
- Overnight crossing support (exit before entry time counted as next-day)

### CSV Export & Import
- Export records for a specific date or all records to CSV
- Import records from CSV with automatic header detection (Hebrew and English column names)
- Configurable columns: toggle, reorder, and rename each column
- BOM support for Excel compatibility, configurable delimiter (`,` `;` `\t`)
- Phone number quoted as Excel formula to preserve leading zero
- Duplicate detection on import: skips records with matching date + car number + entry time

### Contacts
- Auto-maintain a contacts list from saved entries (configurable fields and upsert key)
- Full CRUD contact management page
- Export/import contacts as CSV

### OCR — License Plate Recognition
- Capture plate photo via device camera or pick from gallery (two separate buttons)
- Sends image to OpenRouter vision API (configurable model, prompt, base URL)
- Supports multiple API keys with automatic round-robin rotation
- Auto-fills car number field; optional confirmation dialog before applying
- Token usage log (persisted, per-call breakdown, clearable)

### Settings
- Date/time format, RTL/LTR direction, theme (light, dark, blue, green, warm, system)
- Retention policy: auto-purge records older than N days on app load
- Form defaults: company, approver, guard; required-field toggles
- Validation rules: phone prefix/length, ID number length and Israeli checksum, car number regex
- Autocomplete: substring/prefix matching, configurable fields, min chars, max suggestions
- CSV column configuration (order, header text, enabled state)
- Full JSON backup export/import

### Debug Mode
- Activated via `#debug` URL hash or toggle button in the header
- Persistent across reloads via `localStorage`
- Debug toolbar with demo-data population button

## Tech Stack

- **React 19** with **TanStack Start** (SSR-capable, file-based routing)
- **TanStack Router** for client-side navigation
- **Tailwind CSS v4** with CSS variable themes
- **shadcn/ui** component library (Radix UI primitives)
- **Sonner** for toast notifications
- **OpenRouter** for LLM vision (OCR)
- All storage in `localStorage` via a namespaced key system

## Project Structure

```
src/
  components/       # Shared UI components (AppLayout, EntriesTable, PlateOcrDialog, …)
  hooks/            # React hooks (use-app-data, use-debug-mode, use-theme, …)
  lib/              # Pure logic (csv, openrouter, storage, time, types, validation)
  routes/           # File-based pages (home, contacts, entries/[id], logs, settings)
```

## Future Development Ideas

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

-----------------------------------

## TODOs:

- Data Validation on CSV input: Import .csv on /contacts page allows duplicated records
- UI Bug: The table body cells do not properly align with the corresponding header columns.
- Data Ingestion: Modify the CSV import logic to detect and automatically skip duplicate records.
- Documentation: Refresh the README file to include an overview of application features and a roadmap for future development.
- Navigation: Upgrade error notifications to be clickable. Triggering the notification should route the user to the exact page, section, or input field requiring - attention (e.g., redirecting to the settings page for a missing OpenRouter key).
- API Management: Allow users to configure multiple OpenRouter API keys and implement a round-robin strategy to distribute requests between them.
