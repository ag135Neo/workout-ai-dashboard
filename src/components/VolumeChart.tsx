"use client";

import { useMemo, useState } from "react";
import type { WorkoutSession } from "@/lib/types";
import { loadValue, muscleAbbr, repsValue } from "@/lib/workout";

export default function VolumeChart({ sessions, typeFilter, onSelectDate }: {
  sessions: WorkoutSession[];
  typeFilter: string;
  onSelectDate: (date: string) => void;
}) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; html: string } | null>(null);
  const sessionData = useMemo(() => {
    const filtered = typeFilter === "__all__" ? sessions : sessions.filter((s) => s.type === typeFilter);
    return filtered.map((s) => {
      let vol = 0;
      s.exercises.forEach((ex) => {
        ex.sets.forEach(([r, w]) => {
          const rv = repsValue(r);
          const wv = loadValue(w);
          if (rv && wv) vol += rv * wv;
        });
      });
      return { date: s.date, muscle: s.muscle || "", type: s.type || "Self", vol: Math.round(vol), sat: s.satisfaction };
    });
  }, [sessions, typeFilter]);

  if (!sessionData.length) {
    return <section className="volume-chart"><div className="chart-empty">No sessions to chart.</div></section>;
  }

  const maxVol = Math.max(...sessionData.map((d) => d.vol), 1);
  const H = 160;
  const W = Math.max(820, sessionData.length * 40);
  const BAR_GAP = 4;
  const barW = Math.max(10, Math.floor((W - BAR_GAP * (sessionData.length - 1)) / sessionData.length));
  const totalW = sessionData.length * barW + (sessionData.length - 1) * BAR_GAP;
  const labelH = 52;
  const coachColor = "#3b82f6";
  const selfColor = "#84cc16";

  return (
    <section className="volume-chart">
      <div className="chart-head">
        <span>Total Session Volume (kg)</span>
        <div className="chart-legend"><span className="coach-dot">● Coach</span><span className="self-dot">● Self</span></div>
      </div>
      <div className="chart-scroll">
        <svg width="100%" height={H + labelH} viewBox={`-30 0 ${totalW + 34} ${H + labelH}`} preserveAspectRatio="none" className="chart-svg">
          {[0.25, 0.5, 0.75, 1].map((frac) => {
            const yg = H - Math.round(frac * H);
            const label = `${(Math.round((frac * maxVol) / 100) / 10).toFixed(1)}k`;
            return <g key={frac}><line x1="0" y1={yg} x2={totalW} y2={yg} className="grid-line" /><text x="-4" y={yg + 4} textAnchor="end" fontSize="9" fill="#4b5563">{label}</text></g>;
          })}
          {sessionData.map((d, i) => {
            const bh = Math.max(3, Math.round((d.vol / maxVol) * H));
            const x = i * (barW + BAR_GAP);
            const y = H - bh;
            const color = d.type === "Coach" ? coachColor : selfColor;
            const cx = x + barW / 2;
            const tip = `<strong>${d.date}</strong><br>${d.muscle}<br>${d.type}<br>Volume: ${d.vol.toLocaleString()} kg<br>Satisfaction: ${d.sat ?? "—"}${d.sat ? "%" : ""}`;
            return <g key={`${d.date}-${i}`}>
              <rect
                className="chart-bar"
                x={x}
                y={y}
                width={barW}
                height={bh}
                rx="3"
                fill={color}
                onMouseMove={(e) => setTooltip({ x: e.clientX + 14, y: e.clientY - 10, html: tip })}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => onSelectDate(d.date)}
              />
              <text transform={`translate(${cx},${H + 6}) rotate(45)`} textAnchor="start" fontSize="9" fill="#9ca3af">{muscleAbbr(d.muscle)}</text>
            </g>;
          })}
        </svg>
      </div>
      {tooltip ? <div className="chart-tooltip react-tooltip" style={{ left: tooltip.x, top: tooltip.y }} dangerouslySetInnerHTML={{ __html: tooltip.html }} /> : null}
    </section>
  );
}
