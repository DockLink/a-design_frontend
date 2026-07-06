import type {
  CustomColorOverrides,
  DensityPreference,
  FontSizePreference,
  SidebarModePreference,
  ThemePreset,
} from "@/types/users";

export type { CustomColorOverrides };

export interface AppAppearanceSettings {
  theme_preset: ThemePreset;
  accent_color: string | null;
  density: DensityPreference;
  font_size: FontSizePreference;
  sidebar_mode: SidebarModePreference;
  custom_colors: CustomColorOverrides;
}

export const DEFAULT_APP_APPEARANCE: AppAppearanceSettings = {
  theme_preset: "default",
  accent_color: null,
  density: "comfortable",
  font_size: "medium",
  sidebar_mode: "expanded",
  custom_colors: {},
};
