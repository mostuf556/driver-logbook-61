import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { t } from "@/lib/i18n";
import type { AppSettings } from "@/lib/types";

export function ShareGuestDialog({ settings }: { settings: AppSettings }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lang = settings.language;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const base =
      settings.guestPageBaseUrl?.replace(/\/$/, "") || window.location.origin;
    setUrl(`${base}/guest`);
  }, [settings.guestPageBaseUrl]);

  useEffect(() => {
    if (!open || !url || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, { width: 240, margin: 1 }).catch(() => {
      /* noop */
    });
  }, [open, url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("copied", lang));
    } catch {
      toast.error("Copy failed");
    }
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: t("guestShareTitle", lang), url });
      } else {
        await copy();
      }
    } catch {
      /* user cancelled */
    }
  };

  const downloadQr = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = "guest-qr.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="me-2 size-4" />
          {t("shareGuestPage", lang)}
        </Button>
      </DialogTrigger>
      <DialogContent dir={settings.direction}>
        <DialogHeader>
          <DialogTitle>{t("shareGuestPage", lang)}</DialogTitle>
          <DialogDescription>{t("scanToSubmit", lang)}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <canvas ref={canvasRef} className="rounded border bg-white p-2" />
          <div className="flex w-full gap-2">
            <Input value={url} readOnly dir="ltr" className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={copy} aria-label={t("copied", lang)}>
              <Copy className="size-4" />
            </Button>
          </div>
          <div className="flex gap-2 w-full">
            <Button className="flex-1" onClick={share}>
              <Share2 className="me-2 size-4" />
              {t("share", lang)}
            </Button>
            <Button variant="outline" className="flex-1" onClick={downloadQr}>
              <Download className="me-2 size-4" />
              {t("downloadQr", lang)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}