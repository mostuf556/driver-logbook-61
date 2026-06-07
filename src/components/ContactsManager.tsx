import { Pencil, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
import { exportContactsCsv } from "@/lib/csv";
import { randomContact } from "@/lib/debug-data";
import { uid } from "@/lib/storage";
import type { Contact } from "@/lib/types";

const EMPTY: Contact = { id: "", firstName: "", lastName: "", idNumber: "", phone: "", company: "" };

export function ContactsManager() {
  const { contacts, updateContacts, settings } = useAppData();
  const debug = useDebugMode();
  const [form, setForm] = useState<Contact>(EMPTY);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [filter, setFilter] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName && !form.lastName && !form.idNumber) {
      toast.error("נדרש שם או ת.ז.");
      return;
    }
    updateContacts([{ ...form, id: uid() }, ...contacts]);
    setForm(EMPTY);
    toast.success("נוסף");
  };

  const remove = (id: string) => {
    updateContacts(contacts.filter((c) => c.id !== id));
    toast.success("נמחק");
  };

  const saveEdit = () => {
    if (!editing) return;
    updateContacts(contacts.map((c) => (c.id === editing.id ? editing : c)));
    setEditing(null);
    toast.success("עודכן");
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const clean = text.replace(/^\uFEFF/, "");
    const lines = clean.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return;
    const header = lines[0];
    const start = /שם|name/i.test(header) ? 1 : 0;
    const cols = header.split(/[,\t;]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    // legacy "שם הנהג" single-name column support
    const hasFull = cols.some((c) => /שם הנהג|driverName/i.test(c));
    const added: Contact[] = [];
    for (let i = start; i < lines.length; i++) {
      const raw = lines[i].split(/[,\t;]/).map((c) => c.replace(/^="?|"?$/g, "").trim());
      let firstName = "", lastName = "", idNumber = "", phone = "", company = "";
      if (hasFull) {
        const [name = "", id = "", ph = "", co = ""] = raw;
        const parts = name.trim().split(/\s+/);
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ");
        idNumber = id; phone = ph; company = co;
      } else {
        [firstName = "", lastName = "", idNumber = "", phone = "", company = ""] = raw;
      }
      if (!firstName && !lastName && !idNumber) continue;
      added.push({ id: uid(), firstName, lastName, idNumber, phone, company });
    }
    updateContacts([...added, ...contacts]);
    toast.success(`יובאו ${added.length} אנשי קשר`);
  };

  const filtered = contacts.filter((c) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return [c.firstName, c.lastName, c.idNumber, c.phone, c.company].some((v) =>
      (v || "").toLowerCase().includes(q),
    );
  });

  return (
    <div className="space-y-6" dir="rtl">
      {debug && (
        <div>
          <Button
            variant="outline"
            onClick={() => updateContacts([randomContact(), ...contacts])}
          >
            צור נתוני דמו
          </Button>
        </div>
      )}

      <form onSubmit={add} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="שם פרטי" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
        <Field label="שם משפחה" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
        <Field label="ת.ז." value={form.idNumber} onChange={(v) => setForm({ ...form, idNumber: v })} />
        <Field label="טלפון" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="חברה" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
        <div className="flex items-end">
          <Button type="submit" className="w-full">הוסף איש קשר</Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="חיפוש..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" onClick={() => exportContactsCsv(contacts, settings)}>
          ייצוא CSV
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
          <Upload /> ייבוא CSV
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם פרטי</TableHead>
              <TableHead>שם משפחה</TableHead>
              <TableHead>ת.ז.</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead>חברה</TableHead>
              <TableHead className="text-end">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="whitespace-nowrap">{c.firstName}</TableCell>
                <TableCell className="whitespace-nowrap">{c.lastName}</TableCell>
                <TableCell className="whitespace-nowrap font-mono">{c.idNumber}</TableCell>
                <TableCell className="whitespace-nowrap font-mono" dir="ltr">{c.phone}</TableCell>
                <TableCell className="whitespace-nowrap">{c.company}</TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                      <Pencil />
                    </Button>
                    <ConfirmDialog
                      title="למחוק איש קשר?"
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
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  אין אנשי קשר
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>עריכת איש קשר</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="שם פרטי" value={editing.firstName} onChange={(v) => setEditing({ ...editing, firstName: v })} />
              <Field label="שם משפחה" value={editing.lastName} onChange={(v) => setEditing({ ...editing, lastName: v })} />
              <Field label="ת.ז." value={editing.idNumber} onChange={(v) => setEditing({ ...editing, idNumber: v })} />
              <Field label="טלפון" value={editing.phone} onChange={(v) => setEditing({ ...editing, phone: v })} />
              <Field label="חברה" value={editing.company} onChange={(v) => setEditing({ ...editing, company: v })} className="sm:col-span-2" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>ביטול</Button>
            <Button onClick={saveEdit}>שמור</Button>
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