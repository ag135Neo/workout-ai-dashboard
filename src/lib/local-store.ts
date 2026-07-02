import type { WorkoutSession } from "./types";
import { mergeSessions, normalizeSession } from "./workout";
import { SEED_USER_ID, getActiveUserId } from "./users";

export const LEGACY_USER_ID_KEY = "workout-progress-user-id";
export const LEGACY_EXTRA_SESSIONS_KEY = "workout-extra-sessions";
export const SESSIONS_BY_USER_KEY = "workout-sessions-by-user";
export const DRAFT_KEY_PREFIX = "workout-draft-session";

let migrated = false;

function migrateLegacyStorage(): void {
  if (migrated || typeof window === "undefined") return;
  migrated = true;

  const legacySessions = window.localStorage.getItem(LEGACY_EXTRA_SESSIONS_KEY);
  if (legacySessions) {
    try {
      const parsed = JSON.parse(legacySessions);
      if (Array.isArray(parsed) && parsed.length) {
        const map = readSessionsMap();
        const existing = map[SEED_USER_ID] || [];
        map[SEED_USER_ID] = mergeSessions(existing, parsed.map(normalizeSession));
        writeSessionsMap(map);
      }
    } catch {
      // ignore invalid legacy data
    }
    window.localStorage.removeItem(LEGACY_EXTRA_SESSIONS_KEY);
  }

  window.localStorage.removeItem(LEGACY_USER_ID_KEY);
}

function readSessionsMap(): Record<string, WorkoutSession[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SESSIONS_BY_USER_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const map: Record<string, WorkoutSession[]> = {};
    for (const [userId, sessions] of Object.entries(parsed)) {
      if (Array.isArray(sessions)) map[userId] = sessions.map(normalizeSession);
    }
    return map;
  } catch {
    return {};
  }
}

function writeSessionsMap(map: Record<string, WorkoutSession[]>): void {
  window.localStorage.setItem(SESSIONS_BY_USER_KEY, JSON.stringify(map, null, 2));
}

export function getBrowserUserId(): string {
  migrateLegacyStorage();
  return getActiveUserId();
}

export function readLocalSessions(userId?: string): WorkoutSession[] {
  migrateLegacyStorage();
  const id = userId ?? getActiveUserId();
  return readSessionsMap()[id] || [];
}

export function writeLocalSession(session: WorkoutSession, userId?: string): WorkoutSession[] {
  migrateLegacyStorage();
  const id = userId ?? getActiveUserId();
  const map = readSessionsMap();
  const existing = map[id] || [];
  const merged = mergeSessions(existing, [session]);
  map[id] = merged;
  writeSessionsMap(map);
  return merged;
}

export function clearLocalSessions(userId?: string): void {
  migrateLegacyStorage();
  const id = userId ?? getActiveUserId();
  const map = readSessionsMap();
  delete map[id];
  writeSessionsMap(map);
}

export function draftKey(userId?: string): string {
  return `${DRAFT_KEY_PREFIX}-${userId ?? getActiveUserId()}`;
}

export function readDraft(userId?: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(draftKey(userId));
}

export function writeDraft(json: string, userId?: string): void {
  window.localStorage.setItem(draftKey(userId), json);
}

export function clearDraft(userId?: string): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(draftKey(userId));
}

/** @deprecated Use draftKey() instead */
export const DRAFT_KEY = DRAFT_KEY_PREFIX;

/** @deprecated Use SESSIONS_BY_USER_KEY instead */
export const EXTRA_SESSIONS_KEY = LEGACY_EXTRA_SESSIONS_KEY;

/** @deprecated Use getActiveUserId() from users.ts instead */
export const USER_ID_KEY = LEGACY_USER_ID_KEY;
