import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FieldAutocomplete } from "@/components/FieldAutocomplete";
import { PlateOcrDialog } from "@/components/PlateOcrDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/hooks/use-app-data";
import { useDebugMode } from "@/hooks/use-debug-mode";
import { upsertContactFromReport } from "@/lib/contacts";
import { randomReport } from "@/lib/debug-data";
import { uid } from "@/lib/storage";
import { nowHHMM, todayISO } from "@/lib/time";
import { t } from "@/lib/i18n";
import type { Contact, DriverReport } from "@/lib/types";
import { validateCarNumber, validateIdNumber, validatePhone } from "@/lib/validation";

export function EntryForm({ existing }: { existing?: DriverReport }) {
  const { settings, reports, contacts, updateReports, updateContacts } = useAppData();
  const navigate = useNavigate();
  const debug = useDebugMode();
  const lang = settings.language;
  const isEdit = !!existing;

  const [form, setForm] = useState<DriverReport>(
    existing ?? {
      id: uid(),
      date: settings.autoFillDate ? todayISO() : "",
      firstName: "",
      lastName: "",
      idNumber: "",
      phone: "",
      carNumber: "",
      entryTime: settings.autoFillEntryTime ? nowHHMM(settings.roundTimesToMinutes) : "",
      exitTime: null,
      approverName: settings.defaultApprover,
      company: settings.defaultCompany,
      guardName: settings.defaultGuard,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  );

  const set = <K extends keyof DriverReport>(k: K, v: DriverReport[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const applyContact = (c: Contact) => {
    setForm((f) => ({
      ...f,
      firstName: c.firstName || f.firstName,
      lastName: c.lastName || f.lastName,
      idNumber: c.idNumber || f.idNumber,
      phone: c.phone || f.phone,
      company: c.company || f.company,
    }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = [
      validateIdNumber(form.idNumber, settings),
      validatePhone(form.phone, settings),
      validateCarNumber(form.carNumber, settings),
      settings.requireApprover && !form.approverName ? t("approverRequired", lang) : null,
      settings.requireGuard && !form.guardName ? t("guardRequired", lang) : null,
      !form.firstName && !form.lastName ? t("driverNameRequired", lang) : null,
      !form.date ? t("dateRequired", lang) : null,
      !form.entryTime ? t("entryTimeRequired", lang) : null,
    ].filter(Boolean) as string[];
    if (errs.length) {
      toast.error(errs[0]);
      return;
    }
    const next: DriverReport = { ...form, updatedAt: new Date().toISOString() };
    const list = isEdit
      ? reports.map((r) => (r.id === next.id ? next : r))
      : [next, ...reports];
    updateReports(list);
    updateContacts(upsertContactFromReport(contacts, next, settings));
    toast.success(isEdit ? t("reportUpdated", lang) : t("reportSaved", lang));
    navigate({ to: "/home" });
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" dir="rtl">
      {debug && !isEdit && (
        <div className="sm:col-span-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setForm(randomReport(settings))}>
            {t("demoData", lang)}
          </Button>
        </div>
      )}
      <div className="space-y-1.5">
        <Label>{t("date", lang)}</Label>
        <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>{t("company", lang)}</Label>
        <FieldAutocomplete
          field="company"
          value={form.company}
          onChange={(v) => set("company", v)}
          onPickContact={applyContact}
          contacts={contacts}
          settings={settings}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t("firstName", lang)}</Label>
        <FieldAutocomplete
          field="firstName"
          value={form.firstName}
          onChange={(v) => set("firstName", v)}
          onPickContact={applyContact}
          contacts={contacts}
          settings={settings}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t("lastName", lang)}</Label>
        <FieldAutocomplete
          field="lastName"
          value={form.lastName}
          onChange={(v) => set("lastName", v)}
          onPickContact={applyContact}
          contacts={contacts}
          settings={settings}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t("idNumber", lang)}</Label>
        <FieldAutocomplete
          field="idNumber"
          value={form.idNumber}
          onChange={(v) => set("idNumber", v)}
          onPickContact={applyContact}
          contacts={contacts}
          settings={settings}
          inputMode="numeric"
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t("phone", lang)}</Label>
        <FieldAutocomplete
          field="phone"
          value={form.phone}
          onChange={(v) => set("phone", v)}
          onPickContact={applyContact}
          contacts={contacts}
          settings={settings}
          inputMode="tel"
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t("carNumber", lang)}</Label>
        <div className="flex gap-2">
          <Input value={form.carNumber} onChange={(e) => set("carNumber", e.target.value)} dir="ltr" />
          <PlateOcrDialog
            settings={settings}
            onConfirm={(p) => set("carNumber", p)}
            onNavigateToSettings={() => navigate({ to: "/settings" })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{t("entryTime", lang)}</Label>
        <Input type="time" value={form.entryTime} onChange={(e) => set("entryTime", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>{t("exitTime", lang)}</Label>
        <Input
          type="time"
          value={form.exitTime ?? ""}
          onChange={(e) => set("exitTime", e.target.value || null)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t("approverName", lang)}</Label>
        <Input value={form.approverName} onChange={(e) => set("approverName", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>{t("guardName", lang)}</Label>
        <Input value={form.guardName} onChange={(e) => set("guardName", e.target.value)} />
      </div>
      <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/home" })}>
          {t("cancel", lang)}
        </Button>
        <Button type="submit">{isEdit ? t("save", lang) : t("addNewEntry", lang)}</Button>
      </div>
    </form>
  );
}
