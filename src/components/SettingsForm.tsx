import { useRef, useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/hooks/use-app-data";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { clearAll, exportAllJson, importAllJson } from "@/lib/storage";
import {
  checkOpenRouterKeyAvailability,
  clearTokenLog,
  loadTokenLog,
  totalTokensUsed,
  validateOpenRouterApiKey,
  type TokenLogEntry,
} from "@/lib/openrouter";
import { t } from "@/lib/i18n";
import type { AppSettings, AutocompleteField } from "@/lib/types";

const AUTOCOMPLETE_FIELD_OPTIONS: { key: AutocompleteField; label: string }[] = [
  { key: "firstName", label: "שם פרטי" },
  { key: "lastName", label: "שם משפחה" },
  { key: "idNumber", label: "ת.ז." },
  { key: "phone", label: "טלפון" },
  { key: "company", label: "חברה" },
];

const CONTACT_FIELD_OPTIONS = [
  { key: "firstName" as const, label: "שם פרטי" },
  { key: "lastName" as const, label: "שם משפחה" },
  { key: "idNumber" as const, label: "ת.ז." },
  { key: "phone" as const, label: "טלפון" },
  { key: "company" as const, label: "חברה" },
  { key: "carNumbers" as const, label: "מספרי רכב" },
];

export function SettingsForm() {
  const { settings, updateSettings } = useAppData();
  const [s, setS] = useState<AppSettings>(settings);
  const [keyStatus, setKeyStatus] = useState<string | null>(null);
  const [checkingKey, setCheckingKey] = useState(false);
  const [keyCheckingIndex, setKeyCheckingIndex] = useState<number | null>(null);
  const [addingKey, setAddingKey] = useState(false);
  const [newOpenRouterKey, setNewOpenRouterKey] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const lang = s.language;

  const rawOpenRouterKeys = (s.openRouterApiKeys ?? []).filter(Boolean);
  const visibleOpenRouterKeys = rawOpenRouterKeys.length
    ? rawOpenRouterKeys
    : s.openRouterApiKey
      ? [s.openRouterApiKey]
      : [];

  const syncOpenRouterKeys = (keys: string[]) => {
    const cleaned = keys.filter(Boolean);
    const existingTests = s.openRouterApiKeyTests ?? {};
    const nextTests = Object.fromEntries(
      cleaned
        .map((key) => [key, existingTests[key]])
        .filter(([, value]) => typeof value === "string"),
    );

    const nextSettings = {
      ...s,
      openRouterApiKeyTests: nextTests,
      openRouterApiKeys: cleaned,
      openRouterApiKey: "",
    };

    setS(nextSettings);
    updateSettings(nextSettings);
  };

  const setOpenRouterKey = (index: number, value: string) => {
    const next = [...visibleOpenRouterKeys];
    next[index] = value;
    syncOpenRouterKeys(next);
  };

  const removeOpenRouterKey = (index: number) => {
    const next = visibleOpenRouterKeys.filter((_, i) => i !== index);
    syncOpenRouterKeys(next);
  };

  const formatKeyTestAge = (timestamp?: string) => {
    if (!timestamp) return "";
    const diff = Date.now() - Date.parse(timestamp);
    if (Number.isNaN(diff) || diff < 0) return "";

    const minutes = Math.round(diff / 60000);
    if (minutes < 1) return lang === "he" ? "נבדק עכשיו" : "Tested just now";
    if (minutes < 60) {
      return lang === "he" ? `נבדק לפני ${minutes} דקות` : `Tested ${minutes} minutes ago`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return lang === "he" ? `נבדק לפני ${hours} שעות` : `Tested ${hours} hours ago`;
    }

    const days = Math.round(hours / 24);
    return lang === "he" ? `נבדק לפני ${days} ימים` : `Tested ${days} days ago`;
  };

  const checkOpenRouterKey = async (key: string, index: number) => {
    const apiKey = key.trim();
    if (!apiKey) return;

    setKeyCheckingIndex(index);
    setKeyStatus(null);
    const now = new Date().toISOString();
    const nextSettings = {
      ...s,
      openRouterApiKeyTests: {
        ...(s.openRouterApiKeyTests ?? {}),
        [apiKey]: now,
      },
    };

    try {
      const url = `${s.openRouterBaseUrl.replace(/\/+$/, "")}`;
      await validateOpenRouterApiKey(url, apiKey, s.openRouterModel);
      setS(nextSettings);
      updateSettings(nextSettings);
      toast.success(t("keyStatusAvailable", lang));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("keyCheckError", lang);
      setS(nextSettings);
      updateSettings(nextSettings);
      toast.error(message);
    } finally {
      setKeyCheckingIndex(null);
    }
  };

  const addNewOpenRouterKey = async () => {
    const key = newOpenRouterKey.trim();
    if (!key) {
      toast.error(t("openRouterKeyRequired", lang));
      return;
    }

    setAddingKey(true);
    setKeyStatus(null);
    try {
      const url = `${s.openRouterBaseUrl.replace(/\/+$/, "")}`;
      await validateOpenRouterApiKey(url, key, s.openRouterModel);
      syncOpenRouterKeys([...visibleOpenRouterKeys, key]);
      setNewOpenRouterKey("");
      setKeyStatus(t("keyStatusAvailable", s.language));
      toast.success(t("keyStatusAvailable", s.language));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("keyCheckError", s.language);
      setKeyStatus(`${t("keyStatusUnavailable", s.language)}: ${message}`);
      toast.error(message);
    } finally {
      setAddingKey(false);
    }
  };

  useEffect(() => {
    setS(settings);
  }, [settings]);

  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const save = () => {
    updateSettings(s);
    toast.success(t("settingsSaved", lang));
  };

  const reset = () => {
    if (!confirm(t("confirmResetSettings", lang))) return;
    setS(DEFAULT_SETTINGS);
    updateSettings(DEFAULT_SETTINGS);
    toast.success(t("resetSettingsSuccess", lang));
  };

  const exportData = () => {
    const blob = new Blob([exportAllJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "driver-report-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (file: File) => {
    try {
      importAllJson(await file.text());
      toast.success(t("importSuccessRefresh", lang));
      setTimeout(() => location.reload(), 500);
    } catch {
      toast.error(t("invalidImportFile", lang));
    }
  };

  const checkKeyAvailability = async () => {
    if (!s.openRouterApiKey && !s.openRouterApiKeys?.filter(Boolean).length) {
      toast.error(t("openRouterKeyRequired", lang));
      return;
    }

    setCheckingKey(true);
    setKeyStatus(null);
    try {
      await checkOpenRouterKeyAvailability(s);
      const nextSettings = { ...s };
      updateSettings(nextSettings);
      setKeyStatus(t("keyStatusAvailable", s.language));
      toast.success(t("keyStatusAvailable", s.language));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("keyCheckError", s.language);
      setKeyStatus(`${t("keyStatusUnavailable", s.language)}: ${message}`);
      toast.error(message);
    } finally {
      setCheckingKey(false);
    }
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["general", "retention"]}>
        <AccordionItem value="general">
          <AccordionTrigger>כללי</AccordionTrigger>
          <AccordionContent className="grid gap-4 sm:grid-cols-2">
            <Field label="פורמט תאריך">
              <Select
                value={s.dateFormat}
                onValueChange={(v) => set("dateFormat", v as AppSettings["dateFormat"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/mm/yyyy">dd/mm/yyyy</SelectItem>
                  <SelectItem value="dd.mm.yyyy">dd.mm.yyyy</SelectItem>
                  <SelectItem value="yyyy-mm-dd">yyyy-mm-dd</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="כיוון">
              <Select
                value={s.direction}
                onValueChange={(v) => set("direction", v as "rtl" | "ltr")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rtl">RTL (עברית)</SelectItem>
                  <SelectItem value="ltr">LTR</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="שפה">
              <Select
                value={s.language}
                onValueChange={(v) => {
                  const language = v as AppSettings["language"];
                  const direction: AppSettings["direction"] = language === "en" ? "ltr" : "rtl";
                  const nextSettings = { ...s, language, direction };
                  setS(nextSettings);
                  updateSettings(nextSettings);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="ערכת נושא">
              <Select
                value={s.theme}
                onValueChange={(v) => set("theme", v as AppSettings["theme"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">בהיר</SelectItem>
                  <SelectItem value="dark">כהה</SelectItem>
                  <SelectItem value="blue">כחול</SelectItem>
                  <SelectItem value="green">ירוק</SelectItem>
                  <SelectItem value="warm">חם</SelectItem>
                  <SelectItem value="system">מערכת</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Toggle
              label="הצג כפתור דיבאג בכותרת"
              checked={s.showDebugToggle}
              onCheckedChange={(v) => set("showDebugToggle", v)}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="retention">
          <AccordionTrigger>שמירה וניקוי</AccordionTrigger>
          <AccordionContent className="grid gap-4 sm:grid-cols-2">
            <NumField
              label="ימי שמירה"
              value={s.retentionDays}
              onChange={(n) => set("retentionDays", n)}
            />
            <NumField
              label="שעות שמירת תמונה"
              value={s.imageRetentionHours}
              onChange={(n) => set("imageRetentionHours", n)}
            />
            <Toggle
              label="לעולם אל תמחק רשומות פתוחות"
              checked={s.keepOpenEntriesForever}
              onCheckedChange={(v) => set("keepOpenEntriesForever", v)}
            />
            <Toggle
              label="נקה אוטומטית בטעינה"
              checked={s.purgeOnAppLoad}
              onCheckedChange={(v) => set("purgeOnAppLoad", v)}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="entry">
          <AccordionTrigger>ברירות מחדל לטופס</AccordionTrigger>
          <AccordionContent className="grid gap-4 sm:grid-cols-2">
            <Toggle
              label="מילוי אוטומטי של תאריך"
              checked={s.autoFillDate}
              onCheckedChange={(v) => set("autoFillDate", v)}
            />
            <Toggle
              label="מילוי אוטומטי של שעת כניסה"
              checked={s.autoFillEntryTime}
              onCheckedChange={(v) => set("autoFillEntryTime", v)}
            />
            <Field label="חברה ברירת מחדל">
              <Input
                value={s.defaultCompany}
                onChange={(e) => set("defaultCompany", e.target.value)}
              />
            </Field>
            <Field label="מאשר ברירת מחדל">
              <Input
                value={s.defaultApprover}
                onChange={(e) => set("defaultApprover", e.target.value)}
              />
            </Field>
            <Field label="שומר ברירת מחדל">
              <Input value={s.defaultGuard} onChange={(e) => set("defaultGuard", e.target.value)} />
            </Field>
            <Field label="עיגול שעות (דקות)">
              <Select
                value={String(s.roundTimesToMinutes)}
                onValueChange={(v) => set("roundTimesToMinutes", Number(v) as 1 | 5 | 15)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Toggle
              label="אפשר חציית חצות"
              checked={s.allowOvernight}
              onCheckedChange={(v) => set("allowOvernight", v)}
            />
            <Toggle
              label="תווית חי בפנים"
              checked={s.liveOnSiteBadge}
              onCheckedChange={(v) => set("liveOnSiteBadge", v)}
            />
            <Toggle
              label="חובה: מאשר"
              checked={s.requireApprover}
              onCheckedChange={(v) => set("requireApprover", v)}
            />
            <Toggle
              label="חובה: שומר"
              checked={s.requireGuard}
              onCheckedChange={(v) => set("requireGuard", v)}
            />
            <Toggle
              label="חובה: מספר רכב"
              checked={s.requireCarNumber}
              onCheckedChange={(v) => set("requireCarNumber", v)}
            />
            <Toggle
              label="חובה: טלפון"
              checked={s.requirePhone}
              onCheckedChange={(v) => set("requirePhone", v)}
            />
            <Toggle
              label="חובה: ת.ז."
              checked={s.requireIdNumber}
              onCheckedChange={(v) => set("requireIdNumber", v)}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="validation">
          <AccordionTrigger>ולידציה</AccordionTrigger>
          <AccordionContent className="grid gap-4 sm:grid-cols-2">
            <NumField
              label="אורך טלפון מינ׳"
              value={s.phoneMinLength}
              onChange={(n) => set("phoneMinLength", n)}
            />
            <NumField
              label="אורך טלפון מקס׳"
              value={s.phoneMaxLength}
              onChange={(n) => set("phoneMaxLength", n)}
            />
            <Field label="תחיליות טלפון מותרות (פסיק)">
              <Input
                value={s.phoneAllowedPrefixes}
                onChange={(e) => set("phoneAllowedPrefixes", e.target.value)}
              />
            </Field>
            <NumField
              label="אורך ת.ז."
              value={s.idNumberLength}
              onChange={(n) => set("idNumberLength", n)}
            />
            <Toggle
              label="בדיקת ת.ז. ישראלית"
              checked={s.validateIsraeliId}
              onCheckedChange={(v) => set("validateIsraeliId", v)}
            />
            <NumField
              label="מספר רכב מינ׳"
              value={s.carNumberMinLength}
              onChange={(n) => set("carNumberMinLength", n)}
            />
            <NumField
              label="מספר רכב מקס׳"
              value={s.carNumberMaxLength}
              onChange={(n) => set("carNumberMaxLength", n)}
            />
            <Field label="רגקס תווים מותרים ברכב">
              <Input
                value={s.carNumberAllowedChars}
                onChange={(e) => set("carNumberAllowedChars", e.target.value)}
              />
            </Field>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="autocomplete">
          <AccordionTrigger>השלמה אוטומטית</AccordionTrigger>
          <AccordionContent className="grid gap-4 sm:grid-cols-2">
            <Toggle
              label="הפעל השלמה"
              checked={s.autocompleteEnabled}
              onCheckedChange={(v) => set("autocompleteEnabled", v)}
            />
            <Toggle
              label="מילוי שדות עמיתים אחרי בחירה"
              checked={s.autoFillOnSelect}
              onCheckedChange={(v) => set("autoFillOnSelect", v)}
            />
            <NumField
              label="מינ׳ תווים"
              value={s.autocompleteMinChars}
              onChange={(n) => set("autocompleteMinChars", n)}
            />
            <NumField
              label="מקס׳ הצעות"
              value={s.autocompleteMaxSuggestions}
              onChange={(n) => set("autocompleteMaxSuggestions", n)}
            />
            <Field label="אופן ההתאמה">
              <Select
                value={s.matchMode}
                onValueChange={(v) => set("matchMode", v as "prefix" | "substring")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="substring">מכיל</SelectItem>
                  <SelectItem value="prefix">תחילי</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Toggle
              label="רגיש לרישיות"
              checked={s.caseSensitive}
              onCheckedChange={(v) => set("caseSensitive", v)}
            />
            <div className="sm:col-span-2">
              <Label className="mb-2 block">שדות עם השלמה</Label>
              <div className="flex flex-wrap gap-3">
                {AUTOCOMPLETE_FIELD_OPTIONS.map((opt) => {
                  const checked = s.autocompleteFields.includes(opt.key);
                  return (
                    <label key={opt.key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const on = v === true;
                          const next = on
                            ? [...s.autocompleteFields, opt.key]
                            : s.autocompleteFields.filter((f) => f !== opt.key);
                          set("autocompleteFields", next);
                        }}
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="contacts">
          <AccordionTrigger>עדכון אנשי קשר אוטומטי</AccordionTrigger>
          <AccordionContent className="grid gap-4 sm:grid-cols-2">
            <Toggle
              label="עדכן אנשי קשר בעת שמירה"
              checked={s.autoUpdateContactsOnSave}
              onCheckedChange={(v) => set("autoUpdateContactsOnSave", v)}
            />
            <Toggle
              label="אשר לפני דריסה"
              checked={s.confirmBeforeContactOverwrite}
              onCheckedChange={(v) => set("confirmBeforeContactOverwrite", v)}
            />
            <Field label="מפתח זיהוי איש קשר">
              <Select
                value={s.contactUpsertKey}
                onValueChange={(v) => set("contactUpsertKey", v as AppSettings["contactUpsertKey"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idNumber">ת.ז.</SelectItem>
                  <SelectItem value="phone">טלפון</SelectItem>
                  <SelectItem value="name+company">שם + חברה</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Label className="mb-2 block">שדות שיישמרו לאנשי קשר</Label>
              <div className="flex flex-wrap gap-3">
                {CONTACT_FIELD_OPTIONS.map((opt) => {
                  const checked = s.contactFields.includes(opt.key);
                  return (
                    <label key={opt.key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const on = v === true;
                          const next = on
                            ? [...s.contactFields, opt.key]
                            : s.contactFields.filter((f) => f !== opt.key);
                          set("contactFields", next);
                        }}
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="csv">
          <AccordionTrigger>ייצוא CSV</AccordionTrigger>
          <AccordionContent className="grid gap-4 sm:grid-cols-2">
            <Field label="תבנית שם קובץ">
              <Input
                value={s.csvFilenamePattern}
                onChange={(e) => set("csvFilenamePattern", e.target.value)}
              />
            </Field>
            <Field label="תבנית שם קובץ אנשי קשר">
              <Input
                value={s.contactsFilenamePattern}
                onChange={(e) => set("contactsFilenamePattern", e.target.value)}
              />
            </Field>
            <Field label="מפריד">
              <Select
                value={s.csvDelimiter}
                onValueChange={(v) => set("csvDelimiter", v as "," | ";" | "\t")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">פסיק ,</SelectItem>
                  <SelectItem value=";">נקודה-פסיק ;</SelectItem>
                  <SelectItem value={"\t"}>טאב</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Toggle
              label="כלול BOM (UTF-8 ל-Excel)"
              checked={s.csvIncludeBom}
              onCheckedChange={(v) => set("csvIncludeBom", v)}
            />
            <Toggle
              label="שמור 0 מוביל בטלפון"
              checked={s.csvQuotePhone}
              onCheckedChange={(v) => set("csvQuotePhone", v)}
            />
            <Toggle
              label="כלול רשומות פתוחות"
              checked={s.csvIncludeOpenEntries}
              onCheckedChange={(v) => set("csvIncludeOpenEntries", v)}
            />
            <div className="sm:col-span-2">
              <Label className="mb-2 block">עמודות (סדר וכותרות)</Label>
              <div className="space-y-2">
                {s.csvColumns.map((col, idx) => (
                  <div key={col.key} className="flex items-center gap-2">
                    <Checkbox
                      checked={col.enabled}
                      onCheckedChange={(v) => {
                        const next = [...s.csvColumns];
                        next[idx] = { ...col, enabled: v === true };
                        set("csvColumns", next);
                      }}
                    />
                    <Input
                      value={col.header}
                      onChange={(e) => {
                        const next = [...s.csvColumns];
                        next[idx] = { ...col, header: e.target.value };
                        set("csvColumns", next);
                      }}
                    />
                    <span className="text-xs text-muted-foreground w-24 text-end">{col.key}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          const next = [...s.csvColumns];
                          [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                          set("csvColumns", next);
                        }}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        disabled={idx === s.csvColumns.length - 1}
                        onClick={() => {
                          const next = [...s.csvColumns];
                          [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                          set("csvColumns", next);
                        }}
                      >
                        ↓
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ocr">
          <AccordionTrigger>זיהוי לוחית רכב (OpenRouter)</AccordionTrigger>
          <AccordionContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label>מפתחות OpenRouter</Label>
              <p className="text-xs text-muted-foreground">
                הזן אחד או יותר מפתחות API כאן. המפתחות ישמשו ברוטציה אוטומטית.
              </p>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <Input
                    value={newOpenRouterKey}
                    placeholder="מפתח חדש — sk-or-..."
                    onChange={(e) => {
                      setNewOpenRouterKey(e.target.value);
                      if (keyStatus) setKeyStatus(null);
                    }}
                    className="flex-1 font-mono text-xs"
                    dir="ltr"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addNewOpenRouterKey}
                    disabled={addingKey || !newOpenRouterKey.trim()}
                  >
                    {addingKey ? t("checkingKey", lang) : t("addKey", lang)}
                  </Button>
                </div>
                {visibleOpenRouterKeys.length > 0 && (
                  <div className="space-y-2">
                    {visibleOpenRouterKeys.map((key, idx) => {
                      const lastTested = s.openRouterApiKeyTests?.[key];
                      const checking = keyCheckingIndex === idx;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex gap-2 items-center">
                            <Input
                              value={key}
                              placeholder={`מפתח ${idx + 1} — sk-or-...`}
                              onChange={(e) => setOpenRouterKey(idx, e.target.value)}
                              className="flex-1 font-mono text-xs"
                              dir="ltr"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => checkOpenRouterKey(key, idx)}
                              disabled={checking || !key.trim()}
                            >
                              {checking ? t("checkingKey", lang) : t("checkKey", lang)}
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="shrink-0 text-destructive hover:text-destructive"
                              onClick={() => removeOpenRouterKey(idx)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                          {lastTested ? (
                            <p className="text-xs text-muted-foreground">
                              {formatKeyTestAge(lastTested)}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open("https://openrouter.ai/workspaces/default/keys", "_blank")
                  }
                >
                  {t("generateNewKey", lang)}
                </Button>
              </div>
              {keyStatus && <p className="mt-2 text-xs text-muted-foreground">{keyStatus}</p>}
            </div>

            <Field label="Base URL">
              <Input
                value={s.openRouterBaseUrl}
                onChange={(e) => set("openRouterBaseUrl", e.target.value)}
                dir="ltr"
              />
            </Field>
            <Field label="מודל">
              <Input
                value={s.openRouterModel}
                onChange={(e) => set("openRouterModel", e.target.value)}
                dir="ltr"
              />
            </Field>
            <Field label="פרומפט" className="sm:col-span-2">
              <Textarea
                value={s.ocrPrompt}
                onChange={(e) => set("ocrPrompt", e.target.value)}
                rows={3}
              />
            </Field>
            <NumField
              label="גודל תמונה מקס׳ (MB)"
              value={s.ocrMaxImageSizeMB}
              onChange={(n) => set("ocrMaxImageSizeMB", n)}
            />
            <Toggle
              label="מלא מספר רכב אוטומטית"
              checked={s.ocrAutoFillCarNumber}
              onCheckedChange={(v) => set("ocrAutoFillCarNumber", v)}
            />
            <Toggle
              label="חייב אישור משתמש"
              checked={s.ocrRequireConfirmation}
              onCheckedChange={(v) => set("ocrRequireConfirmation", v)}
            />

            <Field label={t("paperOcrColumns", lang)} className="sm:col-span-2">
              <div className="space-y-2">
                {(s.paperOcrColumns ?? []).map((col, idx) => (
                  <Input
                    key={idx}
                    value={col}
                    onChange={(e) => {
                      const next = [...(s.paperOcrColumns ?? [])];
                      next[idx] = e.target.value;
                      set("paperOcrColumns", next);
                    }}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t("paperOcrColumnsHint", lang)}</p>
            </Field>
            <Field label={t("paperPhoneSeparator", lang)}>
              <Input
                value={s.paperPhoneSeparator}
                onChange={(e) => set("paperPhoneSeparator", e.target.value)}
                dir="ltr"
              />
            </Field>
            <Field label={t("paperOcrPrompt", lang)} className="sm:col-span-2">
              <Textarea
                value={s.paperOcrPrompt}
                onChange={(e) => set("paperOcrPrompt", e.target.value)}
                rows={4}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t("paperOcrPromptHint", lang)}</p>
            </Field>

            <div className="sm:col-span-2">
              <TokenUsageWidget />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="storage">
          <AccordionTrigger>אחסון וגיבוי</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <Field label="Namespace (לאחסון מבודד)">
              <Input
                value={s.storageNamespace}
                onChange={(e) => set("storageNamespace", e.target.value)}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportData}>
                ייצוא JSON מלא
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void importData(f);
                  if (fileRef.current) fileRef.current.value = "";
                }}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                ייבוא JSON
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("למחוק את כל הנתונים?")) {
                    clearAll();
                    location.reload();
                  }
                }}
              >
                מחק את כל הנתונים
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background pt-3">
        <Button variant="outline" onClick={reset}>
          {t("resetDefaults", lang)}
        </Button>
        <Button onClick={save}>{t("saveSettings", lang)}</Button>
      </div>
    </div>
  );
}

function TokenUsageWidget() {
  const { settings } = useAppData();
  const lang = settings.language;
  const [log, setLog] = useState<TokenLogEntry[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setLog(loadTokenLog());
      setTotal(totalTokensUsed());
    };
    refresh();
  }, []);

  const handleClear = () => {
    clearTokenLog();
    setLog([]);
    setTotal(0);
    toast.success(t("tokenLogCleared", lang));
  };

  return (
    <div className="rounded border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t("tokenUsage", lang)}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t("totalTokens", lang)}: {total.toLocaleString()}
          </span>
          <Button variant="outline" size="sm" onClick={handleClear} disabled={log.length === 0}>
            {t("clearLog", lang)}
          </Button>
        </div>
      </div>
      {log.length === 0 ? (
        <p className="text-xs text-muted-foreground">אין נתוני שימוש</p>
      ) : (
        <div className="max-h-40 overflow-y-auto space-y-1">
          {log.slice(0, 20).map((e, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {new Date(e.at).toLocaleString("he-IL")}
              </span>
              <span className="font-mono">
                {e.prompt_tokens}+{e.completion_tokens}={e.total_tokens}
              </span>
            </div>
          ))}
          {log.length > 20 && (
            <p className="text-xs text-muted-foreground text-center">
              ועוד {log.length - 20} רשומות...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <Field label={label}>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </Field>
  );
}
function Toggle({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded border p-3">
      <Label className="cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
