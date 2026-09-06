export const THEMES = ["light", "dark", "glass-light", "glass-dark"] as const;
export type ThemeMode = (typeof THEMES)[number];

export const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Modo Claro",
  dark: "Modo Oscuro",
  "glass-light": "Glass Claro",
  "glass-dark": "Glass Oscuro",
};

const KEY = "sapd_theme";

export function getTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const v = localStorage.getItem(KEY) as ThemeMode | null;
  return v && (THEMES as readonly string[]).includes(v) ? v : "light";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", mode);
}

export function setTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, mode);
  applyTheme(mode);
  window.dispatchEvent(new Event("theme-change"));
}

export function nextTheme(mode: ThemeMode): ThemeMode {
  return THEMES[(THEMES.indexOf(mode) + 1) % THEMES.length];
}
