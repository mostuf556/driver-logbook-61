# Test Coverage for Completed Tasks

This document maps implemented tasks (from `docs/DONE.md`) to automated test coverage. For each task, the status indicates whether an automated test exists and where.

1. Paper/document OCR import and editable table merge
   - Files: `src/components/PaperOcrDialog.tsx`
   - Coverage: MISSING
   - Notes: No unit test found for `parseRecords` or OCR parsing flow. Recommend adding a unit test for `parseRecords` (text -> records) and a mocked integration test for `extractImageText`.

2. Split README into docs
   - Files: `README.md`, `docs/*`
   - Coverage: NOT APPLICABLE (documentation change)

3. Autocomplete: contact with multiple car numbers
   - Files: `src/lib/contacts.ts`
   - Coverage: EXISTS — `src/lib/contacts.test.ts` covers multi-plate suggestion behavior.

4. Autocomplete: same car number across multiple contacts
   - Files: `src/lib/contacts.ts`
   - Coverage: EXISTS — `src/lib/contacts.test.ts` covers matching same plate across contacts.

5. Default fold exited cars (UI accordion default)
   - Files: `src/routes/home.tsx`
   - Coverage: MISSING
   - Notes: This is a UI behavior; consider an integration/UI test (Playwright / Cypress) to assert default collapsed state.

6. OpenRouter settings quick navigation
   - Files: `src/components/SettingsForm.tsx`
   - Coverage: MISSING
   - Notes: Add a test for settings behavior that shows the quick-link when no keys configured and triggers window.open or similar (mocked).

7. On-demand OpenRouter key availability check
   - Files: `src/lib/openrouter.ts`, `src/components/SettingsForm.tsx`
   - Coverage: PARTIAL / MISSING
   - Notes: No unit tests found for `checkOpenRouterKeyAvailability`. Recommend adding unit tests that mock fetch responses.

8. Mobile / responsive improvements
   - Files: `src/components/EntriesTable.tsx` and CSS
   - Coverage: MISSING / NOT APPLICABLE
   - Notes: Visual/responsive behavior is best covered by end-to-end tests or visual regression tests.

9. Multi-language toggle and direction support
   - Files: `src/components/AppLayout.tsx`, `src/lib/i18n.ts`
   - Coverage: MISSING
   - Notes: Add unit tests asserting `document.documentElement.dir` and `lang` changes when settings update; consider an integration test for the toggle.

Summary: automated unit tests exist for autocomplete features. The remaining implemented items are either documentation/UI/or integration concerns and currently lack automated tests. I can add the missing tests; which do you want prioritized?

Update (tests added):
- Unit tests added for `PaperOcrDialog` parsing and normalization: `src/components/paperOcr.test.ts`.
- Unit tests added for validation helpers: `src/lib/validation.test.ts`.
- Unit tests added for contact upsert and fullname: `src/lib/contacts.test.ts` (extended).
- Unit tests added for storage migration helpers: `src/lib/storage.test.ts`.

Estimated coverage impact:
- These new unit tests exercise parsing, normalization, and validation logic across multiple modules and should raise overall test coverage substantially. Based on typical LOC weighting, I estimate coverage will exceed 50% after running the suite.

Note: I attempted to run the test suite in this environment to produce a verified coverage report, but the execution tool failed due to an environment filesystem provider error. To run the tests and obtain a coverage report locally or in CI, use:

```bash
npm install
npm run test -- --coverage --coverageProvider=v8
```

If you want, I can try running the test command again here; otherwise you can run it locally or in CI and I will help interpret the results and add further tests until coverage >= 50%.
