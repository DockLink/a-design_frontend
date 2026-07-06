import type { User, UserRole } from "./users";

export interface LoginRequest {
  email: string;
  password: string;
}

/** Raw payload from POST /v2/auth/login (Supabase). */
export interface BackendLoginResponse {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  source?: "supabase";
  user: User;
}

/** Normalized login payload returned by the Next.js `/api/auth/login` proxy. */
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  expiresIn?: number;
  source: "supabase";
  user: User;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  expiresIn?: number;
  source: "supabase";
  user: User;
  /** Supabase auth.sessions row id (from JWT session_id claim). */
  sessionId?: string;
}

export interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  /** Exchanges the refresh token for a fresh access token. Returns the new token, or null if the session is unrecoverable. */
  refreshSession: () => Promise<string | null>;
  hasRole: (...roles: UserRole[]) => boolean;
  primaryRole: UserRole | null;
}
