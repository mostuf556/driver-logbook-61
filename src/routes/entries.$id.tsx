import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { EntryForm } from "@/components/EntryForm";
import { useAppData } from "@/hooks/use-app-data";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/entries/$id")({
  head: () => ({ meta: [{ title: "Edit · Driver Logbook" }] }),
  component: EditEntryPage,
});

function EditEntryPage() {
  const { id } = useParams({ from: "/entries/$id" });
  const { reports, settings } = useAppData();
  const navigate = useNavigate();
  const r = reports.find((x) => x.id === id);

  useEffect(() => {
    if (reports.length && !r) navigate({ to: "/home" });
  }, [r, reports.length, navigate]);

  return (
    <AppLayout>
      <h1 className="mb-4 text-2xl font-bold">{t("pageEditEntryHeading", settings.language)}</h1>
      {r && <EntryForm existing={r} />}
    </AppLayout>
  );
}
