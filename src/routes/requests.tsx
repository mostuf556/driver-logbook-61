import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { ShareGuestDialog } from "@/components/ShareGuestDialog";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/hooks/use-app-data";
import { upsertContactFromReport } from "@/lib/contacts";
import { t } from "@/lib/i18n";
import { loadPendingRequests, removePendingRequest } from "@/lib/requests";
import { uid } from "@/lib/storage";
import { nowHHMM, todayISO } from "@/lib/time";
import type { DriverReport, PendingRequest } from "@/lib/types";

export const Route = createFileRoute("/requests")({
  head: () => ({ meta: [{ title: "Pending requests · Driver Logbook" }] }),
  component: RequestsPage,
});

function RequestsPage() {
  const { settings, reports, contacts, updateReports, updateContacts } = useAppData();
  const lang = settings.language;
  const [pending, setPending] = useState<PendingRequest[]>([]);

  useEffect(() => {
    const sync = () => setPending(loadPendingRequests());
    sync();
    window.addEventListener("pending-requests-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pending-requests-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const approve = (req: PendingRequest) => {
    const next: DriverReport = {
      id: uid(),
      date: todayISO(),
      firstName: req.firstName,
      lastName: req.lastName,
      idNumber: req.idNumber,
      phone: req.phone,
      carNumber: req.carNumber,
      entryTime: nowHHMM(settings.roundTimesToMinutes),
      exitTime: null,
      approverName: settings.defaultApprover,
      company: req.company,
      guardName: settings.defaultGuard,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updateReports([next, ...reports]);
    updateContacts(upsertContactFromReport(contacts, next, settings));
    removePendingRequest(req.id);
    toast.success(t("requestApproved", lang));
  };

  const reject = (req: PendingRequest) => {
    removePendingRequest(req.id);
    toast.success(t("requestRejected", lang));
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t("pendingRequestsTitle", lang)}</h1>
            <p className="text-sm text-muted-foreground">
              {pending.length} {t("pendingCount", lang)}
            </p>
          </div>
          <ShareGuestDialog settings={settings} />
        </div>

        {pending.length === 0 ? (
          <p className="text-muted-foreground">{t("noPendingRequests", lang)}</p>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => {
              const fullName = [r.firstName, r.lastName].filter(Boolean).join(" ");
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border bg-card p-3"
                >
                  <div className="space-y-1">
                    <div className="font-medium">
                      {fullName || "—"}{" "}
                      {r.company && (
                        <span className="text-sm text-muted-foreground">· {r.company}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3">
                      <span dir="ltr" className="font-mono">{r.carNumber || "—"}</span>
                      <span>{r.idNumber}</span>
                      <span dir="ltr">{r.phone}</span>
                      <span>{new Date(r.requestedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => approve(r)}>
                      <Check className="me-1 size-4" />
                      {t("approve", lang)}
                    </Button>
                    <Button variant="outline" onClick={() => reject(r)}>
                      <X className="me-1 size-4" />
                      {t("reject", lang)}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}