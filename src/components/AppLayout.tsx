import { Link } from "@tanstack/react-router";
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
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
          <Link to="/home" className="text-lg font-bold">
            דוח נהגים
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink to="/home">דוח כניסות ויציאות</NavLink>
            <NavLink to="/contacts">אנשי קשר</NavLink>
            <NavLink to="/logs">לוגים</NavLink>
            <NavLink to="/settings">הגדרות</NavLink>
            {settings.showDebugToggle && (
              <Button
                variant={debug ? "default" : "ghost"}
                size="icon"
                aria-label="מצב דיבאג"
                onClick={() => setDebugFlag(!debug)}
              >
                <Bug />
              </Button>
            )}
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
  return (
    <Link
      to={to}
      className="rounded px-3 py-1.5 hover:bg-accent"
      activeProps={{ className: "rounded px-3 py-1.5 bg-accent font-medium" }}
    >
      {children}
    </Link>
  );
}