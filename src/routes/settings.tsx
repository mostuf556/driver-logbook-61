import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { SettingsForm } from "@/components/SettingsForm";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "הגדרות · דוח נהגים" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppLayout>
      <h1 className="mb-4 text-2xl font-bold">הגדרות</h1>
      <SettingsForm />
    </AppLayout>
  );
}