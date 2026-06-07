import { Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { exportContactsCsv } from "@/lib/csv";
import { uid } from "@/lib/storage";
import type { Contact } from "@/lib/types";

export function ContactsManager() {
  const { contacts, updateContacts, settings } = useAppData();
  const [form, setForm] = useState<Contact>({
    id: "",
    driverName: "",
    idNumber: "",
    phone: "",
    company: "",
  });
  const [filter, setFilter] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.driverName && !form.idNumber) {
      toast.error("נדרש שם או ת.ז.");
      return;
    }
    updateContacts([{ ...form, id: uid() }, ...contacts]);
    setForm({ id: "", driverName: "", idNumber: "", phone: "", company: "" });
    toast.success("נוסף");
  };

  const remove = (id: string) => {
    updateContacts(contacts.filter((c) => c.id !== id));
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const clean = text.replace(/^\uFEFF/, "");
    const lines = clean.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return;
    // skip header if it includes Hebrew column names
    const start = /שם הנהג|driverName/i.test(lines[0]) ? 1 : 0;
    const added: Contact[] = [];
    for (let i = start; i < lines.length; i++) {
      const cols = lines[i].split(/[,\t;]/).map((c) => c.replace(/^="?|"?$/g, "").trim());
      const [driverName = "", idNumber = "", phone = "", company = ""] = cols;
      if (!driverName && !idNumber) continue;
      added.push({ id: uid(), driverName, idNumber, phone, company });
    }
    updateContacts([...added, ...contacts]);
    toast.success(`יובאו ${added.length} אנשי קשר`);
  };

  const filtered = contacts.filter((c) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return [c.driverName, c.idNumber, c.phone, c.company]
      .some((v) => (v || "").toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-5">
        <div className="space-y-1">
          <Label>שם הנהג</Label>
          <Input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>ת.ז.</Label>
          <Input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>טלפון</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>חברה</Label>
          <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full">הוסף</Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="חיפוש..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <Button
          variant="outline"
          onClick={() => exportContactsCsv(contacts, settings.csvDelimiter, settings.csvIncludeBom)}
        >
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

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם הנהג</TableHead>
              <TableHead>ת.ז.</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead>חברה</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.driverName}</TableCell>
                <TableCell>{c.idNumber}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.company}</TableCell>
                <TableCell className="text-end">
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  אין אנשי קשר
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}