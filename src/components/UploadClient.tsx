"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { DRAFT_KEY } from "@/lib/local-store";

export default function UploadClient() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("Self");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Choose a workout-log image first.");
      return;
    }
    setStatus("Reading your log with AI...");
    const form = new FormData();
    form.append("image", file);
    form.append("type", type);
    form.append("date", date);
    form.append("notes", notes);

    const res = await fetch("/api/extract-workout", { method: "POST", body: form });
    const payload = await res.json();
    if (!res.ok) {
      setError(payload.error || "Extraction failed.");
      setStatus(null);
      return;
    }
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload.session, null, 2));
    router.push("/review");
  }

  return (
    <main className="wrap narrow">
      <header className="app-header">
        <div>
          <h1>📸 Upload Workout Log</h1>
          <div className="sub">Take a photo of a written/table workout log. AI extracts the sets, then you review before saving.</div>
        </div>
        <Link className="button ghost" href="/">Back to dashboard</Link>
      </header>

      <form className="upload-card" onSubmit={submit}>
        <label className="drop-zone">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {preview ? <img src={preview} alt="Workout log preview" /> : <div><strong>Choose image</strong><span>PNG, JPG, JPEG, or WEBP</span></div>}
        </label>

        <div className="form-grid">
          <div className="field">
            <label>Fallback Date</label>
            <input value={date} type="date" onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Session Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option>Self</option>
              <option>Coach</option>
            </select>
          </div>
        </div>

        <div className="field full">
          <label>Extra extraction hint / note</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Example: this is back + biceps; unreadable rows are probably cable pullover" />
        </div>

        {error ? <div className="error-box">{error}</div> : null}
        {status ? <div className="status-box">{status}</div> : null}
        <button className="button primary wide" type="submit">Extract workout</button>
      </form>
    </main>
  );
}
