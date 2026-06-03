import {
  createIcePatch,
  createSnowPile,
  createSnowyRock,
  createIceShardField,
  createLargeIceFormation,
  createIceCrystal
} from "./frozenDecorFactory.js";

import {
  collectSafeDecorSpots
} from "./decorSpotUtils.js";

export function createFrozenInterior(scene) {
  createProceduralFrozen(scene, 25);

  createIcePatch(scene, -6.0, 1.5);
  createIcePatch(scene, 3.8, 6.2);
  createIcePatch(scene, 5.7, -4.8);
  createIcePatch(scene, -3.9, -6.1);

  createSnowPile(scene, -1.4, -6.7);
  createSnowPile(scene, 6.1, 2.5);
  createSnowPile(scene, -6.5, 5.2);
  createSnowPile(scene, 2.4, 5.9);

  createSnowyRock(scene, 5.6, 2.5);
  createSnowyRock(scene, -5.8, -3.4);
  createSnowyRock(scene, 4.7, -6.3);

  createIceShardField(scene, -6.7, 6.5);
  createIceShardField(scene, 6.6, -6.3);
  createIceShardField(scene, 5.9, 4.8);
}

export function createFrozenHeroProps(scene) {
  createLargeIceFormation(scene, -7.0, 7.0);
  createLargeIceFormation(scene, 7.0, -7.0);
  createLargeIceFormation(scene, 7.0, 6.8);
}

function createProceduralFrozen(scene, count) {
  const spots = collectSafeDecorSpots({
    count,
    width: 1.05,
    depth: 1.05,
    padding: 0.22,
    spacing: 1.65,
    seed: 41
  });

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];

    if (i % 4 === 0) {
      createSnowPile(scene, spot.x, spot.z);
      continue;
    }

    if (i % 3 === 0) {
      createSnowyRock(scene, spot.x, spot.z);
      continue;
    }

    createIceCrystal(scene, spot.x, spot.z);
  }
}