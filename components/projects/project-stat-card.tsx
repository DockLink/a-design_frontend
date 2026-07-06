export function ProjectStatCard({
  label,
  value,
  subtitle,
  icon,
  trend,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}) {
  const trendColor =
    trend === "up" ? "#248A3D" : trend === "down" ? "#FF3B30" : "#8E8E93";

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)",
        padding: "16px",
      }}
    >
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
    </div>
  );
}
