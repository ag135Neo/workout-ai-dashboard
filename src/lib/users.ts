import type { User } from "./types";

export const SEED_USER_ID = "juanita-nidhindra";
export const SEED_USER_NAME = "Juanita Nidhindra";

export const USERS_KEY = "workout-users";
export const ACTIVE_USER_KEY = "workout-active-user-id";

export function createDefaultUser(): User {
  return {
    id: SEED_USER_ID,
    name: SEED_USER_NAME,
    createdAt: new Date().toISOString(),
  };
}

export function slugifyName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "user";
}

export function createUserFromName(name: string): User {
  const trimmed = name.trim();
  const slug = slugifyName(trimmed);
  const suffix = crypto.randomUUID().slice(0, 8);
  return {
    id: `${slug}-${suffix}`,
    name: trimmed,
    createdAt: new Date().toISOString(),
  };
}

export function readUsers(): User[] {
  if (typeof window === "undefined") return [createDefaultUser()];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeUsers(users: User[]): void {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users, null, 2));
}

export function getActiveUserId(): string {
  if (typeof window === "undefined") return SEED_USER_ID;
  return window.localStorage.getItem(ACTIVE_USER_KEY) || SEED_USER_ID;
}

export function setActiveUserId(userId: string): void {
  window.localStorage.setItem(ACTIVE_USER_KEY, userId);
}

export function getActiveUser(): User {
  const users = ensureUsersInitialized();
  const activeId = getActiveUserId();
  return users.find((u) => u.id === activeId) ?? users[0] ?? createDefaultUser();
}

export function ensureUsersInitialized(): User[] {
  let users = readUsers();
  if (!users.length) {
    users = [createDefaultUser()];
    writeUsers(users);
    setActiveUserId(SEED_USER_ID);
  } else if (!users.some((u) => u.id === SEED_USER_ID)) {
    users = [createDefaultUser(), ...users];
    writeUsers(users);
  }
  const activeId = getActiveUserId();
  if (!users.some((u) => u.id === activeId)) {
    setActiveUserId(users[0].id);
  }
  return users;
}

export function addUser(name: string): User {
  const users = ensureUsersInitialized();
  const user = createUserFromName(name);
  writeUsers([...users, user]);
  setActiveUserId(user.id);
  return user;
}

export function mergeUsers(local: User[], remote: User[]): User[] {
  const map = new Map<string, User>();
  for (const user of remote) map.set(user.id, user);
  for (const user of local) map.set(user.id, user);
  if (!map.has(SEED_USER_ID)) map.set(SEED_USER_ID, createDefaultUser());
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
