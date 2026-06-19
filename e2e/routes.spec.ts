import { test, expect, type ConsoleMessage } from "@playwright/test";

const routes = [
  "/",
  "/home",
  "/contacts",
  "/entries/new",
  "/settings",
  "/logs",
  "/coverage",
  "/e2e",
];

// Allow benign noise (third-party warnings, missing favicon, HMR, dev overlays).
const IGNORE_PATTERNS = [
  /favicon/i,
  /Download the React DevTools/i,
  /\[vite\]/i,
  /lovable\.js/i,
  /RESET_BLANK_CHECK/i,
  /Failed to load resource.*404/i,
  /index\.json/i, // /e2e fetch when manifest absent
  /e2e-report/i,
  /HMR/i,
];

function isIgnored(text: string) {
  return IGNORE_PATTERNS.some((re) => re.test(text));
}

// Single test → single video covering every route in sequence.
test("all routes load without console or page errors", async ({ page }) => {
  const failures: string[] = [];

  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (!isIgnored(text)) failures.push(`[console] ${page.url()} :: ${text}`);
  });
  page.on("pageerror", (err) => {
    if (!isIgnored(err.message)) failures.push(`[pageerror] ${page.url()} :: ${err.message}`);
  });

  for (const path of routes) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response, `no response for ${path}`).not.toBeNull();
    expect(response!.status(), `bad status on ${path}`).toBeLessThan(400);
    // Give the SPA a moment to render and any async errors to surface.
    await page.waitForLoadState("load");
    await page.waitForTimeout(500);
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length, `empty body on ${path}`).toBeGreaterThan(0);
  }

  expect(failures, `runtime errors detected:\n${failures.join("\n")}`).toEqual([]);
});
