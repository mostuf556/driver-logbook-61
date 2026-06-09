import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/e2e")({
  head: () => ({ meta: [{ title: "E2E Test Videos" }] }),
  component: E2EPage,
});

type Entry = {
  title: string;
  status: string;
  durationMs: number;
  videos: string[];
  traces: string[];
  screenshots: string[];
};
type Manifest = { generatedAt: string; status: string; tests: Entry[] };

function E2EPage() {
  const [data, setData] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/e2e-results/index.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div dir="ltr" className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">E2E Test Artifacts</h1>
        <a
          href="/e2e-report/index.html"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary underline"
        >
          Open Playwright HTML report
        </a>
      </div>
      {error || !data ? (
        <div className="rounded border bg-card p-6 text-sm">
          <p className="mb-2 font-medium">No e2e results found.</p>
          <p className="text-muted-foreground">Generate them by running:</p>
          <pre className="mt-3 rounded bg-muted p-3 text-xs">npm run test:e2e</pre>
          <p className="mt-3 text-muted-foreground">
            Output is written to <code>public/e2e-results/</code> and served
            at <code>/e2e-results/</code>.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground">
            Generated {new Date(data.generatedAt).toLocaleString()} — overall{" "}
            <span className="font-mono">{data.status}</span>
          </p>
          {data.tests.map((t, i) => (
            <div key={i} className="rounded border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium">{t.title}</h2>
                <span
                  className={
                    "text-xs font-mono " +
                    (t.status === "passed"
                      ? "text-green-600"
                      : "text-destructive")
                  }
                >
                  {t.status} · {Math.round(t.durationMs)}ms
                </span>
              </div>
              {t.videos.length === 0 ? (
                <p className="text-xs text-muted-foreground">No video recorded.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {t.videos.map((src) => (
                    <video
                      key={src}
                      src={src}
                      controls
                      className="w-full rounded border bg-black"
                    />
                  ))}
                </div>
              )}
              {(t.traces.length > 0 || t.screenshots.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {t.traces.map((src) => (
                    <a key={src} href={src} className="text-primary underline">
                      trace
                    </a>
                  ))}
                  {t.screenshots.map((src) => (
                    <a key={src} href={src} className="text-primary underline">
                      screenshot
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}