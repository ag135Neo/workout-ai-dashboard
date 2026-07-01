import type { PrFlag, SetEntry, WorkoutData, WorkoutExercise, WorkoutSession } from "./types";

export const DEFAULT_GROUP_ORDER = [
  "Hamstrings",
  "Glutes",
  "Back",
  "Back (Traps)",
  "Quads",
  "Shoulders",
  "Biceps",
  "Chest",
  "Triceps",
  "Core",
  "Other",
];

export function loadValue(weightStr: unknown): number | null {
  if (weightStr === null || weightStr === undefined) return null;
  let s = String(weightStr).toLowerCase().replace("kg", "").replace("(kb)", "").replace("(p)", "").trim();
  if (s === "" || s === "-") return null;

  let m = s.match(/^(\d+(?:\.\d+)?)\s*x\s*2/);
  if (m) return parseFloat(m[1]) * 2;

  m = s.match(/^(\d+(?:\.\d+)?)/);
  if (m) return parseFloat(m[1]);

  if (s.includes("bar")) return 0;
  return null;
}

export function repsValue(reps: unknown): number | null {
  if (reps === null || reps === undefined) return null;
  const m = String(reps).match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export function sessionVolume(sets: SetEntry[]): number | null {
  let total = 0;
  sets.forEach(([r, w]) => {
    const rv = repsValue(r);
    const wv = loadValue(w);
    if (rv !== null && wv !== null && wv > 0) total += rv * wv;
  });
  return total > 0 ? Math.round(total) : null;
}

export function topSetLoad(sets: SetEntry[]): number | null {
  const vals = sets.map(([, w]) => loadValue(w)).filter((v): v is number => v !== null);
  return vals.length ? Math.max(...vals) : null;
}

export function satClass(sat: number | null | undefined): string {
  if (sat === null || sat === undefined) return "";
  if (sat >= 75) return "sat-good";
  if (sat >= 50) return "sat-mid";
  return "sat-low";
}

export function groupRank(groupOrder: string[], g: string): number {
  const i = groupOrder.indexOf(g);
  return i === -1 ? 999 : i;
}

export function normalizeSession(input: unknown): WorkoutSession {
  const raw = (input ?? {}) as Record<string, unknown>;
  const today = new Date().toISOString().slice(0, 10);
  const dateRaw = typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : today;
  const exercisesRaw = Array.isArray(raw.exercises) ? raw.exercises : [];

  const exercises: WorkoutExercise[] = exercisesRaw
    .map((ex) => {
      const obj = (ex ?? {}) as Record<string, unknown>;
      const name = typeof obj.name === "string" && obj.name.trim() ? obj.name.trim() : "Unnamed Exercise";
      const rawSets = Array.isArray(obj.sets) ? obj.sets : [];
      const sets: SetEntry[] = rawSets.map((set) => {
        if (Array.isArray(set)) return [String(set[0] ?? ""), String(set[1] ?? "")];
        const setObj = (set ?? {}) as Record<string, unknown>;
        return [String(setObj.reps ?? ""), String(setObj.weight ?? "")];
      });
      return {
        name,
        sets,
        ...(typeof obj.pr === "boolean" ? { pr: obj.pr } : {}),
        ...(typeof obj.pr_note === "string" ? { pr_note: obj.pr_note } : {}),
      };
    })
    .filter((ex) => ex.name !== "Unnamed Exercise" || ex.sets.length > 0);

  const satisfaction = typeof raw.satisfaction === "number" ? Math.max(0, Math.min(100, Math.round(raw.satisfaction))) : null;
  const type = typeof raw.type === "string" && raw.type.trim() ? raw.type.trim() : "Self";
  const muscle = typeof raw.muscle === "string" && raw.muscle.trim() ? raw.muscle.trim() : inferSessionMuscle(exercises.map((e) => e.name));

  return {
    date: dateRaw,
    muscle,
    satisfaction,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    exercises,
    type,
  };
}

export function mergeSessions(base: WorkoutSession[], extras: WorkoutSession[]): WorkoutSession[] {
  const byKey = new Map<string, WorkoutSession>();
  [...base, ...extras].forEach((s) => {
    const normalized = normalizeSession(s);
    const key = `${normalized.date}::${normalized.type ?? ""}::${normalized.muscle ?? ""}`;
    byKey.set(key, normalized);
  });
  return Array.from(byKey.values()).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function inferPrimaryMuscle(exerciseName: string): string {
  const n = exerciseName.toLowerCase();
  if (/(leg curl|rdl|romanian|hamstring)/.test(n)) return "Hamstrings";
  if (/(glute|kickback|hip thrust|sumo)/.test(n)) return "Glutes";
  if (/(lat|pulldown|pullover|row|t-bar|shrug|deadlift)/.test(n)) return n.includes("shrug") ? "Back (Traps)" : "Back";
  if (/(leg ext|quad|leg press|squat|lunge)/.test(n)) return "Quads";
  if (/(ohp|shoulder|lateral raise|front raise|delt)/.test(n)) return "Shoulders";
  if (/(bicep|curl|hammer)/.test(n)) return "Biceps";
  if (/(chest|press|fly|bench|incline|pec)/.test(n)) return "Chest";
  if (/(tricep|pushdown|skullcrusher|extension)/.test(n)) return "Triceps";
  if (/(crunch|plank|leg raise|russian|core|ab)/.test(n)) return "Core";
  return "Other";
}

export function inferSessionMuscle(exerciseNames: string[]): string {
  const ordered = DEFAULT_GROUP_ORDER;
  const present = new Set(exerciseNames.map(inferPrimaryMuscle).filter((g) => g !== "Other"));
  return ordered.filter((g) => present.has(g)).slice(0, 3).join(", ") || "Other";
}

export function deriveMuscleMap(existing: Record<string, string>, sessions: WorkoutSession[]): Record<string, string> {
  const next = { ...existing };
  sessions.forEach((s) => {
    s.exercises.forEach((ex) => {
      if (!next[ex.name]) next[ex.name] = inferPrimaryMuscle(ex.name);
    });
  });
  return next;
}

export function buildExerciseOrder(data: WorkoutData): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  data.sessions.forEach((s) =>
    s.exercises.forEach((ex) => {
      if (!seen.has(ex.name)) {
        seen.add(ex.name);
        order.push(ex.name);
      }
    }),
  );
  order.sort((a, b) => {
    const ga = data.muscleMap[a] || "Other";
    const gb = data.muscleMap[b] || "Other";
    const ra = groupRank(data.groupOrder, ga);
    const rb = groupRank(data.groupOrder, gb);
    if (ra !== rb) return ra - rb;
    return 0;
  });
  return order;
}

export function buildCellData(exerciseOrder: string[], sessions: WorkoutSession[]): Record<string, Record<string, WorkoutExercise>> {
  const cellData: Record<string, Record<string, WorkoutExercise>> = {};
  exerciseOrder.forEach((name) => (cellData[name] = {}));
  sessions.forEach((s) => s.exercises.forEach((ex) => (cellData[ex.name] ??= {})[s.date] = ex));
  return cellData;
}

export function computePrFlags(
  exName: string,
  sessions: WorkoutSession[],
  cellData: Record<string, Record<string, WorkoutExercise>>,
): Record<string, PrFlag> {
  let runningMaxLoad: number | null = null;
  let runningBestRepsAtMax: number | null = null;
  const flags: Record<string, PrFlag> = {};

  sessions.forEach((s) => {
    const ex = cellData[exName]?.[s.date];
    const sets = ex ? ex.sets : [];
    const priorMaxLoad = runningMaxLoad;
    const priorBestReps = runningBestRepsAtMax;

    if (sets && sets.length) {
      const load = topSetLoad(sets);
      if (load !== null) {
        let repsAtTop: number | null = null;
        sets.forEach(([r, w]) => {
          if (loadValue(w) === load) {
            const rv = repsValue(r);
            if (rv !== null && (repsAtTop === null || rv > repsAtTop)) repsAtTop = rv;
          }
        });

        let isPr = false;
        let note: string | null = null;
        if (priorMaxLoad === null) {
          // First ever session is baseline, not PR.
        } else if (load > priorMaxLoad) {
          isPr = true;
          note = `New top weight: ${load}`;
        } else if (load === priorMaxLoad && repsAtTop !== null && priorBestReps !== null && repsAtTop > priorBestReps) {
          isPr = true;
          note = `Same weight (${load}), more reps: ${repsAtTop}`;
        }

        flags[s.date] = { isPr, note };

        if (runningMaxLoad === null || load > runningMaxLoad) {
          runningMaxLoad = load;
          runningBestRepsAtMax = repsAtTop;
        } else if (load === runningMaxLoad && repsAtTop !== null) {
          runningBestRepsAtMax = Math.max(runningBestRepsAtMax || 0, repsAtTop);
        }
      }
    }
  });

  return flags;
}

export function muscleAbbr(m: string): string {
  if (!m) return "";
  const map: Record<string, string> = {
    Hamstrings: "Hams",
    Glutes: "Glts",
    Back: "Back",
    Chest: "Chst",
    Quads: "Qds",
    Shoulders: "Dlts",
    Biceps: "Bis",
    Triceps: "Tris",
    Core: "Core",
    "Biceps, Triceps": "Bi+Tri",
    "Chest, Back": "Ch+Bk",
  };
  if (map[m]) return map[m];
  const parts = m.split(",").map((p) => p.trim());
  return parts.slice(0, 2).map((p) => map[p] || p.slice(0, 4)).join("+");
}
