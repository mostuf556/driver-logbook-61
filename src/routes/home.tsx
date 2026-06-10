import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppLayout } from "@/components/AppLayout";
import { EntriesTable } from "@/components/EntriesTable";
import { PaperOcrDialog } from "@/components/PaperOcrDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import type { DriverReport } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppData } from "@/hooks/use-app-data";
import { exportAllReports, exportReportsForDate, importReportsCsv } from "@/lib/csv";
import { nowHHMM, todayISO } from "@/lib/time";
import { normalizePlate } from "@/lib/validation";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Driver entry report" },
      { name: "description", content: "Manage driver entries and exits with CSV export" },
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

  const lang = settings.language;
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
    const q = plateQuery.trim();
    if (!q) return [] as typeof open;
    const normalizedQuery = normalizePlate(q);
    return open.filter((r) => {
      const haystack = [
        r.carNumber,
        r.firstName,
        r.lastName,
        r.idNumber,
        r.phone,
        r.company,
      ]
        .map(normalizePlate)
        .join(" ");
      return haystack.includes(normalizedQuery);
    });
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
    toast.success(t("exitRecorded", lang));
  };

  const importCsvReports = async (file: File) => {
    try {
      const text = await file.text();
      const imported = importReportsCsv(text);
      if (!imported.length) {
        toast.error(t("importNoRecords", lang));
        return;
      }
      const existingKeys = new Set(reports.map((r) => `${r.date}|${r.carNumber}|${r.entryTime}`));
      const newRecords = imported.filter((r) => !existingKeys.has(`${r.date}|${r.carNumber}|${r.entryTime}`));
      const skipped = imported.length - newRecords.length;
      updateReports([...newRecords, ...reports]);
      if (skipped > 0) {
        toast.success(`${newRecords.length} ${t("recordsImported", lang)} (${skipped} ${t("importDuplicatesSkipped", lang)})`);
      } else {
        toast.success(`${newRecords.length} ${t("recordsImported", lang)}`);
      }
    } catch {
      toast.error(t("importCsvFailed", lang));
    }
  };

  const mergePaperReports = (newReports: DriverReport[]) => {
    if (newReports.length === 0) {
      toast.error(t("importPaperNoRecords", lang));
      return;
    }
    const existingKeys = new Set(reports.map((r) => `${r.date}|${r.carNumber}|${r.entryTime}`));
    const merged = newReports.filter((r) => !existingKeys.has(`${r.date}|${r.carNumber}|${r.entryTime}`));
    updateReports([...merged, ...reports]);
    toast.success(`${merged.length} ${t("importPaperSuccess", lang)}`);
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t("pageHomeHeading", lang)}</h1>
            <p className="text-sm text-muted-foreground">
              {open.length} {t("todayOpenCount", lang)} · {todayClosed.length} {t("todayClosedCount", lang)}
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
                    aria-label={t("exportDate", lang)}
                    onClick={() => {
                      const n = exportReportsForDate(reports, settings, exportDate);
                      toast.success(`${t("exportDateSuccess", lang)} ${n}`);
                    }}
                  >
                    <Download />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("exportDate", lang)}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t("importCsv", lang)}
                    onClick={() => csvImportRef.current?.click()}
                  >
                    <Upload />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("importCsv", lang)}</TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                onClick={() => {
                  const n = exportAllReports(reports, settings);
                  toast.success(`${t("exportDateSuccess", lang)} ${n}`);
                }}
              >
                {t("exportAll", lang)}
              </Button>
              <PaperOcrDialog settings={settings} onMerge={mergePaperReports} />
              <Button asChild>
                <Link to="/entries/new">{t("addNewEntry", lang)}</Link>
              </Button>
            </div>
          </TooltipProvider>
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{t("quickSearch", lang)}</h2>
          <Input
            placeholder={t("searchPlaceholder", lang)}
            value={plateQuery}
            onChange={(e) => setPlateQuery(e.target.value)}
            inputMode="text"
            className="max-w-sm"
          />
          {plateQuery && (
            <div className="space-y-2">
              {matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noMatches", lang)}</p>
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
                          {fullName} · {t("entryTime", lang)} {r.entryTime}
                        </span>
                      </div>
                      <Button onClick={() => exitMatch(r.id)}>{t("leave", lang)}</Button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>

        <Accordion type="single" collapsible defaultValue="open">
          <AccordionItem value="open">
            <AccordionTrigger>
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-semibold">{t("currentlyOnSite", lang)}</span>
                <span className="text-sm text-muted-foreground">{open.length} {t("todayOpenCount", lang)}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <EntriesTable rows={open} showLeave hideExitColumns />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="closed">
            <AccordionTrigger>
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-semibold">{t("todayClosed", lang)}</span>
                <span className="text-sm text-muted-foreground">{todayClosed.length} {t("noRecords", lang)}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <EntriesTable rows={todayClosed} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="history">
            <AccordionTrigger>
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-semibold">{t("history", lang)}</span>
                <span className="text-sm text-muted-foreground">{history.length} {t("noRecords", lang)}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <EntriesTable rows={history} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </AppLayout>
  );
}