import Link from "next/link";

export function ProjectStatCard({
  label,
  value,
  subtitle,
  icon,
  trend,
  href,
  onClick,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  href?: string;
  onClick?: () => void;
}) {
  const trendColor =
    trend === "up" ? "#248A3D" : trend === "down" ? "#FF3B30" : "#8E8E93";

  const interactive = Boolean(href || onClick);

  const content = (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "var(--ds-tertiary-label)",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </div>
        {icon && <div style={{ color: "var(--ds-accent)" }}>{icon}</div>}
      </div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: 600,
          color: "var(--ds-label)",
          letterSpacing: "-0.8px",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: "13px", color: trendColor, marginTop: "6px", fontWeight: 500 }}>
          {subtitle}
        </div>
      )}
    </>
  );

  const style = {
    background: "#FFFFFF",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)",
    padding: "16px",
    display: "block" as const,
    textDecoration: "none" as const,
    color: "inherit" as const,
    cursor: interactive ? "pointer" : "default",
    transition: interactive ? "box-shadow 0.12s, transform 0.12s" : undefined,
  };

  if (href) {
    return (
      <Link href={href} style={style}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          ...style,
          border: "none",
          width: "100%",
          textAlign: "left" as const,
        }}
      >
        {content}
      </button>
    );
  }

  return <div style={style}>{content}</div>;
}
