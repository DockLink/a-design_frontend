"use client";

import { useEffect, useMemo, useState } from "react";
import { Palette } from "lucide-react";
import { toast } from "sonner";

import { useUserPreferences } from "@/components/providers/user-preferences-provider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ACCENT_SWATCHES, mergeUserPreferences } from "@/lib/theme/preferences";
import type {
  DensityPreference,
  FontSizePreference,
  SidebarModePreference,
  ThemePreset,
  UserPreferences,
} from "@/types/users";

const THEME_OPTIONS: { id: ThemePreset; label: string; description: string }[] = [
  { id: "default", label: "Default", description: "ADS+MAD cream and gold" },
  { id: "dark", label: "Dark", description: "Dark surfaces and light text" },
  { id: "high_contrast", label: "High contrast", description: "Stronger text and borders" },
];

function appearancePatch(draft: UserPreferences) {
  return {
    theme_preset: draft.theme_preset,
    accent_color: draft.accent_color,
    density: draft.density,
    font_size: draft.font_size,
    sidebar_mode: draft.sidebar_mode,
  };
}

export function AppearanceSettingsSection() {
  const { setPreferences, savePreferences, isSaving } = useUserPreferences();
  const { user, refreshUser } = useAuth();
  const savedBaseline = useMemo(
    () => mergeUserPreferences(user?.preferences),
    [user?.preferences],
  );
  const [draft, setDraft] = useState<UserPreferences>(savedBaseline);

  useEffect(() => {
    setDraft(savedBaseline);
  }, [savedBaseline]);

  function updateDraft(patch: Partial<UserPreferences>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    setPreferences(next);
  }

  async function handleSave() {
    try {
      await savePreferences(appearancePatch(draft));
      await refreshUser();
      toast.success("Appearance saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save appearance");
      setDraft(savedBaseline);
      setPreferences(savedBaseline);
    }
  }

  function handleResetDraft() {
    setDraft(savedBaseline);
    setPreferences(savedBaseline);
  }

  const isDirty =
    JSON.stringify(appearancePatch(draft)) !==
    JSON.stringify(appearancePatch(savedBaseline));
  const accent = draft.accent_color ?? (draft.theme_preset === "dark" ? "#E0B07A" : "#D4A96A");

  return (
    <section className="mt-5 rounded-2xl border border-[rgba(90,60,30,0.12)] bg-[var(--ds-surface-elevated,#FDFAF6)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Palette size={16} color="var(--ds-accent, #D4A96A)" />
        <h2 className="text-[15px] font-semibold text-[var(--ds-label,#1A1410)]">Appearance</h2>
      </div>
      <p className="mb-5 text-[13px] text-[var(--ds-secondary-label,#9C8573)]">
        Personalize how ADS+MAD looks for your account. Changes preview live; save to sync across devices.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(280px,360px)]">
        <div className="space-y-5">
          <FieldGroup label="Theme preset">
            <div className="grid w-full gap-2 sm:grid-cols-3">
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

          <FieldGroup label="Accent color">
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_SWATCHES.map((swatch) => {
                const active = draft.accent_color === swatch.color;
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    title={swatch.label}
                    onClick={() => updateDraft({ accent_color: swatch.color })}
                    className="h-8 w-8 rounded-full border-2"
                    style={{
                      background: swatch.color,
                      borderColor: active ? "var(--ds-label, #1C1C1E)" : "transparent",
                    }}
                  />
                );
              })}
              <label className="inline-flex items-center gap-2 text-[12px] text-[var(--ds-secondary-label,#9C8573)]">
                Custom
                <input
                  type="color"
                  value={draft.accent_color ?? "#D4A96A"}
                  onChange={(e) => updateDraft({ accent_color: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-[rgba(90,60,30,0.15)] bg-transparent"
                />
              </label>
              <button
                type="button"
                onClick={() => updateDraft({ accent_color: null })}
                className="text-[12px] text-[var(--ds-accent,#D4A96A)] underline-offset-2 hover:underline"
              >
                Reset accent
              </button>
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
        </div>

        <AppearancePreview draft={draft} accent={accent} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!isDirty || isSaving}
          onClick={() => void handleSave()}
          className="h-10 rounded-lg text-white"
          style={{ background: "var(--ds-accent, #D4A96A)" }}
        >
          {isSaving ? "Saving…" : "Save appearance"}
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

function AppearancePreview({
  draft,
  accent,
}: {
  draft: UserPreferences;
  accent: string;
}) {
  const isDark = draft.theme_preset === "dark";
  const bg = isDark ? "#121214" : draft.theme_preset === "high_contrast" ? "#fff" : "#f5f2ed";
  const surface = isDark ? "#1c1c1e" : "#fdfaf6";
  const label = isDark ? "#f2f2f7" : draft.theme_preset === "high_contrast" ? "#000" : "#1a1410";
  const secondary = isDark ? "#aeaeb2" : "#9c8573";

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
              background: isDark ? "#1c1c1e" : "#f7f1eb",
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
