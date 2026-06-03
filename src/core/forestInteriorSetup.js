import {
  createForestCluster,
  createTreeModel,
  createBushPatch,
  createGrassPatch,
  createSmallStone,
  createLog
} from "./forestDecorFactory.js";

import {
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

export function createForestInterior(scene) {
  createForestZone(scene, [
    [-6.8, -6.2, "cluster"],
    [-6.1, -5.1, "tree"],
    [-7.1, -3.6, "bush"],
    [-6.3, -1.4, "tree"],
    [-7.0, 1.5, "bush"],
    [-6.4, 4.7, "cluster"],
    [-7.1, 6.2, "tree"],

    [-3.9, -7.0, "tree"],
    [-2.2, -6.7, "bush"],
    [0.2, -7.1, "tree"],
    [2.6, -6.8, "cluster"],
    [5.2, -6.9, "bush"],

    [6.9, -6.2, "cluster"],
    [6.3, -4.1, "tree"],
    [7.0, -1.6, "bush"],
    [6.4, 1.8, "cluster"],
    [7.0, 4.7, "tree"],
    [6.2, 6.4, "bush"],

    [-4.9, 6.6, "tree"],
    [-2.7, 6.9, "bush"],
    [0.7, 6.8, "tree"],
    [3.2, 6.5, "cluster"],

    [-2.8, 2.2, "bush"],
    [2.8, 2.6, "tree"],
    [4.9, -3.6, "bush"],
    [-4.6, -4.1, "tree"],

    [-1.8, 4.4, "bush"],
    [1.8, 4.7, "tree"],
    [4.1, 1.2, "bush"],
    [-4.2, 0.8, "tree"],
    [1.1, -4.7, "bush"],
    [-1.4, -4.9, "tree"]
  ]);

  createForestLandmarkGrove(scene);
  createForestGroundDetails(scene);
  createForestScatterDetails(scene);

  createLog(scene, -6.0, -2.6);
  createLog(scene, 3.8, 6.6);
  createLog(scene, 5.0, -5.2);
  createLog(scene, -2.8, 5.4);
  createLog(scene, 4.2, 1.9);
}

export function createForestHeroProps(scene) {
  createForestCluster(scene, -7.25, -7.2, 5, 0.85);
  createForestCluster(scene, -7.15, 7.15, 5, 0.85);
  createForestCluster(scene, 7.1, -7.1, 5, 0.85);
  createForestCluster(scene, 7.1, 7.1, 5, 0.85);

  createTallTree(scene, -6.6, -6.8);
  createTallTree(scene, -6.8, 6.7);
  createTallTree(scene, 6.7, -6.8);
  createTallTree(scene, 6.6, 6.7);

  createTallTree(scene, -5.2, 5.9);
  createTallTree(scene, 5.6, 5.6);
}

function createForestZone(scene, plan) {
  for (const [x, z, type] of plan) {
    if (type === "cluster") {
      createForestCluster(scene, x, z, 3, 0.62);
      continue;
    }

    if (type === "tree") {
      createSingleForestTree(scene, x, z);
      continue;
    }

    if (type === "bush") {
      createBushPatch(scene, x, z);
    }
  }
}

function createSingleForestTree(scene, x, z) {
  if (!isAreaSafe(x, z, 0.95, 0.95, 0.22)) return;
  if (!isDecorSpotFree(x, z, 0.56)) return;

  const tree = createTreeModel(
    hash01(x, z, 201) > 0.45 ? "conifer" : "round",
    0.82 + hash01(x, z, 203) * 0.16
  );

  tree.position.set(x, 0, z);

  markStageDecoration(tree);
  registerAnimatedObject(tree, "tree");
  reserveDecorSpot(x, z, 0.56);
  blockTerrainArea(x, z, 0.8, 0.8);
  scene.add(tree);
}

function createTallTree(scene, x, z) {
  if (!isAreaSafe(x, z, 1.05, 1.05, 0.25)) return;
  if (!isDecorSpotFree(x, z, 0.72)) return;

  const tree = createTreeModel("round", 1.18);
  tree.position.set(x, 0, z);

  markStageDecoration(tree);
  registerAnimatedObject(tree, "tree");
  reserveDecorSpot(x, z, 0.72);
  blockTerrainArea(x, z, 1.0, 1.0);
  scene.add(tree);
}

function createForestLandmarkGrove(scene) {
  const grove = [
    [-5.9, 5.9],
    [-5.2, 6.4],
    [-4.7, 5.7],
    [-5.5, 5.2],
    [-4.9, 6.8],
    [-6.2, 6.6]
  ];

  for (const [x, z] of grove) {
    createSingleForestTree(scene, x, z);
  }

  createBushPatch(scene, -5.25, 5.85);
  createBushPatch(scene, -6.05, 5.55);
}

function createForestGroundDetails(scene) {
  createGrassPatch(scene, -5.2, 3.7, 1.25, 0.8);
  createGrassPatch(scene, 4.8, 4.8, 1.1, 0.7);
  createGrassPatch(scene, -2.4, -5.8, 1.2, 0.7);
  createGrassPatch(scene, 5.7, -2.8, 1.0, 0.65);
  createGrassPatch(scene, 1.2, 5.2, 1.1, 0.7);
  createGrassPatch(scene, -5.7, -0.4, 1.0, 0.65);

  createGrassPatch(scene, -1.6, 3.9, 1.0, 0.65);
  createGrassPatch(scene, 3.4, 2.6, 1.0, 0.65);
  createGrassPatch(scene, -3.7, 1.7, 0.9, 0.6);
  createGrassPatch(scene, 4.8, -1.2, 0.9, 0.6);
  createGrassPatch(scene, 0.2, -5.9, 1.1, 0.65);

  createSmallStone(scene, -4.8, 2.8);
  createSmallStone(scene, 2.7, 5.7);
  createSmallStone(scene, 5.5, -5.8);
  createSmallStone(scene, -6.1, 0.5);
  createSmallStone(scene, 3.9, -2.3);
  createSmallStone(scene, -2.9, -6.2);
  createSmallStone(scene, 1.8, 2.1);
  createSmallStone(scene, -1.8, 4.8);
}

function createForestScatterDetails(scene) {
  const details = [
    [-6.6, 3.2, "bush"],
    [-5.4, -4.5, "stone"],
    [-3.2, 4.9, "bush"],
    [-0.8, 6.1, "stone"],
    [1.9, 3.8, "bush"],
    [4.2, 3.8, "stone"],
    [5.8, 0.8, "bush"],
    [6.4, -3.0, "stone"],
    [3.0, -5.6, "bush"],
    [-0.2, -6.7, "stone"],
    [-4.9, -1.8, "bush"],
    [-6.8, -0.9, "stone"]
  ];

  for (const [x, z, type] of details) {
    if (type === "bush") {
      createBushPatch(scene, x, z);
    } else {
      createSmallStone(scene, x, z);
    }
  }
}