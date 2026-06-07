import { Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppData } from "@/hooks/use-app-data";
import type { AppSettings } from "@/lib/types";

export function ThemeSwitcher() {
  const { settings, updateSettings } = useAppData();
  const set = (t: AppSettings["theme"]) => updateSettings({ ...settings, theme: t });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="ערכת נושא">
          {settings.theme === "dark" ? <Moon /> : settings.theme === "blue" ? <Palette /> : <Sun />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => set("light")}><Sun className="ms-2" /> בהיר</DropdownMenuItem>
        <DropdownMenuItem onClick={() => set("dark")}><Moon className="ms-2" /> כהה</DropdownMenuItem>
        <DropdownMenuItem onClick={() => set("blue")}><Palette className="ms-2" /> כחול</DropdownMenuItem>
        <DropdownMenuItem onClick={() => set("system")}>מערכת</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}