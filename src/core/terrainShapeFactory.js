import * as THREE from "three";
import { createGameMaterial } from "../visuals/materials.js";

import {
  applyShaderData,
  markStageDecoration,
  isAreaSafe,
  hash01
} from "./sceneObjectUtils.js";

import {
  reserveDecorSpot,
  isDecorSpotFree
} from "./decorRegistry.js";

import {
  createTreeModel
} from "./forestDecorFactory.js";

export function createLayeredHill(scene, config) {
  const {
    x,
    z,
    radius,
    height,
    baseColor,
    midColor,
    topColor,
    style = "forest",
    addTrees = false
  } = config;

  if (!isAreaSafe(x, z, radius * 2.05, radius * 2.05, 0.14, true)) return;
  if (!isDecorSpotFree(x, z, Math.min(radius * 0.65, 0.95))) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const segmentCount = style === "canyon" ? 8 : 18;

  const base = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius * 0.98,
        radius * 1.18,
        height * 0.42,
        segmentCount
      ),
      createGameMaterial(baseColor, "decor")
    ),
    baseColor,
    "decor"
  );

  base.position.y = height * 0.21;
  base.castShadow = true;
  base.receiveShadow = true;

  const middle = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius * 0.74,
        radius * 0.98,
        height * 0.36,
        segmentCount
      ),
      createGameMaterial(midColor, "decor")
    ),
    midColor,
    "decor"
  );

  middle.position.y = height * 0.6;
  middle.castShadow = true;
  middle.receiveShadow = true;

  const upper = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius * 0.52,
        radius * 0.74,
        height * 0.24,
        segmentCount
      ),
      createGameMaterial(topColor, "decor")
    ),
    topColor,
    "decor"
  );

  upper.position.y = height * 0.9;
  upper.castShadow = true;
  upper.receiveShadow = true;

  group.add(base, middle, upper);

  if (style === "forest") {
    const cap = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.52, 18, 12),
        createGameMaterial(topColor, "decor")
      ),
      topColor,
      "decor"
    );

    cap.position.y = height * 1.08;
    cap.scale.y = 0.24;
    cap.castShadow = true;
    cap.receiveShadow = true;

    group.add(cap);

    if (addTrees) {
      addHillTopTrees(group, radius, height);
      addHillRocks(group, radius, height);
    }
  } else if (style === "canyon") {
    const top = applyShaderData(
      new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.65, radius * 0.72, 0.12, 8),
        createGameMaterial(topColor, "decor")
      ),
      topColor,
      "decor"
    );

    top.position.y = height + 0.06;
    top.castShadow = true;
    top.receiveShadow = true;

    group.add(top);
  } else if (style === "frozen") {
    const snow = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.62, 16, 12),
        createGameMaterial(0xe0f2fe, "decor")
      ),
      0xe0f2fe,
      "decor"
    );

    snow.position.y = height * 1.05;
    snow.scale.y = 0.24;
    snow.castShadow = true;
    snow.receiveShadow = true;

    group.add(snow);
  } else {
    const stoneTop = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(radius * 1.25, 0.1, radius * 0.95),
        createGameMaterial(topColor, "decor")
      ),
      topColor,
      "decor"
    );

    stoneTop.position.y = height + 0.05;
    stoneTop.rotation.y = hash01(x, z, 19) * Math.PI;
    stoneTop.castShadow = true;
    stoneTop.receiveShadow = true;

    group.add(stoneTop);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, Math.min(radius * 0.55, 0.85));
  scene.add(group);
}

export function addHillTopTrees(group, radius, height) {
  const treeCount = radius > 1.5 ? 4 : 2;

  for (let i = 0; i < treeCount; i++) {
    const angle = (Math.PI * 2 * i) / treeCount + 0.45;
    const distance = radius * (0.22 + i * 0.06);

    const tree = createTreeModel(i % 2 === 0 ? "round" : "conifer", 0.48);

    tree.position.set(
      Math.cos(angle) * distance,
      height * 1.02,
      Math.sin(angle) * distance
    );

    tree.scale.multiplyScalar(0.75 + i * 0.05);
    group.add(tree);
  }
}

export function addHillRocks(group, radius, height) {
  for (let i = 0; i < 3; i++) {
    const angle = i * 2.1 + 0.3;

    const rock = applyShaderData(
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.12 + i * 0.025),
        createGameMaterial(0x475569, "decor")
      ),
      0x475569,
      "decor"
    );

    rock.position.set(
      Math.cos(angle) * radius * 0.45,
      height * 0.72,
      Math.sin(angle) * radius * 0.45
    );

    rock.scale.y = 0.65;
    rock.rotation.y = angle;
    rock.castShadow = true;
    rock.receiveShadow = true;

    group.add(rock);
  }
}

export function createForestFloorPatch(scene, x, z, width, depth) {
  if (!isAreaSafe(x, z, width, depth, 0.08)) return;

  const patch = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.018, depth),
      createGameMaterial(0x2f7d37, "decor")
    ),
    0x2f7d37,
    "decor"
  );

  patch.position.set(x, 0.052, z);
  patch.rotation.y = hash01(x, z, 27) * Math.PI;

  if (patch.material) {
    patch.material.transparent = true;
    patch.material.opacity = 0.28;
    patch.material.depthWrite = false;
  }

  markStageDecoration(patch);
  scene.add(patch);
}

export function createBiomeGroundPatch(
  scene,
  x,
  z,
  width,
  depth,
  color,
  opacity = 0.22
) {
  if (!isAreaSafe(x, z, width, depth, 0.08, true)) return;

  const patch = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.018, depth),
      createGameMaterial(color, "decor")
    ),
    color,
    "decor"
  );

  patch.position.set(x, 0.052, z);
  patch.rotation.y = hash01(x, z, 31) * Math.PI;

  if (patch.material) {
    patch.material.transparent = true;
    patch.material.opacity = opacity;
    patch.material.depthWrite = false;
  }

  markStageDecoration(patch);
  scene.add(patch);
}