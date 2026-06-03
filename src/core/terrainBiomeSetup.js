import { getCurrentStage } from "../game/stages.js";

import {
  getTerrainPalette
} from "./terrainBaseSetup.js";

import {
  createLayeredHill,
  createForestFloorPatch,
  createBiomeGroundPatch
} from "./terrainShapeFactory.js";

import {
  createSnowDrift
} from "./frozenDecorFactory.js";

import {
  createLavaCrack,
  createAshPatch
} from "./volcanicDecorFactory.js";

import {
  createSwampPool
} from "./swampDecorFactory.js";

import {
  createCrystalField
} from "./crystalDecorFactory.js";

import {
  createRuinFloorPlateGroup
} from "./ruinsDecorFactory.js";

export function createBiomeTerrain(scene) {
  const stage = getCurrentStage();

  if (stage.id === 1) {
    createForestTerrain(scene);
    return;
  }

  if (stage.id === 2) {
    createCanyonTerrain(scene);
    return;
  }

  if (stage.id === 3) {
    createFrozenTerrain(scene);
    return;
  }

  if (stage.id === 4) {
    createRuinsTerrain(scene);
    return;
  }

  if (stage.id === 5) {
    createVolcanicTerrain(scene);
    return;
  }

  if (stage.id === 6) {
    createSwampTerrain(scene);
    return;
  }

  createCrystalTerrain(scene);
}

function createForestTerrain(scene) {
  const colors = getTerrainPalette(1);

  const hills = [
    [-7.25, 7.05, 1.9, 0.95],
    [7.15, -7.1, 1.55, 0.74],
    [7.1, 7.05, 1.5, 0.72],
    [-7.25, -7.15, 1.45, 0.68],
    [-5.8, 6.35, 1.08, 0.44],
    [5.75, -6.35, 1.0, 0.4],
    [6.35, 3.05, 0.96, 0.38],
    [-6.35, -2.05, 0.9, 0.34],
    [-1.85, 6.75, 0.86, 0.32],
    [3.75, 6.55, 0.86, 0.32],
    [6.7, -2.45, 0.78, 0.3]
  ];

  for (const [x, z, radius, height] of hills) {
    createLayeredHill(scene, {
      x,
      z,
      radius,
      height,
      baseColor: colors.dark,
      midColor: colors.mid,
      topColor: colors.high,
      style: "forest",
      addTrees: true
    });
  }

  createForestFloorPatch(scene, -5.5, 5.7, 2.0, 1.3);
  createForestFloorPatch(scene, 5.6, 3.4, 1.8, 1.1);
  createForestFloorPatch(scene, -6.4, -5.2, 1.6, 1.0);
  createForestFloorPatch(scene, 2.0, 5.8, 1.7, 1.0);
  createForestFloorPatch(scene, 5.8, -1.6, 1.4, 0.9);
  createForestFloorPatch(scene, -3.4, -6.3, 1.5, 0.9);
}

function createCanyonTerrain(scene) {
  const colors = getTerrainPalette(2);

  const mesas = [
    [-7.25, -7.1, 1.45, 0.82],
    [7.15, -7.15, 1.35, 0.76],
    [-7.2, 7.1, 1.3, 0.68],
    [7.25, 7.05, 1.35, 0.78],
    [6.45, 2.7, 1.02, 0.52],
    [-5.9, -5.8, 0.95, 0.48],
    [3.2, 6.7, 0.95, 0.46],
    [-4.8, 6.6, 0.9, 0.42],
    [6.7, -3.4, 0.86, 0.42]
  ];

  for (const [x, z, radius, height] of mesas) {
    createLayeredHill(scene, {
      x,
      z,
      radius,
      height,
      baseColor: colors.dark,
      midColor: colors.mid,
      topColor: colors.high,
      style: "canyon"
    });
  }

  createBiomeGroundPatch(scene, -5.5, 5.7, 1.8, 1.0, 0x8f3f17, 0.22);
  createBiomeGroundPatch(scene, 4.8, -5.7, 1.5, 0.9, 0x8f3f17, 0.22);
  createBiomeGroundPatch(scene, 6.0, 3.5, 1.4, 0.8, 0x9a4a1a, 0.18);
  createBiomeGroundPatch(scene, -6.5, -2.2, 1.4, 0.8, 0x9a4a1a, 0.18);
}

