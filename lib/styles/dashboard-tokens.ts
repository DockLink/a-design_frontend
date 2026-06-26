import type { CSSProperties } from "react";

/** Shared dashboard surfaces & typography — values scale via CSS vars in globals.css */
export const dsCard: CSSProperties = {
  background: "var(--ds-surface)",
  borderRadius: "var(--ds-radius-card)",
  boxShadow: "var(--ds-shadow-card)",
  border: "0.5px solid var(--ds-separator)",
  overflow: "hidden",
};

export const dsLargeTitle: CSSProperties = {
  fontSize: "var(--ds-text-large-title)",
  fontWeight: 600,
  color: "var(--ds-label)",
  letterSpacing: "-0.02em",
  lineHeight: 1.15,
};

export const dsSubtitle: CSSProperties = {
  fontSize: "var(--ds-text-subhead)",
  color: "var(--ds-secondary-label)",
  lineHeight: 1.4,
};

export const dsSectionLabel: CSSProperties = {
  fontSize: "var(--ds-text-caption-1)",
  fontWeight: 600,
  color: "var(--ds-tertiary-label)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "12px",
  marginTop: "28px",
  padding: "0 2px",
};

export const dsActionBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  height: "var(--ds-action-btn-height)",
  padding: "0 20px",
  borderRadius: "var(--ds-radius-control)",
  fontSize: "var(--ds-text-callout)",
  fontWeight: 500,
  cursor: "pointer",
  border: "none",
  letterSpacing: "-0.01em",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

export const dsHeadline: CSSProperties = {
  fontSize: "var(--ds-text-headline)",
  fontWeight: 600,
  color: "var(--ds-label)",
  letterSpacing: "-0.01em",
};

export const dsBody: CSSProperties = {
  fontSize: "var(--ds-text-body)",
  color: "var(--ds-label)",
  lineHeight: 1.45,
};

export const dsCallout: CSSProperties = {
  fontSize: "var(--ds-text-callout)",
  color: "var(--ds-secondary-label)",
  lineHeight: 1.4,
};

export const dsFootnote: CSSProperties = {
  fontSize: "var(--ds-text-footnote)",
  color: "var(--ds-secondary-label)",
  lineHeight: 1.35,
};

export const dsCaption: CSSProperties = {
  fontSize: "var(--ds-text-caption-1)",
  color: "var(--ds-secondary-label)",
};

export const dsCaption2: CSSProperties = {
  fontSize: "var(--ds-text-caption-2)",
  color: "var(--ds-tertiary-label)",
};

export const dsStatValue: CSSProperties = {
  fontSize: "var(--ds-text-title-1)",
  fontWeight: 600,
  color: "var(--ds-label)",
  letterSpacing: "-0.02em",
  lineHeight: 1.1,
};

export const dsMono: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

export const dsVibrancy: CSSProperties = {
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
};
