import type {
  DensityPreference,
  FontSizePreference,
  HomeRoutePreference,
  SidebarModePreference,
  ThemePreset,
  UserPreferences,
} from "@/types/users";

export type { ThemePreset, DensityPreference, FontSizePreference, SidebarModePreference, UserPreferences };

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme_preset: "default",
  accent_color: null,
  density: "comfortable",
  font_size: "medium",
  sidebar_mode: "expanded",
  avatar_file_id: null,
  default_home_route: null,
};

const THEME_PRESETS = new Set<ThemePreset>(["default", "dark", "high_contrast"]);
const DENSITIES = new Set<DensityPreference>(["compact", "comfortable"]);
const FONT_SIZES = new Set<FontSizePreference>(["small", "medium", "large"]);
const SIDEBAR_MODES = new Set<SidebarModePreference>(["expanded", "collapsed"]);
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
    "--background": "#fcf8f4",
    "--foreground": "#1c1c1e",
    "--card": "#ffffff",
    "--muted": "#f5efe6",
    "--border": "rgba(90, 60, 30, 0.12)",
  },
  dark: {
    "--ds-bg": "#121214",
    "--ds-surface": "rgba(28, 28, 30, 0.94)",
    "--ds-surface-elevated": "#1c1c1e",
    "--ds-label": "#f2f2f7",
    "--ds-secondary-label": "#aeaeb2",
    "--ds-tertiary-label": "#8e8e93",
    "--ds-separator": "rgba(255, 255, 255, 0.12)",
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
  root.style.setProperty(
    "--ds-accent",
    prefs.accent_color ?? (prefs.theme_preset === "dark" ? "#E0B07A" : "#d4a96a"),
  );

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
    "--ds-sidebar-width",
    "--ds-accent",
  ];
  keys.forEach((key) => root.style.removeProperty(key));
  delete root.dataset.themePreset;
  delete root.dataset.sidebarMode;
  delete root.dataset.density;
  delete root.dataset.fontSize;
  root.classList.remove("dark");
}
