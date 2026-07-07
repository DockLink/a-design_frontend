/** Leading numeric prefix from project names like "0395_ID_OCEANA…". */
export function projectNameNumericPrefix(name: string | null | undefined): number {
  if (!name) return 0;
  const match = name.trim().match(/^(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export function compareProjectsByNamePrefixDesc<T extends { name?: string | null; created_at?: string | null }>(
  a: T,
  b: T,
): number {
  const prefixDiff = projectNameNumericPrefix(b.name) - projectNameNumericPrefix(a.name);
  if (prefixDiff !== 0) return prefixDiff;

  const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
  return bTime - aTime;
}
