---
name: Expo 53 + Metro version conflict fix
description: Metro 0.84.x (from old RN 0.85 install) breaks expo 53 CLI with ERR_PACKAGE_PATH_NOT_EXPORTED on ./src/lib/TerminalReporter
---

## Rule
After installing/upgrading react-native in an Expo project, always run `npx expo install metro` to ensure metro is at the version expo expects (~0.81-0.82.x for expo 53).

**Why:** Metro 0.84+ has a strict `exports` field in package.json that blocks `metro/src/lib/TerminalReporter` imports used by `@expo/cli`. Expo 53 needs metro ~0.82.x.

**How to apply:** If you see `ERR_PACKAGE_PATH_NOT_EXPORTED: Package subpath './src/lib/TerminalReporter' is not defined`, run `npx expo install metro` then restart the workflow with `--clear`.
