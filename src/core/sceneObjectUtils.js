import { state } from "../game/state.js";
import {
  getActivePathSet,
  GRID_MIN,
  GRID_MAX
} from "./constants.js";

export function applyShaderData(mesh, color, role) {
  mesh.userData.baseColor = color;
  mesh.userData.shaderRole = role;

  return mesh;
}

export function markStageDecoration(object) {
  object.userData.isStageDecoration = true;

  object.traverse?.((child) => {
    child.userData.isStageDecoration = true;
  });
}

export function blockTerrainArea(x, z, width = 1, depth = 1) {
  const minX = Math.floor(x - width / 2);
  const maxX = Math.ceil(x + width / 2);
  const minZ = Math.floor(z - depth / 2);
  const maxZ = Math.ceil(z + depth / 2);

  for (let tx = minX; tx <= maxX; tx++) {
    for (let tz = minZ; tz <= maxZ; tz++) {
      if (tx < GRID_MIN || tx > GRID_MAX) continue;
      if (tz < GRID_MIN || tz > GRID_MAX) continue;

      state.terrainBlockedSet.add(`${tx},${tz}`);
    }
  }
}

export function isAreaSafe(
  x,
  z,
  width = 1,
  depth = 1,
  padding = 0.12,
  allowNearPath = false
) {
  const halfWidth = width / 2 + padding;
  const halfDepth = depth / 2 + padding;

  if (x - halfWidth < GRID_MIN || x + halfWidth > GRID_MAX) return false;
  if (z - halfDepth < GRID_MIN || z + halfDepth > GRID_MAX) return false;

  const pathSet = getActivePathSet();

  const minX = Math.floor(x - halfWidth);
  const maxX = Math.ceil(x + halfWidth);
  const minZ = Math.floor(z - halfDepth);
  const maxZ = Math.ceil(z + halfDepth);

  for (let tx = minX; tx <= maxX; tx++) {
    for (let tz = minZ; tz <= maxZ; tz++) {
      if (pathSet.has(`${tx},${tz}`)) {
        return false;
      }

      if (!allowNearPath) {
        const nearbyPathKeys = [
          `${tx + 1},${tz}`,
          `${tx - 1},${tz}`,
          `${tx},${tz + 1}`,
          `${tx},${tz - 1}`
        ];

        if (nearbyPathKeys.some((key) => pathSet.has(key))) {
          return false;
        }
      }

      if (state.towerSet?.has(`${tx},${tz}`)) {
        return false;
      }

      if (state.terrainBlockedSet?.has(`${tx},${tz}`)) {
        return false;
      }
    }
  }

  return true;
}

export function hash01(x, z, seed = 1) {
  const value = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453;

  return value - Math.floor(value);
}