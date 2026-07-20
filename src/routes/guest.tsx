import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/hooks/use-app-data";
import { useTheme } from "@/hooks/use-theme";
import { t } from "@/lib/i18n";
import { addPendingRequest, guestCooldownRemaining } from "@/lib/requests";
import { uid } from "@/lib/storage";
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

  const [form, setForm] = useState<PendingRequest>({
    id: uid(),
    firstName: "",
    lastName: "",
    idNumber: "",
    phone: "",
    carNumber: "",
    company: "",
    requestedAt: new Date().toISOString(),
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
    ].filter(Boolean) as string[];
    if (errs.length) {
      toast.error(errs[0]);
      return;
    }
    addPendingRequest({ ...form, requestedAt: new Date().toISOString() });
    navigate({ to: "/guest/thanks" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir={settings.direction}>
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold">{t("guestFormTitle", lang)}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{t("guestFormHint", lang)}</p>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("firstName", lang)}</Label>
            <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("lastName", lang)}</Label>
            <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
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
            <Input dir="ltr" value={form.carNumber} onChange={(e) => set("carNumber", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("company", lang)}</Label>
            <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
          </div>
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