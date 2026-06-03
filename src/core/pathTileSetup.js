import * as THREE from "three";
import {
  getActivePathTiles,
  getActivePathSet
} from "./constants.js";
import {
  getStageRoadColor,
  getStageBorderColor
} from "./stageAtmosphere.js";
import { createGameMaterial } from "../visuals/materials.js";
import { getCurrentStage } from "../game/stages.js";

export function createPathTiles(scene) {
  const allPathTiles = getActivePathTiles();
  const allPathSet = getActivePathSet();

  for (const tile of allPathTiles) {
    createRoadTile(scene, tile.x, tile.z);
  }

  for (const tile of allPathTiles) {
    createRoadBorders(scene, tile.x, tile.z, allPathSet);
  }
}

export function clearPathTiles(scene) {
  const oldObjects = [];

  scene.traverse((object) => {
    if (
      object.userData?.isPathTile ||
      object.userData?.isPathBorder ||
      object.userData?.isPathGlow ||
      object.userData?.isRoadDecoration
    ) {
      oldObjects.push(object);
    }
  });

  for (const object of oldObjects) {
    removeObject(scene, object);
  }
}

function createRoadTile(scene, x, z) {
  const stage = getCurrentStage();
  const roadColor = getStageRoadColor();

  const tile = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.1, 0.96),
      createGameMaterial(roadColor, "path")
    ),
    roadColor,
    "path"
  );

  tile.position.set(x, 0.055, z);
  tile.receiveShadow = true;
  tile.userData.isPathTile = true;
  tile.userData.pathKey = `${x},${z}`;

  if (tile.material) {
    tile.material.transparent = false;
    tile.material.opacity = 1;
    tile.material.depthWrite = true;
    tile.material.depthTest = true;
  }

  scene.add(tile);

  createRoadSurfaceDetail(scene, x, z, stage.id);
}

function createRoadSurfaceDetail(scene, x, z, stageId) {
  if (hash01(x, z, 701) > 0.12) return;

  let color = 0x8a5a1f;

  if (stageId === 1) color = 0x8a7a22;
  if (stageId === 2) color = 0x8a3b12;
  if (stageId === 3) color = 0xf0f9ff;
  if (stageId === 4) color = 0x9b845f;
  if (stageId === 5) color = 0x7f1d1d;
  if (stageId === 6) color = 0x365314;
  if (stageId === 7) color = 0xc084fc;

  const detail = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.16 + hash01(x, z, 703) * 0.14,
        0.012,
        0.035 + hash01(x, z, 705) * 0.045
      ),
      createGameMaterial(color, "path")
    ),
    color,
    "path"
  );

  detail.position.set(
    x + (hash01(x, z, 707) - 0.5) * 0.3,
    0.112,
    z + (hash01(x, z, 709) - 0.5) * 0.3
  );

  detail.rotation.y = hash01(x, z, 711) * Math.PI;
  detail.userData.isRoadDecoration = true;

  if (detail.material) {
    detail.material.transparent = true;
    detail.material.opacity = stageId === 3 || stageId === 7 ? 0.22 : 0.14;
    detail.material.depthWrite = false;
  }

  scene.add(detail);
}

function createRoadBorders(scene, x, z, pathSet) {
  const borderColor = getStageBorderColor();

  const directions = [
    {
      dx: 0,
      dz: -1,
      px: 0,
      pz: -0.5,
      width: 0.96,
      depth: 0.08
    },
    {
      dx: 0,
      dz: 1,
      px: 0,
      pz: 0.5,
      width: 0.96,
      depth: 0.08
    },
    {
      dx: -1,
      dz: 0,
      px: -0.5,
      pz: 0,
      width: 0.08,
      depth: 0.96
    },
    {
      dx: 1,
      dz: 0,
      px: 0.5,
      pz: 0,
      width: 0.08,
      depth: 0.96
    }
  ];

  for (const dir of directions) {
    const neighborKey = `${x + dir.dx},${z + dir.dz}`;

    if (pathSet.has(neighborKey)) continue;

    const border = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(dir.width, 0.13, dir.depth),
        createGameMaterial(borderColor, "path")
      ),
      borderColor,
      "path"
    );

    border.position.set(x + dir.px, 0.125, z + dir.pz);
    border.castShadow = true;
    border.receiveShadow = true;
    border.userData.isPathBorder = true;

    scene.add(border);
  }

  createCornerRoadBorders(scene, x, z, pathSet, borderColor);
}

function createCornerRoadBorders(scene, x, z, pathSet, borderColor) {
  const corners = [
    {
      nx1: -1,
      nz1: 0,
      nx2: 0,
      nz2: -1,
      px: -0.5,
      pz: -0.5
    },
    {
      nx1: 1,
      nz1: 0,
      nx2: 0,
      nz2: -1,
      px: 0.5,
      pz: -0.5
    },
    {
      nx1: -1,
      nz1: 0,
      nx2: 0,
      nz2: 1,
      px: -0.5,
      pz: 0.5
    },
    {
      nx1: 1,
      nz1: 0,
      nx2: 0,
      nz2: 1,
      px: 0.5,
      pz: 0.5
    }
  ];

  for (const corner of corners) {
    const sideA = `${x + corner.nx1},${z + corner.nz1}`;
    const sideB = `${x + corner.nx2},${z + corner.nz2}`;

    if (pathSet.has(sideA) || pathSet.has(sideB)) continue;

    const cap = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.13, 0.08),
        createGameMaterial(borderColor, "path")
      ),
      borderColor,
      "path"
    );

    cap.position.set(x + corner.px, 0.125, z + corner.pz);
    cap.castShadow = true;
    cap.receiveShadow = true;
    cap.userData.isPathBorder = true;

    scene.add(cap);
  }
}

function applyShaderData(mesh, color, role) {
  mesh.userData.baseColor = color;
  mesh.userData.shaderRole = role;

  return mesh;
}

function removeObject(scene, object) {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose?.());
      } else {
        child.material.dispose?.();
      }
    }
  });

  if (object.parent) {
    object.parent.remove(object);
  } else {
    scene.remove(object);
  }
}

function hash01(x, z, seed = 1) {
  const value = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453;

  return value - Math.floor(value);
}