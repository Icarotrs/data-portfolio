import * as THREE from "three";
import { MaterialSet, disposeObject, type Shape, type ShapeOptions } from "./common";

/** Dashboard / BI: a wireframe cube holding a 4×4 grid of animated 3D bars. */
export function createCubeBars({ lite }: ShapeOptions): Shape {
  const mats = new MaterialSet();
  const root = new THREE.Group();
  const size = 2.4;
  const half = size / 2;

  const cube = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size)),
    mats.line(0.85),
  );
  root.add(cube);

  // Floor grid inside the cube.
  const floor = new THREE.GridHelper(size, 8);
  (floor.material as THREE.Material).dispose();
  floor.material = mats.line(0.22);
  floor.position.y = -half;
  root.add(floor);

  const n = lite ? 3 : 4;
  const gap = size / (n + 1);
  const barW = gap * 0.5;
  const barGeo = new THREE.BoxGeometry(barW, 1, barW).translate(0, 0.5, 0);
  const edgeGeo = new THREE.EdgesGeometry(barGeo);
  const fill = mats.mesh(0.16, "accent");
  const edge = mats.line(0.9);

  const bars: { group: THREE.Group; phase: number; amp: number }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const group = new THREE.Group();
      group.add(new THREE.Mesh(barGeo, fill), new THREE.LineSegments(edgeGeo, edge));
      group.position.set(-half + gap * (i + 1), -half, -half + gap * (j + 1));
      root.add(group);
      bars.push({ group, phase: i * 0.9 + j * 0.55, amp: 0.45 + ((i * 7 + j * 3) % 5) / 8 });
    }
  }

  root.rotation.x = 0.42;

  return {
    object: root,
    setColors: (fg, accent) => mats.setColors(fg, accent),
    setOpacity: (o) => mats.setOpacity(o),
    update(t) {
      root.rotation.y = t * 0.16 + 0.6;
      for (const b of bars) {
        const h = 0.25 + (size - 0.5) * b.amp * (0.55 + 0.45 * Math.sin(t * 0.9 + b.phase));
        b.group.scale.y = h;
      }
    },
    dispose() {
      disposeObject(root);
      mats.dispose();
    },
  };
}
