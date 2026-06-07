import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { EntryForm } from "@/components/EntryForm";

export const Route = createFileRoute("/entries/new")({
  head: () => ({ meta: [{ title: "כניסה חדשה · דוח נהגים" }] }),
  component: NewEntryPage,
});

function NewEntryPage() {
  return (
    <AppLayout>
      <h1 className="mb-4 text-2xl font-bold">כניסה חדשה</h1>
      <EntryForm />
    </AppLayout>
  );
}