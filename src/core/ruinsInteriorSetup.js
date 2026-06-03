import {
  createStonePlate,
  createRuinsBlock,
  createBrokenArch,
  createRuinsDebrisField,
  createRuinsColumn
} from "./ruinsDecorFactory.js";

import {
  collectSafeDecorSpots
} from "./decorSpotUtils.js";

export function createRuinsInterior(scene) {
  createProceduralRuins(scene, 25);

  createStonePlate(scene, -2.8, 6.2);
  createStonePlate(scene, 4.8, -5.9);
  createStonePlate(scene, -6.2, 1.9);
  createStonePlate(scene, 5.9, 3.4);

  createRuinsBlock(scene, -6.4, -5.8);
  createRuinsBlock(scene, 6.4, -5.7);
  createRuinsBlock(scene, -5.7, 5.8);
  createRuinsBlock(scene, 3.9, 6.3);

  createBrokenArch(scene, 6.5, 1.8);
  createBrokenArch(scene, -6.6, 6.4);

  createRuinsDebrisField(scene, -4.8, -6.3);
  createRuinsDebrisField(scene, 4.9, 5.8);
  createRuinsDebrisField(scene, 6.2, -2.4);
}

export function createRuinsHeroProps(scene) {
  createRuinsColumn(scene, -7.0, 7.0);
  createRuinsColumn(scene, 7.0, -7.0);
  createRuinsColumn(scene, 7.0, 6.8);

  createBrokenArch(scene, 7.0, -7.0);
}

function createProceduralRuins(scene, count) {
  const spots = collectSafeDecorSpots({
    count,
    width: 1.1,
    depth: 1.1,
    padding: 0.24,
    spacing: 1.65,
    seed: 53
  });

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];

    if (i % 4 === 0) {
      createRuinsColumn(scene, spot.x, spot.z);
      continue;
    }

    if (i % 3 === 0) {
      createStonePlate(scene, spot.x, spot.z);
      continue;
    }

    createRuinsBlock(scene, spot.x, spot.z);
  }
}