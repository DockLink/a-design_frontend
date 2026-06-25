export function UserPill({
  bg,
  color,
  children,
}: {
  bg: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        background: bg,
        color,
        fontSize: "11px",
        fontWeight: 500,
        borderRadius: "9999px",
        padding: "2px 8px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
