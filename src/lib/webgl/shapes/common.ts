import * as THREE from "three";

/** A background shape the director can fade in and out. */
export interface Shape {
  object: THREE.Object3D;
  /** Theme colors (display-space, no color management). */
  setColors(fg: THREE.Color, accent: THREE.Color): void;
  /** 0–1 visibility; each material keeps its own base opacity. */
  setOpacity(opacity: number): void;
  /** t = seconds since engine start, dt = seconds since last frame. */
  update(t: number, dt: number): void;
  /** Called when the shape becomes the active one. `settled` skips intro animations. */
  enter?(t: number, settled: boolean): void;
  dispose(): void;
}

export interface ShapeOptions {
  /** Lower particle/segment counts on small screens. */
  lite: boolean;
}

/** Keeps track of materials and their base opacity so a shape can fade as a whole. */
export class MaterialSet {
  private items: { material: THREE.Material & { color?: THREE.Color }; base: number; role: "fg" | "accent" }[] = [];

  line(base: number, role: "fg" | "accent" = "fg") {
    const material = new THREE.LineBasicMaterial({ transparent: true, opacity: base, depthWrite: false });
    this.items.push({ material, base, role });
    return material;
  }

  mesh(base: number, role: "fg" | "accent" = "fg") {
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: base,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.items.push({ material, base, role });
    return material;
  }

  points(base: number, size: number, role: "fg" | "accent" = "fg") {
    const material = new THREE.PointsMaterial({
      transparent: true,
      opacity: base,
      size,
      sizeAttenuation: false,
      depthWrite: false,
    });
    this.items.push({ material, base, role });
    return material;
  }

  setColors(fg: THREE.Color, accent: THREE.Color) {
    for (const { material, role } of this.items) material.color?.copy(role === "fg" ? fg : accent);
  }

  setOpacity(opacity: number) {
    for (const item of this.items) item.material.opacity = item.base * opacity;
  }

  dispose() {
    this.items.forEach((i) => i.material.dispose());
  }
}

export function disposeObject(object: THREE.Object3D) {
  object.traverse((o) => {
    const geometry = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    geometry?.dispose();
  });
}

export const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
