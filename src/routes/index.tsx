import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { EntriesTable } from "@/components/EntriesTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppData } from "@/hooks/use-app-data";
import { exportAllReports, exportReportsForDate } from "@/lib/csv";
import { todayISO } from "@/lib/time";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "דוח נהגים" },
      { name: "description", content: "ניהול דוח נהגים בשער עם ייצוא CSV" },
    ],
  }),
  component: Index,
});

function Index() {
  const { reports, settings } = useAppData();
  const [exportDate, setExportDate] = useState(todayISO());
  const today = todayISO();

  const open = useMemo(() => reports.filter((r) => !r.exitTime), [reports]);
  const todayClosed = useMemo(
    () => reports.filter((r) => r.exitTime && r.date === today),
    [reports, today],
  );
  const history = useMemo(
    () => reports.filter((r) => r.exitTime && r.date !== today),
    [reports, today],
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">דשבורד</h1>
            <p className="text-sm text-muted-foreground">
              {open.length} בפנים · {todayClosed.length} סגורות היום
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={exportDate}
              onChange={(e) => setExportDate(e.target.value)}
              className="w-auto"
            />
            <Button
              variant="outline"
              onClick={() => {
                const n = exportReportsForDate(reports, settings, exportDate);
                toast.success(`יוצאו ${n} רשומות`);
              }}
            >
              ייצוא לתאריך
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const n = exportAllReports(reports, settings);
                toast.success(`יוצאו ${n} רשומות`);
              }}
            >
              ייצוא כל הנתונים
            </Button>
            <Button asChild>
              <Link to="/entries/new">+ כניסה חדשה</Link>
            </Button>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">בפנים כרגע</h2>
          <EntriesTable rows={open} showLeave />
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">היום (סגור)</h2>
          <EntriesTable rows={todayClosed} />
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">היסטוריה</h2>
          <EntriesTable rows={history} />
        </section>
      </div>
    </AppLayout>
  );
}
