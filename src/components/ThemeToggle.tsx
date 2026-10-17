import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyTheme, getTheme, nextTheme, setTheme, THEME_LABELS, type ThemeMode } from "@/lib/theme";

const ICONS: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
};

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const current = getTheme();
    setMode(current);
    setTheme(current);
    const sync = () => setMode(getTheme());
    window.addEventListener("theme-change", sync);
    return () => window.removeEventListener("theme-change", sync);
  }, []);

  const Icon = ICONS[mode];

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => setTheme(nextTheme(mode))}
      title={`Cambiar a ${THEME_LABELS[nextTheme(mode)]}`}
      aria-label={`Cambiar a ${THEME_LABELS[nextTheme(mode)]}`}
      className="gap-2 h-8 min-w-8 rounded-none px-2.5 border-border bg-card text-foreground text-[11px] font-extrabold uppercase tracking-wider hover:bg-accent transition-colors"
    >
      <Icon className="w-4 h-4" />
      <span className="hidden md:inline">{THEME_LABELS[mode]}</span>
    </Button>
  );
}
