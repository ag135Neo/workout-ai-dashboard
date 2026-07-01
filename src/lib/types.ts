export type SetEntry = [string, string];

export interface WorkoutExercise {
  name: string;
  sets: SetEntry[];
  pr?: boolean;
  pr_note?: string;
}

export interface WorkoutSession {
  date: string;
  muscle: string;
  satisfaction?: number | null;
  notes?: string;
  exercises: WorkoutExercise[];
  type?: "Coach" | "Self" | string;
}

export interface WorkoutData {
  sessions: WorkoutSession[];
  muscleMap: Record<string, string>;
  groupOrder: string[];
}

export interface PrFlag {
  isPr: boolean;
  note: string | null;
}
