import * as THREE from "three";
import { state } from "./state.js";
import { tryRelocateTower, canRelocateNow } from "./relocation.js";

function isDown(keys, ...names) {
  return names.some((name) => keys[name]);
}

function isRelocatingSelectedTower() {
  return (
    state.selectedObject &&
    state.towers.includes(state.selectedObject) &&
    canRelocateNow()
  );
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

  // Eğer kule seçiliyse ve preparation phase ise oklar kamerayı değil kuleyi taşır.
  if (isRelocatingSelectedTower()) return;

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

  if (isDown(keys, "i", "I", "KeyI")) spotLight.position.z -= moveSpeed;
  if (isDown(keys, "k", "K", "KeyK")) spotLight.position.z += moveSpeed;
  if (isDown(keys, "j", "J", "KeyJ")) spotLight.position.x -= moveSpeed;
  if (isDown(keys, "l", "L", "KeyL")) spotLight.position.x += moveSpeed;
  if (isDown(keys, "y", "Y", "KeyY")) spotLight.position.y += moveSpeed;
  if (isDown(keys, "u", "U", "KeyU")) spotLight.position.y -= moveSpeed;

  spotLightHelper.update();
}

export function moveSelectedObject(keys) {
  const selected = state.selectedObject;

  if (!selected || !state.towers.includes(selected)) return;
  if (!canRelocateNow()) return;

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