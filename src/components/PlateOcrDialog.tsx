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
  const [tokenInfo, setTokenInfo] = useState<{ prompt: number; completion: number } | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setTokenInfo(null);
    try {
      const url = await fileToDownscaledDataUrl(file, settings.ocrMaxImageSizeMB);
      setImage(url);
      const { plate: result, usage } = await extractPlateNumber(url, settings);
      setPlate(result);
      if (usage) setTokenInfo({ prompt: usage.prompt_tokens, completion: usage.completion_tokens });
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
    setTokenInfo(null);
  };

  const openDialog = () => {
    if (!settings.openRouterApiKey) {
      toast.error("הוסף מפתח OpenRouter בהגדרות");
      return;
    }
    setOpen(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <div className="flex gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            openDialog();
            setTimeout(() => cameraRef.current?.click(), 100);
          }}
        >
          <Camera className="size-4" />
          צלם
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            openDialog();
            setTimeout(() => galleryRef.current?.click(), 100);
          }}
        >
          <ImagePlus className="size-4" />
          העלה תמונה
        </Button>
      </div>

      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>זיהוי מספר רכב מתמונה</DialogTitle>
          <DialogDescription>
            צלם או העלה תמונה של לוחית הרכב. תקבל את הטקסט לאישור.
          </DialogDescription>
        </DialogHeader>

        {/* Hidden file inputs */}
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

        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="size-4" />
              פתח מצלמה
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => galleryRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              בחר מהגלריה
            </Button>
          </div>

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

          {tokenInfo && (
            <p className="text-xs text-muted-foreground">
              טוקנים: {tokenInfo.prompt} קלט · {tokenInfo.completion} פלט
            </p>
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
