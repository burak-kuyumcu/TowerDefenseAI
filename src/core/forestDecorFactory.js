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

export function createForestCluster(scene, x, z, treeCount = 3, spread = 0.55) {
  if (!isAreaSafe(x, z, 1.25, 1.25, 0.24)) return;
  if (!isDecorSpotFree(x, z, 0.72)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < treeCount; i++) {
    const tree = createTreeModel(
      hash01(x + i, z, 71) > 0.55 ? "conifer" : "round",
      0.78 + hash01(x, z + i, 73) * 0.18
    );

    tree.position.set(
      (hash01(x + i, z, 81) - 0.5) * spread,
      0,
      (hash01(x, z + i, 83) - 0.5) * spread
    );

    group.add(tree);
  }

  markStageDecoration(group);
  registerAnimatedObject(group, "tree");
  reserveDecorSpot(x, z, 0.72);
  blockTerrainArea(x, z, 1.15, 1.15);
  scene.add(group);
}

export function createTreeModel(type = "conifer", scale = 1) {
  const group = new THREE.Group();
  group.scale.setScalar(scale);

  const trunk = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.12, 0.55, 8),
      createGameMaterial(0x7c2d12, "decor")
    ),
    0x7c2d12,
    "decor"
  );

  trunk.position.y = 0.28;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  if (type === "conifer") {
    const leavesA = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.34, 0.64, 10),
        createGameMaterial(0x14532d, "decor")
      ),
      0x14532d,
      "decor"
    );

    leavesA.position.y = 0.76;
    leavesA.castShadow = true;
    leavesA.receiveShadow = true;

    const leavesB = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.26, 0.48, 10),
        createGameMaterial(0x166534, "decor")
      ),
      0x166534,
      "decor"
    );

    leavesB.position.y = 1.03;
    leavesB.castShadow = true;
    leavesB.receiveShadow = true;

    group.add(leavesA, leavesB);
  } else {
    const crownA = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 12),
        createGameMaterial(0x166534, "decor")
      ),
      0x166534,
      "decor"
    );

    crownA.position.set(-0.1, 0.92, 0);

    const crownB = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 12, 12),
        createGameMaterial(0x14532d, "decor")
      ),
      0x14532d,
      "decor"
    );

    crownB.position.set(0.15, 0.98, 0.04);

    const crownC = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 12, 12),
        createGameMaterial(0x15803d, "decor")
      ),
      0x15803d,
      "decor"
    );

    crownC.position.set(0.02, 1.11, -0.05);

    crownA.castShadow = true;
    crownB.castShadow = true;
    crownC.castShadow = true;

    crownA.receiveShadow = true;
    crownB.receiveShadow = true;
    crownC.receiveShadow = true;

    group.add(crownA, crownB, crownC);
  }

  return group;
}

export function createBushPatch(scene, x, z) {
  if (!isAreaSafe(x, z, 0.95, 0.95, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.52)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const colors = [0x14532d, 0x166534, 0x15803d, 0x1f7a35];

  for (let i = 0; i < 6; i++) {
    const bush = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.17 + hash01(x + i, z, 91) * 0.09, 12, 12),
        createGameMaterial(colors[i % colors.length], "decor")
      ),
      colors[i % colors.length],
      "decor"
    );

    bush.position.set(
      (hash01(x + i, z, 93) - 0.5) * 0.78,
      0.13 + hash01(x, z + i, 94) * 0.05,
      (hash01(x, z + i, 95) - 0.5) * 0.78
    );

    bush.scale.y = 0.52 + hash01(x + i, z, 97) * 0.18;
    bush.castShadow = true;
    bush.receiveShadow = true;

    group.add(bush);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.52);
  blockTerrainArea(x, z, 0.9, 0.9);
  scene.add(group);
}

export function createGrassPatch(scene, x, z, width = 1, depth = 0.65) {
  if (!isAreaSafe(x, z, width, depth, 0.1)) return;

  const patch = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.018, depth),
      createGameMaterial(0x2f7d37, "decor")
    ),
    0x2f7d37,
    "decor"
  );

  patch.position.set(x, 0.052, z);
  patch.rotation.y = hash01(x, z, 211) * Math.PI;

  if (patch.material) {
    patch.material.transparent = true;
    patch.material.opacity = 0.32;
    patch.material.depthWrite = false;
  }

  markStageDecoration(patch);
  scene.add(patch);
}

export function createSmallStone(scene, x, z) {
  if (!isAreaSafe(x, z, 0.72, 0.72, 0.18)) return;
  if (!isDecorSpotFree(x, z, 0.4)) return;

  const stone = applyShaderData(
    new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.22 + hash01(x, z, 221) * 0.08),
      createGameMaterial(0x64748b, "decor")
    ),
    0x64748b,
    "decor"
  );

  stone.position.set(x, 0.18, z);
  stone.scale.y = 0.65;
  stone.rotation.y = hash01(x, z, 223) * Math.PI;
  stone.castShadow = true;
  stone.receiveShadow = true;

  markStageDecoration(stone);
  reserveDecorSpot(x, z, 0.4);
  scene.add(stone);
}

export function createLog(scene, x, z) {
  if (!isAreaSafe(x, z, 1.1, 1.1, 0.22)) return;
  if (!isDecorSpotFree(x, z, 0.6)) return;

  const log = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.17, 0.9, 12),
      createGameMaterial(0x7c2d12, "decor")
    ),
    0x7c2d12,
    "decor"
  );

  log.rotation.z = Math.PI / 2;
  log.rotation.y = hash01(x, z, 101) * Math.PI;
  log.position.set(x, 0.18, z);
  log.castShadow = true;
  log.receiveShadow = true;

  markStageDecoration(log);
  reserveDecorSpot(x, z, 0.6);
  blockTerrainArea(x, z, 1.0, 1.0);
  scene.add(log);
}