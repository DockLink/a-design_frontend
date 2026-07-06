import type {
  DensityPreference,
  FontSizePreference,
  HomeRoutePreference,
  SidebarModePreference,
  ThemePreset,
  UserPreferences,
} from "@/types/users";
import type { AppAppearanceSettings, CustomColorOverrides } from "@/types/app-settings";
import { DEFAULT_APP_APPEARANCE } from "@/types/app-settings";

export type { ThemePreset, DensityPreference, FontSizePreference, SidebarModePreference, UserPreferences };
export type { AppAppearanceSettings };
export { DEFAULT_APP_APPEARANCE };

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme_preset: "default",
  accent_color: null,
  density: "comfortable",
  font_size: "medium",
  sidebar_mode: "expanded",
  custom_colors: {},
  avatar_file_id: null,
  default_home_route: null,
};

const THEME_PRESETS = new Set<ThemePreset>(["default", "light", "dark", "high_contrast"]);
const DENSITIES = new Set<DensityPreference>(["compact", "comfortable"]);
const FONT_SIZES = new Set<FontSizePreference>(["small", "medium", "large"]);
const SIDEBAR_MODES = new Set<SidebarModePreference>(["expanded", "collapsed"]);
const CUSTOM_COLOR_KEYS: (keyof CustomColorOverrides)[] = [
  "bg",
  "surface",
  "surface_elevated",
  "sidebar_bg",
  "label",
  "secondary_label",
  "accent",
  "accent_hover",
  "separator",
  "destructive",
  "success",
];
const HOME_ROUTES = new Set<string>([
  "/dashboard/super-admin",
  "/dashboard/admin",
  "/dashboard/lead",
  "/dashboard/member",
  "/dashboard/guest",
  "/projects",
  "/my-tasks",
  "/notifications",
]);
const CUID_LIKE = /^[a-z0-9]{20,}$/i;
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export function mergeUserPreferences(stored?: Partial<UserPreferences> | null): UserPreferences {
  const base = { ...DEFAULT_USER_PREFERENCES };
  if (!stored) return base;

  if (stored.theme_preset && THEME_PRESETS.has(stored.theme_preset)) {
    base.theme_preset = stored.theme_preset;
  }
  if (stored.accent_color === null || (stored.accent_color && HEX_COLOR.test(stored.accent_color))) {
    base.accent_color = stored.accent_color ?? null;
  }
  if (stored.density && DENSITIES.has(stored.density)) {
    base.density = stored.density;
  }
  if (stored.font_size && FONT_SIZES.has(stored.font_size)) {
    base.font_size = stored.font_size;
  }
  if (stored.sidebar_mode && SIDEBAR_MODES.has(stored.sidebar_mode)) {
    base.sidebar_mode = stored.sidebar_mode;
  }
  base.custom_colors = sanitizeCustomColors(stored.custom_colors);
  if (stored.avatar_file_id === null) {
    base.avatar_file_id = null;
  } else if (
    stored.avatar_file_id &&
    CUID_LIKE.test(stored.avatar_file_id)
  ) {
    base.avatar_file_id = stored.avatar_file_id;
  }
  if (stored.default_home_route === null) {
    base.default_home_route = null;
  } else if (
    stored.default_home_route &&
    HOME_ROUTES.has(stored.default_home_route)
  ) {
    base.default_home_route = stored.default_home_route as HomeRoutePreference;
  }

  return base;
}

function sanitizeCustomColors(
  input?: Partial<CustomColorOverrides> | null,
): CustomColorOverrides {
  const out: CustomColorOverrides = {};
  if (!input) return out;
  for (const key of CUSTOM_COLOR_KEYS) {
    const value = input[key];
    if (value === null) {
      out[key] = null;
    } else if (typeof value === "string" && HEX_COLOR.test(value)) {
      out[key] = value;
    }
  }
  return out;
}

