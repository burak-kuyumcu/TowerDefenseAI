import {
  animatePortal
} from "./portalSetup.js";

import {
  animateBaseFort
} from "./baseFortSetup.js";

import {
  getAnimatedSceneObjects
} from "./decorRegistry.js";

export function updateSceneVisuals() {
  const time = Date.now();

  animatePortal(time);
  animateBaseFort(time);

  for (const item of getAnimatedSceneObjects()) {
    if (!item.object) continue;

    if (item.type === "tree") {
      item.object.rotation.z =
        item.baseRotZ + Math.sin(time * 0.0018 + item.offset) * 0.008;
    }

    if (item.type === "crystal") {
      item.object.rotation.y += item.speed ?? 0.004;

      const pulse = 1 + Math.sin(time * 0.004 + item.offset) * 0.03;

      item.object.scale.set(
        item.baseScaleX * pulse,
        item.baseScaleY,
        item.baseScaleZ * pulse
      );
    }

    if (item.type === "runeGlow") {
      const opacity = 0.22 + Math.sin(time * 0.006 + item.offset) * 0.08;

      item.object.traverse((child) => {
        if (child.material?.opacity !== undefined) {
          child.material.transparent = true;
          child.material.opacity = Math.max(0.05, opacity);
        }
      });
    }
  }
}