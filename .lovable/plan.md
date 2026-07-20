# Plan: Guest Self-Submit + Guard Approval + Password Gate

## 1. Password gate (guard-only areas)

Since the app is 100% localStorage / client-side, use a **client-side password gate** (not backend auth — no server state exists to protect). Guard sets/changes the password in Settings; hash stored in localStorage.

- New `src/lib/auth.ts`: `hashPassword` (SHA-256 via `crypto.subtle`), `isUnlocked()`, `unlock(pw)`, `lock()`, `setPassword(pw)`, `hasPassword()`. Unlock state kept in `sessionStorage` so refresh persists but closing tab locks.
- New route `/login` — password prompt; on success `navigate({ to: redirect ?? "/home" })`.
- New pathless layout `src/routes/_guarded.tsx` with `beforeLoad` redirecting to `/login` when locked. Move all existing guard routes (`home`, `contacts`, `entries.*`, `settings`, `logs`, `import-paper`, `e2e`, `coverage`) under it by renaming files to `_guarded.home.tsx` etc. (Public: `/`, `/login`, `/guest`, `/guest/thanks`.)
- Settings adds: "Set / change password", "Lock now" button, and toggle `requirePassword` (default true; if false the guard `beforeLoad` skips the check — useful for local dev).
- Default first-run: if no password set, the gate auto-passes and Settings shows a red "Set a password" prompt.

## 2. Guest self-submit flow

- New public route `/guest` (`src/routes/guest.tsx`) — a stripped EntryForm with only driver-visible fields: firstName, lastName, idNumber, phone, carNumber (+ plate OCR), company. No approver/guard/times.
- On submit, append to a new `pending_requests` store in localStorage (`PendingRequest` type: same shape as DriverReport minus times/approver/guard, plus `requestedAt`, `status: "pending"`).
- Redirect to `/guest/thanks` with a success message. No access to any other data.
- Rate-limit: last-submit timestamp in localStorage; block <30s repeat (configurable).

## 3. Guard approval queue

- New guarded route `/requests` listing pending requests with **Approve** / **Reject** buttons.
- Approve → creates a DriverReport with `entryTime = now`, `approverName = settings.defaultApprover`, `guardName = settings.defaultGuard`, removes from pending, upserts contact.
- Reject → removes from pending (kept in a small audit log if debug).
- Home page shows a badge "N pending requests" linking to `/requests`.

## 4. Share guest page + QR

- On `/home` (and `/requests`), add "Share guest page" button that opens a dialog with:
  - The full URL (`https://smart-driver-daily.lovable.app/guest`, configurable base in settings — default from `window.location.origin`).
  - Copy-to-clipboard button.
  - Web Share API `navigator.share()` when available.
  - **QR code** rendered via `qrcode` npm package (`bun add qrcode`) into a `<canvas>`; download-as-PNG button.

## 5. i18n + settings

- Hebrew + English strings for: login, guest form, thanks page, approval queue, share dialog, "Password required", "Set password", "Approve", "Reject", "Pending requests", "Scan to submit".
- New settings: `requirePassword` (bool), `guestSubmitCooldownSeconds` (number), `guestPageBaseUrl` (string, optional override).

## Technical notes

- No backend needed — everything stays in localStorage. The "password" only gates the local UI; anyone with devtools access to the device can still read localStorage. This is documented in Settings help text (not a security guarantee, just a shared-device gate).
- File moves: use `mv` for each `src/routes/<name>.tsx` → `src/routes/_guarded.<name>.tsx`. Router plugin regenerates `routeTree.gen.ts`.
- `src/routes/index.tsx` currently redirects to `/home`; change to redirect to `/home` when unlocked, else `/login`. Keep `/` public so guests landing on the root don't hit the gate before seeing a "Guest submission" link.
- Root layout: show a "Sign out / Lock" button in the header when unlocked; when on `/guest` or `/login`, hide the guard nav.

## Files touched
- New: `src/lib/auth.ts`, `src/lib/requests.ts`, `src/routes/_guarded.tsx`, `src/routes/login.tsx`, `src/routes/guest.tsx`, `src/routes/guest.thanks.tsx`, `src/components/GuestEntryForm.tsx`, `src/components/ShareGuestDialog.tsx`, `src/components/PasswordSetup.tsx`.
- Renamed: existing guarded routes → `_guarded.*`.
- Modified: `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/components/AppLayout.tsx`, `src/components/SettingsForm.tsx`, `src/lib/types.ts`, `src/lib/defaults.ts`, `src/lib/i18n.ts`, `package.json` (+ `qrcode`).
- New guarded route file: `src/routes/_guarded.requests.tsx`.

Confirm and I'll build.
