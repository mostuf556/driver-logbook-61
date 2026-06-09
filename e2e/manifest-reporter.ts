import * as fs from "node:fs";
import * as path from "node:path";
import type {
  Reporter,
  TestCase,
  TestResult,
  FullResult,
} from "@playwright/test/reporter";

type Entry = {
  title: string;
  status: TestResult["status"];
  durationMs: number;
  videos: string[];
  traces: string[];
  screenshots: string[];
};

const OUTPUT_DIR = "public/e2e-results";
const MANIFEST = path.join(OUTPUT_DIR, "index.json");

function toPublicPath(p: string) {
  const abs = path.resolve(p);
  const root = path.resolve(OUTPUT_DIR);
  if (!abs.startsWith(root)) return null;
  return "/e2e-results/" + path.relative(root, abs).split(path.sep).join("/");
}

export default class ManifestReporter implements Reporter {
  private entries: Entry[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    const videos: string[] = [];
    const traces: string[] = [];
    const screenshots: string[] = [];
    for (const a of result.attachments) {
      if (!a.path) continue;
      const pub = toPublicPath(a.path);
      if (!pub) continue;
      if (a.name === "video") videos.push(pub);
      else if (a.name === "trace") traces.push(pub);
      else if (a.name === "screenshot") screenshots.push(pub);
    }
    this.entries.push({
      title: test.titlePath().slice(1).join(" › "),
      status: result.status,
      durationMs: result.duration,
      videos,
      traces,
      screenshots,
    });
  }

  async onEnd(result: FullResult) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(
      MANIFEST,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          status: result.status,
          tests: this.entries,
        },
        null,
        2,
      ),
    );
  }
}