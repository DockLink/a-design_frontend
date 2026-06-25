export function ProjectEmptyTab({ title, message }: { title: string; message: string }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)",
        padding: "32px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "18px", fontWeight: 600, color: "#1C1C1E", marginBottom: "8px" }}>
        {title}
      </div>
      <div style={{ fontSize: "14px", color: "#8E8E93", lineHeight: 1.6 }}>{message}</div>
    </div>
  );
}
