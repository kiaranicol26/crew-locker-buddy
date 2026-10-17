export const THEMES = ["light", "dark"] as const;
export type ThemeMode = (typeof THEMES)[number];

export const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Modo Claro",
  dark: "Modo Oscuro",
};

const KEY = "sapd_theme";

export function getTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return normalizeTheme(localStorage.getItem(KEY));
}

export function normalizeTheme(value: string | null): ThemeMode {
  return value === "dark" || value === "glass-dark" ? "dark" : "light";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", mode);
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function setTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, mode);
  applyTheme(mode);
  window.dispatchEvent(new Event("theme-change"));
}

export function nextTheme(mode: ThemeMode): ThemeMode {
  return mode === "light" ? "dark" : "light";
}
