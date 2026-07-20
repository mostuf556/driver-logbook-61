import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ClipboardCopy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/hooks/use-app-data";
import { useTheme } from "@/hooks/use-theme";
import { t } from "@/lib/i18n";
import { addPendingRequest, guestCooldownRemaining } from "@/lib/requests";
import { uid } from "@/lib/storage";
import { nowHHMM, todayISO } from "@/lib/time";
import { validateCarNumber, validateIdNumber, validatePhone } from "@/lib/validation";
import type { PendingRequest } from "@/lib/types";

export const Route = createFileRoute("/guest")({
  head: () => ({
    meta: [
      { title: "Guest entry request · Driver Logbook" },
      { name: "description", content: "Submit an entrance request to the guard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GuestPage,
});

function GuestPage() {
  const { settings } = useAppData();
  useTheme(settings.theme);
  const navigate = useNavigate();
  const lang = settings.language;
  const [cooldown, setCooldown] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<PendingRequest>({
    id: uid(),
    firstName: "",
    lastName: "",
    idNumber: "",
    phone: "",
    carNumber: "",
    company: "",
    requestedAt: new Date().toISOString(),
    date: todayISO(),
    entryTime: nowHHMM(settings.roundTimesToMinutes),
    exitTime: null,
    approverName: settings.defaultApprover,
    guardName: settings.defaultGuard,
  });

  useEffect(() => {
    const tick = () =>
      setCooldown(guestCooldownRemaining(settings.guestSubmitCooldownSeconds));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [settings.guestSubmitCooldownSeconds]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = settings.direction;
      document.documentElement.lang = settings.language;
    }
  }, [settings.direction, settings.language]);

  const set = <K extends keyof PendingRequest>(k: K, v: PendingRequest[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const buildErrorReport = (errs: string[]) => {
    const lines = [
      `=== Guest Entry Submission Error ===`,
      `Time: ${new Date().toISOString()}`,
      ``,
      `Errors:`,
      ...errs.map((e, i) => `  ${i + 1}. ${e}`),
      ``,
      `Form data:`,
      `  Date: ${form.date ?? ""}`,
      `  Name: ${form.firstName} ${form.lastName}`,
      `  ID: ${form.idNumber}`,
      `  Phone: ${form.phone}`,
      `  Car: ${form.carNumber}`,
      `  Company: ${form.company}`,
      `  Entry time: ${form.entryTime ?? ""}`,
    ];
    return lines.join("\n");
  };

  const handleCopyError = async () => {
    try {
      await navigator.clipboard.writeText(buildErrorReport(errors));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Clipboard not available");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) {
      toast.error(t("guestCooldown", lang).replace("{s}", String(cooldown)));
      return;
    }
    const errs = [
      !form.firstName && !form.lastName ? t("driverNameRequired", lang) : null,
      validateIdNumber(form.idNumber, settings),
      validatePhone(form.phone, settings),
      validateCarNumber(form.carNumber, settings),
      !form.date ? t("dateRequired", lang) : null,
      !form.entryTime ? t("entryTimeRequired", lang) : null,
      settings.requireApprover && !form.approverName ? t("approverRequired", lang) : null,
      settings.requireGuard && !form.guardName ? t("guardRequired", lang) : null,
    ].filter(Boolean) as string[];

    if (errs.length) {
      setErrors(errs);
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      return;
    }

    setErrors([]);
    addPendingRequest({ ...form, requestedAt: new Date().toISOString() });
    navigate({ to: "/guest/thanks" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir={settings.direction}>
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold">{t("guestFormTitle", lang)}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{t("guestFormHint", lang)}</p>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {/* Date */}
          <div className="space-y-1.5">
            <Label>{t("date", lang)}</Label>
            <Input
              type="date"
              value={form.date ?? ""}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label>{t("company", lang)}</Label>
            <Input
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
            />
          </div>

          {/* First name */}
          <div className="space-y-1.5">
            <Label>{t("firstName", lang)}</Label>
            <Input
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
          </div>

          {/* Last name */}
          <div className="space-y-1.5">
            <Label>{t("lastName", lang)}</Label>
            <Input
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </div>

          {/* ID number */}
          <div className="space-y-1.5">
            <Label>{t("idNumber", lang)}</Label>
            <Input
              inputMode="numeric"
              value={form.idNumber}
              onChange={(e) => set("idNumber", e.target.value)}
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label>{t("phone", lang)}</Label>
            <Input
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>

          {/* Car number */}
          <div className="space-y-1.5">
            <Label>{t("carNumber", lang)}</Label>
            <Input
              dir="ltr"
              value={form.carNumber}
              onChange={(e) => set("carNumber", e.target.value)}
            />
          </div>

          {/* Entry time */}
          <div className="space-y-1.5">
            <Label>{t("entryTime", lang)}</Label>
            <Input
              type="time"
              value={form.entryTime ?? ""}
              onChange={(e) => set("entryTime", e.target.value)}
            />
          </div>

          {/* Exit time */}
          <div className="space-y-1.5">
            <Label>{t("exitTime", lang)}</Label>
            <Input
              type="time"
              value={form.exitTime ?? ""}
              onChange={(e) => set("exitTime", e.target.value || null)}
            />
          </div>

          {/* Approver */}
          <div className="space-y-1.5">
            <Label>{t("approverName", lang)}</Label>
            <Input
              value={form.approverName ?? ""}
              onChange={(e) => set("approverName", e.target.value)}
            />
          </div>

          {/* Guard */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("guardName", lang)}</Label>
            <Input
              value={form.guardName ?? ""}
              onChange={(e) => set("guardName", e.target.value)}
            />
          </div>

          {/* Error panel */}
          {errors.length > 0 && (
            <div
              ref={errorRef}
              className="sm:col-span-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 space-y-3"
            >
              <div className="flex items-center gap-2 text-destructive font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{t("guestErrorHeading", lang)}</span>
              </div>
              <ul className="space-y-1 text-sm text-destructive">
                {errors.map((err, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="select-none">•</span>
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={handleCopyError}
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
                {copied ? t("guestCopied", lang) : t("guestCopyError", lang)}
              </Button>
            </div>
          )}

          {/* Submit */}
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full" disabled={cooldown > 0}>
              {cooldown > 0
                ? t("guestCooldown", lang).replace("{s}", String(cooldown))
                : t("guestSubmit", lang)}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