function createFrozenTerrain(scene) {
  const colors = getTerrainPalette(3);

  const snowHills = [
    [-7.25, -7.1, 1.35, 0.58],
    [7.15, -7.15, 1.3, 0.54],
    [7.15, 7.05, 1.25, 0.5],
    [-6.85, 6.35, 1.08, 0.42],
    [5.8, -6.2, 1.02, 0.42],
    [3.2, 6.7, 0.9, 0.34]
  ];

  for (const [x, z, radius, height] of snowHills) {
    createLayeredHill(scene, {
      x,
      z,
      radius,
      height,
      baseColor: colors.dark,
      midColor: colors.mid,
      topColor: colors.high,
      style: "frozen"
    });
  }

  createSnowDrift(scene, -5.8, 5.9);
  createSnowDrift(scene, 4.8, -5.9);
  createSnowDrift(scene, 6.1, 1.2);
}

function createRuinsTerrain(scene) {
  const colors = getTerrainPalette(4);

  const platforms = [
    [-7.25, -7.1, 1.3, 0.42],
    [7.1, -7.15, 1.25, 0.42],
    [7.15, 7.05, 1.2, 0.38],
    [-6.5, 6.4, 1.0, 0.32],
    [3.0, 6.65, 0.9, 0.28],
    [6.6, -3.2, 0.9, 0.28]
  ];

  for (const [x, z, radius, height] of platforms) {
    createLayeredHill(scene, {
      x,
      z,
      radius,
      height,
      baseColor: colors.dark,
      midColor: colors.mid,
      topColor: colors.high,
      style: "ruins"
    });
  }

  createRuinFloorPlateGroup(scene, -5.9, 3.6);
  createRuinFloorPlateGroup(scene, 2.9, -6.2);
}

function createVolcanicTerrain(scene) {
  const colors = getTerrainPalette(5);

  const volcanoRidges = [
    [-7.2, -7.1, 1.55, 0.82],
    [7.1, -7.0, 1.45, 0.76],
    [7.1, 7.0, 1.45, 0.78],
    [-7.2, 7.0, 1.25, 0.62],
    [-5.8, -2.5, 0.95, 0.44],
    [5.9, 2.7, 1.0, 0.46],
    [3.0, 6.6, 0.9, 0.38],
    [-3.5, 6.6, 0.86, 0.35]
  ];

  for (const [x, z, radius, height] of volcanoRidges) {
    createLayeredHill(scene, {
      x,
      z,
      radius,
      height,
      baseColor: colors.dark,
      midColor: colors.mid,
      topColor: colors.high,
      style: "canyon"
    });
  }

  createLavaCrack(scene, -5.7, 5.8, 1.4, 0.34);
  createLavaCrack(scene, 4.8, -5.7, 1.6, 0.32);
  createLavaCrack(scene, 6.2, 1.2, 1.2, 0.28);
  createLavaCrack(scene, -2.2, -6.4, 1.3, 0.28);
  createAshPatch(scene, -6.5, 2.4);
  createAshPatch(scene, 5.5, 5.5);
}

function createSwampTerrain(scene) {
  const colors = getTerrainPalette(6);

  const mounds = [
    [-7.2, -7.1, 1.25, 0.38],
    [7.1, -7.1, 1.2, 0.34],
    [7.1, 7.1, 1.25, 0.38],
    [-7.2, 7.1, 1.2, 0.34],
    [-5.5, 5.5, 0.9, 0.28],
    [5.7, -4.8, 0.9, 0.28],
    [2.8, 6.4, 0.8, 0.24]
  ];

  for (const [x, z, radius, height] of mounds) {
    createLayeredHill(scene, {
      x,
      z,
      radius,
      height,
      baseColor: colors.dark,
      midColor: colors.mid,
      topColor: colors.high,
      style: "forest"
    });
  }

  createSwampPool(scene, -6.0, 5.6, 1.25, 0.85);
  createSwampPool(scene, 5.8, -5.8, 1.25, 0.85);
  createSwampPool(scene, 6.4, 2.2, 1.05, 0.7);
  createSwampPool(scene, -3.4, -6.5, 1.0, 0.65);
}

function createCrystalTerrain(scene) {
  const colors = getTerrainPalette(7);

  const crystalHills = [
    [-7.2, -7.1, 1.25, 0.5],
    [7.1, -7.1, 1.3, 0.54],
    [7.1, 7.1, 1.25, 0.5],
    [-7.2, 7.1, 1.15, 0.46],
    [-5.6, 5.8, 0.9, 0.34],
    [5.5, -5.5, 0.95, 0.36],
    [3.1, 6.6, 0.82, 0.3]
  ];

  for (const [x, z, radius, height] of crystalHills) {
    createLayeredHill(scene, {
      x,
      z,
      radius,
      height,
      baseColor: colors.dark,
      midColor: colors.mid,
      topColor: colors.high,
      style: "frozen"
    });
  }

  createCrystalField(scene, -6.8, 6.6, 5, 0.9);
  createCrystalField(scene, 6.8, -6.5, 5, 0.9);
  createCrystalField(scene, 5.9, 4.9, 4, 0.75);
}