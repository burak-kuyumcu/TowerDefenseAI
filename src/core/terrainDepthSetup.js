import {
  createTerrainFoundation
} from "./terrainBaseSetup.js";

import {
  createBiomeTerrain
} from "./terrainBiomeSetup.js";

export function createTerrainDepth(scene) {
  createTerrainFoundation(scene);
  createBiomeTerrain(scene);
}