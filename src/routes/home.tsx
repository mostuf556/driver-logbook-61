import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Upload, FileUp } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { EntriesTable } from "@/components/EntriesTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppData } from "@/hooks/use-app-data";
import { exportAllReports, exportReportsForDate, importReportsCsv } from "@/lib/csv";
import { importAllJson } from "@/lib/storage";
import { nowHHMM, todayISO } from "@/lib/time";
import { normalizePlate } from "@/lib/validation";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "דוח כניסות ויציאות" },
      { name: "description", content: "ניהול דוח נהגים בשער עם ייצוא CSV" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { reports, settings, updateReports } = useAppData();
  const [exportDate, setExportDate] = useState(todayISO());
  const [plateQuery, setPlateQuery] = useState("");
  const csvImportRef = useRef<HTMLInputElement>(null);
  const today = todayISO();

  const open = useMemo(() => reports.filter((r) => !r.exitTime), [reports]);
  const todayClosed = useMemo(
    () => reports.filter((r) => r.exitTime && r.date === today),
    [reports, today],
  );
  const history = useMemo(
    () => reports.filter((r) => r.exitTime && r.date !== today),
    [reports, today],
  );

  const matches = useMemo(() => {
    const q = normalizePlate(plateQuery);
    if (!q) return [] as typeof open;
    return open.filter((r) => normalizePlate(r.carNumber).includes(q));
  }, [open, plateQuery]);

  const exitMatch = (id: string) => {
    updateReports(
      reports.map((r) =>
        r.id === id
          ? { ...r, exitTime: nowHHMM(settings.roundTimesToMinutes), updatedAt: new Date().toISOString() }
          : r,
      ),
    );
    setPlateQuery("");
    toast.success("יציאה נרשמה");
  };

  const triggerImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try {
        importAllJson(await f.text());
        toast.success("יובא — מרענן");
        setTimeout(() => location.reload(), 500);
      } catch {
        toast.error("קובץ לא תקין");
      }
    };
    input.click();
  };

  const importCsvReports = async (file: File) => {
    try {
      const text = await file.text();
      const imported = importReportsCsv(text);
      if (!imported.length) {
        toast.error("לא נמצאו רשומות בקובץ");
        return;
      }
      const existingIds = new Set(reports.map((r) => r.id));
      const newRecords = imported.filter((r) => !existingIds.has(r.id));
      updateReports([...newRecords, ...reports]);
      toast.success(`יובאו ${imported.length} רשומות מ-CSV`);
    } catch {
      toast.error("שגיאה בייבוא CSV");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Hidden CSV import input */}
        <input
          ref={csvImportRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importCsvReports(f);
            if (csvImportRef.current) csvImportRef.current.value = "";
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-3" dir="rtl">
          <div>
            <h1 className="text-2xl font-bold">דוח כניסות ויציאות</h1>
            <p className="text-sm text-muted-foreground">
              {open.length} בפנים · {todayClosed.length} סגורות היום
            </p>
          </div>
          <TooltipProvider>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={exportDate}
                onChange={(e) => setExportDate(e.target.value)}
                className="w-auto"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="ייצוא לתאריך"
                    onClick={() => {
                      const n = exportReportsForDate(reports, settings, exportDate);
                      toast.success(`יוצאו ${n} רשומות`);
                    }}
                  >
                    <Download />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>ייצוא CSV לתאריך</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="ייבוא JSON"
                    onClick={triggerImport}
                  >
                    <Upload />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>ייבוא נתונים (JSON)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="ייבוא CSV"
                    onClick={() => csvImportRef.current?.click()}
                  >
                    <FileUp />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>ייבוא רשומות מ-CSV</TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                onClick={() => {
                  const n = exportAllReports(reports, settings);
                  toast.success(`יוצאו ${n} רשומות`);
                }}
              >
                ייצוא כל הנתונים
              </Button>
              <Button asChild>
                <Link to="/entries/new">+ כניסה חדשה</Link>
              </Button>
            </div>
          </TooltipProvider>
        </div>

        <section className="space-y-2" dir="rtl">
          <h2 className="text-lg font-semibold">חיפוש מהיר ליציאה</h2>
          <Input
            placeholder="הזן ספרות ממספר הרכב (ללא '-')"
            value={plateQuery}
            onChange={(e) => setPlateQuery(e.target.value)}
            inputMode="numeric"
            dir="ltr"
            className="max-w-sm"
          />
          {plateQuery && (
            <div className="space-y-2">
              {matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין התאמות בין רשומות פתוחות</p>
              ) : (
                matches.map((r) => {
                  const fullName = [r.firstName, r.lastName].filter(Boolean).join(" ");
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded border bg-card p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg" dir="ltr">{r.carNumber}</span>
                        <span className="text-sm text-muted-foreground">
                          {fullName} · כניסה {r.entryTime}
                        </span>
                      </div>
                      <Button onClick={() => exitMatch(r.id)}>יצא</Button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>

        <section className="space-y-2" dir="rtl">
          <h2 className="text-lg font-semibold">בפנים כרגע</h2>
          <EntriesTable rows={open} showLeave />
        </section>

        <section className="space-y-2" dir="rtl">
          <h2 className="text-lg font-semibold">היום (סגור)</h2>
          <EntriesTable rows={todayClosed} />
        </section>

        <section className="space-y-2" dir="rtl">
          <h2 className="text-lg font-semibold">היסטוריה</h2>
          <EntriesTable rows={history} />
        </section>
      </div>
    </AppLayout>
  );
}