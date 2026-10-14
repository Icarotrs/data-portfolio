/**
 * The three background shapes: simple wireframe solids (cube, square
 * pyramid, icosahedron), built as plain vertex lists (no 3D library).
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

type Vec = [number, number, number];

interface Solid {
  vertices: Vec[];
  edges: [number, number][];
}

const CUBE: Solid = (() => {
  const h = 1.1;
  const vertices: Vec[] = [];
  for (const x of [-h, h]) for (const y of [-h, h]) for (const z of [-h, h]) vertices.push([x, y, z]);
  const edges: [number, number][] = [];
  vertices.forEach((a, i) =>
    vertices.forEach((b, j) => {
      // Neighbours differ in exactly one coordinate.
      if (j > i && a.filter((v, k) => v !== b[k]).length === 1) edges.push([i, j]);
    }),
  );
  return { vertices, edges };
})();

const PYRAMID: Solid = {
  vertices: [
    [-1.15, -0.85, -1.15],
    [1.15, -0.85, -1.15],
    [1.15, -0.85, 1.15],
    [-1.15, -0.85, 1.15],
    [0, 1.35, 0],
  ],
  edges: [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [0, 4], [1, 4], [2, 4], [3, 4],
  ],
};

const ICOSAHEDRON: Solid = (() => {
  const t = (1 + Math.sqrt(5)) / 2;
  const raw: Vec[] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
  const k = 1.35 / Math.hypot(1, t);
  const vertices = raw.map((v) => v.map((c) => c * k) as Vec);
  const edges: [number, number][] = [];
  for (let i = 0; i < raw.length; i++)
    for (let j = i + 1; j < raw.length; j++)
      if (Math.abs(Math.hypot(raw[i][0] - raw[j][0], raw[i][1] - raw[j][1], raw[i][2] - raw[j][2]) - 2) < 1e-6) edges.push([i, j]);
  return { vertices, edges };
})();

function solid(shape: Solid, t: Transform, out: Batches, colors: Colors, alpha: number) {
  for (const [a, b] of shape.edges) {
    const va = shape.vertices[a];
    const vb = shape.vertices[b];
    t.apply(va[0], va[1], va[2], out.lines, colors.line, 0.85 * alpha);
    t.apply(vb[0], vb[1], vb[2], out.lines, colors.line, 0.85 * alpha);
  }
  for (const v of shape.vertices) t.apply(v[0], v[1], v[2], out.points, colors.accent, alpha);
}

export type ShapeBuilder = (t: Transform, time: number, out: Batches, colors: Colors, alpha: number) => void;

export const cube: ShapeBuilder = (t, _time, out, colors, alpha) => solid(CUBE, t, out, colors, alpha);
export const pyramid: ShapeBuilder = (t, _time, out, colors, alpha) => solid(PYRAMID, t, out, colors, alpha);
export const icosahedron: ShapeBuilder = (t, _time, out, colors, alpha) => solid(ICOSAHEDRON, t, out, colors, alpha);
