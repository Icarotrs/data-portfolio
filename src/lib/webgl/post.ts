import type { FilterType } from "@site";

export const MAX_BOXES = 8;

/** Filter name → id used by the shader. */
export const FILTER_IDS: Record<FilterType, number> = {
  dither: 0,
  ascii: 1,
  pixelate: 2,
  noise: 3,
  frost: 4,
  halftone: 5,
};

const GLYPHS = " .:-=+*#%@";

/** Monospace glyph strip used by the ASCII filter, ordered dark → bright. */
export function createGlyphStrip() {
  const cellW = 32;
  const cellH = 48;
  const canvas = document.createElement("canvas");
  canvas.width = cellW * GLYPHS.length;
  canvas.height = cellH;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = `600 ${cellH * 0.78}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  [...GLYPHS].forEach((g, i) => ctx.fillText(g, i * cellW + cellW / 2, cellH / 2 + 2));
  return canvas;
}

/** Full-screen triangle; no vertex buffer needed. */
export const FULLSCREEN_VERTEX = /* glsl */ `#version 300 es
  void main() {
    vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
    gl_Position = vec4(p, 0.0, 1.0);
  }
`;

/** Shapes pass: lines, points and triangles with per-vertex colour. */
export const SHAPE_VERTEX = /* glsl */ `#version 300 es
  in vec3 aPos;
  in vec4 aColor;
  uniform mat4 uViewProj;
  uniform float uPointScale;   // device px per world unit at distance 1
  out vec4 vColor;
  void main() {
    gl_Position = uViewProj * vec4(aPos, 1.0);
    gl_PointSize = uPointScale / gl_Position.w;
    vColor = vec4(aColor.rgb * aColor.a, aColor.a);
  }
`;

export const SHAPE_FRAGMENT = /* glsl */ `#version 300 es
  precision mediump float;
  uniform float uRound;        // 1 when drawing points: make them round
  in vec4 vColor;
  out vec4 outColor;
  void main() {
    if (uRound > 0.5) {
      vec2 c = gl_PointCoord - 0.5;
      if (dot(c, c) > 0.25) discard;
    }
    outColor = vColor;
  }
`;

/** Visitor images: one textured quad at a CSS-pixel rectangle. */
export const IMAGE_VERTEX = /* glsl */ `#version 300 es
  uniform vec4 uRect;          // x, y, w, h in CSS px (origin top-left)
  uniform vec2 uView;          // viewport in CSS px
  out vec2 vUv;
  void main() {
    vec2 corner = vec2(gl_VertexID == 1 || gl_VertexID == 3 ? 1.0 : 0.0, gl_VertexID >= 2 ? 1.0 : 0.0);
    vec2 p = uRect.xy + corner * uRect.zw;
    vec2 clip = p / uView * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
    vUv = corner;
  }
`;

export const IMAGE_FRAGMENT = /* glsl */ `#version 300 es
  precision mediump float;
  uniform sampler2D uImage;
  in vec2 vUv;
  out vec4 outColor;
  void main() {
    outColor = vec4(texture(uImage, vUv).rgb, 1.0);
  }
`;

export const POST_FRAGMENT = /* glsl */ `#version 300 es
  precision highp float;
  out vec4 outColor;

  uniform sampler2D tScene;   // shapes + images, premultiplied over transparent
  uniform sampler2D tGlyph;
  uniform vec2 uRes;          // drawing buffer size in device px
  uniform float uDpr;         // device px per CSS px
  uniform float uTime;
  uniform vec3 uBase;         // background, edge tone
  uniform vec3 uBase2;        // background, centre tone
  uniform vec3 uInk;          // tone the filters draw with
  uniform vec3 uAccent;       // orange highlight
  uniform float uVignette;
  uniform vec4 uBoxes[${MAX_BOXES}];   // x0, y0, x1, y1 in device px (origin bottom-left)
  uniform float uBoxType[${MAX_BOXES}];
  uniform int uBoxCount;

  const float GLYPH_COUNT = ${GLYPHS.length}.0;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
  float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
  float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

  // The background: a smooth dark gradient with a soft vignette and a faint
  // warm glow at the bottom. No texture: grain lives on the cards only.
  vec3 field(vec2 px) {
    vec2 uv = px / uRes;
    vec2 d = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    vec3 c = mix(uBase2, uBase, smoothstep(0.0, 0.95, length(d)));
    c *= mix(1.0 - uVignette, 1.0, smoothstep(1.1, 0.25, length(d)));
    c += uAccent * 0.07 * exp(-dot(uv - vec2(0.5, -0.05), uv - vec2(0.5, -0.05)) * 5.0);
    return c;
  }

  vec3 sceneAt(vec2 px, float lod) {
    vec4 s = textureLod(tScene, px / uRes, lod);
    return s.rgb + field(px) * (1.0 - s.a);
  }

  // How far a colour sits from the background towards the ink tone (0..1).
  float amountOf(vec3 c) {
    vec3 base = mix(uBase, uBase2, 0.5);
    vec3 d = uInk - base;
    return clamp(dot(c - base, d) / max(dot(d, d), 1e-4), 0.0, 1.0);
  }

  vec3 fDither(vec2 px, vec2 o) {
    float cell = 2.0 * uDpr;
    vec2 id = floor((px - o) / cell);
    vec3 c = sceneAt(o + (id + 0.5) * cell, 0.0);
    float t = amountOf(c) * 1.2 + 0.03;
    return t > bayer8(id) ? mix(c, uInk, 0.75) : field(px) * 0.85;
  }

  vec3 fAscii(vec2 px, vec2 o) {
    vec2 cell = vec2(8.0, 14.0) * uDpr;
    vec2 id = floor((px - o) / cell);
    vec2 local = fract((px - o) / cell);
    vec3 c = sceneAt(o + (id + 0.5) * cell, log2(cell.x));
    float t = pow(clamp(amountOf(c) * 1.6 + 0.05, 0.0, 1.0), 0.8);
    float index = floor(t * (GLYPH_COUNT - 0.001));
    float mask = texture(tGlyph, vec2((index + local.x) / GLYPH_COUNT, local.y)).r;
    return mix(field(px) * 0.8, uInk, mask * 0.9);
  }

  // Heat-map pixelation: background → orange → ink, like a spectral readout.
  vec3 fPixelate(vec2 px, vec2 o) {
    float cell = 14.0 * uDpr;
    vec2 id = floor((px - o) / cell);
    vec2 local = fract((px - o) / cell);
    vec3 c = sceneAt(o + (id + 0.5) * cell, log2(cell));
    float t = floor(clamp(amountOf(c) * 1.8, 0.0, 1.0) * 6.0 + 0.5) / 6.0;
    vec3 col = t < 0.5 ? mix(field(px) * 0.9, uAccent, t * 2.0) : mix(uAccent, uInk, t * 2.0 - 1.0);
    float gap = (local.x < 1.0 / cell || local.y < 1.0 / cell) ? 1.0 : 0.0;
    return mix(col, field(px) * 0.7, gap * 0.7);
  }

  vec3 fNoise(vec2 px, vec2 o) {
    float row = floor(px.y / (3.0 * uDpr));
    float shift = (hash(vec2(row, floor(uTime * 12.0))) - 0.5) * 6.0 * uDpr;
    vec3 c = sceneAt(px + vec2(shift, 0.0), 0.0);
    float n = hash(px + floor(uTime * 24.0) * 17.0);
    return clamp(c + (n - 0.5) * 0.22, 0.0, 1.0);
  }

  vec3 fFrost(vec2 px, vec2 o) {
    float j = 6.0 * uDpr;
    vec3 c = (sceneAt(px + vec2(j, j), 4.0) + sceneAt(px - vec2(j, j), 4.0)) * 0.5;
    return mix(c, mix(uBase2, uInk, 0.25), 0.3) + (hash(px) - 0.5) * 0.04;
  }

  vec3 fHalftone(vec2 px, vec2 o) {
    float cell = 8.0 * uDpr;
    mat2 rot = mat2(0.7071, -0.7071, 0.7071, 0.7071);
    vec2 rp = rot * (px - o);
    vec2 id = floor(rp / cell);
    vec2 center = (id + 0.5) * cell;
    vec3 c = sceneAt(o + transpose(rot) * center, log2(cell));
    float t = clamp(amountOf(c) * 1.4 + 0.04, 0.0, 1.0);
    float r = sqrt(t) * 0.6 * cell;
    float mask = 1.0 - smoothstep(r - 0.75 * uDpr, r + 0.75 * uDpr, length(rp - center));
    return mix(field(px) * 0.85, uInk, mask * 0.9);
  }

  void main() {
    vec2 px = gl_FragCoord.xy;
    vec3 col = sceneAt(px, 0.0);
    for (int i = 0; i < ${MAX_BOXES}; i++) {
      if (i >= uBoxCount) break;
      vec4 b = uBoxes[i];
      if (px.x < b.x || px.x > b.z || px.y < b.y || px.y > b.w) continue;
      vec2 o = b.xy;
      float t = uBoxType[i];
      if (t < 0.5) col = fDither(px, o);
      else if (t < 1.5) col = fAscii(px, o);
      else if (t < 2.5) col = fPixelate(px, o);
      else if (t < 3.5) col = fNoise(px, o);
      else if (t < 4.5) col = fFrost(px, o);
      else col = fHalftone(px, o);
      break;
    }
    outColor = vec4(col, 1.0);
  }
`;
