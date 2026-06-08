import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bug, ExternalLink, Globe, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAppData } from "@/hooks/use-app-data";
import { useDebugMode, setDebugFlag } from "@/hooks/use-debug-mode";
import { useTheme } from "@/hooks/use-theme";
import { installErrorListeners } from "@/lib/error-log";

const NAV_ITEMS = [
  { to: "/home", label: "כניסות" },
  { to: "/contacts", label: "אנשי קשר" },
  { to: "/logs", label: "לוגים" },
  { to: "/settings", label: "הגדרות" },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useAppData();
  useTheme(settings.theme);
  const debug = useDebugMode();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    document.documentElement.lang = settings.direction === "rtl" ? "he" : "en";
    document.documentElement.dir = settings.direction;
  }, [settings.direction]);

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
            <span className="hidden sm:inline">דוח נהגים</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 text-sm">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
            ))}

            <Button
              variant="ghost"
              size="icon"
              aria-label={settings.direction === "rtl" ? "Switch to English" : "Switch to Hebrew"}
              className="ms-1"
              onClick={() => updateSettings({ ...settings, direction: settings.direction === "rtl" ? "ltr" : "rtl" })}
            >
              <Globe />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Report bug"
              className="ms-1"
              onClick={() => window.open("https://github.com/mostuf556/driver-logbook-61/issues", "_blank")}
            >
              <ExternalLink />
            </Button>
            {(settings.showDebugToggle || debug) && (
              <Button
                variant={debug ? "default" : "ghost"}
                size="icon"
                aria-label="מצב דיבאג"
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
            <ThemeSwitcher />
            <Button
              variant="ghost"
              size="icon"
              aria-label="תפריט ניווט"
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
              {NAV_ITEMS.map((item) => (
                <MobileNavLink
                  key={item.to}
                  to={item.to}
                  onSelect={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </MobileNavLink>
              ))}
              <button
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors text-start"
                onClick={() => {
                  updateSettings({ ...settings, direction: settings.direction === "rtl" ? "ltr" : "rtl" });
                  setMobileMenuOpen(false);
                }}
              >
                <Globe className="size-4" />
                {settings.direction === "rtl" ? "English" : "עברית"}
              </button>
              <button
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors text-start"
                onClick={() => {
                  window.open("https://github.com/mostuf556/driver-logbook-61/issues", "_blank");
                  setMobileMenuOpen(false);
                }}
              >
                <ExternalLink className="size-4" />
                דו"ח בעיה
              </button>
              {(settings.showDebugToggle || debug) && (
                <button
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors text-start"
                  onClick={() => { setDebugFlag(!debug); setMobileMenuOpen(false); }}
                >
                  <Bug className="size-4" />
                  {debug ? "בטל דיבאג" : "מצב דיבאג"}
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
