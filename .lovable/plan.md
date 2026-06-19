# Plan v4 — fixes + UX/config additions

## 1. Fix SSR error (item 3)

- The app reads `localStorage` during render via `useAppData` — on SSR that throws and crashes the page.
- Make `use-app-data.ts` SSR-safe: initialize state from defaults/empty and hydrate from `localStorage` inside a `useEffect`. Guard every `storage.ts` call with `typeof window !== "undefined"`.
- Also add an `errorComponent` on `__root.tsx` so any future render error shows a readable fallback (item 1 partly).

## 2. Full error log viewer (item 1)

- Add `src/lib/error-log.ts`: ring buffer (max 200) persisted to `localStorage` capturing `window.onerror`, `unhandledrejection`, and a `logError(err, ctx)` helper. Wired in `__root.tsx` on mount.
- New page `/logs` (route file `logs.tsx`) showing a table: time / source / message / stack. Buttons: Clear, Copy JSON, Download.
- Link to `/logs` from `AppLayout` nav.
- Server-side: any SSR error already captured by `src/lib/error-capture.ts`; surface latest in `/logs` via a `createServerFn` that returns it.

## 3. Themes: light / dark / blue (item 2)

- Add `theme` to settings: `"light" | "dark" | "blue" | "system"`.
- Define `.dark` and `.theme-blue` CSS variable blocks in `src/styles.css` (existing tokens; just override `--background`, `--foreground`, `--primary`, etc.).
- New `ThemeProvider` in `AppLayout` toggles `<html>` classes based on settings + system pref.
- Small theme switcher (icon button) in header.

## 4. Split driver name (item 4)

- `DriverReport`/`Contact` get `firstName`, `lastName` (drop `driverName`). Migration helper in `storage.ts` on load: split existing `driverName` by first space.
- Update `EntryForm`, `ContactsManager`, autocomplete fields, CSV columns (default header "שם פרטי" / "שם משפחה"), settings labels.

## 5. Quick exit by partial plate (item 5)

- On `/` dashboard add a search input above Open Entries: "חפש לפי מספר רכב". Normalize input + record car numbers by stripping `-` and whitespace; substring match. Live-filter open entries; each match has a prominent "יצא" button that stamps `exitTime = now` and recalculates total.

## 6. Contacts page fixes (item 6)

- Rebuild `ContactsManager` as a responsive table with full-width inline editing using a Dialog (or expandable row) so all fields are visible without truncation. Add column widths and `min-w-0` + `whitespace-nowrap` only where needed; inputs use `w-full`.

## 7. Confirm before delete (item 7)

- All delete actions (entries, contacts, logs) use shadcn `AlertDialog` with explicit confirm/cancel.

## 8. Car plate length ignoring `-` (item 8)

- Default `carNumberMaxLength = 10`. Validator strips `-` before counting. Update settings label to "ללא ספירת מקפים".

## 9. Rename "דשבורד" → "דוח כניסות ויציאות" (item 9)

- Update nav label and `/` page title.

## 10. Export/Import as icons on `/` (item 10)

- Replace text buttons with icon buttons (`Download` / `Upload` from lucide-react) + tooltips.

## 11. Field label "רכב" / "מספר רישוי" → unified "מספר רכב" (item 11)

- Audit all forms/tables/CSV headers and use one consistent label "מספר רכב".

## 12. RTL on Hebrew field names (item 12)

- Add `dir="rtl"` to labels and table headers on `/`. Ensure inputs holding Latin/numeric content stay `dir="ltr"` so digits render correctly while their _label_ is RTL.

## 13. Default route `/home` (item 13)

- New `src/routes/home.tsx` containing what `/` had.
- `src/routes/index.tsx` becomes a redirect to `/home` (`beforeLoad: () => redirect({ to: "/home" })`).
- Update all nav links.

## 14. Contacts export filename with date (item 14)

- When exporting contacts CSV, filename = `contacts_dd_mm_yyyy.csv` (configurable pattern `contactsFilenamePattern`).

## 15. `#debug` URL → debug tools (item 15)

- New `src/hooks/use-debug-mode.ts` reading `location.hash === "#debug"` OR settings flag.
- When active, show button "צור נתוני דמו" on `/contacts` and `/entries/new`. Generates a realistic random record/contact (Hebrew names list, valid Israeli IDs via checksum, random phone with allowed prefix, plate, company).

## 16. Settings toggle to always show debug button (item 16)

- New setting `showDebugToggle: boolean` (default false). When true, a small "Debug" toggle appears in the header alongside the theme switcher.

---

## Files to add

- `src/routes/home.tsx`, `src/routes/logs.tsx`
- `src/lib/error-log.ts`, `src/lib/theme.ts`, `src/lib/debug-data.ts`
- `src/hooks/use-debug-mode.ts`, `src/hooks/use-theme.ts`
- `src/components/ThemeSwitcher.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/QuickExitSearch.tsx`

## Files to edit

- `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/contacts.tsx`, `src/routes/entries.new.tsx`, `src/routes/entries.$id.tsx`, `src/routes/settings.tsx`
- `src/components/AppLayout.tsx`, `src/components/EntryForm.tsx`, `src/components/EntriesTable.tsx`, `src/components/ContactsManager.tsx`, `src/components/SettingsForm.tsx`, `src/components/FieldAutocomplete.tsx`
- `src/hooks/use-app-data.ts`
- `src/lib/types.ts`, `src/lib/defaults.ts`, `src/lib/storage.ts` (migrate), `src/lib/csv.ts`, `src/lib/contacts.ts`, `src/lib/validation.ts`
- `src/styles.css` (theme tokens)

## Out of scope

- Server-side persistence of logs (kept in localStorage + last SSR error only).
- i18n beyond Hebrew.
- Multi-user / cloud sync.

Reply "approve" and I'll implement, or tell me what to change.
