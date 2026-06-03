import {
  createCrystalField,
  createLargeCrystalFormation,
  createRunePlate
} from "./crystalDecorFactory.js";

import {
  createIceCrystal
} from "./frozenDecorFactory.js";

import {
  createStonePlate
} from "./ruinsDecorFactory.js";

import {
  collectSafeDecorSpots
} from "./decorSpotUtils.js";

export function createCrystalInterior(scene) {
  createProceduralCrystal(scene, 26);

  createCrystalField(scene, -6.8, 6.6, 5, 0.9);
  createCrystalField(scene, 6.8, -6.5, 5, 0.9);
  createCrystalField(scene, 5.9, 4.9, 4, 0.75);
  createCrystalField(scene, -5.7, -5.6, 4, 0.75);

  createRunePlate(scene, -4.8, 2.4, 0.95);
  createRunePlate(scene, 4.8, -2.4, 0.95);
  createRunePlate(scene, 1.8, 6.1, 0.85);
  createRunePlate(scene, -2.2, -6.1, 0.85);

  createStonePlate(scene, -6.1, 0.6);
  createStonePlate(scene, 6.1, -0.6);
}

export function createCrystalHeroProps(scene) {
  createLargeCrystalFormation(scene, -7.0, 7.0);
  createLargeCrystalFormation(scene, 7.0, -7.0);
  createLargeCrystalFormation(scene, 7.0, 6.8);
  createLargeCrystalFormation(scene, -7.0, -6.8);

  createRunePlate(scene, -6.6, 3.8, 1.15);
  createRunePlate(scene, 6.6, -3.8, 1.15);
}

function createProceduralCrystal(scene, count) {
  const spots = collectSafeDecorSpots({
    count,
    width: 1.0,
    depth: 1.0,
    padding: 0.2,
    spacing: 1.55,
    seed: 91
  });

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];

    if (i % 6 === 0) {
      createCrystalField(scene, spot.x, spot.z, 3, 0.62);
      continue;
    }

    if (i % 5 === 0) {
      createRunePlate(scene, spot.x, spot.z, 0.78);
      continue;
    }

    if (i % 4 === 0) {
      createStonePlate(scene, spot.x, spot.z);
      continue;
    }

    createIceCrystal(scene, spot.x, spot.z, 0.88);
  }
}