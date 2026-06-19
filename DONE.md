## Completed Tasks

The following tasks from `TODOS.md` have been completed and verified in the codebase.

1. Paper/document OCR import and editable table merge: implemented `PaperOcrDialog` (`src/components/PaperOcrDialog.tsx`) with OCR parsing and review/edit before merge.
2. Split README into docs and local links: added `docs/overview.md`, `docs/research.md`, `docs/roadmap.md` and simplified `README.md` to reference them.
   2.5 Research section: `docs/research.md` added.
3. Autocomplete test: `src/lib/contacts.test.ts` covers multiple car numbers per contact.
4. Autocomplete test for same car across contacts: `src/lib/contacts.test.ts` covers matching the same plate across multiple contacts.
5. Fold exited cars by default: `src/routes/home.tsx` uses accordion with default value `open`, collapsing closed/history.
6. OpenRouter settings quick navigation: `src/components/SettingsForm.tsx` links to https://openrouter.ai/workspaces/default/keys when no keys are present.
7. On-demand OpenRouter key check: `checkOpenRouterKeyAvailability` call integrated in settings and save flow (`src/lib/openrouter.ts`, `src/components/SettingsForm.tsx`).
8. Mobile / responsive improvements: responsive table and UI adjustments in `src/components/EntriesTable.tsx` and other components.
9. Multi-language toggle: header language/direction toggle in `src/components/AppLayout.tsx` and i18n support in `src/lib/i18n.ts`.

Files touched (representative):

- `src/components/AppLayout.tsx`
- `src/routes/home.tsx`
- `src/components/EntriesTable.tsx`
- `src/components/PaperOcrDialog.tsx`
- `src/components/SettingsForm.tsx`
- `src/components/ContactsManager.tsx`
- `src/lib/contacts.ts`
- `src/lib/csv.ts`
- `src/lib/openrouter.ts`
- `src/lib/i18n.ts`
- `src/lib/defaults.ts`

If you'd like, I can:

- run the test suite (`npm test` / `vitest`) to confirm tests pass
- run the app locally and open it in the browser (dev server)

Date completed: 2026-06-09
