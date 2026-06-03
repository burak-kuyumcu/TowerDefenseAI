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

export function createCanyonRock(scene, x, z) {
  if (!isAreaSafe(x, z, 1.0, 1.0, 0.25)) return;
  if (!isDecorSpotFree(x, z, 0.58)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const colors = [0x7c2d12, 0x92400e, 0x78350f];

  for (let i = 0; i < 3; i++) {
    const rock = applyShaderData(
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.28 + i * 0.06),
        createGameMaterial(colors[i], "decor")
      ),
      colors[i],
      "decor"
    );

    rock.position.set(i * 0.22 - 0.2, 0.2 + i * 0.04, i * 0.14 - 0.12);
    rock.scale.y = 0.65;
    rock.rotation.y = hash01(x + i, z, 111) * Math.PI;
    rock.castShadow = true;
    rock.receiveShadow = true;

    group.add(rock);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.58);
  blockTerrainArea(x, z, 0.95, 0.95);
  scene.add(group);
}

export function createTallCanyonSpire(scene, x, z) {
  if (!isAreaSafe(x, z, 1.0, 1.0, 0.25)) return;
  if (!isDecorSpotFree(x, z, 0.65)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const base = applyShaderData(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.34, 1.1, 7),
      createGameMaterial(0x7c2d12, "decor")
    ),
    0x7c2d12,
    "decor"
  );

  base.position.y = 0.55;
  base.scale.x = 0.75;
  base.scale.z = 1.05;
  base.castShadow = true;
  base.receiveShadow = true;

  const cap = applyShaderData(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.38, 7),
      createGameMaterial(0xf59e0b, "decor")
    ),
    0xf59e0b,
    "decor"
  );

  cap.position.y = 1.15;
  cap.castShadow = true;
  cap.receiveShadow = true;

  group.add(base, cap);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.65);
  blockTerrainArea(x, z, 1.0, 1.0);
  scene.add(group);
}

export function createGroundCrack(scene, x, z, color) {
  if (!isAreaSafe(x, z, 1.0, 1.0, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.5)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.065, z);

  for (let i = 0; i < 4; i++) {
    const crack = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.34 - i * 0.04, 0.018, 0.03),
        createGameMaterial(color, "decor")
      ),
      color,
      "decor"
    );

    crack.position.set(
      i * 0.15 - 0.18,
      0,
      (hash01(x, z + i, 121) - 0.5) * 0.18
    );

    crack.rotation.y = hash01(x + i, z, 123) * Math.PI;

    if (crack.material) {
      crack.material.transparent = true;
      crack.material.opacity = 0.72;
      crack.material.depthWrite = false;
    }

    group.add(crack);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.5);
  scene.add(group);
}

export function createPebbleField(scene, x, z, color = 0x78350f) {
  if (!isAreaSafe(x, z, 1.2, 1.2, 0.18, true)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < 7; i++) {
    const pebble = applyShaderData(
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.07 + hash01(x + i, z, 811) * 0.05),
        createGameMaterial(color, "decor")
      ),
      color,
      "decor"
    );

    pebble.position.set(
      (hash01(x + i, z, 813) - 0.5) * 0.9,
      0.08,
      (hash01(x, z + i, 815) - 0.5) * 0.9
    );

    pebble.scale.y = 0.55;
    pebble.rotation.y = hash01(x + i, z, 817) * Math.PI;
    pebble.castShadow = true;
    pebble.receiveShadow = true;

    group.add(pebble);
  }

  markStageDecoration(group);
  scene.add(group);
}

export function createCanyonBonePile(scene, x, z) {
  if (!isAreaSafe(x, z, 1.1, 1.1, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.55)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.08, z);

  for (let i = 0; i < 4; i++) {
    const bone = applyShaderData(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.03, 0.55, 8),
        createGameMaterial(0xe7d7b5, "decor")
      ),
      0xe7d7b5,
      "decor"
    );

    bone.rotation.z = Math.PI / 2;
    bone.rotation.y = i * 0.75;

    bone.position.set(
      (hash01(x + i, z, 821) - 0.5) * 0.45,
      0.05,
      (hash01(x, z + i, 823) - 0.5) * 0.45
    );

    bone.castShadow = true;
    bone.receiveShadow = true;

    group.add(bone);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.55);
  scene.add(group);
}

export function createCanyonNeedleGroup(scene, x, z) {
  if (!isAreaSafe(x, z, 1.25, 1.25, 0.22)) return;
  if (!isDecorSpotFree(x, z, 0.65)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < 3; i++) {
    const color = i % 2 === 0 ? 0x7c2d12 : 0x92400e;

    const needle = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.16 + i * 0.04, 0.85 - i * 0.12, 7),
        createGameMaterial(color, "decor")
      ),
      color,
      "decor"
    );

    needle.position.set(i * 0.28 - 0.28, 0.42, (i % 2) * 0.18);
    needle.rotation.z = (i - 1) * 0.08;
    needle.castShadow = true;
    needle.receiveShadow = true;

    group.add(needle);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.65);
  blockTerrainArea(x, z, 1.1, 1.1);
  scene.add(group);
}

export function createDeadShrub(scene, x, z) {
  if (!isAreaSafe(x, z, 0.9, 0.9, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.45)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.08, z);

  const branchColor = 0x5c2d18;

  for (let i = 0; i < 5; i++) {
    const branch = applyShaderData(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.032, 0.42 + i * 0.035, 6),
        createGameMaterial(branchColor, "decor")
      ),
      branchColor,
      "decor"
    );

    branch.position.y = 0.15 + i * 0.015;
    branch.rotation.z = 0.55 + i * 0.22;
    branch.rotation.y = i * 1.18;
    branch.castShadow = true;
    branch.receiveShadow = true;

    group.add(branch);
  }

  const root = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 8, 8),
      createGameMaterial(0x3b1d12, "decor")
    ),
    0x3b1d12,
    "decor"
  );

  root.position.y = 0.08;
  root.scale.y = 0.45;
  root.castShadow = true;
  root.receiveShadow = true;

  group.add(root);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.45);
  scene.add(group);
}