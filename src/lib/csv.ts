import { DEFAULT_CSV_COLUMNS } from "./defaults";
import { computeTotalMinutes, filenameDate, formatDate, formatTotal, todayISO } from "./time";
import type { AppSettings, CsvColumnKey, DriverReport } from "./types";

/** Parse one CSV line respecting quoted fields and Excel ="value" formula syntax. */
export function parseCsvLine(line: string, delim: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (line.startsWith(delim, i)) {
      fields.push(unExcelQuote(cur));
      cur = "";
      i += delim.length - 1;
    } else {
      cur += ch;
    }
  }
  fields.push(unExcelQuote(cur));
  return fields;
}

/** Strip Excel ="value" formula wrapper if present. */
function unExcelQuote(v: string): string {
  const t = v.trim();
  if (t.startsWith('="') && t.endsWith('"')) return t.slice(2, -1);
  return t;
}

function cellValue(r: DriverReport, key: CsvColumnKey, s: AppSettings): string {
  switch (key) {
    case "date":
      return formatDate(r.date, s.dateFormat);
    case "firstName":
      return r.firstName;
    case "lastName":
      return r.lastName;
    case "idNumber":
      return r.idNumber;
    case "phone":
      return r.phone;
    case "carNumber":
      return r.carNumber;
    case "entryTime":
      return r.entryTime;
    case "exitTime":
      return r.exitTime || "";
    case "totalTime":
      return formatTotal(computeTotalMinutes(r.entryTime, r.exitTime, s.allowOvernight));
    case "approverName":
      return r.approverName;
    case "company":
      return r.company;
    case "guardName":
      return r.guardName;
  }
  return "";
}

function escapeCell(v: string, delim: string): string {
  const needsQuote = v.includes(delim) || v.includes('"') || v.includes("\n") || v.includes("\r");
  if (needsQuote) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function buildCsv(reports: DriverReport[], s: AppSettings): string {
  const cols = (s.csvColumns?.length ? s.csvColumns : DEFAULT_CSV_COLUMNS).filter((c) => c.enabled);
  const delim = s.csvDelimiter;
  const lines: string[] = [];
  lines.push(cols.map((c) => escapeCell(c.header, delim)).join(delim));
  for (const r of reports) {
    const row = cols.map((c) => {
      let v = cellValue(r, c.key, s);
      if (c.key === "phone" && s.csvQuotePhone && v) v = `="${v}"`;
      return escapeCell(v, delim);
    });
    lines.push(row.join(delim));
  }
  const content = lines.join("\r\n");
  return s.csvIncludeBom ? "\uFEFF" + content : content;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportReportsForDate(reports: DriverReport[], s: AppSettings, dateIso?: string) {
  const d = dateIso || todayISO();
  const filtered = reports.filter((r) => {
    if (r.date !== d) return false;
    if (!s.csvIncludeOpenEntries && !r.exitTime) return false;
    return true;
  });
  const csv = buildCsv(filtered, s);
  const name = filenameDate(s.csvFilenamePattern, d);
  downloadCsv(name, csv);
  return filtered.length;
}

export function exportAllReports(reports: DriverReport[], s: AppSettings) {
  const list = s.csvIncludeOpenEntries ? reports : reports.filter((r) => r.exitTime);
  const csv = buildCsv(list, s);
  const name = `${filenameDate(s.csvFilenamePattern, todayISO())}_all`;
  downloadCsv(name, csv);
  return list.length;
}

export function exportContactsCsv(
  contacts: { firstName: string; lastName: string; idNumber: string; phone: string; company: string }[],
  s: AppSettings,
) {
  const delim = s.csvDelimiter;
  const includeBom = s.csvIncludeBom;
  const header = ["שם פרטי", "שם משפחה", "תעודת זהות", "טלפון", "חברה"];
  const lines = [header.map((h) => escapeCell(h, delim)).join(delim)];
  for (const c of contacts) {
    lines.push(
      [
        c.firstName,
        c.lastName,
        c.idNumber,
        s.csvQuotePhone && c.phone ? `="${c.phone}"` : c.phone,
        c.company,
      ]
        .map((v) => escapeCell(v, delim))
        .join(delim),
    );
  }
  const csv = (includeBom ? "\uFEFF" : "") + lines.join("\r\n");
  const name = filenameDate(s.contactsFilenamePattern || "contact_list_dd_mm_yyyy", todayISO());
  downloadCsv(name, csv);
}