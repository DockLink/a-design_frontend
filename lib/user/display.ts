import type { User } from "@/types/users";

type UserNameFields = {
  email: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
};

export function normalizeUserFields<T extends UserNameFields>(
  user: T,
): T & { first_name: string; last_name: string } {
  return {
    ...user,
    first_name: user.first_name ?? user.firstName ?? "",
    last_name: user.last_name ?? user.lastName ?? "",
  };
}

export function getUserFullName(user: UserNameFields): string {
  const { first_name, last_name } = normalizeUserFields(user);
  return [first_name, last_name].filter(Boolean).join(" ");
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/** Primary label for lists — real name when set, otherwise derived from email. */
export function getUserListPrimaryLabel(user: UserNameFields): string {
  const fullName = getUserFullName(user);
  return fullName || nameFromEmail(user.email);
}

export function getUserDisplayName(user: UserNameFields): string {
  return getUserFullName(user) || user.email;
}

export function userMatchesSearch(user: UserNameFields, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const normalized = normalizeUserFields(user);
  const haystack = [
    normalized.first_name,
    normalized.last_name,
    getUserFullName(normalized),
    getUserListPrimaryLabel(normalized),
    normalized.email,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function getUserInitials(user: UserNameFields): string {
  const { first_name, last_name } = normalizeUserFields(user);
  const a = first_name?.[0] ?? "";
  const b = last_name?.[0] ?? "";
  if (a || b) return `${a}${b}`.toUpperCase();
  return (user.email[0]?.toUpperCase() ?? "?");
}

export function assigneeFromUser(user: User): { userId: string; name: string; initials: string } {
  return {
    userId: user.id,
    name: getUserListPrimaryLabel(user),
    initials: getUserInitials(user),
  };
}
