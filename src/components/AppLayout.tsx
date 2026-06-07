import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
          <Link to="/" className="text-lg font-bold">
            דוח נהגים
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              className="rounded px-3 py-1.5 hover:bg-accent"
              activeProps={{ className: "rounded px-3 py-1.5 bg-accent font-medium" }}
              activeOptions={{ exact: true }}
            >
              דשבורד
            </Link>
            <Link
              to="/contacts"
              className="rounded px-3 py-1.5 hover:bg-accent"
              activeProps={{ className: "rounded px-3 py-1.5 bg-accent font-medium" }}
            >
              אנשי קשר
            </Link>
            <Link
              to="/settings"
              className="rounded px-3 py-1.5 hover:bg-accent"
              activeProps={{ className: "rounded px-3 py-1.5 bg-accent font-medium" }}
            >
              הגדרות
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
      <Toaster position="top-center" richColors />
    </div>
  );
}