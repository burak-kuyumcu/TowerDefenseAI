import * as THREE from "three";
import { createGameMaterial } from "../visuals/materials.js";

import {
  applyShaderData,
  markStageDecoration,
  blockTerrainArea,
  isAreaSafe,
  hash01
} from "./sceneObjectUtils.js";

import {
  reserveDecorSpot,
  isDecorSpotFree,
  registerAnimatedObject
} from "./decorRegistry.js";

export function createSnowDrift(scene, x, z) {
  if (!isAreaSafe(x, z, 1.2, 0.8, 0.14, true)) return;
  if (!isDecorSpotFree(x, z, 0.5)) return;

  const drift = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 18, 10),
      createGameMaterial(0xe0f2fe, "decor")
    ),
    0xe0f2fe,
    "decor"
  );

  drift.position.set(x, 0.08, z);
  drift.scale.set(1.2, 0.18, 0.68);
  drift.rotation.y = hash01(x, z, 341) * Math.PI;
  drift.castShadow = true;
  drift.receiveShadow = true;

  markStageDecoration(drift);
  reserveDecorSpot(x, z, 0.5);
  scene.add(drift);
}

export function createIcePatch(scene, x, z) {
  if (!isAreaSafe(x, z, 1.2, 0.9, 0.12, true)) return;

  const patch = applyShaderData(
    new THREE.Mesh(
      new THREE.CircleGeometry(0.48, 28),
      createGameMaterial(0xbae6fd, "decor")
    ),
    0xbae6fd,
    "decor"
  );

  patch.rotation.x = -Math.PI / 2;
  patch.rotation.z = hash01(x, z, 351) * Math.PI;
  patch.position.set(x, 0.064, z);
  patch.scale.set(1.35, 0.86, 1);

  if (patch.material) {
    patch.material.transparent = true;
    patch.material.opacity = 0.45;
    patch.material.depthWrite = false;
    patch.material.side = THREE.DoubleSide;
  }

  markStageDecoration(patch);
  scene.add(patch);
}

export function createSnowPile(scene, x, z) {
  if (!isAreaSafe(x, z, 0.95, 0.95, 0.16)) return;
  if (!isDecorSpotFree(x, z, 0.48)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < 4; i++) {
    const snow = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.18 + hash01(x + i, z, 361) * 0.08, 14, 10),
        createGameMaterial(0xf0f9ff, "decor")
      ),
      0xf0f9ff,
      "decor"
    );

    snow.position.set(
      (hash01(x + i, z, 363) - 0.5) * 0.58,
      0.11 + i * 0.015,
      (hash01(x, z + i, 365) - 0.5) * 0.58
    );

    snow.scale.y = 0.42;
    snow.castShadow = true;
    snow.receiveShadow = true;

    group.add(snow);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.48);
  scene.add(group);
}

export function createSnowyRock(scene, x, z) {
  if (!isAreaSafe(x, z, 0.95, 0.95, 0.18)) return;
  if (!isDecorSpotFree(x, z, 0.48)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const rock = applyShaderData(
    new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.28),
      createGameMaterial(0x64748b, "decor")
    ),
    0x64748b,
    "decor"
  );

  rock.position.y = 0.22;
  rock.scale.set(1.05, 0.72, 0.88);
  rock.rotation.y = hash01(x, z, 371) * Math.PI;
  rock.castShadow = true;
  rock.receiveShadow = true;

  const snowCap = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 8),
      createGameMaterial(0xe0f2fe, "decor")
    ),
    0xe0f2fe,
    "decor"
  );

  snowCap.position.y = 0.42;
  snowCap.scale.set(1.1, 0.25, 0.8);
  snowCap.castShadow = true;
  snowCap.receiveShadow = true;

  group.add(rock, snowCap);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.48);
  blockTerrainArea(x, z, 0.85, 0.85);
  scene.add(group);
}

export function createIceCrystal(scene, x, z, scale = 1) {
  if (!isAreaSafe(x, z, 0.75 * scale, 0.75 * scale, 0.16)) return;
  if (!isDecorSpotFree(x, z, 0.4 * scale)) return;

  const crystal = applyShaderData(
    new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28 * scale),
      createGameMaterial(0x67e8f9, "decor")
    ),
    0x67e8f9,
    "decor"
  );

  crystal.position.set(x, 0.34 * scale, z);
  crystal.scale.y = 1.6;
  crystal.rotation.y = hash01(x, z, 381) * Math.PI;
  crystal.castShadow = true;
  crystal.receiveShadow = true;

  markStageDecoration(crystal);
  registerAnimatedObject(crystal, "crystal", {
    speed: 0.003 + hash01(x, z, 383) * 0.004
  });
  reserveDecorSpot(x, z, 0.4 * scale);
  blockTerrainArea(x, z, 0.7 * scale, 0.7 * scale);
  scene.add(crystal);
}

export function createIceShardField(scene, x, z, count = 4, spread = 0.7) {
  if (!isAreaSafe(x, z, 1.2, 1.2, 0.18)) return;
  if (!isDecorSpotFree(x, z, 0.66)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < count; i++) {
    const shard = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.09 + hash01(x + i, z, 391) * 0.05, 0.55, 6),
        createGameMaterial(0x93c5fd, "decor")
      ),
      0x93c5fd,
      "decor"
    );

    shard.position.set(
      (hash01(x + i, z, 393) - 0.5) * spread,
      0.28,
      (hash01(x, z + i, 395) - 0.5) * spread
    );

    shard.rotation.z = (hash01(x + i, z, 397) - 0.5) * 0.28;
    shard.rotation.y = hash01(x, z + i, 399) * Math.PI;
    shard.castShadow = true;
    shard.receiveShadow = true;

    group.add(shard);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.66);
  blockTerrainArea(x, z, 1.1, 1.1);
  scene.add(group);
}

export function createLargeIceFormation(scene, x, z) {
  if (!isAreaSafe(x, z, 1.25, 1.25, 0.22)) return;
  if (!isDecorSpotFree(x, z, 0.7)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const heights = [1.15, 0.92, 0.78, 0.62];
  const offsets = [
    [0, 0],
    [0.28, 0.18],
    [-0.25, 0.2],
    [0.06, -0.28]
  ];

  for (let i = 0; i < heights.length; i++) {
    const shard = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.16 - i * 0.015, heights[i], 7),
        createGameMaterial(i % 2 === 0 ? 0x67e8f9 : 0xbae6fd, "decor")
      ),
      i % 2 === 0 ? 0x67e8f9 : 0xbae6fd,
      "decor"
    );

    shard.position.set(offsets[i][0], heights[i] / 2, offsets[i][1]);
    shard.rotation.z = (i - 1.5) * 0.08;
    shard.rotation.y = i * 0.9;
    shard.castShadow = true;
    shard.receiveShadow = true;

    group.add(shard);
  }

  markStageDecoration(group);
  registerAnimatedObject(group, "crystal", {
    speed: 0.0025
  });
  reserveDecorSpot(x, z, 0.7);
  blockTerrainArea(x, z, 1.2, 1.2);
  scene.add(group);
}