import { ICON_NAMES, TYPING_GLYPHS, type IconName } from "./names";

/**
 * Draws every background icon (white line art on transparent) into one
 * texture atlas. Icons are drawn in a -50..50 box centered in each cell.
 */

export const ATLAS_COLUMNS = 8;
const CELL = 128;

type Ctx = CanvasRenderingContext2D;

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

function text(ctx: Ctx, value: string, size = 46) {
  ctx.font = `700 ${size}px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(value, 0, 3);
}

function path(ctx: Ctx, points: [number, number][], close = false) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (close) ctx.closePath();
}

function circle(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function keycap(ctx: Ctx, label: string, size: number) {
  rrect(ctx, -36, -36, 72, 72, 14);
  ctx.stroke();
  ctx.save();
  ctx.lineWidth = 3;
  rrect(ctx, -27, -31, 54, 50, 9);
  ctx.stroke();
  ctx.restore();
  ctx.font = `700 ${size}px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, -5);
}

const drawings: Record<IconName, (ctx: Ctx) => void> = {
  coffee(ctx) {
    rrect(ctx, -30, -8, 44, 42, 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(16, 12, 11, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    for (const x of [-20, -8, 4]) {
      ctx.beginPath();
      ctx.moveTo(x, -16);
      ctx.bezierCurveTo(x - 7, -24, x + 7, -30, x, -40);
      ctx.stroke();
    }
  },
  "key-a": (ctx) => keycap(ctx, "A", 30),
  "key-cmd": (ctx) => keycap(ctx, "⌘", 30),
  "key-esc": (ctx) => keycap(ctx, "esc", 20),
  "key-enter": (ctx) => keycap(ctx, "↵", 30),
  clock(ctx) {
    circle(ctx, 0, 0, 38);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r0 = i % 3 ? 31 : 27;
      path(ctx, [
        [Math.cos(a) * r0, Math.sin(a) * r0],
        [Math.cos(a) * 34, Math.sin(a) * 34],
      ]);
      ctx.stroke();
    }
    path(ctx, [[0, 4], [0, -22]]);
    ctx.stroke();
    path(ctx, [[0, 0], [16, 10]]);
    ctx.stroke();
  },
  frog(ctx) {
    ctx.beginPath();
    ctx.ellipse(0, 12, 40, 26, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (const x of [-20, 20]) {
      circle(ctx, x, -16, 12);
      ctx.stroke();
      circle(ctx, x + 2, -16, 4.5);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 8, 22, 0.18 * Math.PI, 0.82 * Math.PI);
    ctx.stroke();
  },
  star(ctx) {
    const pts: [number, number][] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 17 : 40;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push([Math.cos(a) * r, Math.sin(a) * r + 4]);
    }
    path(ctx, pts, true);
    ctx.stroke();
  },
  heart(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, 34);
    ctx.bezierCurveTo(-46, 4, -34, -38, 0, -16);
    ctx.bezierCurveTo(34, -38, 46, 4, 0, 34);
    ctx.stroke();
  },
  rocket(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.quadraticCurveTo(18, -22, 14, 18);
    ctx.lineTo(-14, 18);
    ctx.quadraticCurveTo(-18, -22, 0, -42);
    ctx.stroke();
    circle(ctx, 0, -10, 7);
    ctx.stroke();
    path(ctx, [[-14, 2], [-28, 22], [-14, 18]]);
    ctx.stroke();
    path(ctx, [[14, 2], [28, 22], [14, 18]]);
    ctx.stroke();
    path(ctx, [[-7, 26], [0, 40], [7, 26]]);
    ctx.stroke();
  },
  bulb(ctx) {
    ctx.beginPath();
    ctx.arc(0, -10, 26, 0.78 * Math.PI, 0.22 * Math.PI);
    ctx.lineTo(10, 18);
    ctx.lineTo(-10, 18);
    ctx.closePath();
    ctx.stroke();
    path(ctx, [[-10, 28], [10, 28]]);
    ctx.stroke();
    path(ctx, [[-6, 37], [6, 37]]);
    ctx.stroke();
  },
  planet(ctx) {
    circle(ctx, 0, 0, 24);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 44, 13, -0.4, 0.15 * Math.PI, 1.05 * Math.PI, true);
    ctx.stroke();
  },
  cactus(ctx) {
    rrect(ctx, -10, -40, 20, 70, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, 6);
    ctx.lineTo(-24, 6);
    ctx.quadraticCurveTo(-30, 6, -30, 0);
    ctx.lineTo(-30, -16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, -6);
    ctx.lineTo(24, -6);
    ctx.quadraticCurveTo(30, -6, 30, -12);
    ctx.lineTo(30, -26);
    ctx.stroke();
    path(ctx, [[-26, 38], [26, 38]]);
    ctx.stroke();
  },
  smiley(ctx) {
    circle(ctx, 0, 0, 38);
    ctx.stroke();
    circle(ctx, -13, -10, 4.5);
    ctx.fill();
    circle(ctx, 13, -10, 4.5);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 2, 20, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  },
  "bar-chart"(ctx) {
    path(ctx, [[-36, -38], [-36, 34], [38, 34]]);
    ctx.stroke();
    [
      [-26, 18],
      [-6, 36],
      [14, 56],
    ].forEach(([x, h]) => ctx.fillRect(x, 28 - h, 13, h));
  },
  "pie-chart"(ctx) {
    circle(ctx, 0, 0, 36);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, -4);
    ctx.arc(4, -4, 34, -Math.PI / 2, 0.15 * Math.PI);
    ctx.closePath();
    ctx.fill();
  },
  trend(ctx) {
    path(ctx, [[-38, 26], [-14, 2], [2, 14], [34, -22]]);
    ctx.stroke();
    path(ctx, [[14, -24], [36, -24], [36, -2]]);
    ctx.stroke();
  },
  sheet(ctx) {
    rrect(ctx, -38, -30, 76, 60, 6);
    ctx.stroke();
    for (const y of [-10, 10]) {
      path(ctx, [[-38, y], [38, y]]);
      ctx.stroke();
    }
    for (const x of [-12, 12]) {
      path(ctx, [[x, -30], [x, 30]]);
      ctx.stroke();
    }
  },
  database(ctx) {
    ctx.beginPath();
    ctx.ellipse(0, -26, 32, 11, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (const y of [0, 26]) {
      ctx.beginPath();
      ctx.ellipse(0, y, 32, 11, 0, 0, Math.PI);
      ctx.stroke();
    }
    path(ctx, [[-32, -26], [-32, 26]]);
    ctx.stroke();
    path(ctx, [[32, -26], [32, 26]]);
    ctx.stroke();
  },
  magnifier(ctx) {
    circle(ctx, -8, -8, 24);
    ctx.stroke();
    ctx.save();
    ctx.lineWidth = 10;
    path(ctx, [[10, 10], [34, 34]]);
    ctx.stroke();
    ctx.restore();
  },
  monitor(ctx) {
    rrect(ctx, -40, -34, 80, 52, 6);
    ctx.stroke();
    path(ctx, [[0, 18], [0, 32]]);
    ctx.stroke();
    path(ctx, [[-18, 34], [18, 34]]);
    ctx.stroke();
  },
  mouse(ctx) {
    rrect(ctx, -22, -38, 44, 76, 22);
    ctx.stroke();
    path(ctx, [[0, -38], [0, -14]]);
    ctx.stroke();
    path(ctx, [[-22, -14], [22, -14]]);
    ctx.stroke();
  },
  gear(ctx) {
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.rotate((i / 8) * Math.PI * 2);
      ctx.fillRect(-7, -40, 14, 16);
      ctx.restore();
    }
    circle(ctx, 0, 0, 27);
    ctx.stroke();
    circle(ctx, 0, 0, 10);
    ctx.stroke();
  },
  envelope(ctx) {
    rrect(ctx, -40, -28, 80, 56, 6);
    ctx.stroke();
    path(ctx, [[-38, -24], [0, 6], [38, -24]]);
    ctx.stroke();
  },
  bolt(ctx) {
    path(
      ctx,
      [
        [8, -42],
        [-24, 6],
        [-2, 6],
        [-10, 42],
        [24, -8],
        [2, -8],
      ],
      true,
    );
    ctx.fill();
  },
  loop(ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0.2 * Math.PI, 1.9 * Math.PI);
    ctx.stroke();
    const a = 1.9 * Math.PI;
    const ex = Math.cos(a) * 30;
    const ey = Math.sin(a) * 30;
    path(ctx, [[ex - 14, ey - 6], [ex, ey], [ex + 2, ey + 15]]);
    ctx.stroke();
  },
  check(ctx) {
    circle(ctx, 0, 0, 38);
    ctx.stroke();
    path(ctx, [[-18, 2], [-5, 16], [20, -12]]);
    ctx.stroke();
  },
  cloud(ctx) {
    ctx.beginPath();
    ctx.moveTo(-28, 24);
    ctx.arc(-24, 6, 18, 0.6 * Math.PI, 1.5 * Math.PI);
    ctx.arc(2, -8, 24, 1.1 * Math.PI, 1.9 * Math.PI);
    ctx.arc(26, 8, 16, 1.5 * Math.PI, 0.5 * Math.PI);
    ctx.closePath();
    ctx.stroke();
  },
  chat(ctx) {
    ctx.beginPath();
    ctx.roundRect(-40, -32, 80, 52, 14);
    ctx.stroke();
    path(ctx, [[-20, 20], [-26, 38], [-4, 20]]);
    ctx.stroke();
    for (const x of [-16, 0, 16]) {
      circle(ctx, x, -6, 4.5);
      ctx.fill();
    }
  },
  terminal(ctx) {
    rrect(ctx, -40, -32, 80, 64, 8);
    ctx.stroke();
    path(ctx, [[-26, -12], [-12, 0], [-26, 12]]);
    ctx.stroke();
    path(ctx, [[-4, 14], [20, 14]]);
    ctx.stroke();
  },
  braces: (ctx) => text(ctx, "{ }", 50),
  tag: (ctx) => text(ctx, "</>", 42),
  "arrow-fn": (ctx) => text(ctx, "=>", 50),
  fn: (ctx) => text(ctx, "fn()", 34),
  semicolon: (ctx) => text(ctx, ";", 64),
  hash: (ctx) => text(ctx, "#", 60),
  and: (ctx) => text(ctx, "&&", 46),
  brackets: (ctx) => text(ctx, "[ ]", 50),
  lambda: (ctx) => text(ctx, "λ", 64),
  binary: (ctx) => text(ctx, "01", 52),
  sigma: (ctx) => text(ctx, "Σ", 64),
  percent: (ctx) => text(ctx, "%", 62),
  dollar: (ctx) => text(ctx, "$", 62),
};

