import {
  isAreaSafe,
  hash01
} from "./sceneObjectUtils.js";

import {
  isDecorSpotFree
} from "./decorRegistry.js";

export function collectSafeDecorSpots({
  count,
  width,
  depth,
  padding,
  spacing,
  seed
}) {
  const candidates = [];

  for (let x = -7; x <= 7; x++) {
    for (let z = -7; z <= 7; z++) {
      if (!isAreaSafe(x, z, width, depth, padding)) continue;
      if (!isDecorSpotFree(x, z, spacing * 0.35)) continue;

      const edgeBias = Math.min(
        Math.abs(x + 8),
        Math.abs(x - 8),
        Math.abs(z + 8),
        Math.abs(z - 8)
      );

      const score = hash01(x, z, seed) + edgeBias * 0.035;

      candidates.push({
        x,
        z,
        score
      });
    }
  }

  candidates.sort((a, b) => a.score - b.score);

  const selected = [];

  for (const candidate of candidates) {
    if (selected.length >= count) break;

    let tooClose = false;

    for (const other of selected) {
      const distance = Math.hypot(
        candidate.x - other.x,
        candidate.z - other.z
      );

      if (distance < spacing) {
        tooClose = true;
        break;
      }
    }

    if (tooClose) continue;

    selected.push(candidate);
  }

  return selected;
}