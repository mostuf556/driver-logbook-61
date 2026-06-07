# Driver Gate Report (דוח נהגים)

A Hebrew-first RTL web application for managing driver entry and exit records at gated facilities.

## Tech Stack

- **Framework:** React 19 + TanStack Start (SSR)
- **Routing:** TanStack Router (file-based)
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Build:** Vite 7 via `@lovable.dev/vite-tanstack-config`
- **Package Manager:** npm (Node 22)
- **Data:** localStorage (local-first, no backend DB)
- **OCR:** OpenRouter API for license plate recognition

## Project Structure

- `src/routes/` — File-based page routes
- `src/components/` — React components (`ui/` for shadcn primitives)
- `src/hooks/` — Custom hooks (app data, theme, etc.)
- `src/lib/` — Business logic (storage, OpenRouter API, CSV)
- `src/server.ts` — SSR server entry (TanStack Start / Nitro)
- `src/start.ts` — TanStack Start instance with error middleware

## Running

```bash
npm run dev   # Dev server on port 5000
npm run build # Production build
```

## User Preferences

- Hebrew/RTL interface is intentional — preserve direction and Hebrew text.
