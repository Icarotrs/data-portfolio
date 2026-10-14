import * as THREE from "three";
import { disposeObject, type Shape, type ShapeOptions } from "./common";

const RADIUS = 1.55;
const INTRO = 2.8; // seconds for chaos → sphere

/**
 * Data cleaning: scattered points organize themselves into a Fibonacci
 * sphere. The morph runs in the vertex shader; only uniforms change per frame.
 */
export function createParticleSphere({ lite }: ShapeOptions): Shape {
  const count = lite ? 900 : 1800;
  const start = new Float32Array(count * 3);
  const target = new Float32Array(count * 3);
  const delay = new Float32Array(count);

  const golden = Math.PI * (3 - Math.sqrt(5));
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    target.set([Math.cos(th) * rad * RADIUS, y * RADIUS, Math.sin(th) * rad * RADIUS], i * 3);
    start.set([(rand() - 0.5) * 6.5, (rand() - 0.5) * 4, (rand() - 0.5) * 3], i * 3);
    // Points organize roughly top to bottom, with jitter.
    delay[i] = (1 - (y + 1) / 2) * 0.45 + rand() * 0.25;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(target, 3));
  geometry.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
  geometry.setAttribute("aDelay", new THREE.BufferAttribute(delay, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uProgress: { value: 1 },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color() },
      uAccent: { value: new THREE.Color() },
      uSize: { value: 2.6 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aStart;
      attribute float aDelay;
      uniform float uProgress;
      uniform float uTime;
      uniform float uSize;
      varying float vOrder;
      void main() {
        float k = clamp((uProgress - aDelay) / 0.3, 0.0, 1.0);
        k = k < 0.5 ? 4.0 * k * k * k : 1.0 - pow(-2.0 * k + 2.0, 3.0) / 2.0;
        vec3 drift = vec3(sin(uTime * 0.6 + aDelay * 40.0), cos(uTime * 0.5 + aDelay * 31.0), 0.0) * 0.08;
        vec3 p = mix(aStart + drift * 3.0, position * (1.0 + 0.025 * sin(uTime * 1.2 + position.y * 2.0)), k);
        vOrder = k;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (6.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uAccent;
      uniform float uOpacity;
      varying float vOrder;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        if (dot(c, c) > 0.25) discard;
        gl_FragColor = vec4(mix(uAccent, uColor, vOrder), uOpacity * (0.55 + 0.45 * vOrder));
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  const root = new THREE.Group();
  root.add(points);
  let enteredAt = -INTRO;

  return {
    object: root,
    setColors(fg, accent) {
      material.uniforms.uColor.value.copy(fg);
      material.uniforms.uAccent.value.copy(accent);
    },
    setOpacity(o) {
      material.uniforms.uOpacity.value = o;
    },
    enter(t, settled) {
      enteredAt = settled ? t - INTRO : t;
    },
    update(t) {
      material.uniforms.uTime.value = t;
      material.uniforms.uProgress.value = Math.min(1, (t - enteredAt) / INTRO);
      root.rotation.y = t * 0.12;
      root.rotation.x = 0.25;
    },
    dispose() {
      disposeObject(root);
      material.dispose();
    },
  };
}
