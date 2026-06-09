import { test, expect, type ConsoleMessage } from "@playwright/test";

const routes = [
  "/",
  "/home",
  "/contacts",
  "/entries/new",
  "/settings",
  "/logs",
  "/coverage",
];

// Allow benign noise (e.g. third-party warnings, missing favicon, HMR)
const IGNORE_PATTERNS = [
  /favicon/i,
  /Download the React DevTools/i,
  /\[vite\]/i,
  /lovable\.js/i,
  /RESET_BLANK_CHECK/i,
];

function isIgnored(text: string) {
  return IGNORE_PATTERNS.some((re) => re.test(text));
}

for (const path of routes) {
  test(`route ${path} loads without console or page errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg: ConsoleMessage) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (!isIgnored(text)) consoleErrors.push(text);
    });
    page.on("pageerror", (err) => {
      if (!isIgnored(err.message)) pageErrors.push(err.message);
    });

    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response, `no response for ${path}`).not.toBeNull();
    expect(response!.status(), `bad status on ${path}`).toBeLessThan(400);

    // Body must have rendered something
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length, `empty body on ${path}`).toBeGreaterThan(0);

    expect(pageErrors, `page errors on ${path}`).toEqual([]);
    expect(consoleErrors, `console errors on ${path}`).toEqual([]);
  });
}