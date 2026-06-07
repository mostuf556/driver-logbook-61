---
name: Expo package version pinning
description: How to keep all packages in sync with the installed expo version
---

## Rule
After any `npm install` that touches expo-related packages, run `npx expo install --fix` to realign all package versions to what expo SDK expects.

**Why:** expo has very specific peer dependency versions for react, react-dom, react-native, gesture-handler, reanimated, etc. Mismatches cause runtime errors like "Incompatible React versions".

**How to apply:** Run `npx expo install --fix` and then restart the workflow. The workflow command should include `--clear` after the first run to bust the Metro cache.
