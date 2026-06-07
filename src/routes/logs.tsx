import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { clearErrorLog, loadErrorLog, type LoggedError } from "@/lib/error-log";

export const Route = createFileRoute("/logs")({
  head: () => ({ meta: [{ title: "לוגים · דוח נהגים" }] }),
  component: LogsPage,
});

function LogsPage() {
  const [logs, setLogs] = useState<LoggedError[]>([]);
  useEffect(() => {
    setLogs(loadErrorLog());
  }, []);

  const refresh = () => setLogs(loadErrorLog());

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
    toast.success("הועתק");
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `error_log_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <AppLayout>
      <div className="space-y-4" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">לוג שגיאות</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh}>רענן</Button>
            <Button variant="outline" onClick={copy} disabled={!logs.length}>העתק JSON</Button>
            <Button variant="outline" onClick={download} disabled={!logs.length}>הורד</Button>
            <ConfirmDialog
              title="לנקות לוג?"
              onConfirm={() => {
                clearErrorLog();
                refresh();
              }}
              trigger={<Button variant="destructive" disabled={!logs.length}>נקה</Button>}
            />
          </div>
        </div>
        {!logs.length ? (
          <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
            אין שגיאות לוגיות
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((l) => (
              <details key={l.id} className="rounded border bg-card p-3">
                <summary className="cursor-pointer">
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(l.at).toLocaleString("he-IL")}
                  </span>{" "}
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">{l.source}</span>{" "}
                  <span className="font-medium">{l.message}</span>
                </summary>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground" dir="ltr">
{l.stack || "(no stack)"}
                </pre>
                {l.url && <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{l.url}</p>}
              </details>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}