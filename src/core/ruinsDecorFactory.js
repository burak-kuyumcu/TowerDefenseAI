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
  isDecorSpotFree
} from "./decorRegistry.js";

export function createStonePlate(scene, x, z) {
  if (!isAreaSafe(x, z, 1.05, 0.85, 0.14, true)) return;
  if (!isDecorSpotFree(x, z, 0.48)) return;

  const plate = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 0.055, 0.62),
      createGameMaterial(0x8a7354, "decor")
    ),
    0x8a7354,
    "decor"
  );

  plate.position.set(x, 0.07, z);
  plate.rotation.y = hash01(x, z, 431) * Math.PI;
  plate.castShadow = true;
  plate.receiveShadow = true;

  markStageDecoration(plate);
  reserveDecorSpot(x, z, 0.48);
  scene.add(plate);
}

export function createRuinsBlock(scene, x, z) {
  if (!isAreaSafe(x, z, 1.0, 1.0, 0.22)) return;
  if (!isDecorSpotFree(x, z, 0.55)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const block = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.42, 0.5),
      createGameMaterial(0x7d6a4f, "decor")
    ),
    0x7d6a4f,
    "decor"
  );

  block.position.y = 0.22;
  block.rotation.y = hash01(x, z, 441) * Math.PI;
  block.castShadow = true;
  block.receiveShadow = true;

  const cap = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.08, 0.62),
      createGameMaterial(0xc7aa6b, "decor")
    ),
    0xc7aa6b,
    "decor"
  );

  cap.position.y = 0.47;
  cap.rotation.y = block.rotation.y;
  cap.castShadow = true;
  cap.receiveShadow = true;

  group.add(block, cap);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.55);
  blockTerrainArea(x, z, 0.95, 0.95);
  scene.add(group);
}

export function createBrokenArch(scene, x, z) {
  if (!isAreaSafe(x, z, 1.35, 1.0, 0.24)) return;
  if (!isDecorSpotFree(x, z, 0.78)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = hash01(x, z, 451) * Math.PI;

  const leftPillar = createArchPillar(-0.36, 0);
  const rightPillar = createArchPillar(0.36, 0);

  const top = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.16, 0.24),
      createGameMaterial(0xc7aa6b, "decor")
    ),
    0xc7aa6b,
    "decor"
  );

  top.position.set(0, 1.02, 0);
  top.rotation.z = 0.08;
  top.castShadow = true;
  top.receiveShadow = true;

  const missingChunk = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.18, 0.26),
      createGameMaterial(0x574839, "decor")
    ),
    0x574839,
    "decor"
  );

  missingChunk.position.set(0.26, 0.92, 0.02);
  missingChunk.rotation.z = -0.35;
  missingChunk.castShadow = true;
  missingChunk.receiveShadow = true;

  group.add(leftPillar, rightPillar, top, missingChunk);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.78);
  blockTerrainArea(x, z, 1.3, 1.0);
  scene.add(group);
}

export function createRuinsDebrisField(scene, x, z) {
  if (!isAreaSafe(x, z, 1.35, 1.15, 0.14, true)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const colors = [0x7d6a4f, 0x8a7354, 0xc7aa6b, 0x574839];

  for (let i = 0; i < 8; i++) {
    const debris = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.18 + hash01(x + i, z, 461) * 0.16,
          0.06 + hash01(x, z + i, 463) * 0.08,
          0.16 + hash01(x + i, z, 465) * 0.14
        ),
        createGameMaterial(colors[i % colors.length], "decor")
      ),
      colors[i % colors.length],
      "decor"
    );

    debris.position.set(
      (hash01(x + i, z, 467) - 0.5) * 1.05,
      0.08,
      (hash01(x, z + i, 469) - 0.5) * 0.9
    );

    debris.rotation.y = hash01(x + i, z, 471) * Math.PI;
    debris.rotation.z = (hash01(x, z + i, 473) - 0.5) * 0.4;
    debris.castShadow = true;
    debris.receiveShadow = true;

    group.add(debris);
  }

  markStageDecoration(group);
  scene.add(group);
}

export function createRuinsColumn(scene, x, z) {
  if (!isAreaSafe(x, z, 0.95, 0.95, 0.22)) return;
  if (!isDecorSpotFree(x, z, 0.58)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const base = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.32, 0.16, 16),
      createGameMaterial(0x8a7354, "decor")
    ),
    0x8a7354,
    "decor"
  );

  base.position.y = 0.08;
  base.castShadow = true;
  base.receiveShadow = true;

  const shaftHeight = 0.78 + hash01(x, z, 481) * 0.35;

  const shaft = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.18, shaftHeight, 14),
      createGameMaterial(0xc7aa6b, "decor")
    ),
    0xc7aa6b,
    "decor"
  );

  shaft.position.y = 0.16 + shaftHeight / 2;
  shaft.rotation.z = (hash01(x, z, 483) - 0.5) * 0.18;
  shaft.castShadow = true;
  shaft.receiveShadow = true;

  const cap = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.12, 0.48),
      createGameMaterial(0x7d6a4f, "decor")
    ),
    0x7d6a4f,
    "decor"
  );

  cap.position.y = 0.22 + shaftHeight;
  cap.rotation.y = hash01(x, z, 485) * Math.PI;
  cap.castShadow = true;
  cap.receiveShadow = true;

  group.add(base, shaft, cap);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.58);
  blockTerrainArea(x, z, 0.9, 0.9);
  scene.add(group);
}

export function createRuinFloorPlateGroup(scene, x, z) {
  if (!isAreaSafe(x, z, 1.6, 1.4, 0.12, true)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.064, z);
  group.rotation.y = hash01(x, z, 491) * Math.PI;

  const pieces = [
    [-0.42, -0.18, 0.48, 0.32],
    [0.12, -0.2, 0.42, 0.26],
    [0.42, 0.22, 0.34, 0.3],
    [-0.14, 0.24, 0.5, 0.26]
  ];

  for (let i = 0; i < pieces.length; i++) {
    const [px, pz, width, depth] = pieces[i];

    const piece = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.035, depth),
        createGameMaterial(i % 2 === 0 ? 0x8a7354 : 0x7d6a4f, "decor")
      ),
      i % 2 === 0 ? 0x8a7354 : 0x7d6a4f,
      "decor"
    );

    piece.position.set(px, 0, pz);
    piece.rotation.y = (hash01(x + i, z, 493) - 0.5) * 0.22;
    piece.castShadow = true;
    piece.receiveShadow = true;

    group.add(piece);
  }

  markStageDecoration(group);
  scene.add(group);
}

function createArchPillar(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const lower = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.6, 0.24),
      createGameMaterial(0x8a7354, "decor")
    ),
    0x8a7354,
    "decor"
  );

  lower.position.y = 0.3;
  lower.castShadow = true;
  lower.receiveShadow = true;

  const upper = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.38, 0.22),
      createGameMaterial(0xc7aa6b, "decor")
    ),
    0xc7aa6b,
    "decor"
  );

  upper.position.y = 0.79;
  upper.castShadow = true;
  upper.receiveShadow = true;

  group.add(lower, upper);

  return group;
}