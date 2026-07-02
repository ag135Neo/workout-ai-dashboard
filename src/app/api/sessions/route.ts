import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeSession } from "@/lib/workout";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || "juanita-nidhindra";
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ sessions: [], source: "localStorage", message: "Supabase is not configured." });
  }

  const { data, error } = await supabase
    .from("workout_sessions")
    .select("payload")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: (data ?? []).map((row) => normalizeSession(row.payload)), source: "supabase" });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "juanita-nidhindra";
  const session = normalizeSession(body?.session);
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ ok: true, persisted: false, message: "Saved in browser only. Add Supabase env vars for DB persistence.", session });
  }

  const { error } = await supabase.from("workout_sessions").upsert(
    {
      user_id: userId,
      date: session.date,
      payload: session,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, persisted: true, session });
}
