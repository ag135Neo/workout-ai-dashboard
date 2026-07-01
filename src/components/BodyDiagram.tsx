"use client";

import type { CSSProperties } from "react";

const MUSCLE_SVG_MAP: Record<string, string[]> = {
  Chest: ["m-chest-l", "m-chest-r"],
  Shoulders: ["m-delt-l-f", "m-delt-r-f", "m-rdelt-l", "m-rdelt-r"],
  Biceps: ["m-bicep-l", "m-bicep-r"],
  Core: ["m-core"],
  Quads: ["m-quad-l", "m-quad-r"],
  Back: ["m-lat-l", "m-lat-r", "m-lowerback"],
  "Back (Traps)": ["m-trap"],
  Triceps: ["m-tri-l", "m-tri-r"],
  Glutes: ["m-glute-l", "m-glute-r"],
  Hamstrings: ["m-ham-l", "m-ham-r"],
};

const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#14b8a6",
  Shoulders: "#a855f7",
  Biceps: "#ec4899",
  Core: "#84cc16",
  Quads: "#22c55e",
  Back: "#3b82f6",
  "Back (Traps)": "#60a5fa",
  Triceps: "#f59e0b",
  Glutes: "#f97316",
  Hamstrings: "#ef4444",
};

const ID_TO_GROUP = Object.fromEntries(Object.entries(MUSCLE_SVG_MAP).flatMap(([g, ids]) => ids.map((id) => [id, g])));

function muscleStyle(id: string, group: string): CSSProperties {
  const g = ID_TO_GROUP[id];
  if (group === "__all__") return { fill: MUSCLE_COLORS[g] || "#4b5563", opacity: 0.75, stroke: "none" };
  if (g === group) return { fill: MUSCLE_COLORS[group] || "#5b8cff", opacity: 1, stroke: "rgba(255,255,255,0.35)", strokeWidth: 1 };
  return { fill: "#111827", opacity: 0.3, stroke: "none" };
}

