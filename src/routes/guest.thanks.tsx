import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { useTheme } from "@/hooks/use-theme";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/guest/thanks")({
  head: () => ({
    meta: [
      { title: "Request submitted · Driver Logbook" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThanksPage,
});

function ThanksPage() {
  const { settings } = useAppData();
  useTheme(settings.theme);
  const lang = settings.language;
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4"
      dir={settings.direction}
    >
      <div className="max-w-md text-center space-y-3">
        <CheckCircle2 className="mx-auto size-16 text-green-600" />
        <h1 className="text-2xl font-bold">{t("guestThanksTitle", lang)}</h1>
        <p className="text-muted-foreground">{t("guestThanksBody", lang)}</p>
      </div>
    </div>
  );
}