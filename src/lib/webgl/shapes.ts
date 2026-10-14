/**
 * The three background shapes, built as plain vertex lists (no 3D library):
 *   cube-bars        dashboard: wireframe cube with animated 3D bars
 *   torus            automation: line-ring torus with jobs flowing around it
 *   particle-sphere  data cleaning: scattered points organising into a sphere
 *
 * Each frame the shapes are transformed on the CPU into world space and
 * appended to three batches (lines, points, triangles). Vertex format:
 * x, y, z, r, g, b, a  (colour is straight alpha; the shader premultiplies).
 */

export type RGB = [number, number, number];

export class Batch {
  data = new Float32Array(7 * 4096);
  count = 0;

  reset() {
    this.count = 0;
  }

  push(x: number, y: number, z: number, c: RGB, a: number) {
    if ((this.count + 1) * 7 > this.data.length) {
      const next = new Float32Array(this.data.length * 2);
      next.set(this.data);
      this.data = next;
    }
    const d = this.data;
    const o = this.count++ * 7;
    d[o] = x;
    d[o + 1] = y;
    d[o + 2] = z;
    d[o + 3] = c[0];
    d[o + 4] = c[1];
    d[o + 5] = c[2];
    d[o + 6] = a;
  }
}

/** Rotation (X, then Y, then Z) + uniform scale + translation. */
export class Transform {
  private m = new Float32Array(9);
  s = 1;
  tx = 0;
  ty = 0;
  tz = 0;

  set(rx: number, ry: number, rz: number, s: number, tx: number, ty: number, tz: number) {
    const [cx, sx, cy, sy, cz, sz] = [Math.cos(rx), Math.sin(rx), Math.cos(ry), Math.sin(ry), Math.cos(rz), Math.sin(rz)];
    // R = Rz * Ry * Rx
    this.m.set([
      cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx,
      sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx,
      -sy, cy * sx, cy * cx,
    ]);
    Object.assign(this, { s, tx, ty, tz });
    return this;
  }

  apply(x: number, y: number, z: number, out: Batch, c: RGB, a: number) {
    const m = this.m;
    x *= this.s;
    y *= this.s;
    z *= this.s;
    out.push(
      m[0] * x + m[1] * y + m[2] * z + this.tx,
      m[3] * x + m[4] * y + m[5] * z + this.ty,
      m[6] * x + m[7] * y + m[8] * z + this.tz,
      c,
      a,
    );
  }
}

export interface Colors {
  line: RGB;
  accent: RGB;
}

export interface Batches {
  lines: Batch;
  points: Batch;
  tris: Batch;
}

// ── Cube with bars ───────────────────────────────────────────
const CUBE = 2.4;
const H = CUBE / 2;
const CUBE_EDGES: number[][] = [];
{
  const v = [-H, H];
  for (const a of v) for (const b of v) {
    CUBE_EDGES.push([-H, a, b, H, a, b], [a, -H, b, a, H, b], [a, b, -H, a, b, H]);
  }
}

function box(t: Transform, out: Batches, x: number, z: number, w: number, h: number, colors: Colors, alpha: number) {
  const x0 = x - w / 2, x1 = x + w / 2, z0 = z - w / 2, z1 = z + w / 2, y0 = -H, y1 = -H + h;
  const corners = [
    [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
    [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1],
  ];
  const edges = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
  for (const i of edges) t.apply(corners[i][0], corners[i][1], corners[i][2], out.lines, colors.line, 0.85 * alpha);
  const faces = [
    [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], [4, 5, 6, 7],
  ];
  for (const [a, b, c, d] of faces) {
    for (const i of [a, b, c, a, c, d]) t.apply(corners[i][0], corners[i][1], corners[i][2], out.tris, colors.accent, 0.22 * alpha);
  }
}

export function cubeBars(t: Transform, time: number, out: Batches, colors: Colors, alpha: number) {
  for (const e of CUBE_EDGES) {
    t.apply(e[0], e[1], e[2], out.lines, colors.line, 0.8 * alpha);
    t.apply(e[3], e[4], e[5], out.lines, colors.line, 0.8 * alpha);
  }
  // Floor grid.
  for (let i = 1; i < 8; i++) {
    const p = -H + (CUBE * i) / 8;
    t.apply(p, -H, -H, out.lines, colors.line, 0.18 * alpha);
    t.apply(p, -H, H, out.lines, colors.line, 0.18 * alpha);
    t.apply(-H, -H, p, out.lines, colors.line, 0.18 * alpha);
    t.apply(H, -H, p, out.lines, colors.line, 0.18 * alpha);
  }
  const n = 4;
  const gap = CUBE / (n + 1);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const amp = 0.45 + ((i * 7 + j * 3) % 5) / 8;
      const h = 0.25 + (CUBE - 0.5) * amp * (0.55 + 0.45 * Math.sin(time * 0.9 + i * 0.9 + j * 0.55));
      box(t, out, -H + gap * (i + 1), -H + gap * (j + 1), gap * 0.5, h, colors, alpha);
    }
  }
}

