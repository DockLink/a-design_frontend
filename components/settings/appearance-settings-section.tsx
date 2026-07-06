"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Palette, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { useUserPreferences } from "@/components/providers/user-preferences-provider";
import { Button } from "@/components/ui/button";
import {
  CUSTOM_COLOR_FIELDS,
  getPresetColorValue,
  mergeAppAppearance,
} from "@/lib/theme/preferences";
import type { AppAppearanceSettings, CustomColorOverrides } from "@/types/app-settings";
import type {
  DensityPreference,
  FontSizePreference,
  SidebarModePreference,
  ThemePreset,
} from "@/types/users";

const THEME_OPTIONS: { id: ThemePreset; label: string; description: string }[] = [
  { id: "default", label: "Default", description: "ADS+MAD cream and gold" },
  { id: "light", label: "Light", description: "Clean white surfaces" },
  { id: "dark", label: "Dark", description: "Dark surfaces and light text" },
  { id: "high_contrast", label: "High contrast", description: "Stronger text and borders" },
];

const COLOR_GROUPS: ("Backgrounds" | "Text" | "Accents" | "Borders" | "Status")[] = [
  "Backgrounds",
  "Text",
  "Accents",
  "Borders",
  "Status",
];

function appearancePatch(draft: AppAppearanceSettings) {
  return {
    theme_preset: draft.theme_preset,
    accent_color: draft.accent_color,
    density: draft.density,
    font_size: draft.font_size,
    sidebar_mode: draft.sidebar_mode,
    custom_colors: draft.custom_colors,
  };
}

