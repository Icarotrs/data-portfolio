import * as THREE from "three";
import type { ShapeId } from "@site";
import type { Shape, ShapeOptions } from "./shapes/common";
import { createCubeBars } from "./shapes/cube-bars";
import { createTorus } from "./shapes/torus";
import { createParticleSphere } from "./shapes/particle-sphere";
import { createHome } from "./shapes/home";

const FADE_SECONDS = 0.8;

const factories: Record<ShapeId, (o: ShapeOptions) => Shape> = {
  home: createHome,
  "cube-bars": createCubeBars,
  torus: createTorus,
  "particle-sphere": createParticleSphere,
};

/**
 * Owns all shapes and crossfades between them (800ms). Shapes at zero
 * opacity are hidden and not updated.
 */
export class Director {
  readonly root = new THREE.Group();
  private shapes = new Map<ShapeId, { shape: Shape; opacity: number }>();
  private active: ShapeId;

  constructor(initial: ShapeId, options: ShapeOptions) {
    for (const id of Object.keys(factories) as ShapeId[]) {
      const shape = factories[id](options);
      shape.object.visible = false;
      this.root.add(shape.object);
      this.shapes.set(id, { shape, opacity: 0 });
    }
    this.active = initial;
  }

  /** Switch shapes. `instant` skips the crossfade and intro animation (reduced motion, stills). */
  setActive(id: ShapeId, t: number, instant: boolean) {
    const changed = id !== this.active;
    this.active = id;
    const entry = this.shapes.get(id)!;
    if (changed || entry.opacity === 0) entry.shape.enter?.(t, instant);
    if (instant) for (const [key, e] of this.shapes) e.opacity = key === id ? 1 : 0;
  }

  setColors(fg: THREE.Color, accent: THREE.Color) {
    for (const { shape } of this.shapes.values()) shape.setColors(fg, accent);
  }

  /** Returns true while a crossfade is still running. */
  update(t: number, dt: number): boolean {
    let animating = false;
    const step = dt / FADE_SECONDS;
    for (const [id, entry] of this.shapes) {
      const target = id === this.active ? 1 : 0;
      if (entry.opacity !== target) {
        entry.opacity =
          target > entry.opacity
            ? Math.min(target, entry.opacity + step)
            : Math.max(target, entry.opacity - step);
        animating = true;
      }
      const { shape, opacity } = entry;
      shape.object.visible = opacity > 0.001;
      if (!shape.object.visible) continue;
      // Smoothstep the linear fade; the incoming shape also grows slightly.
      const eased = opacity * opacity * (3 - 2 * opacity);
      shape.setOpacity(eased);
      shape.object.scale.setScalar(0.9 + 0.1 * eased);
      shape.update(t, dt);
    }
    return animating;
  }

  dispose() {
    for (const { shape } of this.shapes.values()) shape.dispose();
  }
}
