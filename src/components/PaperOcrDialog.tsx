import { Camera, ImagePlus, Loader2, Maximize2, Minimize2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { extractImageText, fileToDownscaledDataUrl } from "@/lib/openrouter";
import { todayISO } from "@/lib/time";
import { uid } from "@/lib/storage";
import { t } from "@/lib/i18n";
import type { AppSettings, DriverReport } from "@/lib/types";

// Canonical field order for paperOcrColumns. The Nth header in settings maps
// to the Nth entry below.
export const PAPER_FIELD_ORDER = [
  "date",
  "fullName",
  "idOrPhone",
  "carNumber",
  "entryTime",
  "exitTime",
  "approverName",
  "company",
  "guardName",
] as const;
export type PaperField = (typeof PAPER_FIELD_ORDER)[number];

function normalizeValue(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeDate(value: string) {
  const cleaned = value.replace(/\./g, "-").replace(/\//g, "-").trim();
  const parts = cleaned.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return todayISO();
}

function normalizeTime(value: string) {
  const cleaned = value.replace(/\./g, ":").trim();
  const match = cleaned.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }
  return "";
}

function emptyRow(): DriverReport {
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function splitFullName(value: string): { firstName: string; lastName: string } {
  const v = normalizeValue(value);
  if (!v) return { firstName: "", lastName: "" };
  const idx = v.indexOf(" ");
  if (idx === -1) return { firstName: v, lastName: "" };
  return { firstName: v.slice(0, idx), lastName: v.slice(idx + 1) };
}

function assignByField(
  row: DriverReport,
  field: PaperField,
  rawValue: string,
  phoneSeparator: string,
) {
  const value = normalizeValue(rawValue || "");
  switch (field) {
    case "date":
      if (value) row.date = normalizeDate(value);
      return;
    case "fullName": {
      const { firstName, lastName } = splitFullName(value);
      row.firstName = firstName;
      row.lastName = lastName;
      return;
    }
    case "idOrPhone": {
      if (!value) return;
      const sep = phoneSeparator || "-";
      if (value.includes(sep)) row.phone = value;
      else row.idNumber = value;
      return;
    }
    case "carNumber":
      row.carNumber = value;
      return;
    case "entryTime":
      row.entryTime = normalizeTime(value);
      return;
    case "exitTime":
      row.exitTime = normalizeTime(value) || null;
      return;
    case "approverName":
      row.approverName = value;
      return;
    case "company":
      row.company = value;
      return;
    case "guardName":
      row.guardName = value;
      return;
  }
}

function parseRecordsFromJson(
  text: string,
  columns: string[],
  phoneSeparator: string,
): DriverReport[] {
  if (!text.trim()) return [];
  // Strip ```json fences if present
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    // Try to locate first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return [];
    try {
      data = JSON.parse(match[0]);
    } catch {
      return [];
    }
  }
  const rows: unknown[] = Array.isArray((data as { rows?: unknown }).rows)
    ? ((data as { rows: unknown[] }).rows)
    : Array.isArray(data)
      ? (data as unknown[])
      : [];
  const result: DriverReport[] = [];
  for (const r of rows) {
    const row = emptyRow();
    if (Array.isArray(r)) {
      for (let i = 0; i < r.length && i < PAPER_FIELD_ORDER.length; i++) {
        assignByField(row, PAPER_FIELD_ORDER[i], String(r[i] ?? ""), phoneSeparator);
      }
    } else if (r && typeof r === "object") {
      const obj = r as Record<string, unknown>;
      for (let i = 0; i < columns.length && i < PAPER_FIELD_ORDER.length; i++) {
        const v = obj[columns[i]] ?? obj[PAPER_FIELD_ORDER[i]];
        if (v !== undefined) assignByField(row, PAPER_FIELD_ORDER[i], String(v ?? ""), phoneSeparator);
      }
    }
    result.push(row);
  }
  return result;
}

// Legacy TSV/CSV parser kept for fallback and tests.
function parseRecords(text: string): DriverReport[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const header = lines[0].toLowerCase();
  const hasHeader = /(date|entry|exit|first|last|id|plate|car)/.test(header) && lines[0].includes("\t");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const values = line.split(/\t|,|;/).map(normalizeValue).filter(Boolean);
    const row: DriverReport = emptyRow();

    if (values.length >= 11) {
      row.date = normalizeDate(values[0]);
      row.entryTime = normalizeTime(values[1]);
      row.exitTime = normalizeTime(values[2]) || null;
      row.firstName = values[3] || "";
      row.lastName = values[4] || "";
      row.idNumber = values[5] || "";
      row.phone = values[6] || "";
      row.carNumber = values[7] || "";
      row.company = values[8] || "";
      row.approverName = values[9] || "";
      row.guardName = values[10] || "";
    } else if (values.length >= 6) {
      row.date = normalizeDate(values[0]);
      row.entryTime = normalizeTime(values[1]);
      row.exitTime = normalizeTime(values[2]) || null;
      row.firstName = values[3] || "";
      row.lastName = values[4] || "";
      row.carNumber = values[5] || "";
      row.company = values[6] || "";
      row.idNumber = values[7] || "";
      row.phone = values[8] || "";
    } else if (values.length === 1) {
      row.carNumber = values[0];
    }

    return row;
  });
}

