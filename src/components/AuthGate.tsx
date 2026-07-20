import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasPassword, isUnlocked, setPassword, unlock } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { AppSettings } from "@/lib/types";

export function AuthGate({
  settings,
  children,
}: {
  settings: AppSettings;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pwSet, setPwSet] = useState(false);
  const lang = settings.language;

  useEffect(() => {
    const sync = () => {
      setPwSet(hasPassword());
      setUnlocked(isUnlocked());
    };
    sync();
    setReady(true);
    window.addEventListener("auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!ready) return null;

  // Gate disabled by config → pass through
  if (!settings.requirePassword) return <>{children}</>;
  // No password set → let user in, they'll be prompted in Settings
  if (!pwSet) return <>{children}</>;
  if (unlocked) return <>{children}</>;

  return <LoginScreen lang={lang} />;

  function LoginScreen({ lang }: { lang: "he" | "en" }) {
    const [pw, setPw] = useState("");
    const [busy, setBusy] = useState(false);
    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      const ok = await unlock(pw);
      setBusy(false);
      if (!ok) toast.error(t("wrongPassword", lang));
      setPw("");
    };
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background px-4"
        dir={settings.direction}
      >
        <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-bold">{t("loginTitle", lang)}</h1>
          <p className="text-sm text-muted-foreground">{t("loginHint", lang)}</p>
          <div className="space-y-1.5">
            <Label>{t("password", lang)}</Label>
            <Input
              type="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy || !pw}>
            {t("unlock", lang)}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {t("guestFlowHint", lang)}{" "}
            <a href="/guest" className="underline text-primary">
              /guest
            </a>
          </p>
        </form>
      </div>
    );
  }
}

// One-shot helper for setting the initial password from the Settings screen.
export async function setInitialPassword(pw: string) {
  await setPassword(pw);
}