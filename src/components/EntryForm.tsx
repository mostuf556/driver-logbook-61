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
import type { Contact, DriverReport } from "@/lib/types";
import { validateCarNumber, validateIdNumber, validatePhone } from "@/lib/validation";

export function EntryForm({ existing }: { existing?: DriverReport }) {
  const { settings, reports, contacts, updateReports, updateContacts } = useAppData();
  const navigate = useNavigate();
  const debug = useDebugMode();
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
      settings.requireApprover && !form.approverName ? "שם המאשר חובה" : null,
      settings.requireGuard && !form.guardName ? "שם השומר חובה" : null,
      !form.firstName && !form.lastName ? "שם נהג חובה" : null,
      !form.date ? "תאריך חובה" : null,
      !form.entryTime ? "שעת כניסה חובה" : null,
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
    toast.success(isEdit ? "עודכן" : "נוסף");
    navigate({ to: "/home" });
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" dir="rtl">
      {debug && !isEdit && (
        <div className="sm:col-span-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setForm(randomReport(settings))}>
            מלא נתוני דמו
          </Button>
        </div>
      )}
      <div className="space-y-1.5">
        <Label>תאריך</Label>
        <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>חברה</Label>
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
        <Label>שם פרטי</Label>
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
        <Label>שם משפחה</Label>
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
        <Label>תעודת זהות</Label>
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
        <Label>טלפון</Label>
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
        <Label>מספר רכב</Label>
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
        <Label>שעת כניסה</Label>
        <Input type="time" value={form.entryTime} onChange={(e) => set("entryTime", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>שעת יציאה</Label>
        <Input
          type="time"
          value={form.exitTime ?? ""}
          onChange={(e) => set("exitTime", e.target.value || null)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>שם המאשר</Label>
        <Input value={form.approverName} onChange={(e) => set("approverName", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>שם השומר</Label>
        <Input value={form.guardName} onChange={(e) => set("guardName", e.target.value)} />
      </div>
      <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/home" })}>
          ביטול
        </Button>
        <Button type="submit">{isEdit ? "שמור" : "הוסף רשומה"}</Button>
      </div>
    </form>
  );
}
