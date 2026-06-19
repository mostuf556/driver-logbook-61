import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { EntryForm } from "@/components/EntryForm";
import { useAppData } from "@/hooks/use-app-data";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/entries/new")({
  head: () => ({ meta: [{ title: "New entry · Driver Logbook" }] }),
  component: NewEntryPage,
});

function NewEntryPage() {
  const { settings } = useAppData();
  return (
    <AppLayout>
      <h1 className="mb-4 text-2xl font-bold">{t("pageNewEntryHeading", settings.language)}</h1>
      <EntryForm />
    </AppLayout>
  );
}
