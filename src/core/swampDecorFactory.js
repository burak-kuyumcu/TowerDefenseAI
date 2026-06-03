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

export function createSwampPool(scene, x, z, width = 1.1, depth = 0.7) {
  if (!isAreaSafe(x, z, width, depth, 0.12, true)) return;
  if (!isDecorSpotFree(x, z, 0.55)) return;

  const pool = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.018, depth),
      createGameMaterial(0x064e3b, "decor")
    ),
    0x064e3b,
    "decor"
  );

  pool.position.set(x, 0.052, z);
  pool.rotation.y = hash01(x, z, 931) * Math.PI;

  if (pool.material) {
    pool.material.transparent = true;
    pool.material.opacity = 0.5;
    pool.material.depthWrite = false;
  }

  const shine = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.72, 0.01, depth * 0.42),
      createGameMaterial(0x22c55e, "decor")
    ),
    0x22c55e,
    "decor"
  );

  shine.position.set(x, 0.066, z);
  shine.rotation.y = pool.rotation.y + 0.18;

  if (shine.material) {
    shine.material.transparent = true;
    shine.material.opacity = 0.18;
    shine.material.depthWrite = false;
  }

  markStageDecoration(pool);
  markStageDecoration(shine);
  reserveDecorSpot(x, z, 0.55);

  scene.add(pool, shine);
}

export function createSwampTree(scene, x, z, scale = 1) {
  if (!isAreaSafe(x, z, 1.0 * scale, 1.0 * scale, 0.25)) return;
  if (!isDecorSpotFree(x, z, 0.62 * scale)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);

  const trunk = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.18, 0.9, 8),
      createGameMaterial(0x3f2f1d, "decor")
    ),
    0x3f2f1d,
    "decor"
  );

  trunk.position.y = 0.45;
  trunk.rotation.z = (hash01(x, z, 941) - 0.5) * 0.18;
  trunk.castShadow = true;
  trunk.receiveShadow = true;

  const moss = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 12, 12),
      createGameMaterial(0x166534, "decor")
    ),
    0x166534,
    "decor"
  );

  moss.position.y = 0.96;
  moss.scale.set(1.1, 0.5, 0.85);
  moss.castShadow = true;
  moss.receiveShadow = true;

  const hangingVines = createHangingVines(x, z);

  group.add(trunk, moss, hangingVines);

  markStageDecoration(group);
  registerAnimatedObject(group, "tree");
  reserveDecorSpot(x, z, 0.62 * scale);
  blockTerrainArea(x, z, 0.95 * scale, 0.95 * scale);

  scene.add(group);
}

export function createReedPatch(scene, x, z) {
  if (!isAreaSafe(x, z, 0.9, 0.9, 0.18)) return;
  if (!isDecorSpotFree(x, z, 0.45)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < 6; i++) {
    const color = i % 2 === 0 ? 0x365314 : 0x4d7c0f;

    const reed = applyShaderData(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.026, 0.46 + i * 0.025, 6),
        createGameMaterial(color, "decor")
      ),
      color,
      "decor"
    );

    reed.position.set(
      (hash01(x + i, z, 951) - 0.5) * 0.55,
      0.22,
      (hash01(x, z + i, 953) - 0.5) * 0.55
    );

    reed.rotation.z = (hash01(x + i, z, 955) - 0.5) * 0.22;
    reed.rotation.x = (hash01(x, z + i, 956) - 0.5) * 0.12;
    reed.castShadow = true;
    reed.receiveShadow = true;

    group.add(reed);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.45);
  scene.add(group);
}

export function createMushroomCluster(scene, x, z) {
  if (!isAreaSafe(x, z, 0.9, 0.9, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.45)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < 4; i++) {
    const mushroom = createMushroomModel({
      capColor: i % 2 === 0 ? 0x84cc16 : 0xa3e635,
      scale: 0.82 + hash01(x + i, z, 963) * 0.22
    });

    mushroom.position.set(i * 0.12 - 0.18, 0, (i % 2) * 0.12);
    mushroom.rotation.y = hash01(x + i, z, 965) * Math.PI;

    group.add(mushroom);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.45);
  scene.add(group);
}

export function createLargeMushroomCluster(scene, x, z) {
  if (!isAreaSafe(x, z, 1.35, 1.1, 0.2)) return;

  createMushroomCluster(scene, x, z);
  createMushroomCluster(scene, x + 0.45, z + 0.2);

  const hero = createMushroomModel({
    capColor: 0x84cc16,
    scale: 1.35
  });

  hero.position.set(x - 0.36, 0, z + 0.26);
  hero.rotation.y = hash01(x, z, 971) * Math.PI;

  markStageDecoration(hero);
  scene.add(hero);
}

function createMushroomModel({ capColor = 0x84cc16, scale = 1 } = {}) {
  const group = new THREE.Group();
  group.scale.setScalar(scale);

  const stem = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 0.22, 8),
      createGameMaterial(0xd6d3d1, "decor")
    ),
    0xd6d3d1,
    "decor"
  );

  stem.position.y = 0.11;
  stem.castShadow = true;
  stem.receiveShadow = true;

  const cap = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 12, 8),
      createGameMaterial(capColor, "decor")
    ),
    capColor,
    "decor"
  );

  cap.position.y = 0.24;
  cap.scale.y = 0.45;
  cap.castShadow = true;
  cap.receiveShadow = true;

  group.add(stem, cap);

  return group;
}

function createHangingVines(x, z) {
  const group = new THREE.Group();

  for (let i = 0; i < 4; i++) {
    const vine = applyShaderData(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.016, 0.38 + i * 0.04, 5),
        createGameMaterial(0x365314, "decor")
      ),
      0x365314,
      "decor"
    );

    vine.position.set(
      (hash01(x + i, z, 981) - 0.5) * 0.35,
      0.72 - i * 0.015,
      (hash01(x, z + i, 983) - 0.5) * 0.28
    );

    vine.rotation.z = (hash01(x + i, z, 985) - 0.5) * 0.32;
    vine.castShadow = true;
    vine.receiveShadow = true;

    group.add(vine);
  }

  return group;
}