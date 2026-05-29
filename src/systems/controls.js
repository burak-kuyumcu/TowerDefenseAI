import * as THREE from "three";
import { state } from "../game/state.js";
import { tryRelocateTower, canRelocateNow } from "../systems/relocation.js";

function isDown(keys, ...names) {
  return names.some((name) => keys[name]);
}

function isShiftDown(keys) {
  return isDown(keys, "Shift", "ShiftLeft", "ShiftRight");
}

function isAltDown(keys) {
  return isDown(keys, "Alt", "AltLeft", "AltRight");
}

function isSelectedTower() {
  return state.selectedObject && state.towers.includes(state.selectedObject);
}

function isRelocatingSelectedTower() {
  return isSelectedTower() && canRelocateNow() && !isShiftDown(window.__keys ?? {});
}

export function updateCamera(camera, keys) {
  const moveSpeed = 0.12;
  const rotateSpeed = 0.025;

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3()
    .crossVectors(forward, camera.up)
    .normalize()
    .multiplyScalar(-1);

  if (isDown(keys, "w", "W", "KeyW")) {
    camera.position.add(forward.clone().multiplyScalar(moveSpeed));
  }

  if (isDown(keys, "s", "S", "KeyS")) {
    camera.position.add(forward.clone().multiplyScalar(-moveSpeed));
  }

  if (isDown(keys, "a", "A", "KeyA")) {
    camera.position.add(right.clone().multiplyScalar(-moveSpeed));
  }

  if (isDown(keys, "d", "D", "KeyD")) {
    camera.position.add(right.clone().multiplyScalar(moveSpeed));
  }

  if (isDown(keys, "q", "Q", "KeyQ")) {
    camera.position.y += moveSpeed;
  }

  if (isDown(keys, "e", "E", "KeyE")) {
    camera.position.y -= moveSpeed;
  }

  // Selected tower + preparation phase: arrow keys relocate tower.
  if (isSelectedTower() && canRelocateNow()) return;

  // Alt + arrow keys: spotlight aim, so do not rotate camera.
  if (isAltDown(keys)) return;

  if (isDown(keys, "ArrowLeft")) {
    camera.rotation.y += rotateSpeed;
  }

  if (isDown(keys, "ArrowRight")) {
    camera.rotation.y -= rotateSpeed;
  }

  if (isDown(keys, "ArrowUp")) {
    camera.rotation.x += rotateSpeed;
  }

  if (isDown(keys, "ArrowDown")) {
    camera.rotation.x -= rotateSpeed;
  }
}

export function updateLights(spotLight, spotLightHelper, keys) {
  const moveSpeed = 0.1;
  const aimSpeed = 0.08;

  // Spotlight translation: I/K/J/L + Y/U
  if (!isShiftDown(keys)) {
    if (isDown(keys, "i", "I", "KeyI")) spotLight.position.z -= moveSpeed;
    if (isDown(keys, "k", "K", "KeyK")) spotLight.position.z += moveSpeed;
    if (isDown(keys, "j", "J", "KeyJ")) spotLight.position.x -= moveSpeed;
    if (isDown(keys, "l", "L", "KeyL")) spotLight.position.x += moveSpeed;
    if (isDown(keys, "y", "Y", "KeyY")) spotLight.position.y += moveSpeed;
    if (isDown(keys, "u", "U", "KeyU")) spotLight.position.y -= moveSpeed;
  }

  // Spotlight aim: Alt + Arrow Keys
  // This avoids conflicts with C/V/name showcase and V/start wave.
  if (spotLight.target && isAltDown(keys)) {
    if (isDown(keys, "ArrowLeft")) spotLight.target.position.x -= aimSpeed;
    if (isDown(keys, "ArrowRight")) spotLight.target.position.x += aimSpeed;
    if (isDown(keys, "ArrowUp")) spotLight.target.position.z -= aimSpeed;
    if (isDown(keys, "ArrowDown")) spotLight.target.position.z += aimSpeed;
  }

  spotLightHelper.update();
}

export function updateDirectionalLight(directionalLight, keys) {
  const moveSpeed = 0.08;

  if (isDown(keys, "Digit7", "7")) directionalLight.position.x -= moveSpeed;
  if (isDown(keys, "Digit8", "8")) directionalLight.position.x += moveSpeed;
  if (isDown(keys, "Digit9", "9")) directionalLight.position.z -= moveSpeed;
  if (isDown(keys, "Digit0", "0")) directionalLight.position.z += moveSpeed;

  if (isDown(keys, "BracketLeft", "[")) {
    directionalLight.position.y = Math.max(
      1,
      directionalLight.position.y - moveSpeed
    );
  }

  if (isDown(keys, "BracketRight", "]")) {
    directionalLight.position.y += moveSpeed;
  }

  directionalLight.lookAt(0, 0, 0);
}

export function moveSelectedObject(keys) {
  const selected = state.selectedObject;

  if (!selected || !state.towers.includes(selected)) return;
  if (!canRelocateNow()) return;

  // Shift + keys are reserved for rotation.
  if (isShiftDown(keys)) return;

  if (state.relocationMoveCooldown > 0) {
    state.relocationMoveCooldown--;
    return;
  }

  let dx = 0;
  let dz = 0;

  if (isDown(keys, "ArrowLeft")) dx = -1;
  if (isDown(keys, "ArrowRight")) dx = 1;
  if (isDown(keys, "ArrowUp")) dz = -1;
  if (isDown(keys, "ArrowDown")) dz = 1;

  if (dx === 0 && dz === 0) return;

  const moved = tryRelocateTower(selected, dx, dz);

  if (moved) {
    state.relocationMoveCooldown = 12;
  }
}

export function rotateSelectedObject(keys) {
  const selected = state.selectedObject;

  if (!selected || !state.towers.includes(selected)) return;

  const rotateSpeed = 0.035;

  // Hold Shift + keys to rotate selected tower in 3 dimensions.
  if (!isShiftDown(keys)) return;

  if (isDown(keys, "j", "J", "KeyJ")) selected.rotation.y += rotateSpeed;
  if (isDown(keys, "l", "L", "KeyL")) selected.rotation.y -= rotateSpeed;

  if (isDown(keys, "i", "I", "KeyI")) selected.rotation.x += rotateSpeed;
  if (isDown(keys, "k", "K", "KeyK")) selected.rotation.x -= rotateSpeed;

  if (isDown(keys, "z", "Z", "KeyZ")) selected.rotation.z += rotateSpeed;
  if (isDown(keys, "x", "X", "KeyX")) selected.rotation.z -= rotateSpeed;
}