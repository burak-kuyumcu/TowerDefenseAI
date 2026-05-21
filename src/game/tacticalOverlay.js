import * as THREE from "three";
import { state } from "./state.js";
import { GRID_MIN, GRID_MAX, pathSet } from "../core/constants.js";

const rangeRings = new Map();
let relocationHints = [];

export function initTacticalOverlay(scene) {
  clearRelocationHints(scene);
  clearRangeRings(scene);
}

export function updateTacticalOverlay(scene) {
  updateRangeRings(scene);
  updateRelocationHints(scene);
}

function updateRangeRings(scene) {
  const scanActive =
    state.shaderMode === "xray" ||
    state.shaderMode === "neon";

  for (const tower of state.towers) {
    if (!scanActive) {
      removeRangeRing(scene, tower);
      continue;
    }

    if (!rangeRings.has(tower)) {
      const ring = createRangeRing(tower);
      rangeRings.set(tower, ring);
      scene.add(ring);
    }

    const ring = rangeRings.get(tower);
    ring.position.set(tower.position.x, 0.08, tower.position.z);
    ring.scale.setScalar(tower.userData.range ?? 3);
    ring.material.opacity =
      state.shaderMode === "xray" ? 0.38 : 0.22;
  }

  for (const [tower] of rangeRings) {
    if (!state.towers.includes(tower)) {
      removeRangeRing(scene, tower);
    }
  }
}

function createRangeRing(tower) {
  const color =
    tower.userData.type === "sniper"
      ? 0xa855f7
      : tower.userData.type === "slow"
        ? 0x14b8a6
        : tower.userData.type === "splash"
          ? 0xf97316
          : tower.userData.type === "rapid"
            ? 0x38bdf8
            : 0x2563eb;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.98, 1.02, 96),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.userData.isTacticalOverlay = true;

  return ring;
}

function removeRangeRing(scene, tower) {
  const ring = rangeRings.get(tower);
  if (!ring) return;

  scene.remove(ring);
  ring.geometry.dispose();
  ring.material.dispose();
  rangeRings.delete(tower);
}

function updateRelocationHints(scene) {
  const shouldShow =
    state.started &&
    !state.gameOver &&
    state.waitingForNextWave &&
    !state.waveActive &&
    state.shaderMode === "xray" &&
    state.selectedObject &&
    state.towers.includes(state.selectedObject);

  clearRelocationHints(scene);

  if (!shouldShow) return;

  const tower = state.selectedObject;
  const currentX = Math.round(tower.position.x);
  const currentZ = Math.round(tower.position.z);

  const candidates = [
    [currentX + 1, currentZ],
    [currentX - 1, currentZ],
    [currentX, currentZ + 1],
    [currentX, currentZ - 1]
  ];

  for (const [x, z] of candidates) {
    if (!isValidRelocationTile(x, z, tower)) continue;

    const tile = createRelocationHint(x, z);
    relocationHints.push(tile);
    scene.add(tile);
  }
}

function createRelocationHint(x, z) {
  const tile = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.04, 0.92),
    new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.36,
      depthWrite: false
    })
  );

  tile.position.set(x, 0.11, z);
  tile.userData.isTacticalOverlay = true;

  return tile;
}

function isValidRelocationTile(x, z, tower) {
  if (x < GRID_MIN || x > GRID_MAX) return false;
  if (z < GRID_MIN || z > GRID_MAX) return false;

  const key = `${x},${z}`;

  if (pathSet.has(key)) return false;

  const oldKey = tower.userData.occupiedKey;
  if (state.towerSet.has(key) && key !== oldKey) return false;

  return true;
}

function clearRelocationHints(scene) {
  for (const hint of relocationHints) {
    scene.remove(hint);
    hint.geometry.dispose();
    hint.material.dispose();
  }

  relocationHints = [];
}

function clearRangeRings(scene) {
  for (const [, ring] of rangeRings) {
    scene.remove(ring);
    ring.geometry.dispose();
    ring.material.dispose();
  }

  rangeRings.clear();
}