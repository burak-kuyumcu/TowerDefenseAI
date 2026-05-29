import * as THREE from "three";
import { getCurrentStage } from "../game/stages.js";
import { createGameMaterial } from "../visuals/materials.js";

let stagePathMeshes = [];

export function initStagePath(scene) {
  removeAllPathTiles(scene);
  rebuildStagePath(scene);
}

export function rebuildStagePath(scene) {
  clearStagePath(scene);

  const stage = getCurrentStage();
  const pathTiles = buildTilesFromStagePath(stage.path);

  for (const tilePos of pathTiles) {
    const tile = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.1, 1),
      createGameMaterial(stage.roadColor ?? 0x7c4f25, "path")
    );

    tile.position.set(tilePos.x, 0.055, tilePos.z);
    tile.receiveShadow = true;

    tile.userData.isPathTile = true;
    tile.userData.pathKey = `${tilePos.x},${tilePos.z}`;
    tile.userData.baseColor = stage.roadColor ?? 0x7c4f25;
    tile.userData.shaderRole = "path";
    tile.userData.isDynamicStagePath = true;

    scene.add(tile);
    stagePathMeshes.push(tile);
  }
}

export function clearStagePath(scene) {
  for (const mesh of stagePathMeshes) {
    scene.remove(mesh);
    mesh.geometry?.dispose?.();
    mesh.material?.dispose?.();
  }

  stagePathMeshes = [];
}

function removeAllPathTiles(scene) {
  const oldPathTiles = [];

  scene.traverse((object) => {
    if (object.isMesh && object.userData?.isPathTile) {
      oldPathTiles.push(object);
    }
  });

  for (const tile of oldPathTiles) {
    scene.remove(tile);
    tile.geometry?.dispose?.();
    tile.material?.dispose?.();
  }
}

function buildTilesFromStagePath(path) {
  const result = new Map();

  if (!path || path.length === 0) return [];

  for (let i = 0; i < path.length - 1; i++) {
    const [startX, startZ] = path[i];
    const [endX, endZ] = path[i + 1];

    addOrthogonalSegment(result, startX, startZ, endX, endZ);
  }

  return [...result.values()];
}

function addOrthogonalSegment(result, startX, startZ, endX, endZ) {
  let x = startX;
  let z = startZ;

  result.set(`${x},${z}`, { x, z });

  while (x !== endX) {
    x += Math.sign(endX - x);
    result.set(`${x},${z}`, { x, z });
  }

  while (z !== endZ) {
    z += Math.sign(endZ - z);
    result.set(`${x},${z}`, { x, z });
  }
}