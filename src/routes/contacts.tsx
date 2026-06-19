import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ContactsManager } from "@/components/ContactsManager";
import { useAppData } from "@/hooks/use-app-data";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Contacts · Driver Logbook" }] }),
  component: ContactsPage,
});

function ContactsPage() {
  const { settings } = useAppData();
  return (
    <AppLayout>
      <h1 className="mb-4 text-2xl font-bold">{t("pageContactsHeading", settings.language)}</h1>
      <ContactsManager />
    </AppLayout>
  );
}
