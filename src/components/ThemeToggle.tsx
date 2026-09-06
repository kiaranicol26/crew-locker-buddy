import { useEffect, useState } from "react";
import { Sun, Moon, Sparkles, Stars } from "lucide-react";
import { applyTheme, getTheme, nextTheme, setTheme, THEME_LABELS, type ThemeMode } from "@/lib/theme";

const ICONS: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  "glass-light": Sparkles,
  "glass-dark": Stars,
};

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const current = getTheme();
    setMode(current);
    applyTheme(current);
    const sync = () => setMode(getTheme());
    window.addEventListener("theme-change", sync);
    return () => window.removeEventListener("theme-change", sync);
  }, []);

  const Icon = ICONS[mode];

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme(mode))}
      title="Cambiar tema"
      className="flex items-center gap-2 h-8 px-2.5 border border-blue-300 bg-white text-blue-800 text-[11px] font-extrabold uppercase tracking-wider hover:bg-blue-50 transition-colors"
    >
      <Icon className="w-4 h-4" />
      <span className="hidden md:inline">{THEME_LABELS[mode]}</span>
    </button>
  );
}
