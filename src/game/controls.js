import * as THREE from "three";
import { state } from "./state.js";
import { GRID_MIN, GRID_MAX } from "../core/constants.js";
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

  const speed = 0.08;

  if (keys["ArrowUp"]) state.selectedObject.position.z -= speed;
  if (keys["ArrowDown"]) state.selectedObject.position.z += speed;
  if (keys["ArrowLeft"]) state.selectedObject.position.x -= speed;
  if (keys["ArrowRight"]) state.selectedObject.position.x += speed;

  state.selectedObject.position.x = THREE.MathUtils.clamp(
    state.selectedObject.position.x,
    GRID_MIN,
    GRID_MAX
  );

  state.selectedObject.position.z = THREE.MathUtils.clamp(
    state.selectedObject.position.z,
    GRID_MIN,
    GRID_MAX
  );

  updateTowerOccupiedKey(state.selectedObject);
}