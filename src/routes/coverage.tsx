import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/coverage")({
  head: () => ({ meta: [{ title: "Test Coverage" }] }),
  component: CoveragePage,
});

function CoveragePage() {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/coverage/index.html", { method: "HEAD" })
      .then((r) => setAvailable(r.ok))
      .catch(() => setAvailable(false));
  }, []);

  return (
    <div dir="ltr" className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
        <h1 className="text-sm font-semibold">Test Coverage Report</h1>
        <a
          href="/coverage/index.html"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary underline"
        >
          Open in new tab
        </a>
      </div>
      {available === false ? (
        <div className="m-6 rounded border bg-card p-6 text-sm">
          <p className="mb-2 font-medium">No coverage report found.</p>
          <p className="text-muted-foreground">
            Generate one by running:
          </p>
          <pre className="mt-3 rounded bg-muted p-3 text-xs">npm run test:coverage</pre>
          <p className="mt-3 text-muted-foreground">
            Output is written to <code>public/coverage/</code> and served at{" "}
            <code>/coverage/index.html</code>.
          </p>
        </div>
      ) : (
        <iframe
          src="/coverage/index.html"
          title="Coverage report"
          className="flex-1 w-full border-0"
        />
      )}
    </div>
  );
}