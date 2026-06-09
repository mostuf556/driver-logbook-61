# Copilot instructions for driver-logbook-61

This repository is a TypeScript + React single-page app (TanStack Start) built with Vite. The app is Hebrew-first (RTL) and stores data in localStorage — no backend.

Build, test and lint

- Install: npm install
- Dev server: npm run dev
- Build: npm run build  (development build: npm run build:dev)
- Preview production build: npm run preview
- Lint: npm run lint  (ESLint; to lint a single file use npx eslint <path>)
- Format: npm run format (Prettier)
- Tests: npm run test  (runs Vitest)
  - Run a single test file: npm run test -- ./path/to/file.test.ts
  - Run tests by name: npm run test -- -t "test name"

CI

- GitHub Actions workflow: .github/workflows/ci.yml
- CI uses Node 20, runs npm ci and `npm run test -- --coverage --coverageProvider=v8`; coverage artifact saved to coverage/

High-level architecture

- Framework: TanStack Start (file-based routing) + React + TypeScript + Vite
- Routing: src/routes/ contains route files. __root.tsx is the app shell. Routes map filename → URL (see src/routes/README.md for conventions). routeTree.gen.ts is auto-generated — do not edit.
- UI: src/components/ and src/components/ui/ hold reusable UI primitives and dialogs.
- State/data: client-only state persisted to localStorage; TanStack React Query used for data-fetch patterns where applicable.
- Styling: TailwindCSS + utility components; direction is RTL where applicable.
- Entry points: dev server via Vite; main app under src/ (routes and components). Docs and design notes in docs/.

Key conventions and repository-specific patterns

- File-based routing specifics: dynamic segments use bare $ (e.g., users/$id.tsx); optional segments use the {-$name} syntax; splats are files named with $ (read via _splat param). Preserve __root.tsx and _layout.tsx semantics described in src/routes/README.md.
- Do NOT add Next.js/Remix-style folders like src/pages/ or app/layout.tsx — this repo follows TanStack Start conventions.
- routeTree.gen.ts is generated — commit it only if generation step requires it, but avoid manual edits.
- Tests: Vitest is configured; CI runs tests with V8 coverage provider. Local test runs should mirror CI flags when debugging coverage issues: npm run test -- --coverage --coverageProvider=v8
- Lint & formatting: ESLint + Prettier. ESLint is run across the repo by the `lint` script; use npx eslint for targeted files.
- RTL/Hebrew: UI components and pages expect RTL layout; be mindful of direction and text alignment when editing or adding components.

Files to check first when making changes

- src/routes/ (routing, pages)
- src/components/ (UI primitives and dialogs)
- src/routes/README.md (routing conventions)
- package.json (scripts and tooling)
- .github/workflows/ci.yml (CI/test expectations)
- docs/ (project overview, research, roadmap)

No other AI assistant config files were detected (CLAUDE.md, AGENTS.md, .cursorrules, .windsurfrules, etc.).

If you'd like, configure an MCP server for browser-based testing (Playwright) or Vite dev integration — ask and it can be added.