export function mergeAppAppearance(
  stored?: Partial<AppAppearanceSettings> | null,
): AppAppearanceSettings {
  const base = { ...DEFAULT_APP_APPEARANCE, custom_colors: {} };
  if (!stored) return base;

  if (stored.theme_preset && THEME_PRESETS.has(stored.theme_preset)) {
    base.theme_preset = stored.theme_preset;
  }
  if (stored.accent_color === null || (stored.accent_color && HEX_COLOR.test(stored.accent_color))) {
    base.accent_color = stored.accent_color ?? null;
  }
  if (stored.density && DENSITIES.has(stored.density)) {
    base.density = stored.density;
  }
  if (stored.font_size && FONT_SIZES.has(stored.font_size)) {
    base.font_size = stored.font_size;
  }
  if (stored.sidebar_mode && SIDEBAR_MODES.has(stored.sidebar_mode)) {
    base.sidebar_mode = stored.sidebar_mode;
  }
  base.custom_colors = sanitizeCustomColors(stored.custom_colors);

  return base;
}

export function mergeEffectivePreferences(
  appAppearance: AppAppearanceSettings,
  stored?: Partial<UserPreferences> | null,
): UserPreferences {
  const personal = mergeUserPreferences(stored);
  return {
    ...appAppearance,
    avatar_file_id: personal.avatar_file_id,
    default_home_route: personal.default_home_route,
  };
}

const PRESET_TOKENS: Record<
  ThemePreset,
  Partial<Record<string, string>>
> = {
  default: {
    "--ds-bg": "#f5f2ed",
    "--ds-surface": "rgba(255, 255, 255, 0.92)",
    "--ds-surface-elevated": "#ffffff",
    "--ds-label": "#1c1c1e",
    "--ds-secondary-label": "#6c6c70",
    "--ds-tertiary-label": "#8e8e93",
    "--ds-separator": "rgba(60, 60, 67, 0.12)",
    "--ds-sidebar-bg": "#f7f1eb",
    "--ds-destructive": "#ff3b30",
    "--ds-destructive-muted": "rgba(255, 59, 48, 0.08)",
    "--ds-success": "#34c759",
    "--ds-warning": "#c85000",
    "--background": "#fcf8f4",
    "--foreground": "#1c1c1e",
    "--card": "#ffffff",
    "--muted": "#f5efe6",
    "--border": "rgba(90, 60, 30, 0.12)",
  },
  light: {
    "--ds-bg": "#ffffff",
    "--ds-surface": "#ffffff",
    "--ds-surface-elevated": "#ffffff",
    "--ds-label": "#111318",
    "--ds-secondary-label": "#5b6270",
    "--ds-tertiary-label": "#848c99",
    "--ds-separator": "rgba(17, 19, 24, 0.1)",
    "--ds-sidebar-bg": "#f4f5f7",
    "--ds-destructive": "#e5342b",
    "--ds-destructive-muted": "rgba(229, 52, 43, 0.08)",
    "--ds-success": "#1f9d55",
    "--ds-warning": "#b5620a",
    "--background": "#ffffff",
    "--foreground": "#111318",
    "--card": "#ffffff",
    "--muted": "#f2f3f5",
    "--border": "rgba(17, 19, 24, 0.1)",
  },
  dark: {
    "--ds-bg": "#121214",
    "--ds-surface": "rgba(28, 28, 30, 0.94)",
    "--ds-surface-elevated": "#1c1c1e",
    "--ds-label": "#f2f2f7",
    "--ds-secondary-label": "#aeaeb2",
    "--ds-tertiary-label": "#8e8e93",
    "--ds-separator": "rgba(255, 255, 255, 0.12)",
    "--ds-sidebar-bg": "#1c1c1e",
    "--ds-destructive": "#ff453a",
    "--ds-destructive-muted": "rgba(255, 69, 58, 0.15)",
    "--ds-success": "#30d158",
    "--ds-warning": "#ff9f0a",
    "--background": "#121214",
    "--foreground": "#f2f2f7",
    "--card": "#1c1c1e",
    "--muted": "#2c2c2e",
    "--border": "rgba(255, 255, 255, 0.14)",
  },
  high_contrast: {
    "--ds-bg": "#ffffff",
    "--ds-surface": "#ffffff",
    "--ds-surface-elevated": "#ffffff",
    "--ds-label": "#000000",
    "--ds-secondary-label": "#1a1a1a",
    "--ds-tertiary-label": "#333333",
    "--ds-separator": "rgba(0, 0, 0, 0.28)",
    "--ds-sidebar-bg": "#f5f5f5",
    "--ds-destructive": "#d70015",
    "--ds-destructive-muted": "rgba(215, 0, 21, 0.1)",
    "--ds-success": "#248a3d",
    "--ds-warning": "#a05a00",
    "--background": "#ffffff",
    "--foreground": "#000000",
    "--card": "#ffffff",
    "--muted": "#f0f0f0",
    "--border": "rgba(0, 0, 0, 0.35)",
  },
};