/** Tile index of each icon, then the typing glyphs, then the caret. */
export const ICON_TILE = Object.fromEntries(ICON_NAMES.map((n, i) => [n, i])) as Record<IconName, number>;
export const GLYPH_TILE_START = ICON_NAMES.length;
export const GLYPH_TILE_COUNT = TYPING_GLYPHS.length;
export const CARET_TILE = GLYPH_TILE_START + GLYPH_TILE_COUNT;

export function createIconAtlas(): HTMLCanvasElement {
  const tiles = CARET_TILE + 1;
  const rows = Math.ceil(tiles / ATLAS_COLUMNS);
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_COLUMNS * CELL;
  canvas.height = rows * CELL;
  const ctx = canvas.getContext("2d")!;

  const draw = (tile: number, fn: (ctx: Ctx) => void) => {
    ctx.save();
    ctx.translate((tile % ATLAS_COLUMNS) * CELL + CELL / 2, Math.floor(tile / ATLAS_COLUMNS) * CELL + CELL / 2);
    ctx.scale(CELL / 112, CELL / 112);
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = "#fff";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    fn(ctx);
    ctx.restore();
  };

  ICON_NAMES.forEach((name, i) => draw(i, drawings[name]));
  TYPING_GLYPHS.forEach((g, i) => draw(GLYPH_TILE_START + i, (c) => text(c, g, 64)));
  draw(CARET_TILE, (c) => c.fillRect(-10, -32, 20, 64));
  return canvas;
}
