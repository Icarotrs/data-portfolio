import type { CSSProperties, ReactElement } from "react";
import type { Shape } from "@site";

/**
 * Small animated shapes, one per project type (see site.config.ts →
 * kindShapes). Plain SVG / CSS: transforms and opacity only, no canvas.
 * Animations are defined in globals.css under "Glyphs".
 */
export function Glyph({ shape, className = "" }: { shape: Shape; className?: string }) {
  const Comp = SHAPES[shape];
  return <Comp className={`glyph ${className}`} />;
}

type Props = { className: string };

// Deterministic pseudo-random numbers so server and client agree.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Nodes joined by lines, with pulses running along the connections. */
function Nodes({ className }: Props) {
  const n = [
    [22, 30],
    [64, 18],
    [98, 46],
    [40, 78],
    [86, 98],
  ];
  const links = [
    [0, 1],
    [1, 2],
    [0, 3],
    [3, 2],
    [3, 4],
    [2, 4],
  ];
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      {links.map(([a, b], i) => (
        <line key={i} x1={n[a][0]} y1={n[a][1]} x2={n[b][0]} y2={n[b][1]} stroke="currentColor" strokeOpacity=".45" strokeWidth="1.2" />
      ))}
      {links.map(([a, b], i) => (
        <circle key={`p${i}`} r="2.6" className="glyph-pulse" fill="var(--accent)">
          <animateMotion dur={`${1.8 + (i % 3) * 0.5}s`} begin={`-${i * 0.35}s`} repeatCount="indefinite" path={`M${n[a][0]},${n[a][1]} L${n[b][0]},${n[b][1]}`} />
        </circle>
      ))}
      {n.map(([x, y], i) => (
        <circle key={`n${i}`} cx={x} cy={y} r={i === 2 ? 7 : 5} fill="var(--card)" stroke={i === 2 ? "var(--accent)" : "currentColor"} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

/** Wireframe torus: rings and spokes seen from above, spinning, squashed into a tilt. */
function Torus({ className }: Props) {
  const spokes = Array.from({ length: 18 }, (_, i) => (i / 18) * Math.PI * 2);
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <g transform="translate(60 60) scale(1 .42)">
        <g className="glyph-spin">
          {[20, 29, 38, 47].map((r, i) => (
            <circle key={r} r={r} fill="none" stroke={i === 2 ? "var(--accent)" : "currentColor"} strokeOpacity={i === 2 ? 1 : 0.5} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          ))}
          {spokes.map((a, i) => (
            <line
              key={i}
              x1={Math.cos(a) * 20}
              y1={Math.sin(a) * 20}
              x2={Math.cos(a) * 47}
              y2={Math.sin(a) * 47}
              stroke="currentColor"
              strokeOpacity=".45"
              strokeWidth="1.1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </g>
    </svg>
  );
}

/** A loose cloud of particles that gathers into three groups and back. */
function Clusters({ className }: Props) {
  const r = rng(7);
  const centers = [
    [-26, -18],
    [24, -12],
    [-2, 28],
  ];
  const dots = Array.from({ length: 24 }, (_, i) => {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 44;
    const [cx, cy] = centers[i % 3];
    return {
      x0: Math.cos(a) * d,
      y0: Math.sin(a) * d,
      x1: cx + (r() - 0.5) * 16,
      y1: cy + (r() - 0.5) * 16,
      accent: i % 3 === 0,
    };
  });
  return (
    <svg viewBox="-60 -60 120 120" className={className} aria-hidden="true">
      <circle r="52" fill="none" stroke="currentColor" strokeOpacity=".25" strokeDasharray="2 4" />
      {dots.map((d, i) => (
        <circle
          key={i}
          r="2.8"
          className="glyph-move"
          fill={d.accent ? "var(--accent)" : "currentColor"}
          style={{ "--x0": `${d.x0}px`, "--y0": `${d.y0}px`, "--x1": `${d.x1}px`, "--y1": `${d.y1}px`, "--d": `${(i % 6) * 60}ms` } as CSSProperties}
        />
      ))}
    </svg>
  );
}

/** Scattered particles that line up into a grid and break apart again. */
function Grid({ className }: Props) {
  const r = rng(19);
  const dots = Array.from({ length: 25 }, (_, i) => ({
    x0: (r() - 0.5) * 96,
    y0: (r() - 0.5) * 96,
    x1: ((i % 5) - 2) * 20,
    y1: (Math.floor(i / 5) - 2) * 20,
  }));
  return (
    <svg viewBox="-60 -60 120 120" className={className} aria-hidden="true">
      <rect x="-52" y="-52" width="104" height="104" fill="none" stroke="currentColor" strokeOpacity=".25" strokeDasharray="2 4" />
      {dots.map((d, i) => (
        <rect
          key={i}
          x="-3"
          y="-3"
          width="6"
          height="6"
          className="glyph-move"
          fill={i % 5 === 0 ? "var(--accent)" : "currentColor"}
          style={{ "--x0": `${d.x0}px`, "--y0": `${d.y0}px`, "--x1": `${d.x1}px`, "--y1": `${d.y1}px`, "--d": `${(i % 5) * 70}ms` } as CSSProperties}
        />
      ))}
    </svg>
  );
}

/** Isometric 3D bars that rise and settle. */
function Bars({ className }: Props) {
  const bars = [
    [18, 0.55],
    [42, 0.8],
    [66, 0.45],
    [90, 1],
  ];
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <path d="M6 104 L60 118 L114 104" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.2" />
      {bars.map(([x, h], i) => {
        const top = 70 * h;
        const y = 104 - (x - 6) * 0.1;
        return (
          <g key={i} className="glyph-rise" style={{ "--d": `${i * 160}ms`, transformOrigin: `${x}px ${y}px` } as CSSProperties}>
            <path d={`M${x - 8} ${y} v${-top} l8 -4 l8 4 v${top} l-8 4 Z`} fill={i === 3 ? "var(--accent)" : "currentColor"} fillOpacity={i === 3 ? 0.9 : 0.35} />
            <path d={`M${x} ${y + 4} v${-top} l8 -4 v${top} Z`} fill={i === 3 ? "var(--accent)" : "currentColor"} fillOpacity={i === 3 ? 0.6 : 0.2} />
            <path d={`M${x - 8} ${y - top} l8 -4 l8 4 l-8 4 Z`} fill={i === 3 ? "var(--accent)" : "currentColor"} fillOpacity={i === 3 ? 1 : 0.55} />
          </g>
        );
      })}
    </svg>
  );
}

/** Wireframe cube rotating in 3D (CSS 3D transforms on six faces). */
function Cube({ className }: Props) {
  const faces = ["rotateY(0deg)", "rotateY(90deg)", "rotateY(180deg)", "rotateY(-90deg)", "rotateX(90deg)", "rotateX(-90deg)"];
  return (
    <div className={`${className} glyph-cube-wrap`} aria-hidden="true">
      <div className="glyph-cube">
        {faces.map((t, i) => (
          <span key={i} style={{ transform: `${t} translateZ(var(--half))` }} className={i === 0 ? "accent" : ""} />
        ))}
      </div>
    </div>
  );
}

const SHAPES: Record<Shape, (p: Props) => ReactElement> = {
  nodes: Nodes,
  torus: Torus,
  clusters: Clusters,
  grid: Grid,
  bars: Bars,
  cube: Cube,
};
