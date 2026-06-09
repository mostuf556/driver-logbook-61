# Completed Implementation Notes

This file mirrors the repository-level `DONE.md` and records implemented tasks that were moved from `TODOS.md`.

See the root `DONE.md` for a brief provenance list. Tests and coverage status for each completed task are tracked in `docs/COVERAGE.md`.

Implemented tasks (summary):

1. Paper/document OCR import and editable table merge — `src/components/PaperOcrDialog.tsx`
2. Split docs into `docs/` and simplified `README.md`
3. Autocomplete multi-plate behavior — `src/lib/contacts.ts` + `src/lib/contacts.test.ts`
4. Autocomplete same-plate-multiple-contacts behavior — `src/lib/contacts.test.ts`
5. Fold exited cars by default — `src/routes/home.tsx` (accordion default)
6. OpenRouter settings quick navigation — `src/components/SettingsForm.tsx`
7. On-demand OpenRouter key availability check — `src/lib/openrouter.ts` + `src/components/SettingsForm.tsx`
8. Mobile/responsive UI improvements — `src/components/EntriesTable.tsx` and responsive CSS
9. Multi-language toggle and direction support — `src/components/AppLayout.tsx` + `src/lib/i18n.ts`

Next: review `docs/COVERAGE.md` for test coverage state and add missing tests where required.
