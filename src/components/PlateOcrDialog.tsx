import { Camera, Loader2 } from "lucide-react";
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
import { extractPlateNumber, fileToDownscaledDataUrl } from "@/lib/openrouter";
import type { AppSettings } from "@/lib/types";

export function PlateOcrDialog({
  settings,
  onConfirm,
}: {
  settings: AppSettings;
  onConfirm: (plate: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const url = await fileToDownscaledDataUrl(file, settings.ocrMaxImageSizeMB);
      setImage(url);
      const result = await extractPlateNumber(url, settings);
      setPlate(result);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "שגיאה בזיהוי");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setPlate("");
    setLoading(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          if (!settings.openRouterApiKey) {
            toast.error("הוסף מפתח OpenRouter בהגדרות");
            return;
          }
          setOpen(true);
        }}
      >
        <Camera className="ms-1" />
        סרוק רכב
      </Button>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>זיהוי מספר רכב מתמונה</DialogTitle>
          <DialogDescription>
            צלם או העלה תמונה של לוחית הרכב. תקבל את הטקסט לאישור.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          {image && (
            <div className="rounded border p-2">
              <img src={image} alt="רכב" className="mx-auto max-h-48 rounded" />
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              מזהה...
            </div>
          )}
          <div>
            <Label htmlFor="ocr-plate">מספר רכב</Label>
            <Input
              id="ocr-plate"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="מספר רכב"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button
            disabled={!plate}
            onClick={() => {
              onConfirm(plate);
              setOpen(false);
              reset();
            }}
          >
            אשר ומלא
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}