// ── Torus ────────────────────────────────────────────────────
const R = 1.35;
const r = 0.5;
const torusPoint = (u: number, v: number): [number, number, number] => {
  const c = R + r * Math.cos(v);
  return [c * Math.cos(u), c * Math.sin(u), r * Math.sin(v)];
};
const TORUS_RINGS: number[] = [];
const TORUS_LOOPS: number[] = [];
{
  const rings = 40, segs = 24, loops = 6, loopSegs = 90;
  for (let i = 0; i < rings; i++) {
    const u = (i / rings) * Math.PI * 2;
    for (let k = 0; k < segs; k++) {
      TORUS_RINGS.push(...torusPoint(u, (k / segs) * Math.PI * 2), ...torusPoint(u, ((k + 1) / segs) * Math.PI * 2));
    }
  }
  for (let l = 0; l < loops; l++) {
    const v = (l / loops) * Math.PI * 2;
    for (let k = 0; k < loopSegs; k++) {
      TORUS_LOOPS.push(...torusPoint((k / loopSegs) * Math.PI * 2, v), ...torusPoint(((k + 1) / loopSegs) * Math.PI * 2, v));
    }
  }
}

export function torus(t: Transform, time: number, out: Batches, colors: Colors, alpha: number) {
  for (let i = 0; i < TORUS_RINGS.length; i += 3) t.apply(TORUS_RINGS[i], TORUS_RINGS[i + 1], TORUS_RINGS[i + 2], out.lines, colors.line, 0.32 * alpha);
  for (let i = 0; i < TORUS_LOOPS.length; i += 3) t.apply(TORUS_LOOPS[i], TORUS_LOOPS[i + 1], TORUS_LOOPS[i + 2], out.lines, colors.line, 0.85 * alpha);
  for (let i = 0; i < 90; i++) {
    const lane = i % 6;
    const u = (i / 90) * Math.PI * 6 + time * (0.35 + lane * 0.03);
    const [x, y, z] = torusPoint(u, (lane / 6) * Math.PI * 2);
    t.apply(x, y, z, out.points, colors.accent, alpha);
  }
}

// ── Particle sphere ──────────────────────────────────────────
const SPHERE_COUNT = 1400;
const SPHERE_RADIUS = 1.55;
const CYCLE = 16; // seconds: scatter → organise → hold → scatter
const sphereTarget = new Float32Array(SPHERE_COUNT * 3);
const sphereStart = new Float32Array(SPHERE_COUNT * 3);
const sphereDelay = new Float32Array(SPHERE_COUNT);
{
  const golden = Math.PI * (3 - Math.sqrt(5));
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < SPHERE_COUNT; i++) {
    const y = 1 - (i / (SPHERE_COUNT - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    sphereTarget.set([Math.cos(th) * rad * SPHERE_RADIUS, y * SPHERE_RADIUS, Math.sin(th) * rad * SPHERE_RADIUS], i * 3);
    sphereStart.set([(rand() - 0.5) * 5, (rand() - 0.5) * 4, (rand() - 0.5) * 3], i * 3);
    sphereDelay[i] = (1 - (y + 1) / 2) * 0.35 + rand() * 0.2;
  }
}
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export function particleSphere(t: Transform, time: number, out: Batches, colors: Colors, alpha: number) {
  const phase = (time % CYCLE) / CYCLE;
  // 0–0.45 organise, hold, 0.85–1 scatter again.
  const order = phase < 0.85 ? Math.min(1, phase / 0.45) : 1 - (phase - 0.85) / 0.15;
  for (let i = 0; i < SPHERE_COUNT; i++) {
    const k = ease(Math.min(1, Math.max(0, (order - sphereDelay[i]) / 0.45)));
    const j = i * 3;
    const wob = 0.06 * (1 - k);
    const x = sphereStart[j] + (sphereTarget[j] - sphereStart[j]) * k + Math.sin(time * 0.7 + i) * wob;
    const y = sphereStart[j + 1] + (sphereTarget[j + 1] - sphereStart[j + 1]) * k + Math.cos(time * 0.6 + i) * wob;
    const z = sphereStart[j + 2] + (sphereTarget[j + 2] - sphereStart[j + 2]) * k;
    const accent = i % 9 === 0;
    t.apply(x, y, z, out.points, accent ? colors.accent : colors.line, (0.45 + 0.55 * k) * alpha);
  }
}
