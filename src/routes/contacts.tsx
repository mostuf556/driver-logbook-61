import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ContactsManager } from "@/components/ContactsManager";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "אנשי קשר · דוח נהגים" }] }),
  component: ContactsPage,
});

function ContactsPage() {
  return (
    <AppLayout>
      <h1 className="mb-4 text-2xl font-bold">אנשי קשר</h1>
      <ContactsManager />
    </AppLayout>
  );
}