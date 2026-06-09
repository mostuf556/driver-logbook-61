import { Pencil, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppData } from "@/hooks/use-app-data";
import { useDebugMode } from "@/hooks/use-debug-mode";
import { exportContactsCsv, parseCsvLine } from "@/lib/csv";
import { randomContact } from "@/lib/debug-data";
import { uid } from "@/lib/storage";
import type { Contact } from "@/lib/types";

const EMPTY: Contact = { id: "", firstName: "", lastName: "", idNumber: "", phone: "", company: "", carNumbers: [] };

export function ContactsManager() {
  const { contacts, updateContacts, settings } = useAppData();
  const lang = settings.language;
  const debug = useDebugMode();
  const [form, setForm] = useState<Contact>(EMPTY);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [filter, setFilter] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName && !form.lastName && !form.idNumber) {
      toast.error(t("contactNameOrIdRequired", lang));
      return;
    }
    updateContacts([{ ...form, id: uid() }, ...contacts]);
    setForm(EMPTY);
    toast.success(t("contactAdded", lang));
  };

  const remove = (id: string) => {
    updateContacts(contacts.filter((c) => c.id !== id));
    toast.success(t("contactDeleted", lang));
  };

  const saveEdit = () => {
    if (!editing) return;
    updateContacts(contacts.map((c) => (c.id === editing.id ? editing : c)));
    setEditing(null);
    toast.success(t("contactUpdated", lang));
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const clean = text.replace(/^\uFEFF/, "");
    const lines = clean.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return;
    const header = lines[0];
    const delim = header.includes("\t") ? "\t" : header.includes(";") ? ";" : ",";
    const cols = parseCsvLine(header, delim).map((c) => c.trim());
    const getIndex = (patterns: RegExp[]) => cols.findIndex((c) => patterns.some((re) => re.test(c)));
    const fullNameIndex = getIndex([/שם הנהג|driverName/i]);
    const firstNameIndex = getIndex([/שם פרטי|firstname|first name/i]);
    const lastNameIndex = getIndex([/שם משפחה|lastname|last name/i]);
    const idIndex = getIndex([/תעודת זהות|idnumber|id|ת\.ז\./i]);
    const phoneIndex = getIndex([/טלפון|phone/i]);
    const companyIndex = getIndex([/חברה|company/i]);
    const carsIndex = getIndex([/מספר רכב|plate|car number|car/i]);
    const start = cols.some((c) => /שם|name|id|phone|company/i.test(c)) ? 1 : 0;
    const hasFull = fullNameIndex >= 0;

    const existingByIdNumber = new Set(contacts.map((c) => c.idNumber).filter(Boolean));
    const existingByPhone = new Set(contacts.map((c) => c.phone).filter(Boolean));
    const existingByName = new Set(
      contacts.map((c) => `${c.firstName.trim()}|${c.lastName.trim()}|${c.company.trim()}`),
    );

    const added: Contact[] = [];
    let skipped = 0;
    for (let i = start; i < lines.length; i++) {
      const raw = parseCsvLine(lines[i], delim);
      const getRaw = (index: number) => (index >= 0 ? (raw[index] ?? "").trim() : "");
      let firstName = "";
      let lastName = "";
      if (hasFull) {
        const fullName = getRaw(fullNameIndex);
        const parts = fullName.trim().split(/\s+/);
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ");
      } else {
        firstName = getRaw(firstNameIndex);
        lastName = getRaw(lastNameIndex);
      }

      const idNumber = getRaw(idIndex);
      const phone = getRaw(phoneIndex);
      const company = getRaw(companyIndex);
      const carNumbersRaw = getRaw(carsIndex);
      const carNumbers = carNumbersRaw
        .split(/[;,]+/)
        .map((v) => v.trim())
        .filter(Boolean);

      if (!firstName && !lastName && !idNumber) continue;

      if (idNumber && existingByIdNumber.has(idNumber)) { skipped++; continue; }
      if (phone && existingByPhone.has(phone)) { skipped++; continue; }
      const nameKey = `${firstName}|${lastName}|${company}`;
      if (existingByName.has(nameKey)) { skipped++; continue; }

      const newContact: Contact = {
        id: uid(),
        firstName,
        lastName,
        idNumber,
        phone,
        company,
        carNumbers,
      };
      added.push(newContact);
      if (idNumber) existingByIdNumber.add(idNumber);
      if (phone) existingByPhone.add(phone);
      existingByName.add(nameKey);
    }
    updateContacts([...added, ...contacts]);
    if (skipped > 0) {
      toast.success(`${added.length} ${t("contactImportSuccess", lang)} (${skipped} ${t("contactImportSkipped", lang)})`);
    } else {
      toast.success(`${added.length} ${t("contactImportSuccess", lang)}`);
    }
  };

  const filtered = contacts.filter((c) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return [c.firstName, c.lastName, c.idNumber, c.phone, c.company]
      .some((v) => (v || "").toLowerCase().includes(q)) ||
      c.carNumbers.some((n) => n.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t("firstName", lang)} value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
        <Field label={t("lastName", lang)} value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
        <Field label={t("idNumber", lang)} value={form.idNumber} onChange={(v) => setForm({ ...form, idNumber: v })} />
        <Field label={t("phone", lang)} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label={t("company", lang)} value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
        <Field
          label={t("carNumber", lang)}
          value={form.carNumbers.join(", ")}
          onChange={(v) => setForm({ ...form, carNumbers: v.split(/[;,]+/).map((p) => p.trim()).filter(Boolean) })}
          className="sm:col-span-2"
        />
        <div className="flex items-end gap-2">
          {debug && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => {
                const c = randomContact();
                setForm({ ...c, id: "" });
              }}
            >
              {t("demoData", lang)}
            </Button>
          )}
          <Button type="submit" className="w-full">{t("addContact", lang)}</Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t("searchContactsPlaceholder", lang)}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" onClick={() => exportContactsCsv(contacts, settings)}>
          {t("exportCsv", lang)}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importCsv(f);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload /> {t("importCsv", lang)}
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">{t("firstName", lang)}</TableHead>
              <TableHead className="whitespace-nowrap">{t("lastName", lang)}</TableHead>
              <TableHead className="whitespace-nowrap">{t("idNumber", lang)}</TableHead>
              <TableHead className="whitespace-nowrap">{t("phone", lang)}</TableHead>
              <TableHead className="hidden sm:table-cell whitespace-nowrap">{t("company", lang)}</TableHead>
              <TableHead className="whitespace-nowrap">{t("carNumbers", lang)}</TableHead>
              <TableHead className="whitespace-nowrap text-end">{t("actions", lang)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="whitespace-nowrap">{c.firstName}</TableCell>
                <TableCell className="whitespace-nowrap">{c.lastName}</TableCell>
                <TableCell className="whitespace-nowrap font-mono">{c.idNumber}</TableCell>
                <TableCell className="whitespace-nowrap font-mono" dir="ltr">{c.phone}</TableCell>
                <TableCell className="hidden sm:table-cell whitespace-nowrap">{c.company}</TableCell>
                <TableCell className="whitespace-nowrap">{c.carNumbers.join("; ")}</TableCell>
                <TableCell className="whitespace-nowrap text-end">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                      <Pencil />
                    </Button>
                    <ConfirmDialog
                      title={t("deleteContact", lang)}
                      description={[c.firstName, c.lastName, c.idNumber].filter(Boolean).join(" · ")}
                      onConfirm={() => remove(c.id)}
                      trigger={
                        <Button size="icon" variant="ghost">
                          <Trash2 />
                        </Button>
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  {t("noContacts", lang)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("editContact", lang)}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("firstName", lang)} value={editing.firstName} onChange={(v) => setEditing({ ...editing, firstName: v })} />
              <Field label={t("lastName", lang)} value={editing.lastName} onChange={(v) => setEditing({ ...editing, lastName: v })} />
              <Field label={t("idNumber", lang)} value={editing.idNumber} onChange={(v) => setEditing({ ...editing, idNumber: v })} />
              <Field label={t("phone", lang)} value={editing.phone} onChange={(v) => setEditing({ ...editing, phone: v })} />
              <Field label={t("company", lang)} value={editing.company} onChange={(v) => setEditing({ ...editing, company: v })} />
              <Field
                label={t("carNumber", lang)}
                value={editing.carNumbers.join(", ")}
                onChange={(v) => setEditing({ ...editing, carNumbers: v.split(/[;,]+/).map((p) => p.trim()).filter(Boolean) })}
                className="sm:col-span-2"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>{t("cancel", lang)}</Button>
            <Button onClick={saveEdit}>{t("save", lang)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="w-full" />
    </div>
  );
}
