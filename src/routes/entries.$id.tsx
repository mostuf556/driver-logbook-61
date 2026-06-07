import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { EntryForm } from "@/components/EntryForm";
import { useAppData } from "@/hooks/use-app-data";

export const Route = createFileRoute("/entries/$id")({
  head: () => ({ meta: [{ title: "עריכה · דוח נהגים" }] }),
  component: EditEntryPage,
});

function EditEntryPage() {
  const { id } = useParams({ from: "/entries/$id" });
  const { reports } = useAppData();
  const navigate = useNavigate();
  const r = reports.find((x) => x.id === id);

  useEffect(() => {
    if (reports.length && !r) navigate({ to: "/" });
  }, [r, reports.length, navigate]);

  return (
    <AppLayout>
      <h1 className="mb-4 text-2xl font-bold">עריכת רשומה</h1>
      {r && <EntryForm existing={r} />}
    </AppLayout>
  );
}