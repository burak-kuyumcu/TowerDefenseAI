import {
  createCanyonRock,
  createTallCanyonSpire,
  createGroundCrack,
  createPebbleField,
  createCanyonBonePile,
  createCanyonNeedleGroup,
  createDeadShrub
} from "./canyonDecorFactory.js";

import {
  collectSafeDecorSpots
} from "./decorSpotUtils.js";

export function createCanyonInterior(scene) {
  createProceduralCanyon(scene, 28);

  createCanyonRock(scene, -6.5, -5.9);
  createCanyonRock(scene, -5.8, 2.6);
  createCanyonRock(scene, -3.2, 6.2);
  createCanyonRock(scene, 2.8, -6.6);
  createCanyonRock(scene, 5.9, -4.9);
  createCanyonRock(scene, 6.3, 2.9);
  createCanyonRock(scene, 4.6, 5.8);

  createDeadShrub(scene, -6.2, 1.2);
  createDeadShrub(scene, 6.4, 4.9);
  createDeadShrub(scene, -2.6, -6.2);
  createDeadShrub(scene, 3.8, -2.7);
  createDeadShrub(scene, 5.7, 0.6);

  createGroundCrack(scene, -5.4, 1.8, 0x3b1d12);
  createGroundCrack(scene, 4.8, 5.8, 0x3b1d12);
  createGroundCrack(scene, 0.9, -6.4, 0x3b1d12);
  createGroundCrack(scene, 6.1, -1.8, 0x3b1d12);

  createPebbleField(scene, -4.6, -6.7, 0x78350f);
  createPebbleField(scene, 2.9, 6.6, 0x78350f);
  createPebbleField(scene, 6.5, -6.2, 0x78350f);
}

export function createCanyonHeroProps(scene) {
  createTallCanyonSpire(scene, -7.1, 7.05);
  createTallCanyonSpire(scene, 7.05, -7.1);
  createTallCanyonSpire(scene, 7.2, 6.7);

  createCanyonNeedleGroup(scene, -7.0, -6.6);
  createCanyonNeedleGroup(scene, 6.9, 3.4);

  createCanyonBonePile(scene, -6.4, 4.6);
  createCanyonBonePile(scene, 5.4, -5.8);
}

function createProceduralCanyon(scene, count) {
  const spots = collectSafeDecorSpots({
    count,
    width: 1.05,
    depth: 1.05,
    padding: 0.22,
    spacing: 1.55,
    seed: 29
  });

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];

    if (i % 5 === 0) {
      createGroundCrack(scene, spot.x, spot.z, 0x3b1d12);
      continue;
    }

    if (i % 3 === 0) {
      createDeadShrub(scene, spot.x, spot.z);
      continue;
    }

    createCanyonRock(scene, spot.x, spot.z);
  }
}