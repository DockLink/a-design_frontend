import type { User } from "@/types/users";

export function getUserDisplayName(user: User): string {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
}

export function getUserInitials(user: User): string {
  const a = user.first_name?.[0] ?? "";
  const b = user.last_name?.[0] ?? "";
  return `${a}${b}`.toUpperCase() || user.email[0]?.toUpperCase() || "?";
}