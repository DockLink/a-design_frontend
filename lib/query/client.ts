import { QueryClient } from "@tanstack/react-query";

/**
 * Singleton QueryClient shared across the app.
 * Defaults:
 *  - staleTime 30 s  → background refetch only after 30 s, avoiding
 *                      duplicate fetches when multiple components mount at once.
 *  - gcTime 5 min    → keep cached data in memory for 5 min after last observer.
 *  - retry 1         → retry once on transient network failure, not more.
 *  - refetchOnWindowFocus false → don't hammer the server on every Alt-Tab.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