export function AppearanceSettingsSection() {
  const {
    appAppearance,
    setPreferences,
    preferences,
    saveAppAppearance,
    pausePolling,
    resumePolling,
    isSavingAppearance,
  } = useUserPreferences();
  const savedBaseline = useMemo(
    () => mergeAppAppearance(appAppearance),
    [appAppearance],
  );
  const [draft, setDraft] = useState<AppAppearanceSettings>(savedBaseline);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!dirtyRef.current) {
      setDraft(savedBaseline);
    }
  }, [savedBaseline]);

  useEffect(() => {
    return () => {
      resumePolling();
    };
  }, [resumePolling]);

  function updateDraft(patch: Partial<AppAppearanceSettings>) {
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      pausePolling();
    }
    const next = { ...draft, ...patch };
    setDraft(next);
    setPreferences({ ...preferences, ...next });
  }

  function updateCustomColor(key: keyof CustomColorOverrides, value: string | null) {
    updateDraft({ custom_colors: { ...draft.custom_colors, [key]: value } });
  }

  async function handleSave() {
    try {
      await saveAppAppearance(appearancePatch(draft));
      dirtyRef.current = false;
      resumePolling();
      toast.success("Appearance saved for all users");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save appearance");
      dirtyRef.current = false;
      resumePolling();
      setDraft(savedBaseline);
      setPreferences({ ...preferences, ...savedBaseline });
    }
  }

  function handleResetDraft() {
    dirtyRef.current = false;
    resumePolling();
    setDraft(savedBaseline);
    setPreferences({ ...preferences, ...savedBaseline });
  }

  function handleResetAllColors() {
    updateDraft({ custom_colors: {} });
  }

  const isDirty =
    JSON.stringify(appearancePatch(draft)) !==
    JSON.stringify(appearancePatch(savedBaseline));
  const accent =
    draft.custom_colors.accent ??
    draft.accent_color ??
    (draft.theme_preset === "dark" ? "#E0B07A" : "#D4A96A");
  const hasCustomColors = Object.values(draft.custom_colors).some((v) => v);

  return (
    <section className="mt-5 rounded-2xl border border-[rgba(90,60,30,0.12)] bg-[var(--ds-surface-elevated,#FDFAF6)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Palette size={16} color="var(--ds-accent, #D4A96A)" />
        <h2 className="text-[15px] font-semibold text-[var(--ds-label,#1A1410)]">
          Organization appearance
        </h2>
      </div>
      <p className="mb-5 text-[13px] text-[var(--ds-secondary-label,#9C8573)]">
        Set the theme, colors, and layout for everyone in ADS+MAD. Only super admins can change
        these settings. Other users see updates automatically within about a minute, or when they
        return to the app.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(280px,360px)]">
        <div className="space-y-5">
          <FieldGroup label="Theme preset">
            <div className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {THEME_OPTIONS.map((opt) => {
                const active = draft.theme_preset === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateDraft({ theme_preset: opt.id })}
                    className="rounded-xl border p-3 text-left transition-colors"
                    style={{
                      borderColor: active ? accent : "rgba(90,60,30,0.12)",
                      background: active ? "color-mix(in srgb, var(--ds-accent) 12%, transparent)" : "var(--ds-bg, #F5EFE6)",
                    }}
                  >
                    <div className="text-[13px] font-semibold text-[var(--ds-label,#1A1410)]">{opt.label}</div>
                    <div className="mt-1 text-[11px] text-[var(--ds-secondary-label,#9C8573)]">{opt.description}</div>
                  </button>
                );
              })}
            </div>
          </FieldGroup>

          <FieldGroup label="Density">
            <SegmentedControl
              value={draft.density}
              options={[
                { value: "compact", label: "Compact" },
                { value: "comfortable", label: "Comfortable" },
              ]}
              onChange={(value) => updateDraft({ density: value as DensityPreference })}
            />
          </FieldGroup>

          <FieldGroup label="Font size">
            <SegmentedControl
              value={draft.font_size}
              options={[
                { value: "small", label: "Small" },
                { value: "medium", label: "Medium" },
                { value: "large", label: "Large" },
              ]}
              onChange={(value) => updateDraft({ font_size: value as FontSizePreference })}
            />
          </FieldGroup>

          <FieldGroup label="Sidebar">
            <SegmentedControl
              value={draft.sidebar_mode}
              options={[
                { value: "expanded", label: "Expanded" },
                { value: "collapsed", label: "Collapsed" },
              ]}
              onChange={(value) => updateDraft({ sidebar_mode: value as SidebarModePreference })}
            />
          </FieldGroup>

          <div className="border-t border-[rgba(90,60,30,0.12)] pt-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-[var(--ds-secondary-label,#9C8573)]">
                Full color customization
              </div>
              {hasCustomColors ? (
                <button
                  type="button"
                  onClick={handleResetAllColors}
                  className="inline-flex items-center gap-1 text-[12px] text-[var(--ds-accent,#D4A96A)] underline-offset-2 hover:underline"
                >
                  <RotateCcw size={12} />
                  Reset all colors to preset
                </button>
              ) : null}
            </div>

            <div className="space-y-4">
              {COLOR_GROUPS.map((group) => (
                <ColorGroupBlock
                  key={group}
                  group={group}
                  draft={draft}
                  onChange={updateCustomColor}
                />
              ))}
            </div>
          </div>
        </div>

        <AppearancePreview draft={draft} accent={accent} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!isDirty || isSavingAppearance}
          onClick={() => void handleSave()}
          className="h-10 rounded-lg text-white"
          style={{ background: "var(--ds-accent, #D4A96A)" }}
        >
          {isSavingAppearance ? "Saving…" : "Save for all users"}
        </Button>
        {isDirty ? (
          <Button type="button" variant="outline" onClick={handleResetDraft} className="h-10">
            Revert changes
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function ColorGroupBlock({
  group,
  draft,
  onChange,
}: {
  group: "Backgrounds" | "Text" | "Accents" | "Borders" | "Status";
  draft: AppAppearanceSettings;
  onChange: (key: keyof CustomColorOverrides, value: string | null) => void;
}) {
  const fields = CUSTOM_COLOR_FIELDS.filter((f) => f.group === group);
  if (fields.length === 0) return null;

  return (
    <div>
      <div className="mb-2 text-[11px] font-medium text-[var(--ds-tertiary-label,#B8A695)]">{group}</div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {fields.map((field) => {
          const override = draft.custom_colors[field.key];
          const effective = override ?? getPresetColorValue(draft.theme_preset, field.key);
          return (
            <div
              key={field.key}
              className="flex items-center justify-between gap-2 rounded-lg border border-[rgba(90,60,30,0.1)] px-2.5 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <input
                  type="color"
                  value={effective}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="h-7 w-9 shrink-0 cursor-pointer rounded border border-[rgba(90,60,30,0.15)] bg-transparent"
                />
                <span className="truncate text-[12px] text-[var(--ds-label,#1A1410)]">{field.label}</span>
              </div>
              {override ? (
                <button
                  type="button"
                  onClick={() => onChange(field.key, null)}
                  className="shrink-0 text-[11px] text-[var(--ds-secondary-label,#9C8573)] underline-offset-2 hover:underline"
                >
                  Reset
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppearancePreview({
  draft,
  accent,
}: {
  draft: AppAppearanceSettings;
  accent: string;
}) {
  const colors = draft.custom_colors;
  const preset = draft.theme_preset;
  const isDark = preset === "dark";
  const bg = colors.bg ?? getPresetColorValue(preset, "bg");
  const surface = colors.surface_elevated ?? colors.surface ?? getPresetColorValue(preset, "surface_elevated");
  const label = colors.label ?? getPresetColorValue(preset, "label");
  const secondary = colors.secondary_label ?? getPresetColorValue(preset, "secondary_label");
  const sidebarBg = colors.sidebar_bg ?? getPresetColorValue(preset, "sidebar_bg");

  return (
    <div
      className="hidden h-fit rounded-xl border p-4 lg:block"
      style={{ borderColor: "rgba(90,60,30,0.12)", background: surface }}
    >
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: secondary }}>
        Live preview
      </div>
      <div
        className="overflow-hidden rounded-lg border"
        style={{ borderColor: "rgba(90,60,30,0.12)", background: bg }}
      >
        <div className="flex" style={{ minHeight: 160 }}>
          <div
            style={{
              width: draft.sidebar_mode === "collapsed" ? 36 : 72,
              background: sidebarBg,
              borderRight: "1px solid rgba(90,60,30,0.1)",
              padding: "8px 6px",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 8,
                  borderRadius: 4,
                  marginBottom: 6,
                  background: i === 1 ? accent : "rgba(90,60,30,0.12)",
                  opacity: i === 1 ? 1 : 0.6,
                }}
              />
            ))}
          </div>
          <div className="flex-1 p-3">
            <div style={{ fontSize: 11, fontWeight: 600, color: label }}>Dashboard</div>
            <div
              className="mt-2 rounded-md p-2"
              style={{ background: surface, border: "1px solid rgba(90,60,30,0.1)" }}
            >
              <div style={{ height: 6, width: "70%", borderRadius: 3, background: accent, opacity: 0.85 }} />
              <div
                className="mt-2"
                style={{ height: 4, width: "90%", borderRadius: 2, background: "rgba(90,60,30,0.15)" }}
              />
              <div
                className="mt-1"
                style={{ height: 4, width: "60%", borderRadius: 2, background: "rgba(90,60,30,0.1)" }}
              />
            </div>
            <div className="mt-2 flex gap-1">
              <span
                className="rounded px-2 py-0.5 text-[9px] font-medium text-white"
                style={{ background: accent }}
              >
                Action
              </span>
              <span
                className="rounded px-2 py-0.5 text-[9px]"
                style={{ color: secondary, background: "rgba(90,60,30,0.08)" }}
              >
                Secondary
              </span>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[11px]" style={{ color: secondary }}>
        {draft.density === "compact" ? "Compact" : "Comfortable"} · {draft.font_size} text ·{" "}
        {draft.sidebar_mode} sidebar
      </p>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[140px_1fr] md:items-start">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ds-secondary-label,#9C8573)] md:pt-2">
        {label}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex w-full max-w-md flex-wrap gap-1 rounded-lg border border-[rgba(90,60,30,0.12)] bg-[var(--ds-bg,#F5EFE6)] p-1">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="flex-1 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors"
            style={{
              background: active ? "var(--ds-accent, #D4A96A)" : "transparent",
              color: active ? "#fff" : "var(--ds-label, #1A1410)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
