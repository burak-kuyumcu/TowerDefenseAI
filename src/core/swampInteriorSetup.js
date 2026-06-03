import {
  createSwampPool,
  createSwampTree,
  createReedPatch,
  createMushroomCluster,
  createLargeMushroomCluster
} from "./swampDecorFactory.js";

import {
  createBushPatch,
  createSmallStone
} from "./forestDecorFactory.js";

import {
  collectSafeDecorSpots
} from "./decorSpotUtils.js";

export function createSwampInterior(scene) {
  createProceduralSwamp(scene, 26);

  createSwampTree(scene, -6.7, -6.0, 1.05);
  createSwampTree(scene, 6.6, 5.8, 1.0);
  createSwampTree(scene, -5.8, 3.2, 0.9);
  createSwampTree(scene, 5.8, -4.4, 0.92);

  createReedPatch(scene, -5.8, 2.6);
  createReedPatch(scene, 5.8, -2.7);
  createReedPatch(scene, 2.4, 6.3);
  createReedPatch(scene, -3.4, -6.4);

  createMushroomCluster(scene, -4.7, -6.5);
  createMushroomCluster(scene, 4.8, 6.1);
  createMushroomCluster(scene, 6.3, 1.6);
  createMushroomCluster(scene, -6.2, 4.7);

  createBushPatch(scene, -6.8, 0.2);
  createBushPatch(scene, 6.8, -0.4);
  createBushPatch(scene, -2.2, 6.5);
  createBushPatch(scene, 2.8, -6.6);

  createSmallStone(scene, -5.5, -4.8);
  createSmallStone(scene, 5.2, 4.9);
}

export function createSwampHeroProps(scene) {
  createLargeMushroomCluster(scene, -6.9, -6.9);
  createLargeMushroomCluster(scene, 6.9, 6.9);

  createSwampTree(scene, -7.0, 6.8, 1.22);
  createSwampTree(scene, 7.0, -6.8, 1.22);

  createSwampPool(scene, -7.0, 0.8, 1.2, 0.78);
  createSwampPool(scene, 7.0, -0.8, 1.2, 0.78);

  createReedPatch(scene, -6.6, 1.8);
  createReedPatch(scene, 6.6, -1.8);
}

function createProceduralSwamp(scene, count) {
  const spots = collectSafeDecorSpots({
    count,
    width: 1.0,
    depth: 1.0,
    padding: 0.2,
    spacing: 1.55,
    seed: 79
  });

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];

    if (i % 6 === 0) {
      createSwampPool(scene, spot.x, spot.z, 0.95, 0.6);
      continue;
    }

    if (i % 5 === 0) {
      createSwampTree(scene, spot.x, spot.z, 0.82);
      continue;
    }

    if (i % 4 === 0) {
      createMushroomCluster(scene, spot.x, spot.z);
      continue;
    }

    if (i % 3 === 0) {
      createReedPatch(scene, spot.x, spot.z);
      continue;
    }

    createBushPatch(scene, spot.x, spot.z);
  }
}