const FONT_SCALE: Record<FontSizePreference, number> = {
  small: 0.92,
  medium: 1,
  large: 1.08,
};

const BASE_FONT_SIZES = {
  "--ds-text-large-title": 28,
  "--ds-text-title-1": 24,
  "--ds-text-title-2": 20,
  "--ds-text-headline": 17,
  "--ds-text-body": 15,
  "--ds-text-callout": 14,
  "--ds-text-subhead": 14,
  "--ds-text-footnote": 13,
  "--ds-text-caption-1": 12,
  "--ds-text-caption-2": 11,
} as const;

const DENSITY_TOKENS: Record<DensityPreference, Record<string, string>> = {
  comfortable: {
    "--ds-content-padding-x": "24px",
    "--ds-content-padding-y": "28px",
    "--ds-action-btn-height": "36px",
    "--ds-radius-control": "10px",
  },
  compact: {
    "--ds-content-padding-x": "18px",
    "--ds-content-padding-y": "20px",
    "--ds-action-btn-height": "32px",
    "--ds-radius-control": "8px",
  },
};

const SIDEBAR_WIDTH: Record<SidebarModePreference, string> = {
  expanded: "220px",
  collapsed: "68px",
};

const CUSTOM_COLOR_CSS_VARS: Record<keyof CustomColorOverrides, string> = {
  bg: "--ds-bg",
  surface: "--ds-surface",
  surface_elevated: "--ds-surface-elevated",
  sidebar_bg: "--ds-sidebar-bg",
  label: "--ds-label",
  secondary_label: "--ds-secondary-label",
  accent: "--ds-accent",
  accent_hover: "--ds-accent-hover",
  separator: "--ds-separator",
  destructive: "--ds-destructive",
  success: "--ds-success",
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!HEX_COLOR.test(hex)) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export const CUSTOM_COLOR_FIELDS: {
  key: keyof CustomColorOverrides;
  label: string;
  group: "Backgrounds" | "Text" | "Accents" | "Borders" | "Status";
}[] = [
  { key: "bg", label: "Page background", group: "Backgrounds" },
  { key: "surface", label: "Surface / cards", group: "Backgrounds" },
  { key: "surface_elevated", label: "Elevated surface (dialogs)", group: "Backgrounds" },
  { key: "sidebar_bg", label: "Sidebar background", group: "Backgrounds" },
  { key: "label", label: "Primary text", group: "Text" },
  { key: "secondary_label", label: "Secondary text", group: "Text" },
  { key: "accent", label: "Accent", group: "Accents" },
  { key: "accent_hover", label: "Accent hover", group: "Accents" },
  { key: "separator", label: "Border / separator", group: "Borders" },
  { key: "destructive", label: "Destructive", group: "Status" },
  { key: "success", label: "Success", group: "Status" },
];

