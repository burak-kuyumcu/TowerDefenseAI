import {
  createCanyonRock,
  createGroundCrack,
  createPebbleField,
  createTallCanyonSpire,
  createCanyonNeedleGroup,
  createDeadShrub
} from "./canyonDecorFactory.js";

import {
  createLavaCrack,
  createAshPatch
} from "./volcanicDecorFactory.js";

import {
  collectSafeDecorSpots
} from "./decorSpotUtils.js";

export function createVolcanicInterior(scene) {
  createProceduralVolcanic(scene, 26);

  createLavaCrack(scene, -5.8, 5.3, 1.55, 0.35);
  createLavaCrack(scene, 5.3, -5.8, 1.45, 0.32);
  createLavaCrack(scene, 5.7, 2.3, 1.15, 0.28);
  createLavaCrack(scene, -3.8, -6.1, 1.2, 0.28);

  createAshPatch(scene, -6.1, 2.8);
  createAshPatch(scene, 5.9, 5.4);
  createAshPatch(scene, 2.2, -6.2);

  createCanyonRock(scene, -6.5, -4.8);
  createCanyonRock(scene, 6.4, -5.1);
  createCanyonRock(scene, -5.6, 6.1);
  createCanyonRock(scene, 6.2, 2.8);

  createGroundCrack(scene, -5.6, -1.4, 0x1f0806);
  createGroundCrack(scene, 4.7, 4.9, 0x1f0806);
  createGroundCrack(scene, 0.5, -6.5, 0x1f0806);

  createPebbleField(scene, -4.9, -6.4, 0x450a0a);
  createPebbleField(scene, 3.5, 6.5, 0x450a0a);
}

export function createVolcanicHeroProps(scene) {
  createTallCanyonSpire(scene, -7.0, -7.0);
  createTallCanyonSpire(scene, 7.0, 7.0);

  createCanyonNeedleGroup(scene, -6.8, 6.7);
  createCanyonNeedleGroup(scene, 6.8, -6.8);

  createLavaCrack(scene, -7.0, 1.4, 1.4, 0.38);
  createLavaCrack(scene, 7.0, -1.4, 1.4, 0.38);

  createAshPatch(scene, -7.0, -4.3);
  createAshPatch(scene, 7.0, 4.3);
}

function createProceduralVolcanic(scene, count) {
  const spots = collectSafeDecorSpots({
    count,
    width: 1.1,
    depth: 1.1,
    padding: 0.22,
    spacing: 1.55,
    seed: 67
  });

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];

    if (i % 6 === 0) {
      createLavaCrack(scene, spot.x, spot.z, 1.0, 0.22);
      continue;
    }

    if (i % 5 === 0) {
      createAshPatch(scene, spot.x, spot.z);
      continue;
    }

    if (i % 4 === 0) {
      createDeadShrub(scene, spot.x, spot.z);
      continue;
    }

    if (i % 3 === 0) {
      createGroundCrack(scene, spot.x, spot.z, 0x1f0806);
      continue;
    }

    createCanyonRock(scene, spot.x, spot.z);
  }
}