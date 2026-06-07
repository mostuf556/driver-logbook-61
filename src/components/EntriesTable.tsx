import { Link } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppData } from "@/hooks/use-app-data";
import {
  computeTotalMinutes,
  formatDate,
  formatTotal,
  liveOnSiteMinutes,
  nowHHMM,
} from "@/lib/time";
import type { DriverReport } from "@/lib/types";

export function EntriesTable({
  rows,
  showLeave,
}: {
  rows: DriverReport[];
  showLeave?: boolean;
}) {
  const { settings, reports, updateReports } = useAppData();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!showLeave || !settings.liveOnSiteBadge) return;
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [showLeave, settings.liveOnSiteBadge]);

  const onLeave = (r: DriverReport) => {
    const next = reports.map((x) =>
      x.id === r.id
        ? { ...x, exitTime: nowHHMM(settings.roundTimesToMinutes), updatedAt: new Date().toISOString() }
        : x,
    );
    updateReports(next);
    toast.success("יציאה נרשמה");
  };

  const onDelete = (r: DriverReport) => {
    if (!confirm("למחוק רשומה זו?")) return;
    updateReports(reports.filter((x) => x.id !== r.id));
  };

  if (!rows.length) {
    return <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">אין רשומות</div>;
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>תאריך</TableHead>
            <TableHead>שם הנהג</TableHead>
            <TableHead>חברה</TableHead>
            <TableHead>רכב</TableHead>
            <TableHead>כניסה</TableHead>
            <TableHead>יציאה</TableHead>
            <TableHead>סהכ זמן</TableHead>
            <TableHead className="text-end">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const total = computeTotalMinutes(r.entryTime, r.exitTime, settings.allowOvernight);
            const live = !r.exitTime ? liveOnSiteMinutes(r.date, r.entryTime) : 0;
            return (
              <TableRow key={r.id} className={!r.exitTime ? "bg-amber-50/60" : ""}>
                <TableCell>{formatDate(r.date, settings.dateFormat)}</TableCell>
                <TableCell className="font-medium">
                  {r.driverName}
                  <div className="text-xs text-muted-foreground">{r.idNumber}</div>
                </TableCell>
                <TableCell>{r.company}</TableCell>
                <TableCell className="font-mono">{r.carNumber}</TableCell>
                <TableCell>{r.entryTime}</TableCell>
                <TableCell>
                  {r.exitTime ?? (
                    settings.liveOnSiteBadge ? (
                      <Badge variant="secondary">בפנים · {formatTotal(live)}</Badge>
                    ) : (
                      <Badge variant="secondary">בפנים</Badge>
                    )
                  )}
                </TableCell>
                <TableCell>{formatTotal(total)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {showLeave && !r.exitTime && (
                      <Button size="sm" onClick={() => onLeave(r)}>
                        יציאה
                      </Button>
                    )}
                    <Button asChild size="icon" variant="ghost">
                      <Link to="/entries/$id" params={{ id: r.id }}>
                        <Pencil />
                      </Link>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(r)}>
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}