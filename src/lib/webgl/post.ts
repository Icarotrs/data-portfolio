import * as THREE from "three";
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
function createGlyphAtlas() {
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
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D tScene;
  uniform sampler2D tGlyph;
  uniform vec2 uRes;          // drawing buffer size in device px
  uniform float uDpr;
  uniform float uTime;
  uniform vec3 uBg;
  uniform vec3 uFg;
  uniform vec3 uFrost;
  uniform float uDark;
  uniform vec4 uBoxes[${MAX_BOXES}];   // x0, y0, x1, y1 in device px (origin bottom-left)
  uniform float uBoxType[${MAX_BOXES}];
  uniform int uBoxCount;

  const float GLYPH_COUNT = ${GLYPHS.length}.0;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Ordered dither thresholds (Bayer 8x8), in [0, 1).
  float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
  float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
  float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

  // Background field: soft moving gradient + 64px grid, so filters also
  // have something to work on where no shape is present.
  vec3 field(vec2 px, float lod) {
    vec2 uv = px / uRes;
    float g = 0.5 + 0.5 * sin(uv.x * 2.3 + uTime * 0.05) * cos(uv.y * 1.9 - uTime * 0.04);
    float v = 0.02 + 0.05 * g * (1.0 - 0.6 * length(uv - vec2(0.7, 0.75)));
    vec2 cell = mod(px, 64.0 * uDpr);
    float line = (cell.x < uDpr || cell.y < uDpr) ? 1.0 : 0.0;
    v += line * 0.09 * (1.0 - clamp(lod, 0.0, 1.0));
    return mix(uBg, uFg, v);
  }

  // Scene (premultiplied, transparent background) composited over the field.
  vec3 sceneAt(vec2 px, float lod) {
    vec4 s = textureLod(tScene, px / uRes, lod);
    return s.rgb + field(px, lod) * (1.0 - s.a);
  }

  // Position of a color between background (0) and foreground (1).
  float amountOf(vec3 c) {
    vec3 d = uFg - uBg;
    return clamp(dot(c - uBg, d) / max(dot(d, d), 1e-4), 0.0, 1.0);
  }

  vec3 fDither(vec2 px, vec2 o) {
    float cell = 2.0 * uDpr;
    vec2 id = floor((px - o) / cell);
    float a = amountOf(sceneAt(o + (id + 0.5) * cell, 0.0));
    return (a - 0.02) * 1.2 > bayer8(id) ? uFg : uBg;
  }

  vec3 fAscii(vec2 px, vec2 o) {
    vec2 cell = vec2(8.0, 14.0) * uDpr;
    vec2 id = floor((px - o) / cell);
    vec2 local = fract((px - o) / cell);
    float a = amountOf(sceneAt(o + (id + 0.5) * cell, log2(cell.x)));
    a = pow(clamp(a * 1.6, 0.0, 1.0), 0.8);
    float index = floor(a * (GLYPH_COUNT - 0.001));
    float mask = texture(tGlyph, vec2((index + local.x) / GLYPH_COUNT, local.y)).r;
    return mix(uBg, uFg, mask * 0.92);
  }

  vec3 fPixelate(vec2 px, vec2 o) {
    float cell = 14.0 * uDpr;
    vec2 id = floor((px - o) / cell);
    vec2 local = fract((px - o) / cell);
    vec3 c = sceneAt(o + (id + 0.5) * cell, log2(cell));
    float a = floor(clamp(amountOf(c) * 1.5, 0.0, 1.0) * 5.0 + 0.5) / 5.0;
    vec3 col = mix(uBg, uFg, a);
    float gap = (local.x < 1.0 / cell || local.y < 1.0 / cell) ? 1.0 : 0.0;
    return mix(col, uBg, gap * 0.6);
  }

  vec3 fNoise(vec2 px, vec2 o) {
    float row = floor(px.y / (3.0 * uDpr));
    float shift = (hash(vec2(row, floor(uTime * 12.0))) - 0.5) * 6.0 * uDpr;
    vec3 c = sceneAt(px + vec2(shift, 0.0), 0.0);
    float n = hash(px + floor(uTime * 24.0) * 17.0);
    return clamp(c + (n - 0.5) * 0.24, 0.0, 1.0);
  }

  vec3 fFrost(vec2 px, vec2 o) {
    float lod = 3.5;
    float j = 6.0 * uDpr;
    vec3 c = (sceneAt(px + vec2(j, j), lod) + sceneAt(px + vec2(-j, j), lod)
      + sceneAt(px + vec2(j, -j), lod) + sceneAt(px + vec2(-j, -j), lod)) * 0.25;
    c = mix(c, uFrost, 0.38);
    return c + (hash(px) - 0.5) * 0.03;
  }

  vec3 fHalftone(vec2 px, vec2 o) {
    float cell = 8.0 * uDpr;
    mat2 rot = mat2(0.7071, -0.7071, 0.7071, 0.7071);
    vec2 rp = rot * (px - o);
    vec2 id = floor(rp / cell);
    vec2 center = (id + 0.5) * cell;
    float a = amountOf(sceneAt(o + transpose(rot) * center, log2(cell)));
    float r = sqrt(clamp((a - 0.035) * 1.6, 0.0, 1.0)) * 0.62 * cell;
    float d = length(rp - center);
    float mask = 1.0 - smoothstep(r - 0.75 * uDpr, r + 0.75 * uDpr, d);
    return mix(uBg, uFg, mask);
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
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createPostPass() {
  const glyphs = createGlyphAtlas();
  const boxes = Array.from({ length: MAX_BOXES }, () => new THREE.Vector4());
  const material = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tScene: { value: null },
      tGlyph: { value: glyphs },
      uRes: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: 1 },
      uTime: { value: 0 },
      uBg: { value: new THREE.Color() },
      uFg: { value: new THREE.Color() },
      uFrost: { value: new THREE.Color() },
      uDark: { value: 0 },
      uBoxes: { value: boxes },
      uBoxType: { value: new Array(MAX_BOXES).fill(0) },
      uBoxCount: { value: 0 },
    },
    vertexShader: /* glsl */ `
      void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);

  return {
    scene,
    camera: new THREE.Camera(),
    uniforms: material.uniforms,
    dispose() {
      glyphs.dispose();
      material.dispose();
      mesh.geometry.dispose();
    },
  };
}
