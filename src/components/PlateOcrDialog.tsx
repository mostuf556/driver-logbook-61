import { Camera, ImagePlus, Loader as Loader2 } from "lucide-react";
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
import { t } from "@/lib/i18n";

export function PlateOcrDialog({
  settings,
  onConfirm,
  onNavigateToSettings,
}: {
  settings: AppSettings;
  onConfirm: (plate: string) => void;
  onNavigateToSettings?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ prompt: number; completion: number } | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const lang = settings.language;

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
      toast.error(e instanceof Error ? e.message : t("ocrError", lang));
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
    if (!settings.openRouterApiKey && !(settings.openRouterApiKeys?.length)) {
      toast.error(t("keyMissing", lang), {
        action: onNavigateToSettings
          ? { label: t("openSettings", lang), onClick: onNavigateToSettings }
          : undefined,
      });
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
          <DialogTitle>{t("ocrDialogTitle", lang)}</DialogTitle>
          <DialogDescription>
            {t("ocrDialogDescription", lang)}
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
              {t("openCamera", lang)}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => galleryRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              {t("chooseFromGallery", lang)}
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
              {t("searchingText", lang)}
            </div>
          )}

          {tokenInfo && (
            <p className="text-xs text-muted-foreground">
              {t("ocrTokens", lang)}: {tokenInfo.prompt} prompt · {tokenInfo.completion} completion
            </p>
          )}

          <div>
            <Label htmlFor="ocr-plate">{t("licensePlate", lang)}</Label>
            <Input
              id="ocr-plate"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder={t("licensePlate", lang)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("cancel", lang)}
          </Button>
          <Button
            disabled={!plate}
            onClick={() => {
              onConfirm(plate);
              setOpen(false);
              reset();
            }}
          >
            {t("confirmAndFill", lang)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
