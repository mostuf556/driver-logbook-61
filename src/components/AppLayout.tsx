import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bug, ExternalLink, Globe, KeyRound, Loader2, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAppData } from "@/hooks/use-app-data";
import { useDebugMode, setDebugFlag } from "@/hooks/use-debug-mode";
import { useOpenRouterKeyStatus } from "@/hooks/use-openrouter-key-status";
import { useTheme } from "@/hooks/use-theme";
import { installErrorListeners } from "@/lib/error-log";
import { t } from "@/lib/i18n";
import type { KeyStatusInfo } from "@/hooks/use-openrouter-key-status";

function KeyStatusIcon({ info }: { info: KeyStatusInfo }) {
  if (info.status === "checking") {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }
  // Green only when more than one key is valid; otherwise red.
  const color =
    info.validCount > 0
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  return <KeyRound className={`size-4 ${color}`} />;
}

function keyStatusTooltip(info: KeyStatusInfo, language: "he" | "en"): string {
  if (info.status === "checking") return t("keyStatus_checking", language);
  if (info.totalCount === 0) return t("keyStatus_missing", language);
  const template = t("keyStatusCount", language);
  return template
    .replace("{valid}", String(info.validCount))
    .replace("{total}", String(info.totalCount));
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useAppData();
  useTheme(settings.theme);
  const debug = useDebugMode();
  const keyInfo = useOpenRouterKeyStatus(settings);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = [
    { to: "/home", label: t("navEntries", settings.language) },
    { to: "/contacts", label: t("navContacts", settings.language) },
    { to: "/logs", label: t("navLogs", settings.language) },
    { to: "/settings", label: t("navSettings", settings.language) },
  ] as const;

  useEffect(() => {
    installErrorListeners();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (debug && !window.location.hash.toLowerCase().includes("debug")) {
      history.replaceState(null, "", window.location.pathname + window.location.search + "#debug");
    }
  }, [debug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.direction;
  }, [settings.direction, settings.language]);

  // Close mobile menu on navigate
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground" dir={settings.direction}>
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto flex h-14 items-center justify-between gap-2 px-4">
          {/* Logo */}
          <Link
            to="/home"
            className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground hover:text-primary transition-colors shrink-0"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold select-none">
              נ
            </span>
            <span className="hidden sm:inline">{t("title", settings.language)}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 text-sm">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/settings"
                    aria-label={keyStatusTooltip(keyInfo, settings.language)}
                    className="ms-1 inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent/60"
                  >
                    <KeyStatusIcon info={keyInfo} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>{keyStatusTooltip(keyInfo, settings.language)}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="ghost"
              size="icon"
              aria-label={t("toggleLanguage", settings.language)}
              className="ms-1"
              onClick={() => {
                const nextLanguage = settings.language === "he" ? "en" : "he";
                updateSettings({
                  ...settings,
                  language: nextLanguage,
                  direction: nextLanguage === "en" ? "ltr" : "rtl",
                });
              }}
            >
              <Globe />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("reportBug", settings.language)}
              className="ms-1"
              onClick={() =>
                window.open("https://github.com/mostuf556/driver-logbook-61/issues", "_blank")
              }
            >
              <ExternalLink />
            </Button>
            {(settings.showDebugToggle || debug) && (
              <Button
                variant={debug ? "default" : "ghost"}
                size="icon"
                aria-label={t("debug", settings.language)}
                className="ms-1"
                onClick={() => setDebugFlag(!debug)}
              >
                <Bug />
              </Button>
            )}
            <div className="ms-1 border-r h-5 border-border" />
            <ThemeSwitcher />
          </nav>

          {/* Mobile: theme + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <Link
              to="/settings"
              aria-label={keyStatusTooltip(keyInfo, settings.language)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent/60"
            >
              <KeyStatusIcon info={keyInfo} />
            </Link>
            <ThemeSwitcher />
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("navMenu", settings.language)}
              onClick={() => setMobileMenuOpen((o) => !o)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-card/98 backdrop-blur-sm">
            <nav className="container mx-auto flex flex-col px-4 py-2 gap-0.5">
              {navItems.map((item) => (
                <MobileNavLink key={item.to} to={item.to} onSelect={() => setMobileMenuOpen(false)}>
                  {item.label}
                </MobileNavLink>
              ))}
              <button
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors text-start"
                onClick={() => {
                  const nextLanguage = settings.language === "he" ? "en" : "he";
                  updateSettings({
                    ...settings,
                    language: nextLanguage,
                    direction: nextLanguage === "en" ? "ltr" : "rtl",
                  });
                  setMobileMenuOpen(false);
                }}
              >
                <Globe className="size-4" />
                {settings.language === "he" ? "English" : "עברית"}
              </button>
              <button
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors text-start"
                onClick={() => {
                  window.open("https://github.com/mostuf556/driver-logbook-61/issues", "_blank");
                  setMobileMenuOpen(false);
                }}
              >
                <ExternalLink className="size-4" />
                {t("reportBug", settings.language)}
              </button>
              {(settings.showDebugToggle || debug) && (
                <button
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors text-start"
                  onClick={() => {
                    setDebugFlag(!debug);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Bug className="size-4" />
                  {debug ? t("debugOff", settings.language) : t("debug", settings.language)}
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-6">{children}</main>
      <Toaster position="top-center" richColors />
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <Link
      to={to}
      className={[
        "relative rounded-md px-3 py-1.5 font-medium transition-colors",
        isActive
          ? "text-foreground bg-accent"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
      ].join(" ")}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-[3px] h-0.5 w-4 rounded-full bg-primary" />
      )}
    </Link>
  );
}

function MobileNavLink({
  to,
  children,
  onSelect,
}: {
  to: string;
  children: ReactNode;
  onSelect: () => void;
}) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <Link
      to={to}
      onClick={onSelect}
      className={[
        "rounded-md px-3 py-2.5 text-sm font-medium transition-colors block",
        isActive
          ? "text-foreground bg-accent"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