export default function BodyDiagram({ group }: { group: string }) {
  const s = (id: string) => muscleStyle(id, group);
  return (
    <aside id="bodyDiagramPanel">
      <h3>Muscle Map</h3>
      <svg id="muscleMapSvg" viewBox="0 0 300 392" width="100%" className="muscle-map-svg">
        <text x="75" y="390" textAnchor="middle" fontSize="9" fill="#6b7280" className="bd-label">FRONT</text>
        <text x="225" y="390" textAnchor="middle" fontSize="9" fill="#6b7280" className="bd-label">BACK</text>
        <line x1="150" y1="2" x2="150" y2="382" stroke="#232c47" strokeWidth="1" />

        <circle cx="75" cy="28" r="21" fill="#2d3748" />
        <path d="M67,49 L83,49 L82,67 L68,67 Z" fill="#2d3748" />
        <path d="M20,162 C14,176 13,196 19,208 L33,204 L40,190 L40,164 Z" fill="#1e293b" />
        <path d="M130,162 C136,176 137,196 131,208 L117,204 L110,190 L110,164 Z" fill="#1e293b" />
        <path d="M37,310 L53,310 L51,368 L35,368 Z" fill="#1e293b" />
        <path d="M97,310 L113,310 L115,368 L99,368 Z" fill="#1e293b" />
        <path d="M31,368 L55,368 L57,380 L29,380 Z" fill="#1e293b" />
        <path d="M95,368 L119,368 L121,380 L93,380 Z" fill="#1e293b" />
        <path d="M54,198 L96,198 L100,222 L50,222 Z" fill="#2d3748" />
        <path id="m-chest-l" className="muscle-path" style={s("m-chest-l")} d="M75,68 C60,68 46,74 40,82 C36,94 38,116 46,128 C52,132 64,134 75,132 Z" />
        <path id="m-chest-r" className="muscle-path" style={s("m-chest-r")} d="M75,68 C90,68 104,74 110,82 C114,94 112,116 104,128 C98,132 86,134 75,132 Z" />
        <path id="m-delt-l-f" className="muscle-path" style={s("m-delt-l-f")} d="M40,82 C26,78 13,88 13,103 C13,115 22,122 34,122 C38,116 42,106 44,96 C44,88 42,84 40,82 Z" />
        <path id="m-delt-r-f" className="muscle-path" style={s("m-delt-r-f")} d="M110,82 C124,78 137,88 137,103 C137,115 128,122 116,122 C112,116 108,106 106,96 C106,88 108,84 110,82 Z" />
        <path id="m-bicep-l" className="muscle-path" style={s("m-bicep-l")} d="M34,122 C20,130 13,150 17,165 C21,174 35,174 40,164 L40,140 L36,122 Z" />
        <path id="m-bicep-r" className="muscle-path" style={s("m-bicep-r")} d="M116,122 C130,130 137,150 133,165 C129,174 115,174 110,164 L110,140 L114,122 Z" />
        <path id="m-core" className="muscle-path" style={s("m-core")} d="M46,130 L104,130 L100,198 L50,198 Z" />
        <path id="m-quad-l" className="muscle-path" style={s("m-quad-l")} d="M50,222 C33,244 30,282 36,310 L53,310 C57,282 62,244 65,222 Z" />
        <path id="m-quad-r" className="muscle-path" style={s("m-quad-r")} d="M100,222 C117,244 120,282 114,310 L97,310 C93,282 88,244 85,222 Z" />

        <circle cx="225" cy="28" r="21" fill="#2d3748" />
        <path d="M217,49 L233,49 L232,67 L218,67 Z" fill="#2d3748" />
        <path d="M166,162 C160,176 159,196 165,208 L179,204 L186,190 L186,164 Z" fill="#1e293b" />
        <path d="M284,162 C290,176 291,196 285,208 L271,204 L264,190 L264,164 Z" fill="#1e293b" />
        <path d="M184,310 L200,310 L198,368 L182,368 Z" fill="#1e293b" />
        <path d="M250,310 L266,310 L268,368 L252,368 Z" fill="#1e293b" />
        <path d="M178,368 L202,368 L204,380 L176,380 Z" fill="#1e293b" />
        <path d="M248,368 L272,368 L274,380 L246,380 Z" fill="#1e293b" />
        <path id="m-trap" className="muscle-path" style={s("m-trap")} d="M200,70 C190,66 180,60 186,50 L204,46 L225,46 L246,46 L264,50 C270,60 260,66 250,70 C242,82 236,106 225,114 C214,106 208,82 200,70 Z" />
        <path id="m-rdelt-l" className="muscle-path" style={s("m-rdelt-l")} d="M188,80 C174,84 164,98 167,113 C171,122 183,122 189,114 C191,104 191,92 188,80 Z" />
        <path id="m-rdelt-r" className="muscle-path" style={s("m-rdelt-r")} d="M262,80 C276,84 286,98 283,113 C279,122 267,122 261,114 C259,104 259,92 262,80 Z" />
        <path id="m-lat-l" className="muscle-path" style={s("m-lat-l")} d="M200,72 L188,116 C183,138 184,170 191,188 L215,192 L219,114 C213,110 207,96 200,72 Z" />
        <path id="m-lat-r" className="muscle-path" style={s("m-lat-r")} d="M250,72 L262,116 C267,138 266,170 259,188 L235,192 L231,114 C237,110 243,96 250,72 Z" />
        <path id="m-lowerback" className="muscle-path" style={s("m-lowerback")} d="M191,188 L215,192 L225,192 L235,192 L259,188 L255,222 L195,222 Z" />
        <path id="m-tri-l" className="muscle-path" style={s("m-tri-l")} d="M167,112 C158,124 156,152 162,169 C166,178 181,178 185,169 L186,148 L186,114 Z" />
        <path id="m-tri-r" className="muscle-path" style={s("m-tri-r")} d="M283,112 C292,124 294,152 288,169 C284,178 269,178 265,169 L264,148 L264,114 Z" />
        <path id="m-glute-l" className="muscle-path" style={s("m-glute-l")} d="M195,222 L225,222 L222,280 C217,293 205,295 199,287 C191,277 190,255 193,237 Z" />
        <path id="m-glute-r" className="muscle-path" style={s("m-glute-r")} d="M255,222 L225,222 L228,280 C233,293 245,295 251,287 C259,277 260,255 257,237 Z" />
        <path id="m-ham-l" className="muscle-path" style={s("m-ham-l")} d="M193,237 C189,260 187,285 185,310 L201,310 C204,285 207,260 210,237 Z" />
        <path id="m-ham-r" className="muscle-path" style={s("m-ham-r")} d="M257,237 C261,260 263,285 265,310 L249,310 C246,285 243,260 240,237 Z" />
      </svg>
    </aside>
  );
}
