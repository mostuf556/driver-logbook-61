import { Moon, Sun, Waves, Leaf, Flame, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppData } from "@/hooks/use-app-data";
import type { AppSettings } from "@/lib/types";

const THEME_OPTIONS: { value: AppSettings["theme"]; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "בהיר", icon: <Sun className="size-4" /> },
  { value: "dark", label: "כהה", icon: <Moon className="size-4" /> },
  { value: "blue", label: "כחול", icon: <Waves className="size-4" /> },
  { value: "green", label: "ירוק", icon: <Leaf className="size-4" /> },
  { value: "warm", label: "חם", icon: <Flame className="size-4" /> },
  { value: "system", label: "מערכת", icon: <Monitor className="size-4" /> },
];

function ThemeIcon({ theme }: { theme: AppSettings["theme"] }) {
  switch (theme) {
    case "dark": return <Moon className="size-4" />;
    case "blue": return <Waves className="size-4" />;
    case "green": return <Leaf className="size-4" />;
    case "warm": return <Flame className="size-4" />;
    case "system": return <Monitor className="size-4" />;
    default: return <Sun className="size-4" />;
  }
}

export function ThemeSwitcher() {
  const { settings, updateSettings } = useAppData();
  const set = (t: AppSettings["theme"]) => updateSettings({ ...settings, theme: t });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="ערכת נושא" className="shrink-0">
          <ThemeIcon theme={settings.theme} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {THEME_OPTIONS.map((opt, i) => (
          <>
            {i === THEME_OPTIONS.length - 1 && <DropdownMenuSeparator key="sep" />}
            <DropdownMenuItem
              key={opt.value}
              onClick={() => set(opt.value)}
              className="flex items-center gap-2 cursor-pointer"
              data-active={settings.theme === opt.value}
            >
              {opt.icon}
              <span>{opt.label}</span>
              {settings.theme === opt.value && (
                <span className="ms-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          </>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
