"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { WorkoutSession } from "@/lib/types";
import { clearDraft, readDraft, writeLocalSession } from "@/lib/local-store";
import { normalizeSession } from "@/lib/workout";
import { useUser } from "./UserContext";
import UserSwitcher from "./UserSwitcher";

export default function ReviewClient() {
  const router = useRouter();
  const { activeUser } = useUser();
  const [jsonText, setJsonText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = readDraft(activeUser.id);
    if (raw) setJsonText(raw);
    else setJsonText("");
  }, [activeUser.id]);

  async function save() {
    setError(null);
    try {
      const session = normalizeSession(JSON.parse(jsonText)) as WorkoutSession;
      writeLocalSession(session, activeUser.id);
      setMessage(`Saved in browser for ${activeUser.name}. Syncing to DB if configured...`);
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: activeUser.id, session }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "DB save failed");
      clearDraft(activeUser.id);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  let parsed: WorkoutSession | null = null;
  try { parsed = jsonText ? normalizeSession(JSON.parse(jsonText)) : null; } catch { parsed = null; }

  return (
    <main className="wrap narrow">
      <header className="app-header">
        <div>
          <h1>✅ Review Extraction</h1>
          <div className="sub">Fix anything the AI guessed wrong, then save it into the dashboard for {activeUser.name}.</div>
        </div>
        <div className="top-actions">
          <UserSwitcher />
          <Link className="button ghost" href="/upload">Back to upload</Link>
        </div>
      </header>

      {!jsonText ? <div className="placeholder">No draft found for {activeUser.name}. Upload an image first.</div> : null}

      {parsed ? (
        <section className="review-summary">
          <div><strong>{parsed.date}</strong><span>{parsed.muscle}</span></div>
          <div><strong>{parsed.type}</strong><span>{parsed.exercises.length} exercises</span></div>
          <div><strong>{parsed.satisfaction ?? "—"}{parsed.satisfaction ? "%" : ""}</strong><span>satisfaction</span></div>
        </section>
      ) : null}

      <textarea className="json-editor" value={jsonText} onChange={(e) => setJsonText(e.target.value)} spellCheck={false} />

      {error ? <div className="error-box">{error}</div> : null}
      {message ? <div className="status-box">{message}</div> : null}

      <div className="action-row">
        <button className="button primary" onClick={save} disabled={!jsonText}>Save to dashboard</button>
        <Link className="button ghost" href="/">Cancel</Link>
      </div>
    </main>
  );
}
