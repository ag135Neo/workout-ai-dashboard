"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import seed from "@/data/seed-workouts.json";
import type { SetEntry, WorkoutData, WorkoutExercise, WorkoutSession } from "@/lib/types";
import {
  buildCellData,
  buildExerciseOrder,
  computePrFlags,
  deriveMuscleMap,
  loadValue,
  mergeSessions,
  muscleAbbr,
  satClass,
  sessionVolume,
  topSetLoad,
} from "@/lib/workout";
import { clearLocalSessions, readLocalSessions } from "@/lib/local-store";
import { SEED_USER_ID } from "@/lib/users";
import { useUser } from "./UserContext";
import UserSwitcher from "./UserSwitcher";
import BodyDiagram from "./BodyDiagram";
import VolumeChart from "./VolumeChart";

const seedData = seed as unknown as WorkoutData;

type CellData = Record<string, Record<string, WorkoutExercise>>;

function emptyData(): WorkoutData {
  return { sessions: [], muscleMap: {}, groupOrder: seedData.groupOrder };
}

export default function DashboardClient() {
  const { activeUser } = useUser();
  const [data, setData] = useState<WorkoutData>(() =>
    activeUser.id === SEED_USER_ID
      ? { sessions: seedData.sessions, muscleMap: seedData.muscleMap, groupOrder: seedData.groupOrder }
      : emptyData(),
  );
  const [muscle, setMuscle] = useState("__all__");
  const [exercise, setExercise] = useState("__all__");
  const [typeFilter, setTypeFilter] = useState("__all__");
  const [date, setDate] = useState("__all__");
  const [sourceNote, setSourceNote] = useState("Loading sessions...");

  useEffect(() => {
    const userId = activeUser.id;
    const seedSessions = userId === SEED_USER_ID ? seedData.sessions : [];
    const localSessions = readLocalSessions(userId);

    async function loadRemote() {
      try {
        const res = await fetch(`/api/sessions?userId=${encodeURIComponent(userId)}`);
        const payload = await res.json();
        const remoteSessions = Array.isArray(payload.sessions) ? payload.sessions : [];
        const sessions = mergeSessions(seedSessions, [...localSessions, ...remoteSessions]);
        setData({
          sessions,
          muscleMap: deriveMuscleMap(userId === SEED_USER_ID ? seedData.muscleMap : {}, sessions),
          groupOrder: seedData.groupOrder,
        });

        const parts: string[] = [];
        if (userId === SEED_USER_ID) parts.push(`${seedSessions.length} seed session(s)`);
        if (localSessions.length) parts.push(`${localSessions.length} browser-saved`);
        if (remoteSessions.length) parts.push(`${remoteSessions.length} from database`);
        if (!parts.length) {
          setSourceNote(`No sessions yet for ${activeUser.name}. Upload a log to get started.`);
        } else {
          setSourceNote(`Showing ${activeUser.name}: ${parts.join(" + ")}.`);
        }
      } catch {
        const sessions = mergeSessions(seedSessions, localSessions);
        setData({
          sessions,
          muscleMap: deriveMuscleMap(userId === SEED_USER_ID ? seedData.muscleMap : {}, sessions),
          groupOrder: seedData.groupOrder,
        });
        if (!sessions.length) {
          setSourceNote(`No sessions yet for ${activeUser.name}. Upload a log to get started.`);
        } else {
          setSourceNote(`Showing ${activeUser.name}: ${sessions.length} session(s).`);
        }
      }
    }

    setMuscle("__all__");
    setExercise("__all__");
    setTypeFilter("__all__");
    setDate("__all__");
    loadRemote();
  }, [activeUser.id, activeUser.name]);

  const sessions = data.sessions;
  const exerciseOrder = useMemo(() => buildExerciseOrder(data), [data]);
  const cellData = useMemo(() => buildCellData(exerciseOrder, sessions), [exerciseOrder, sessions]);
  const groupOptions = useMemo(() => {
    const present = new Set(exerciseOrder.map((n) => data.muscleMap[n] || "Other"));
    return data.groupOrder.filter((g) => present.has(g));
  }, [data.groupOrder, data.muscleMap, exerciseOrder]);

  const exerciseOptions = useMemo(() => {
    return exerciseOrder.filter((name) => muscle === "__all__" || (data.muscleMap[name] || "Other") === muscle);
  }, [data.muscleMap, exerciseOrder, muscle]);

  const dateOptions = useMemo(() => {
    return sessions.slice().reverse().filter((s) => typeFilter === "__all__" || s.type === typeFilter);
  }, [sessions, typeFilter]);

  useEffect(() => {
    if (exercise !== "__all__" && !exerciseOptions.includes(exercise)) setExercise("__all__");
  }, [exercise, exerciseOptions]);

  function handleResetLocal() {
    clearLocalSessions(activeUser.id);
    const seedSessions = activeUser.id === SEED_USER_ID ? seedData.sessions : [];
    setData({
      sessions: seedSessions,
      muscleMap: activeUser.id === SEED_USER_ID ? seedData.muscleMap : {},
      groupOrder: seedData.groupOrder,
    });
    setSourceNote(
      activeUser.id === SEED_USER_ID
        ? "Browser-saved sessions cleared. Seed data is still visible."
        : `Browser-saved sessions cleared for ${activeUser.name}.`,
    );
  }

  const isDateView = date !== "__all__";

  return (
    <main className="wrap">
      <header className="app-header">
        <div>
          <h1>🏋 Workout Progress Log</h1>
          <div className="sub">Pick a muscle group and/or an exercise to see its full history.</div>
          <div className="tiny-note">{sourceNote}</div>
        </div>
        <div className="top-actions">
          <UserSwitcher />
          <Link className="button primary" href="/upload">+ Upload log</Link>
          <button className="button ghost" onClick={handleResetLocal}>Clear browser saves</button>
        </div>
      </header>

      <VolumeChart sessions={sessions} typeFilter={typeFilter} onSelectDate={(selected) => setDate(selected)} />

      <div className="dashboard-top-row">
        <section className="controls">
          <div className="field">
            <label htmlFor="muscleSelect">Muscle Group</label>
            <select id="muscleSelect" value={muscle} disabled={isDateView} onChange={(e) => { setMuscle(e.target.value); setExercise("__all__"); }}>
              <option value="__all__">All Muscle Groups</option>
              {groupOptions.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="exerciseSelect">Exercise</label>
            <select id="exerciseSelect" value={exercise} disabled={isDateView} onChange={(e) => setExercise(e.target.value)}>
              <option value="__all__">{muscle === "__all__" ? "All Exercises" : `All in ${muscle}`}</option>
              {exerciseOptions.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="typeSelect">Session Type</label>
            <select id="typeSelect" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setDate("__all__"); }}>
              <option value="__all__">All Sessions</option>
              <option value="Coach">Coach</option>
              <option value="Self">Self</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="dateSelect">Date</label>
            <select id="dateSelect" value={date} onChange={(e) => setDate(e.target.value)}>
              <option value="__all__">All Dates</option>
              {dateOptions.map((s) => (
                <option key={`${s.date}-${s.type}-${s.muscle}`} value={s.date}>
                  {s.date}{s.muscle ? ` — ${s.muscle}` : ""}{s.type ? ` [${s.type}]` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="legend">
            <span><i className="swatch good" />Progressing</span>
            <span><i className="swatch bad" />Regressing</span>
            <span><i className="swatch same" />Same load</span>
            <span><i className="swatch pr" />PR</span>
            <span><i className="swatch first" />First time</span>
          </div>
        </section>

        <BodyDiagram group={muscle} />
      </div>

      <section className="results">
        {isDateView ? (
          <DayCard date={date} sessions={sessions} muscleMap={data.muscleMap} cellData={cellData} />
        ) : (
          <ExerciseResults
            exercise={exercise}
            muscle={muscle}
            exerciseOrder={exerciseOrder}
            muscleMap={data.muscleMap}
            sessions={sessions}
            cellData={cellData}
            typeFilter={typeFilter}
          />
        )}
      </section>
    </main>
  );
}

function ExerciseResults({ exercise, muscle, exerciseOrder, muscleMap, sessions, cellData, typeFilter }: {
  exercise: string;
  muscle: string;
  exerciseOrder: string[];
  muscleMap: Record<string, string>;
  sessions: WorkoutSession[];
  cellData: CellData;
  typeFilter: string;
}) {
  let namesToShow: string[] = [];
  if (exercise !== "__all__") namesToShow = [exercise];
  else if (muscle !== "__all__") namesToShow = exerciseOrder.filter((n) => (muscleMap[n] || "Other") === muscle);
  else namesToShow = exerciseOrder.slice();

  if (!namesToShow.length) return <div className="placeholder">No exercises match this selection.</div>;

  return <>{namesToShow.map((name) => <ExerciseCard key={name} exName={name} sessions={sessions} muscleMap={muscleMap} cellData={cellData} typeFilter={typeFilter} />)}</>;
}

function ExerciseCard({ exName, sessions, muscleMap, cellData, typeFilter }: {
  exName: string;
  sessions: WorkoutSession[];
  muscleMap: Record<string, string>;
  cellData: CellData;
  typeFilter: string;
}) {
  const group = muscleMap[exName] || "Other";
  const prFlags = computePrFlags(exName, sessions, cellData);
  const filteredSessions = typeFilter === "__all__" ? sessions : sessions.filter((s) => s.type === typeFilter);
  const maxSets = Math.max(1, ...filteredSessions.map((s) => (cellData[exName]?.[s.date] || { sets: [] }).sets.length));
  let lastLoad: number | null = null;

  const rows = filteredSessions.map((s) => {
    const ex = cellData[exName]?.[s.date];
    if (!ex) return null;
    const sets = ex.sets || [];
    const pr = prFlags[s.date] || { isPr: false, note: null };
    const curLoad = sets.length ? topSetLoad(sets) : null;
    let rowClass = "";

    if (sets.length && !pr.isPr && curLoad !== null) {
      if (lastLoad === null) rowClass = "first-cell";
      else if (curLoad > lastLoad) rowClass = "good-cell";
      else if (curLoad < lastLoad) rowClass = "bad-cell";
      else rowClass = "same-cell";
    }
    if (curLoad !== null) lastLoad = curLoad;

    const vol = sessionVolume(sets);
    return (
      <tr key={`${exName}-${s.date}`} title={pr.note ?? ""}>
        <td className="date-cell">{s.date}{s.type ? <span className={`type-tag ${s.type === "Coach" ? "coach" : "self"}`}>{s.type}</span> : null}</td>
        {Array.from({ length: maxSets }).map((_, k) => {
          if (k >= sets.length) return <td key={k} />;
          const [reps, weight] = sets[k];
          const setLoad = loadValue(weight);
          const isPrSet = pr.isPr && setLoad !== null && setLoad === curLoad;
          return <SetCell key={k} set={[reps, weight]} className={isPrSet ? "pr-cell" : rowClass} isPr={isPrSet} />;
        })}
        <td className="volume-cell">{vol !== null ? `${vol} kg` : "—"}</td>
        <td className={satClass(s.satisfaction)}>{s.satisfaction !== null && s.satisfaction !== undefined ? `${s.satisfaction}%` : "—"}</td>
        <td className="notes-cell">{s.notes || ""}</td>
      </tr>
    );
  }).filter(Boolean);

  if (!rows.length) {
    return <div className="card"><div className="card-head"><h2>{exName}</h2><span className="group-tag">{group}</span></div><div className="card-empty">No logged sessions for this exercise.</div></div>;
  }

  return (
    <div className="card">
      <div className="card-head"><h2>{exName}</h2><span className="group-tag">{group}</span></div>
      <div className="table-scroll">
        <table>
          <thead><tr><th className="left">Date</th>{Array.from({ length: maxSets }).map((_, k) => <th key={k}>Set {k + 1}</th>)}<th>Volume</th><th>Satisfaction</th><th>Notes</th></tr></thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </div>
  );
}

function DayCard({ date, sessions, muscleMap, cellData }: { date: string; sessions: WorkoutSession[]; muscleMap: Record<string, string>; cellData: CellData }) {
  const s = sessions.find((x) => x.date === date);
  if (!s) return <div className="placeholder">No session found for this date.</div>;
  const maxSets = Math.max(1, ...s.exercises.map((ex) => ex.sets.length));

  return (
    <div className="card">
      <div className="card-head">
        <h2>{s.date}{s.muscle ? ` · ${s.muscle}` : ""}</h2>
        <div className="head-badges">
          {s.type ? <span className={`group-tag type-border ${s.type === "Coach" ? "coach" : "self"}`}>{s.type}</span> : null}
          <span className={`group-tag ${satClass(s.satisfaction)}`}>{s.satisfaction !== null && s.satisfaction !== undefined ? `Satisfaction ${s.satisfaction}%` : "Satisfaction —"}</span>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th className="left">Exercise</th>{Array.from({ length: maxSets }).map((_, k) => <th key={k}>Set {k + 1}</th>)}<th>Volume</th></tr></thead>
          <tbody>
            {s.exercises.map((ex) => <DayExerciseRow key={`${s.date}-${ex.name}`} session={s} ex={ex} sessions={sessions} muscleMap={muscleMap} cellData={cellData} maxSets={maxSets} />)}
          </tbody>
        </table>
      </div>
      {s.notes ? <div className="card-note">{s.notes}</div> : null}
    </div>
  );
}

function DayExerciseRow({ session, ex, sessions, muscleMap, cellData, maxSets }: {
  session: WorkoutSession;
  ex: WorkoutExercise;
  sessions: WorkoutSession[];
  muscleMap: Record<string, string>;
  cellData: CellData;
  maxSets: number;
}) {
  const group = muscleMap[ex.name] || "Other";
  const prFlags = computePrFlags(ex.name, sessions, cellData);
  const pr = prFlags[session.date] || { isPr: false, note: null };
  const sets = ex.sets || [];

  if (!sets.length) {
    return <tr className="empty-row"><td className="date-cell">{ex.name}<div className="group-mini">{group}</div></td><td colSpan={maxSets}>— not logged —</td><td>—</td></tr>;
  }

  const idx = sessions.map((x) => x.date).indexOf(session.date);
  let lastLoad: number | null = null;
  for (let i = idx - 1; i >= 0; i--) {
    const prevEx = cellData[ex.name]?.[sessions[i].date];
    if (prevEx && prevEx.sets && prevEx.sets.length) {
      const load = topSetLoad(prevEx.sets);
      if (load !== null) { lastLoad = load; break; }
    }
  }

  const curLoad = topSetLoad(sets);
  let rowClass = "";
  if (!pr.isPr && curLoad !== null) {
    if (lastLoad === null) rowClass = "first-cell";
    else if (curLoad > lastLoad) rowClass = "good-cell";
    else if (curLoad < lastLoad) rowClass = "bad-cell";
    else rowClass = "same-cell";
  }
  const vol = sessionVolume(sets);

  return (
    <tr title={pr.note ?? ""}>
      <td className="date-cell">{ex.name}<div className="group-mini">{group}</div></td>
      {Array.from({ length: maxSets }).map((_, k) => {
        if (k >= sets.length) return <td key={k} />;
        const [reps, weight] = sets[k];
        const setLoad = loadValue(weight);
        const isPrSet = pr.isPr && setLoad !== null && setLoad === curLoad;
        return <SetCell key={k} set={[reps, weight]} className={isPrSet ? "pr-cell" : rowClass} isPr={isPrSet} />;
      })}
      <td className="volume-cell">{vol !== null ? `${vol} kg` : "—"}</td>
    </tr>
  );
}

function SetCell({ set, className, isPr }: { set: SetEntry; className: string; isPr: boolean }) {
  const [reps, weight] = set;
  return (
    <td className={`set-cell ${className}`}>
      <div className="reps">{reps || "-"}</div>
      <div className="wt">{weight && weight !== "" ? weight : "-"}</div>
      {isPr ? <span className="pr-tag">★ PR</span> : null}
    </td>
  );
}
