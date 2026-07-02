"use client";

import { FormEvent, useState } from "react";
import { useUser } from "./UserContext";

export default function UserSwitcher() {
  const { users, activeUser, switchUser, createUser } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    void createUser(trimmed).then(() => {
      setNewName("");
      setShowForm(false);
    });
  }

  return (
    <div className="user-switcher">
      <div className="field user-field">
        <label htmlFor="userSelect">User</label>
        <select
          id="userSelect"
          value={activeUser.id}
          onChange={(e) => switchUser(e.target.value)}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>
      {!showForm ? (
        <button className="button ghost user-add-btn" type="button" onClick={() => setShowForm(true)}>
          + New user
        </button>
      ) : (
        <form className="user-create-form" onSubmit={handleCreate}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Full name"
            autoFocus
          />
          <button className="button primary" type="submit" disabled={!newName.trim()}>Add</button>
          <button className="button ghost" type="button" onClick={() => { setShowForm(false); setNewName(""); }}>Cancel</button>
        </form>
      )}
    </div>
  );
}