export { normalizeValue, normalizeDate, normalizeTime, parseRecords };

export function PaperOcrDialog({
  settings,
  onMerge,
}: {
  settings: AppSettings;
  onMerge: (records: DriverReport[]) => void;
}) {
  const lang = settings.language;
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [rows, setRows] = useState<DriverReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const columns = settings.paperOcrColumns?.length
    ? settings.paperOcrColumns
    : ["תאריך", "שם הנהג", "תעודת זהות", "מספר רכב", "שעת כניסה", "שעת יציאה", "שם המאשר", "חברה", "שם השומר"];
  const phoneSep = settings.paperPhoneSeparator || "-";
  const promptTemplate = settings.paperOcrPrompt || "";
  const builtPrompt = (promptTemplate || "Extract rows as JSON {\"rows\":[[...]]} with columns: {{COLUMNS}}")
    .replace("{{COLUMNS}}", columns.join(", "));

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const url = await fileToDownscaledDataUrl(file, settings.ocrMaxImageSizeMB);
      setImage(url);
      const { text } = await extractImageText(url, builtPrompt, settings);
      const parsed = parseRecordsFromJson(text, columns, phoneSep);
      if (parsed.length === 0) {
        // Fall back to legacy TSV parser if model didn't return JSON.
        setRows(parseRecords(text));
      } else {
        setRows(parsed);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("ocrError", lang));
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (index: number, key: keyof DriverReport, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: key === "exitTime" ? (value || null) : value } as DriverReport;
      return next;
    });
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t("importPaper", lang)}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) {
            setImage(null);
            setRows([]);
            setFullscreen(false);
          }
          setOpen(value);
        }}
      >
        <DialogContent
          dir={settings.direction}
          className={
            fullscreen
              ? "max-w-[100vw] w-screen h-screen sm:rounded-none p-4 overflow-auto"
              : "max-w-3xl max-h-[90vh] overflow-auto"
          }
        >
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>{t("paperImportDialogTitle", lang)}</DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={fullscreen ? t("exitFullscreen", lang) : t("fullscreen", lang)}
                onClick={() => setFullscreen((f) => !f)}
              >
                {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </Button>
            </div>
            <DialogDescription>
              {t("paperImportDialogDescription", lang)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => cameraRef.current?.click()}>
                <Camera className="size-4" /> {t("capture", lang)}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => galleryRef.current?.click()}>
                <ImagePlus className="size-4" /> {t("uploadImage", lang)}
              </Button>
            </div>

            <input
              ref={cameraRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                if (cameraRef.current) cameraRef.current.value = "";
              }}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                if (galleryRef.current) galleryRef.current.value = "";
              }}
            />

            {image && (
              <div className="rounded border p-2">
                <img src={image} alt="Paper OCR preview" className="mx-auto max-h-48 rounded" />
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {t("searchingText", lang)}
              </div>
            )}

            {!!rows.length && (
              <div className="space-y-3 overflow-x-auto">
                <div className="grid grid-cols-[1fr] gap-3">
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
                      <div className="flex flex-wrap gap-2 pe-10">
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
                      <div className={`grid gap-2 ${fullscreen ? "sm:grid-cols-4" : "sm:grid-cols-2"} mt-3`}>
                        <Input value={row.firstName} onChange={(e) => updateRow(index, "firstName", e.target.value)} placeholder={t("firstNamePlaceholder", lang)} />
                        <Input value={row.lastName} onChange={(e) => updateRow(index, "lastName", e.target.value)} placeholder={t("lastNamePlaceholder", lang)} />
                        <Input value={row.idNumber} onChange={(e) => updateRow(index, "idNumber", e.target.value)} placeholder={t("idNumberPlaceholder", lang)} />
                        <Input value={row.phone} onChange={(e) => updateRow(index, "phone", e.target.value)} placeholder={t("phonePlaceholder", lang)} />
                        <Input value={row.carNumber} onChange={(e) => updateRow(index, "carNumber", e.target.value)} placeholder={t("carNumberPlaceholder", lang)} />
                        <Input value={row.company} onChange={(e) => updateRow(index, "company", e.target.value)} placeholder={t("companyPlaceholder", lang)} />
                        <Input value={row.approverName} onChange={(e) => updateRow(index, "approverName", e.target.value)} placeholder={t("approverPlaceholder", lang)} />
                        <Input value={row.guardName} onChange={(e) => updateRow(index, "guardName", e.target.value)} placeholder={t("guardPlaceholder", lang)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel", lang)}
            </Button>
            <Button
              disabled={!rows.length}
              onClick={() => {
                onMerge(rows);
                setOpen(false);
              }}
            >
              {t("mergeRecords", lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
