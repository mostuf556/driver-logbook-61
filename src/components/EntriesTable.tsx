import { Link } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
  hideExitColumns,
}: {
  rows: DriverReport[];
  showLeave?: boolean;
  hideExitColumns?: boolean;
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
    updateReports(reports.filter((x) => x.id !== r.id));
    toast.success("נמחק");
  };

  const hideExit = hideExitColumns ?? rows.every((r) => !r.exitTime);

  if (!rows.length) {
    return <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">אין רשומות</div>;
  }

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">תאריך</TableHead>
            <TableHead className="whitespace-nowrap">שם נהג</TableHead>
            <TableHead className="hidden sm:table-cell whitespace-nowrap">חברה</TableHead>
            <TableHead className="whitespace-nowrap">מספר רכב</TableHead>
            <TableHead className="whitespace-nowrap">כניסה</TableHead>
            {!hideExit && <TableHead className="whitespace-nowrap">יציאה</TableHead>}
            {!hideExit && <TableHead className="whitespace-nowrap">סהכ זמן</TableHead>}
            <TableHead className="whitespace-nowrap text-end">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const total = computeTotalMinutes(r.entryTime, r.exitTime, settings.allowOvernight);
            const live = !r.exitTime ? liveOnSiteMinutes(r.date, r.entryTime) : 0;
            const fullName = [r.firstName, r.lastName].filter(Boolean).join(" ");
            return (
              <TableRow key={r.id} className={!r.exitTime ? "bg-accent/40" : ""}>
                <TableCell className="whitespace-nowrap">{formatDate(r.date, settings.dateFormat)}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">
                  {fullName}
                  <div className="text-xs text-muted-foreground">{r.idNumber}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell whitespace-nowrap">{r.company}</TableCell>
                <TableCell className="font-mono whitespace-nowrap">{r.carNumber}</TableCell>
                <TableCell className="whitespace-nowrap">{r.entryTime}</TableCell>
                {!hideExit && (
                  <TableCell className="whitespace-nowrap">
                    {r.exitTime ?? (
                      settings.liveOnSiteBadge ? (
                        <Badge variant="secondary">בפנים · {formatTotal(live)}</Badge>
                      ) : (
                        <Badge variant="secondary">בפנים</Badge>
                      )
                    )}
                  </TableCell>
                )}
                {!hideExit && <TableCell className="whitespace-nowrap">{formatTotal(total)}</TableCell>}
                <TableCell className="whitespace-nowrap">
                  <div className="flex justify-end gap-1">
                    {showLeave && !r.exitTime && (
                      <Button size="sm" onClick={() => onLeave(r)}>
                        יצא
                      </Button>
                    )}
                    <Button asChild size="icon" variant="ghost">
                      <Link to="/entries/$id" params={{ id: r.id }}>
                        <Pencil />
                      </Link>
                    </Button>
                    <ConfirmDialog
                      title="למחוק רשומה זו?"
                      description={`${fullName || ""} · ${r.carNumber}`}
                      onConfirm={() => onDelete(r)}
                      trigger={
                        <Button size="icon" variant="ghost">
                          <Trash2 />
                        </Button>
                      }
                    />
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
