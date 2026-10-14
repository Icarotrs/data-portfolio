import * as THREE from "three";
import { MaterialSet, disposeObject, type Shape, type ShapeOptions } from "./common";

const R = 1.35; // main radius
const r = 0.5; // tube radius

function torusPoint(u: number, v: number, out: THREE.Vector3) {
  const c = R + r * Math.cos(v);
  return out.set(c * Math.cos(u), c * Math.sin(u), r * Math.sin(v));
}

/** Automation: a line-ring torus with "jobs" flowing around the loop. */
export function createTorus({ lite }: ShapeOptions): Shape {
  const mats = new MaterialSet();
  const root = new THREE.Group();
  const p = new THREE.Vector3();
  const q = new THREE.Vector3();

  // Rings around the tube + a few loops along the main circle.
  const rings = lite ? 28 : 44;
  const ringSegs = 28;
  const loops = 6;
  const loopSegs = 96;
  const verts: number[] = [];
  for (let i = 0; i < rings; i++) {
    const u = (i / rings) * Math.PI * 2;
    for (let k = 0; k < ringSegs; k++) {
      torusPoint(u, (k / ringSegs) * Math.PI * 2, p);
      torusPoint(u, ((k + 1) / ringSegs) * Math.PI * 2, q);
      verts.push(p.x, p.y, p.z, q.x, q.y, q.z);
    }
  }
  const loopVerts: number[] = [];
  for (let l = 0; l < loops; l++) {
    const v = (l / loops) * Math.PI * 2;
    for (let k = 0; k < loopSegs; k++) {
      torusPoint((k / loopSegs) * Math.PI * 2, v, p);
      torusPoint(((k + 1) / loopSegs) * Math.PI * 2, v, q);
      loopVerts.push(p.x, p.y, p.z, q.x, q.y, q.z);
    }
  }
  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  root.add(new THREE.LineSegments(ringGeo, mats.line(0.42)));
  const loopGeo = new THREE.BufferGeometry();
  loopGeo.setAttribute("position", new THREE.Float32BufferAttribute(loopVerts, 3));
  root.add(new THREE.LineSegments(loopGeo, mats.line(0.9)));

  // Flowing particles.
  const count = lite ? 60 : 120;
  const flow = new Float32Array(count * 3);
  const flowGeo = new THREE.BufferGeometry();
  flowGeo.setAttribute("position", new THREE.BufferAttribute(flow, 3));
  root.add(new THREE.Points(flowGeo, mats.points(1, 4, "accent")));

  root.rotation.x = -1.05;

  return {
    object: root,
    setColors: (fg, accent) => mats.setColors(fg, accent),
    setOpacity: (o) => mats.setOpacity(o),
    update(t) {
      root.rotation.z = t * 0.18;
      root.rotation.y = Math.sin(t * 0.2) * 0.15;
      for (let i = 0; i < count; i++) {
        const lane = i % loops;
        const u = ((i / count) * Math.PI * 2 * 3 + t * (0.35 + lane * 0.03)) % (Math.PI * 2);
        torusPoint(u, (lane / loops) * Math.PI * 2, p);
        flow.set([p.x, p.y, p.z], i * 3);
      }
      flowGeo.attributes.position.needsUpdate = true;
    },
    dispose() {
      disposeObject(root);
      mats.dispose();
    },
  };
}