export function getPresetColorValue(preset: ThemePreset, key: keyof CustomColorOverrides): string {
  const cssVar = CUSTOM_COLOR_CSS_VARS[key];
  const tokens = PRESET_TOKENS[preset];
  const value = tokens[cssVar];
  if (value && HEX_COLOR.test(value)) return value;
  if (key === "accent") return preset === "dark" ? "#E0B07A" : "#D4A96A";
  if (key === "accent_hover") return getPresetColorValue(preset, "accent");
  return "#000000";
}

export const ACCENT_SWATCHES = [
  { id: "gold", label: "Gold", color: "#D4A96A" },
  { id: "teal", label: "Teal", color: "#2A9D8F" },
  { id: "slate", label: "Slate", color: "#5C6B7A" },
  { id: "rose", label: "Rose", color: "#C97B84" },
  { id: "indigo", label: "Indigo", color: "#5B6CFF" },
] as const;

export function applyUserPreferences(prefs: UserPreferences): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const presetTokens = PRESET_TOKENS[prefs.theme_preset];
  const densityTokens = DENSITY_TOKENS[prefs.density];
  const fontScale = FONT_SCALE[prefs.font_size];

  Object.entries(presetTokens).forEach(([key, value]) => {
    if (value != null) root.style.setProperty(key, value);
  });

  Object.entries(densityTokens).forEach(([key, value]) => {
    if (value != null) root.style.setProperty(key, value);
  });

  Object.entries(BASE_FONT_SIZES).forEach(([key, px]) => {
    root.style.setProperty(key, `${Math.round(px * fontScale)}px`);
  });

  root.style.setProperty("--ds-sidebar-width", SIDEBAR_WIDTH[prefs.sidebar_mode]);
  const accentHex =
    prefs.custom_colors?.accent ??
    prefs.accent_color ??
    (prefs.theme_preset === "dark" ? "#E0B07A" : "#d4a96a");
  root.style.setProperty("--ds-accent", accentHex);
  const accentRgb = hexToRgb(accentHex);
  if (accentRgb) {
    root.style.setProperty(
      "--ds-accent-muted",
      `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.12)`,
    );
  }
  root.style.setProperty("--ds-accent-hover", prefs.custom_colors?.accent_hover ?? accentHex);

  const customColors = prefs.custom_colors ?? {};
  for (const key of CUSTOM_COLOR_KEYS) {
    if (key === "accent" || key === "accent_hover") continue;
    const value = customColors[key];
    if (value) {
      root.style.setProperty(CUSTOM_COLOR_CSS_VARS[key], value);
    }
  }

  root.style.setProperty("--background", customColors.bg ?? presetTokens["--background"] ?? presetTokens["--ds-bg"] ?? "");
  root.style.setProperty("--foreground", customColors.label ?? presetTokens["--foreground"] ?? presetTokens["--ds-label"] ?? "");
  root.style.setProperty("--card", customColors.surface_elevated ?? customColors.surface ?? presetTokens["--card"] ?? "");
  root.style.setProperty("--border", customColors.separator ?? presetTokens["--border"] ?? "");

  root.dataset.themePreset = prefs.theme_preset;
  root.dataset.sidebarMode = prefs.sidebar_mode;
  root.dataset.density = prefs.density;
  root.dataset.fontSize = prefs.font_size;

  if (prefs.theme_preset === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function clearAppliedUserPreferences(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const keys = [
    ...Object.keys(PRESET_TOKENS.default),
    ...Object.keys(DENSITY_TOKENS.comfortable),
    ...Object.keys(BASE_FONT_SIZES),
    ...Object.values(CUSTOM_COLOR_CSS_VARS),
    "--ds-sidebar-width",
    "--ds-accent",
    "--ds-accent-muted",
    "--ds-accent-hover",
  ];
  keys.forEach((key) => root.style.removeProperty(key));
  delete root.dataset.themePreset;
  delete root.dataset.sidebarMode;
  delete root.dataset.density;
  delete root.dataset.fontSize;
  root.classList.remove("dark");
}
