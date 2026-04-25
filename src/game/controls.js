import * as THREE from "three";
import { state } from "./state.js";
import { GRID_MIN, GRID_MAX, pathSet } from "../core/constants.js";
import { updateTowerOccupiedKey } from "./towers.js";

export function updateCamera(camera, keys) {
  const speed = 0.18;

  if (keys["w"] || keys["W"]) camera.position.z -= speed;
  if (keys["s"] || keys["S"]) camera.position.z += speed;
  if (keys["a"] || keys["A"]) camera.position.x -= speed;
  if (keys["d"] || keys["D"]) camera.position.x += speed;
  if (keys["q"] || keys["Q"]) camera.position.y += speed;
  if (keys["e"] || keys["E"]) camera.position.y -= speed;

  camera.lookAt(0, 0, 0);
}

export function updateLights(spotLight, spotLightHelper, keys) {
  const speed = 0.15;

  if (!state.selectedObject) {
    if (keys["ArrowUp"]) spotLight.position.z -= speed;
    if (keys["ArrowDown"]) spotLight.position.z += speed;
    if (keys["ArrowLeft"]) spotLight.position.x -= speed;
    if (keys["ArrowRight"]) spotLight.position.x += speed;
  }

  if (keys["y"] || keys["Y"]) spotLight.position.y -= speed;

  if (keys["+"] || keys["="]) spotLight.intensity += 0.05;
  if (keys["-"]) spotLight.intensity = Math.max(0, spotLight.intensity - 0.05);

  spotLightHelper.update();
}

export function moveSelectedObject(keys) {
  if (!state.selectedObject) return;

  const selected = state.selectedObject;
  const isTower = state.towers.includes(selected);

  const oldX = selected.position.x;
  const oldZ = selected.position.z;

  const speed = 0.08;

  if (keys["ArrowUp"]) selected.position.z -= speed;
  if (keys["ArrowDown"]) selected.position.z += speed;
  if (keys["ArrowLeft"]) selected.position.x -= speed;
  if (keys["ArrowRight"]) selected.position.x += speed;

  selected.position.x = THREE.MathUtils.clamp(selected.position.x, GRID_MIN, GRID_MAX);
  selected.position.z = THREE.MathUtils.clamp(selected.position.z, GRID_MIN, GRID_MAX);

  if (isTower) {
    const newKey = `${Math.round(selected.position.x)},${Math.round(selected.position.z)}`;
    const oldKey = selected.userData.occupiedKey;

    const blockedByPath = pathSet.has(newKey);
    const blockedByTower =
      state.towerSet.has(newKey) && newKey !== oldKey;

    if (blockedByPath || blockedByTower) {
      selected.position.x = oldX;
      selected.position.z = oldZ;
      return;
    }

    updateTowerOccupiedKey(selected);
  }
}