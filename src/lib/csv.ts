import { DEFAULT_CSV_COLUMNS } from "./defaults";
import { computeTotalMinutes, filenameDate, formatDate, formatTotal, todayISO } from "./time";
import { uid } from "./storage";
import type { AppSettings, Contact, CsvColumnKey, DriverReport } from "./types";

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

/** Parse a date string from various formats (dd/mm/yyyy, dd.mm.yyyy, yyyy-mm-dd) → YYYY-MM-DD */
function parseDate(v: string): string {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const dm = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(v);
  if (dm) return `${dm[3]}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}`;
  return v;
}

/** Import a CSV file (text content) as DriverReport records.
 *  Maps column headers to fields using both Hebrew and English variants.
 *  Returns the parsed records; caller is responsible for merging/saving.
 */
export function importReportsCsv(text: string): DriverReport[] {
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const delim = headerLine.includes("\t") ? "\t" : headerLine.includes(";") ? ";" : ",";
  const headers = parseCsvLine(headerLine, delim).map((h) => h.trim());

  // Map header text → CsvColumnKey
  const HEADER_MAP: Record<string, CsvColumnKey> = {
    "תאריך": "date", "date": "date",
    "שם פרטי": "firstName", "firstname": "firstName", "first name": "firstName",
    "שם משפחה": "lastName", "lastname": "lastName", "last name": "lastName",
    "תעודת זהות": "idNumber", "idnumber": "idNumber", "id": "idNumber", "ת.ז.": "idNumber",
    "טלפון": "phone", "phone": "phone",
    "מספר רכב": "carNumber", "carnumber": "carNumber", "car number": "carNumber", "plate": "carNumber",
    "שעת כניסה": "entryTime", "entrytime": "entryTime", "entry time": "entryTime", "כניסה": "entryTime",
    "שעת יציאה": "exitTime", "exittime": "exitTime", "exit time": "exitTime", "יציאה": "exitTime",
    "שם המאשר": "approverName", "approvername": "approverName", "approver": "approverName",
    "חברה": "company", "company": "company",
    "שם השומר": "guardName", "guardname": "guardName", "guard": "guardName",
  };

  const colMap: (CsvColumnKey | null)[] = headers.map((h) => HEADER_MAP[h.toLowerCase()] ?? HEADER_MAP[h] ?? null);

  const records: DriverReport[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i], delim);
    const get = (key: CsvColumnKey): string => {
      const idx = colMap.indexOf(key);
      return idx >= 0 ? (fields[idx] ?? "").trim() : "";
    };
    const date = parseDate(get("date"));
    const entryTime = get("entryTime");
    if (!date && !entryTime) continue;
    const exitRaw = get("exitTime");
    records.push({
      id: uid(),
      date: date || todayISO(),
      firstName: get("firstName"),
      lastName: get("lastName"),
      idNumber: get("idNumber"),
      phone: get("phone"),
      carNumber: get("carNumber"),
      entryTime: entryTime || "00:00",
      exitTime: exitRaw || null,
      approverName: get("approverName"),
      company: get("company"),
      guardName: get("guardName"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return records;
}

export function exportContactsCsv(  contacts: Contact[],
  s: AppSettings,
) {
  const delim = s.csvDelimiter;
  const includeBom = s.csvIncludeBom;
  const header = ["שם פרטי", "שם משפחה", "תעודת זהות", "טלפון", "חברה", "מספרי רכב"];
  const lines = [header.map((h) => escapeCell(h, delim)).join(delim)];
  for (const c of contacts) {
    lines.push(
      [
        c.firstName,
        c.lastName,
        c.idNumber,
        s.csvQuotePhone && c.phone ? `="${c.phone}"` : c.phone,
        c.company,
        c.carNumbers?.join("; ") ?? "",
      ]
        .map((v) => escapeCell(v, delim))
        .join(delim),
    );
  }
  const csv = (includeBom ? "\uFEFF" : "") + lines.join("\r\n");
  const name = filenameDate(s.contactsFilenamePattern || "contact_list_dd_mm_yyyy", todayISO());
  downloadCsv(name, csv);
}