import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { SettingsForm } from "@/components/SettingsForm";
import { useAppData } from "@/hooks/use-app-data";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Driver Logbook" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings } = useAppData();
  return (
    <AppLayout>
      <h1 className="mb-4 text-2xl font-bold">{t("pageSettingsHeading", settings.language)}</h1>
      <SettingsForm />
    </AppLayout>
  );
}