import * as THREE from "three";
import { MAP_SIZE } from "./constants.js";
import { createGameMaterial } from "../visuals/materials.js";
import { getCurrentStage } from "../game/stages.js";
import { state } from "../game/state.js";

export function createGroundPlane(scene, groundColor = 0x256b2f) {
  const ground = applyShaderData(
    new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE),
      createGameMaterial(groundColor, "ground")
    ),
    groundColor,
    "ground"
  );

  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;

  scene.add(ground);

  return ground;
}

export function createGridOverlay(scene) {
  const grid = new THREE.GridHelper(MAP_SIZE, MAP_SIZE, 0x9ca3af, 0x365f46);


  grid.position.set(0.5, 0.032, 0.5);

  scene.add(grid);

  return grid;
}

export function createMapBaseSlab(scene) {
  const stage = getCurrentStage();
  const colors = getTerrainPalette(stage.id);

  const slab = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(MAP_SIZE, 0.85, MAP_SIZE),
      createGameMaterial(colors.low, "ground")
    ),
    colors.low,
    "ground"
  );

  slab.position.y = -0.48;
  slab.receiveShadow = true;
  slab.userData.isStageDecoration = true;

  scene.add(slab);

  return slab;
}

export function createMapEdgeWalls(scene) {
  const stage = getCurrentStage();
  const colors = getTerrainPalette(stage.id);

  const half = MAP_SIZE / 2;
  const thickness = 0.26;
  const height = 0.72;

  const north = createEdgeWall(MAP_SIZE, thickness, height, colors.dark);
  north.position.set(0, -0.14, -half - thickness / 2);

  const south = createEdgeWall(MAP_SIZE, thickness, height, colors.dark);
  south.position.set(0, -0.14, half + thickness / 2);

  const west = createEdgeWall(thickness, MAP_SIZE, height, colors.dark);
  west.position.set(-half - thickness / 2, -0.14, 0);

  const east = createEdgeWall(thickness, MAP_SIZE, height, colors.dark);
  east.position.set(half + thickness / 2, -0.14, 0);

  north.userData.isStageDecoration = true;
  south.userData.isStageDecoration = true;
  west.userData.isStageDecoration = true;
  east.userData.isStageDecoration = true;

  scene.add(north, south, west, east);

  return {
    north,
    south,
    west,
    east
  };
}

export function createTerrainFoundation(scene) {
  createMapBaseSlab(scene);
  createMapEdgeWalls(scene);
}

export function ensureTerrainBlockedSet() {
  if (!state.terrainBlockedSet) {
    state.terrainBlockedSet = new Set();
  }
}

export function getTerrainPalette(stageId) {
  if (stageId === 1) {
    return {
      low: 0x08150c,
      dark: 0x102918,
      mid: 0x245f2d,
      high: 0x347a38,
      accent: 0x16a34a,
      shadow: 0x0b1f12
    };
  }

  if (stageId === 2) {
    return {
      low: 0x1f0d06,
      dark: 0x35180c,
      mid: 0x7c3f1d,
      high: 0xb45309,
      accent: 0xf59e0b,
      shadow: 0x160703
    };
  }

  if (stageId === 3) {
    return {
      low: 0x082f49,
      dark: 0x163247,
      mid: 0x5f86a4,
      high: 0xbae6fd,
      accent: 0x67e8f9,
      shadow: 0x061f33
    };
  }

  if (stageId === 4) {
    return {
      low: 0x17110c,
      dark: 0x2f261d,
      mid: 0x7d6a4f,
      high: 0xc7aa6b,
      accent: 0xfacc15,
      shadow: 0x0f0a07
    };
  }

  if (stageId === 5) {
    return {
      low: 0x110504,
      dark: 0x2a0b08,
      mid: 0x5b1a12,
      high: 0xb91c1c,
      accent: 0xf97316,
      shadow: 0x070202
    };
  }

  if (stageId === 6) {
    return {
      low: 0x07130d,
      dark: 0x123524,
      mid: 0x1f4d36,
      high: 0x4d7c0f,
      accent: 0x84cc16,
      shadow: 0x03100a
    };
  }

  return {
    low: 0x0f172a,
    dark: 0x1e1b4b,
    mid: 0x312e81,
    high: 0x7dd3fc,
    accent: 0xc084fc,
    shadow: 0x070b1f
  };
}

function createEdgeWall(width, depth, height, color) {
  const wall = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      createGameMaterial(color, "ground")
    ),
    color,
    "ground"
  );

  wall.castShadow = true;
  wall.receiveShadow = true;

  return wall;
}

function applyShaderData(mesh, color, role) {
  mesh.userData.baseColor = color;
  mesh.userData.shaderRole = role;

  return mesh;
}