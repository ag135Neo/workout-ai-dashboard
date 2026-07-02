import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createUserFromName, SEED_USER_ID, SEED_USER_NAME } from "@/lib/users";
import type { User } from "@/lib/types";

export const runtime = "nodejs";

function defaultUsers(): User[] {
  return [{
    id: SEED_USER_ID,
    name: SEED_USER_NAME,
    createdAt: new Date().toISOString(),
  }];
}

export async function GET() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ users: defaultUsers(), source: "localStorage" });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, name, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users: User[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  }));

  if (!users.some((u) => u.id === SEED_USER_ID)) {
    users.unshift(defaultUsers()[0]);
  }

  return NextResponse.json({ users, source: "supabase" });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const id = typeof body?.id === "string" ? body.id : "";
  const createdAt = typeof body?.createdAt === "string" ? body.createdAt : new Date().toISOString();

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const user: User = id ? { id, name, createdAt } : createUserFromName(name);
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ user, persisted: false, message: "Saved in browser only." });
  }

  const { error } = await supabase.from("users").upsert({
    id: user.id,
    name: user.name,
    created_at: user.createdAt,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user, persisted: true });
}
