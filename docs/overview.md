# Driver Gate Report Overview

A Hebrew-first RTL web application for managing driver entry and exit records at a guarded facility. The app stores all data locally in `localStorage`, so it works without a backend.

## Features

- Create, edit, and delete driver entry records with full details
- Record entrance and exit times with automatic date/time defaults
- Quick exit search for open entries by plate, name, ID, phone, or company
- One-click exit for matching open entries
- Live on-site badge for open entries with elapsed time
- CSV export/import with flexible headers, delimiters, and BOM support
- Contact management with multiple license plates per contact
- OCR support for license plates and document import via OpenRouter
- Configurable settings for autocomplete, validation, retention, and more

## Tech Stack

- React 19 with TanStack Start
- TanStack Router for routing
- Tailwind CSS v4 and shadcn/ui components
- Local storage persistence with namespaced app storage
- OpenRouter for OCR image processing

## Project Structure

- `src/components/` — shared UI components and page widgets
- `src/hooks/` — custom React hooks
- `src/lib/` — application logic, storage, data parsing, and validation
- `src/routes/` — file-based page routes

## Run Locally

```bash
npm install
npm run dev
```
