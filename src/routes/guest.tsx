import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardCopy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/hooks/use-app-data";
import { useTheme } from "@/hooks/use-theme";
import { t } from "@/lib/i18n";
import { addPendingRequest } from "@/lib/requests";
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

function freshForm(settings: { defaultApprover: string; defaultGuard: string; roundTimesToMinutes: 1 | 5 | 15 }): PendingRequest {
  return {
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
    estimatedExitTime: null,
    approverName: settings.defaultApprover,
    guardName: settings.defaultGuard,
  };
}

function GuestPage() {
  const { settings } = useAppData();
  useTheme(settings.theme);
  const lang = settings.language;

  const [form, setForm] = useState<PendingRequest>(() => freshForm(settings));
  const [warnings, setWarnings] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = settings.direction;
      document.documentElement.lang = settings.language;
    }
  }, [settings.direction, settings.language]);

  const set = <K extends keyof PendingRequest>(k: K, v: PendingRequest[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const buildErrorReport = (errs: string[]) => {
    return [
      `=== Guest Entry Submission Warning ===`,
      `Time: ${new Date().toISOString()}`,
      ``,
      `Warnings:`,
      ...errs.map((e, i) => `  ${i + 1}. ${e}`),
      ``,
      `Form data:`,
      `  Name: ${form.firstName} ${form.lastName}`,
      `  ID: ${form.idNumber}`,
      `  Phone: ${form.phone}`,
      `  Car: ${form.carNumber}`,
      `  Company: ${form.company}`,
    ].join("\n");
  };

  const handleCopyWarnings = async () => {
    try {
      await navigator.clipboard.writeText(buildErrorReport(warnings));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const doSubmit = () => {
    addPendingRequest({
      ...form,
      date: todayISO(),
      entryTime: nowHHMM(settings.roundTimesToMinutes),
      requestedAt: new Date().toISOString(),
    });
    setSubmitted(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = [
      !form.firstName && !form.lastName ? t("driverNameRequired", lang) : null,
      validateIdNumber(form.idNumber, settings),
      validatePhone(form.phone, settings),
      validateCarNumber(form.carNumber, settings),
    ].filter(Boolean) as string[];

    if (errs.length) {
      setWarnings(errs);
      return;
    }

    doSubmit();
  };

  const handleAnother = () => {
    setForm(freshForm(settings));
    setWarnings([]);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4" dir={settings.direction}>
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="mx-auto size-16 text-green-600" />
          <h1 className="text-2xl font-bold">{t("guestThanksTitle", lang)}</h1>
          <p className="text-muted-foreground">{t("guestThanksBody", lang)}</p>
          <Button variant="outline" onClick={handleAnother}>
            {t("guestSubmit", lang)}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir={settings.direction}>
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold">{t("guestFormTitle", lang)}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{t("guestFormHint", lang)}</p>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("firstName", lang)}</Label>
            <Input
              autoFocus
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("lastName", lang)}</Label>
            <Input
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("idNumber", lang)}</Label>
            <Input
              inputMode="numeric"
              value={form.idNumber}
              onChange={(e) => set("idNumber", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("phone", lang)}</Label>
            <Input
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("carNumber", lang)}</Label>
            <Input
              dir="ltr"
              value={form.carNumber}
              onChange={(e) => set("carNumber", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("company", lang)}</Label>
            <Input
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("estimatedExitTime", lang)}</Label>
            <Input
              type="time"
              value={form.estimatedExitTime ?? ""}
              onChange={(e) => set("estimatedExitTime", e.target.value || null)}
            />
          </div>

          {/* Warnings — non-blocking, guest can still submit */}
          {warnings.length > 0 && (
            <div className="sm:col-span-2 rounded-lg border border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{t("guestErrorHeading", lang)}</span>
              </div>
              <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-400">
                {warnings.map((w, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="select-none">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-amber-400/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50"
                  onClick={doSubmit}
                >
                  {t("guestSubmitAnyway", lang)}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={handleCopyWarnings}
                >
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  {copied ? t("guestCopied", lang) : t("guestCopyError", lang)}
                </Button>
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" className="w-full">
              {t("guestSubmit", lang)}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
