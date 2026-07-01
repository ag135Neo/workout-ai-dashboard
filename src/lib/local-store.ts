import type { WorkoutSession } from "./types";
import { mergeSessions, normalizeSession } from "./workout";

export const USER_ID_KEY = "workout-progress-user-id";
export const EXTRA_SESSIONS_KEY = "workout-extra-sessions";
export const DRAFT_KEY = "workout-draft-session";

export function getBrowserUserId(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;
  const fallback = process.env.NEXT_PUBLIC_DEMO_USER_ID || `user-${crypto.randomUUID()}`;
  window.localStorage.setItem(USER_ID_KEY, fallback);
  return fallback;
}

export function readLocalSessions(): WorkoutSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(EXTRA_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeSession) : [];
  } catch {
    return [];
  }
}

export function writeLocalSession(session: WorkoutSession): WorkoutSession[] {
  const existing = readLocalSessions();
  const merged = mergeSessions(existing, [session]);
  window.localStorage.setItem(EXTRA_SESSIONS_KEY, JSON.stringify(merged, null, 2));
  return merged;
}

export function clearLocalSessions(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(EXTRA_SESSIONS_KEY);
}
