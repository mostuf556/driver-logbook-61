import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppData } from "@/hooks/use-app-data";
import { useDebugMode } from "@/hooks/use-debug-mode";
import { extractImageText, fileToDownscaledDataUrl } from "@/lib/openrouter";
import { logEvent } from "@/lib/error-log";
import { t } from "@/lib/i18n";
import { uid } from "@/lib/storage";
import { todayISO } from "@/lib/time";
import type { DriverReport } from "@/lib/types";
import {
  PAPER_FIELD_ORDER,
  normalizeDate,
  normalizeTime,
  normalizeValue,
} from "@/components/PaperOcrDialog";

export const Route = createFileRoute("/import-paper")({
  head: () => ({
    meta: [
      { title: "Import from paper" },
      { name: "description", content: "AI-powered driver log import from a paper photo" },
    ],
  }),
  component: ImportPaperPage,
});

const AUTO_RETRY_LIMIT = 1;

type CsvOk = { ok: true; rows: string[][] };
type CsvErr = { ok: false; error: string };
type CsvResult = CsvOk | CsvErr;

function parseCsv(raw: string, expectedCols: number): CsvResult {
  const cleaned = raw
    .trim()
    .replace(/^```(?:csv)?/i, "")
    .replace(/```$/i, "")
    .trim();
  if (!cleaned) return { ok: false, error: "Empty response from model" };
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inQuotes) {
      if (ch === '"') {
        if (cleaned[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      if (ch === "\r" && cleaned[i + 1] === "\n") i++;
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  if (inQuotes) return { ok: false, error: "Unterminated quoted field" };
  if (rows.length < 2)
    return { ok: false, error: "Need at least a header row and one data row" };
  const bad = rows.findIndex((r) => r.length !== expectedCols);
  if (bad !== -1)
    return {
      ok: false,
      error: `Row ${bad + 1} has ${rows[bad].length} columns, expected ${expectedCols}`,
    };
  return { ok: true, rows };
}

function emptyRow(): DriverReport {
  const iso = new Date().toISOString();
  return {
    id: uid(),
    date: todayISO(),
    firstName: "",
    lastName: "",
    idNumber: "",
    phone: "",
    carNumber: "",
    entryTime: "",
    exitTime: null,
    approverName: "",
    company: "",
    guardName: "",
    createdAt: iso,
    updatedAt: iso,
  };
}

function rowsToReports(rows: string[][], phoneSep: string): DriverReport[] {
  const dataRows = rows.slice(1); // skip header
  return dataRows.map((cells) => {
    const r = emptyRow();
    for (let i = 0; i < cells.length && i < PAPER_FIELD_ORDER.length; i++) {
      const field = PAPER_FIELD_ORDER[i];
      const value = normalizeValue(cells[i] ?? "");
      switch (field) {
        case "date":
          if (value) r.date = normalizeDate(value);
          break;
        case "fullName": {
          if (!value) break;
          const idx = value.indexOf(" ");
          if (idx === -1) {
            r.firstName = value;
          } else {
            r.firstName = value.slice(0, idx);
            r.lastName = value.slice(idx + 1);
          }
          break;
        }
        case "idOrPhone":
          if (!value) break;
          if (value.includes(phoneSep)) r.phone = value;
          else r.idNumber = value;
          break;
        case "carNumber":
          r.carNumber = value;
          break;
        case "entryTime":
          r.entryTime = normalizeTime(value);
          break;
        case "exitTime":
          r.exitTime = normalizeTime(value) || null;
          break;
        case "approverName":
          r.approverName = value;
          break;
        case "company":
          r.company = value;
          break;
        case "guardName":
          r.guardName = value;
          break;
      }
    }
    return r;
  });
}

function buildPrompt(columns: string[], errorFeedback?: string): string {
  const headerLine = columns.join(",");
  const base =
    `Extract every driver-log row from this image. Return STRICT CSV only ` +
    `(no prose, no markdown fences). First line MUST be the header exactly:\n${headerLine}\n` +
    `Each subsequent line is one data row with the SAME number of comma-separated ` +
    `columns. Quote any field containing a comma or quote using standard CSV ` +
    `("" to escape a quote). Dates as YYYY-MM-DD, times as HH:mm (24h). ` +
    `Use empty fields for missing data.`;
  if (errorFeedback) {
    return `${base}\n\nIMPORTANT: Your previous attempt failed validation with: "${errorFeedback}". Fix that and return ONLY valid CSV.`;
  }
  return base;
}

function ImportPaperPage() {
  const navigate = useNavigate();
  const { reports, settings, updateReports } = useAppData();
  const debug = useDebugMode();
  const lang = settings.language;
  const columns =
    settings.paperOcrColumns?.length
      ? settings.paperOcrColumns
      : [
          "תאריך",
          "שם הנהג",
          "תעודת זהות",
          "מספר רכב",
          "שעת כניסה",
          "שעת יציאה",
          "שם המאשר",
          "חברה",
          "שם השומר",
        ];
  const phoneSep = settings.paperPhoneSeparator || "-";

  const [image, setImage] = useState<string | null>(null);
  const [rows, setRows] = useState<DriverReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCsv, setLastCsv] = useState<string>("");
  const [lastError, setLastError] = useState<string>("");
  const [confirmRetry, setConfirmRetry] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function runExtraction(imageData: string, errorFeedback?: string) {
    setLoading(true);
    try {
      let attempts = 0;
      let feedback = errorFeedback;
      // attempts: initial + up to AUTO_RETRY_LIMIT auto-retries before confirm.
      while (attempts <= AUTO_RETRY_LIMIT) {
        const prompt = buildPrompt(columns, feedback);
        const { text } = await extractImageText(imageData, prompt, settings);
        setLastCsv(text);
        const parsed = parseCsv(text, columns.length);
        if (parsed.ok) {
          setRows(rowsToReports(parsed.rows, phoneSep));
          setLastError("");
          toast.success(`${parsed.rows.length - 1} ${t("recordsImported", lang)}`);
          return;
        }
        logEvent(
          "paper-ocr.csv-invalid",
          `attempt=${attempts + 1} error="${parsed.error}" csv="${text.slice(0, 200)}"`,
        );
        feedback = parsed.error;
        setLastError(parsed.error);
        attempts++;
      }
      // Still failing → ask user.
      setConfirmRetry(true);
    } catch (error) {
      const msg = error instanceof Error ? error.message : t("ocrError", lang);
      setLastError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(file: File) {
    const url = await fileToDownscaledDataUrl(file, settings.ocrMaxImageSizeMB);
    setImage(url);
    setRows([]);
    setLastError("");
    setLastCsv("");
    await runExtraction(url);
  }

  function updateRow(index: number, key: keyof DriverReport, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [key]: key === "exitTime" ? value || null : value,
      } as DriverReport;
      return next;
    });
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function mergeAndReturn() {
    if (!rows.length) {
      toast.error(t("importPaperNoRecords", lang));
      return;
    }
    const existingKeys = new Set(reports.map((r) => `${r.date}|${r.carNumber}|${r.entryTime}`));
    const merged = rows.filter(
      (r) => !existingKeys.has(`${r.date}|${r.carNumber}|${r.entryTime}`),
    );
    updateReports([...merged, ...reports]);
    toast.success(`${merged.length} ${t("importPaperSuccess", lang)}`);
    void navigate({ to: "/home" });
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto" dir={settings.direction}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t("paperImportDialogTitle", lang)}</h1>
            <p className="text-sm text-muted-foreground">
              {t("paperImportDialogDescription", lang)}
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate({ to: "/home" })}>
            <ArrowLeft className="size-4" />
            {t("cancel", lang)}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="size-4" /> {t("capture", lang)}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => galleryRef.current?.click()}
          >
            <ImagePlus className="size-4" /> {t("uploadImage", lang)}
          </Button>
          {image && (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => void runExtraction(image)}
            >
              <RefreshCw className="size-4" /> {t("refresh", lang)}
            </Button>
          )}
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            if (cameraRef.current) cameraRef.current.value = "";
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            if (galleryRef.current) galleryRef.current.value = "";
          }}
        />

        {image && (
          <div className="rounded border p-2">
            <img src={image} alt="Paper preview" className="mx-auto max-h-64 rounded" />
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {t("searchingText", lang)}
          </div>
        )}

        {!loading && lastError && !rows.length && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <div className="font-medium text-destructive">{t("ocrError", lang)}</div>
            <div className="text-muted-foreground mt-1">{lastError}</div>
          </div>
        )}

        {debug && lastCsv && (
          <details className="rounded border bg-muted/40 p-2 text-xs">
            <summary className="cursor-pointer font-medium">Raw CSV (debug)</summary>
            <pre className="mt-2 whitespace-pre-wrap break-all">{lastCsv}</pre>
          </details>
        )}

        {!!rows.length && (
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={row.id} className="rounded-lg border bg-card p-3 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 end-2"
                  aria-label={t("delete", lang)}
                  onClick={() => removeRow(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
                <div className="grid gap-2 sm:grid-cols-3 pe-10">
                  <Input
                    value={row.date}
                    onChange={(e) => updateRow(index, "date", e.target.value)}
                    placeholder={t("dateExample", lang)}
                  />
                  <Input
                    value={row.entryTime}
                    onChange={(e) => updateRow(index, "entryTime", e.target.value)}
                    placeholder={t("timeExample", lang)}
                  />
                  <Input
                    value={row.exitTime ?? ""}
                    onChange={(e) => updateRow(index, "exitTime", e.target.value)}
                    placeholder={t("timeExample", lang)}
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-4 mt-3">
                  <Input
                    value={row.firstName}
                    onChange={(e) => updateRow(index, "firstName", e.target.value)}
                    placeholder={t("firstNamePlaceholder", lang)}
                  />
                  <Input
                    value={row.lastName}
                    onChange={(e) => updateRow(index, "lastName", e.target.value)}
                    placeholder={t("lastNamePlaceholder", lang)}
                  />
                  <Input
                    value={row.idNumber}
                    onChange={(e) => updateRow(index, "idNumber", e.target.value)}
                    placeholder={t("idNumberPlaceholder", lang)}
                  />
                  <Input
                    value={row.phone}
                    onChange={(e) => updateRow(index, "phone", e.target.value)}
                    placeholder={t("phonePlaceholder", lang)}
                  />
                  <Input
                    value={row.carNumber}
                    onChange={(e) => updateRow(index, "carNumber", e.target.value)}
                    placeholder={t("carNumberPlaceholder", lang)}
                  />
                  <Input
                    value={row.company}
                    onChange={(e) => updateRow(index, "company", e.target.value)}
                    placeholder={t("companyPlaceholder", lang)}
                  />
                  <Input
                    value={row.approverName}
                    onChange={(e) => updateRow(index, "approverName", e.target.value)}
                    placeholder={t("approverPlaceholder", lang)}
                  />
                  <Input
                    value={row.guardName}
                    onChange={(e) => updateRow(index, "guardName", e.target.value)}
                    placeholder={t("guardPlaceholder", lang)}
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate({ to: "/home" })}>
                {t("cancel", lang)}
              </Button>
              <Button onClick={mergeAndReturn}>{t("mergeRecords", lang)}</Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={confirmRetry} onOpenChange={setConfirmRetry}>
        <AlertDialogContent dir={settings.direction}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ocrRetryTitle", lang)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("ocrRetryDescription", lang)}
              {lastError ? ` — ${lastError}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel", lang)}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmRetry(false);
                if (image) void runExtraction(image, lastError);
              }}
            >
              {t("retry", lang)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}