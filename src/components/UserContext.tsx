"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@/lib/types";
import {
  addUser,
  ensureUsersInitialized,
  getActiveUser,
  mergeUsers,
  readUsers,
  setActiveUserId,
  writeUsers,
} from "@/lib/users";

interface UserContextValue {
  users: User[];
  activeUser: User;
  switchUser: (userId: string) => void;
  createUser: (name: string) => Promise<User>;
  refreshUsers: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User>(() => getActiveUser());

  const refreshUsers = useCallback(async () => {
    const localUsers = ensureUsersInitialized();
    try {
      const res = await fetch("/api/users");
      const payload = await res.json();
      const remoteUsers = Array.isArray(payload.users) ? payload.users : [];
      const merged = mergeUsers(localUsers, remoteUsers);
      writeUsers(merged);
      setUsers(merged);
    } catch {
      setUsers(localUsers);
    }
    setActiveUser(getActiveUser());
  }, []);

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  const switchUser = useCallback((userId: string) => {
    setActiveUserId(userId);
    setActiveUser(getActiveUser());
  }, []);

  const createUser = useCallback(async (name: string) => {
    const user = addUser(name);
    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: user.id, name: user.name, createdAt: user.createdAt }),
      });
    } catch {
      // local user is still created
    }
    const nextUsers = readUsers();
    setUsers(nextUsers);
    setActiveUser(user);
    return user;
  }, []);

  const value = useMemo(
    () => ({ users, activeUser, switchUser, createUser, refreshUsers }),
    [users, activeUser, switchUser, createUser, refreshUsers],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
