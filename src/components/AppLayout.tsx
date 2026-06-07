import { Link, useLocation } from "@tanstack/react-router";
import { Bug } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAppData } from "@/hooks/use-app-data";
import { useDebugMode, setDebugFlag } from "@/hooks/use-debug-mode";
import { useTheme } from "@/hooks/use-theme";
import { installErrorListeners } from "@/lib/error-log";

export function AppLayout({ children }: { children: ReactNode }) {
  const { settings } = useAppData();
  useTheme(settings.theme);
  const debug = useDebugMode();

  useEffect(() => {
    installErrorListeners();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
          <Link
            to="/home"
            className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground hover:text-primary transition-colors"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold select-none">
              נ
            </span>
            דוח נהגים
          </Link>

          <nav className="flex items-center gap-0.5 text-sm">
            <NavLink to="/home">כניסות</NavLink>
            <NavLink to="/contacts">אנשי קשר</NavLink>
            <NavLink to="/logs">לוגים</NavLink>
            <NavLink to="/settings">הגדרות</NavLink>

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
        </div>
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
