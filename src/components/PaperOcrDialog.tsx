import { Camera, ImagePlus, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { extractImageText, fileToDownscaledDataUrl } from "@/lib/openrouter";
import { todayISO, nowHHMM } from "@/lib/time";
import { uid } from "@/lib/storage";
import { t } from "@/lib/i18n";
import type { AppSettings, DriverReport } from "@/lib/types";

const PROMPT = `Extract the table of driver entry records from this image. Output tab-separated rows only, in the following order: date (YYYY-MM-DD), entryTime (HH:mm), exitTime (HH:mm or empty), firstName, lastName, idNumber, phone, carNumber, company, approverName, guardName. Do not include any labels, only the data rows.`;

function normalizeValue(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeDate(value: string) {
  const cleaned = value.replace(/\./g, "-").replace(/\//g, "-").trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleaned)) return cleaned;
  const parts = cleaned.split("-").map((p) => p.padStart(2, "0"));
  if (parts.length === 3) {
    if (parts[0].length === 4) return `${parts[0]}-${parts[1]}-${parts[2]}`;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
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
    const row: Partial<DriverReport> = {
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

    return row as DriverReport;
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
  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState<DriverReport[]>([]);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const url = await fileToDownscaledDataUrl(file, settings.ocrMaxImageSizeMB);
      setImage(url);
      const { text } = await extractImageText(url, PROMPT, settings);
      setRawText(text);
      setRows(parseRecords(text));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("ocrError", lang));
    } finally {
      setLoading(false);
    }
  };

  const syncRawText = () => {
    setRows(parseRecords(rawText));
  };

  const updateRow = (index: number, key: keyof DriverReport, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: key === "exitTime" ? (value || null) : value } as DriverReport;
      return next;
    });
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
            setRawText("");
            setRows([]);
          }
          setOpen(value);
        }}
      >
        <DialogContent dir="rtl" className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("paperImportDialogTitle", lang)}</DialogTitle>
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("recognizedText", lang)}</Label>
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("importTable", lang)}</Label>
                <Button type="button" variant="outline" onClick={syncRawText} disabled={loading || !rawText}>
                  {t("updateTable", lang)}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {t("reviewAndUpdateTable", lang)}
                </p>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {t("searchingText", lang)}
              </div>
            )}

            {!!rows.length && (
              <div className="space-y-3 overflow-x-auto">
                <div className="grid grid-cols-[1fr] gap-3">
                  {rows.map((row, index) => (
                    <div key={row.id} className="rounded-lg border bg-card p-3">
                      <div className="flex flex-wrap gap-2">
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
                      <div className="grid gap-2 sm:grid-cols-2 mt-3">
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
