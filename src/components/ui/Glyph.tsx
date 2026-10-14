import type { ReactElement } from "react";
import type { Shape } from "@site";

/**
 * The animated shapes of the home composition (site.config.ts →
 * homeShapes). Plain SVG / CSS: transforms and opacity only, no canvas.
 * Animations are defined in globals.css under "Glyphs".
 */
export function Glyph({ shape, className = "" }: { shape: Shape; className?: string }) {
  const Comp = SHAPES[shape];
  return <Comp className={`glyph ${className}`} />;
}

type Props = { className: string };

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
  cube: Cube,
};
