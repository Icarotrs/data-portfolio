import * as THREE from "three";
import type { Shape, ShapeOptions } from "./common";
import { createCubeBars } from "./cube-bars";
import { createTorus } from "./torus";
import { createParticleSphere } from "./particle-sphere";

/** Home: the three project shapes together, smaller, orbiting a common center. */
export function createHome(options: ShapeOptions): Shape {
  const parts = [createCubeBars(options), createTorus(options), createParticleSphere(options)];
  const slots = [
    new THREE.Vector3(-2.3, 0.5, 0),
    new THREE.Vector3(0.2, -0.7, -0.8),
    new THREE.Vector3(2.4, 0.6, -0.3),
  ];
  const root = new THREE.Group();
  const holders = parts.map((part, i) => {
    const holder = new THREE.Group();
    holder.scale.setScalar(0.5);
    holder.position.copy(slots[i]);
    holder.add(part.object);
    root.add(holder);
    return holder;
  });

  return {
    object: root,
    setColors: (fg, accent) => parts.forEach((p) => p.setColors(fg, accent)),
    setOpacity: (o) => parts.forEach((p) => p.setOpacity(o)),
    enter: (t, settled) => parts.forEach((p) => p.enter?.(t, settled)),
    update(t, dt) {
      root.rotation.y = Math.sin(t * 0.08) * 0.35;
      holders.forEach((h, i) => {
        h.position.y = slots[i].y + Math.sin(t * 0.5 + i * 2.1) * 0.12;
      });
      parts.forEach((p) => p.update(t, dt));
    },
    dispose: () => parts.forEach((p) => p.dispose()),
  };
}
