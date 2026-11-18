import type { ReactNode } from "react";
import type { NoteColor } from "@/lib/types";

/* Trama guilloché precalculada una sola vez (coordenadas con 1 decimal). */
const W = 400;
const H = 240;

function wave(base: number, amp: number, freq: number, phase: number) {
  let d = "";
  for (let x = 0; x <= W; x += 8) {
    const y = base + amp * Math.sin((x / W) * Math.PI * 2 * freq + phase);
    d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`;
  }
  return d;
}

const WAVES = Array.from({ length: 18 }, (_, i) => wave(18 + i * 12, 7 + (i % 3) * 2, 2.5, i * 0.45));

/** Hipotrocoide: la curva clásica de las rosetas de los billetes. Escala `R`, `r` enteros. */
function rosette(cx: number, cy: number, scale: number, R: number, r: number, dist: number) {
  let d = "";
  const k = (R - r) / r;
  const turns = r; // R y r coprimos: la curva cierra tras r vueltas
  const steps = 160 * turns;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * turns;
    const x = cx + scale * ((R - r) * Math.cos(t) + dist * Math.cos(k * t));
    const y = cy + scale * ((R - r) * Math.sin(t) - dist * Math.sin(k * t));
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + "Z";
}

const ROSETTE = [rosette(332, 70, 3.2, 13, 5, 9), rosette(332, 70, 1.9, 11, 4, 6)];

function Pattern() {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 size-full text-note-accent"
      aria-hidden
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.16">
        {WAVES.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.38">
        {ROSETTE.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

/** Billete: superficie impresa con trama, roseta y borde interior. Siempre igual en claro y oscuro. */
export function Banknote({ color, className = "", children }: { color: NoteColor; className?: string; children: ReactNode }) {
  return (
    <div
      className={`note-${color} relative isolate overflow-hidden rounded-note bg-note-bg text-note-ink shadow-note ${className}`}
    >
      <Pattern />
      <span className="pointer-events-none absolute inset-1.5 rounded-[13px] border border-note-accent/35" aria-hidden />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Rótulo impreso del billete (nombre de la cuenta). */
export function NoteLabel({ children }: { children: ReactNode }) {
  return <span className="font-display text-sm font-semibold tracking-[0.08em] uppercase">{children}</span>;
}
