import type { User } from "@/types/users";

function initialsFromUser(user: User): string {
  const first = user.first_name?.[0] ?? "";
  const last = user.last_name?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || user.email[0]?.toUpperCase() || "?";
}

export function UserAvatar({ user, size = 32 }: { user: User; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#F5E6D0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 500,
        color: "#D4A96A",
        flexShrink: 0,
      }}
    >
      {initialsFromUser(user)}
    </div>
  );
}
