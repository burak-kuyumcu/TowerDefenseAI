import * as THREE from "three";
import { state } from "../game/state.js";
import { tryRelocateTower, canRelocateNow } from "./relocation.js";
import { ensureDirectionalFocus } from "./directionalFocus.js";

const CONTROL_MODES = ["camera", "object", "spotlight", "directional"];

function isDown(keys, ...names) {
  return names.some((name) => keys[name]);
}

function isShiftDown(keys) {
  return isDown(keys, "Shift", "ShiftLeft", "ShiftRight");
}

function isAltDown(keys) {
  return isDown(keys, "Alt", "AltLeft", "AltRight");
}

function getSelectedObject() {
  return state.selectedObject;
}

function isTransformableObject(object) {
  if (!object) return false;

  if (state.towers.includes(object)) return true;
  if (state.enemies.includes(object)) return true;

  return object.userData?.isTransformable === true;
}

export function cycleControlMode() {
  const currentIndex = CONTROL_MODES.indexOf(state.controlMode);
  const nextIndex = (currentIndex + 1) % CONTROL_MODES.length;

  state.controlMode = CONTROL_MODES[nextIndex];
  state.freeTransformEnabled = state.controlMode === "object";

  return state.controlMode;
}

export function setControlMode(mode) {
  if (!CONTROL_MODES.includes(mode)) return;

  state.controlMode = mode;
  state.freeTransformEnabled = mode === "object";
}

export function getControlModeLabel() {
  if (state.controlMode === "camera") return "Camera 6DOF";
  if (state.controlMode === "object") return "Object 6DOF";
  if (state.controlMode === "spotlight") return "Spotlight Control";
  if (state.controlMode === "directional") return "Directional Light";

  return "Camera 6DOF";
}

export function updateCamera(camera, keys) {
  if (state.controlMode !== "camera") return;

  const moveSpeed = isShiftDown(keys) ? 0.28 : 0.16;
  const verticalSpeed = isShiftDown(keys) ? 0.62 : 0.42;
  const rotateSpeed = isShiftDown(keys) ? 0.048 : 0.028;
  const rollSpeed = isShiftDown(keys) ? 0.042 : 0.024;

  const minCameraY = 2.2;
  const maxCameraY = 28;

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;

  if (forward.lengthSq() < 0.0001) {
    forward.set(0, 0, -1);
  }

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
    camera.position.y += verticalSpeed;
  }

  if (isDown(keys, "e", "E", "KeyE")) {
    camera.position.y -= verticalSpeed;
  }

  camera.position.y = THREE.MathUtils.clamp(
    camera.position.y,
    minCameraY,
    maxCameraY
  );

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

  if (isDown(keys, "PageUp")) {
    camera.rotation.z += rollSpeed;
  }

  if (isDown(keys, "PageDown")) {
    camera.rotation.z -= rollSpeed;
  }
}

export function updateLights(spotLight, spotLightHelper, keys) {
  if (state.controlMode !== "spotlight") {
    spotLightHelper.update();
    return;
  }

  const moveSpeed = isShiftDown(keys) ? 0.22 : 0.12;
  const aimSpeed = isShiftDown(keys) ? 0.18 : 0.09;

  if (isDown(keys, "w", "W", "KeyW")) spotLight.position.z -= moveSpeed;
  if (isDown(keys, "s", "S", "KeyS")) spotLight.position.z += moveSpeed;
  if (isDown(keys, "a", "A", "KeyA")) spotLight.position.x -= moveSpeed;
  if (isDown(keys, "d", "D", "KeyD")) spotLight.position.x += moveSpeed;
  if (isDown(keys, "q", "Q", "KeyQ")) spotLight.position.y += moveSpeed;
  if (isDown(keys, "e", "E", "KeyE")) spotLight.position.y -= moveSpeed;

  spotLight.position.y = Math.max(0.4, spotLight.position.y);

  if (spotLight.target) {
    if (isDown(keys, "ArrowLeft")) spotLight.target.position.x -= aimSpeed;
    if (isDown(keys, "ArrowRight")) spotLight.target.position.x += aimSpeed;
    if (isDown(keys, "ArrowUp")) spotLight.target.position.z -= aimSpeed;
    if (isDown(keys, "ArrowDown")) spotLight.target.position.z += aimSpeed;
    if (isDown(keys, "PageUp")) spotLight.target.position.y += aimSpeed;
    if (isDown(keys, "PageDown")) spotLight.target.position.y -= aimSpeed;
  }

  spotLightHelper.update();
}

export function updateDirectionalLight(directionalLight, keys) {
  if (state.controlMode !== "directional") return;

  initDirectionalLightControlData(directionalLight);

  const moveSpeed = isShiftDown(keys) ? 0.22 : 0.12;
  const angleSpeed = isShiftDown(keys) ? 0.045 : 0.025;

  if (isAltDown(keys)) {
    if (isDown(keys, "w", "W", "KeyW")) {
      directionalLight.position.z -= moveSpeed;
    }

    if (isDown(keys, "s", "S", "KeyS")) {
      directionalLight.position.z += moveSpeed;
    }

    if (isDown(keys, "a", "A", "KeyA")) {
      directionalLight.position.x -= moveSpeed;
    }

    if (isDown(keys, "d", "D", "KeyD")) {
      directionalLight.position.x += moveSpeed;
    }

    if (isDown(keys, "q", "Q", "KeyQ")) {
      directionalLight.position.y += moveSpeed;
    }

    if (isDown(keys, "e", "E", "KeyE")) {
      directionalLight.position.y -= moveSpeed;
    }

    directionalLight.position.y = Math.max(0.5, directionalLight.position.y);
    directionalLight.lookAt(0, 0, 0);

    return;
  }

  const data = directionalLight.userData.control;

  if (isDown(keys, "ArrowLeft")) data.yaw -= angleSpeed;
  if (isDown(keys, "ArrowRight")) data.yaw += angleSpeed;
  if (isDown(keys, "ArrowUp")) data.pitch += angleSpeed;
  if (isDown(keys, "ArrowDown")) data.pitch -= angleSpeed;
  if (isDown(keys, "PageUp")) data.roll += angleSpeed;
  if (isDown(keys, "PageDown")) data.roll -= angleSpeed;

  data.pitch = THREE.MathUtils.clamp(data.pitch, -1.2, 1.2);

  const radius = data.radius;
  const x = Math.cos(data.pitch) * Math.sin(data.yaw) * radius;
  const y = Math.sin(data.pitch) * radius + 7;
  const z = Math.cos(data.pitch) * Math.cos(data.yaw) * radius;

  directionalLight.position.set(x, y, z);
  directionalLight.lookAt(0, 0, 0);

  directionalLight.userData.visualRoll = data.roll;
}

export function updateSelectedObjectTransform(keys) {
  if (state.controlMode !== "object") return;

  const selected = getSelectedObject();

  if (!isTransformableObject(selected)) return;

  ensureDirectionalFocus(selected);

  const moveSpeed = isShiftDown(keys) ? 0.16 : 0.075;
  const rotateSpeed = isShiftDown(keys) ? 0.065 : 0.035;

  if (isDown(keys, "w", "W", "KeyW")) selected.position.z -= moveSpeed;
  if (isDown(keys, "s", "S", "KeyS")) selected.position.z += moveSpeed;
  if (isDown(keys, "a", "A", "KeyA")) selected.position.x -= moveSpeed;
  if (isDown(keys, "d", "D", "KeyD")) selected.position.x += moveSpeed;
  if (isDown(keys, "q", "Q", "KeyQ")) selected.position.y += moveSpeed;
  if (isDown(keys, "e", "E", "KeyE")) selected.position.y -= moveSpeed;

  selected.position.y = Math.max(0, selected.position.y);

  if (isDown(keys, "ArrowLeft")) selected.rotation.y += rotateSpeed;
  if (isDown(keys, "ArrowRight")) selected.rotation.y -= rotateSpeed;
  if (isDown(keys, "ArrowUp")) selected.rotation.x += rotateSpeed;
  if (isDown(keys, "ArrowDown")) selected.rotation.x -= rotateSpeed;
  if (isDown(keys, "PageUp")) selected.rotation.z += rotateSpeed;
  if (isDown(keys, "PageDown")) selected.rotation.z -= rotateSpeed;
}

export function moveSelectedObject(keys) {
  if (state.controlMode === "object") {
    updateSelectedObjectTransform(keys);
    return;
  }

  const selected = getSelectedObject();

  if (!selected || !state.towers.includes(selected)) return;
  if (!canRelocateNow()) return;
  if (!isShiftDown(keys)) return;

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
  if (state.controlMode === "object") return;

  const selected = getSelectedObject();

  if (!selected || !state.towers.includes(selected)) return;

  ensureDirectionalFocus(selected);

  const rotateSpeed = 0.035;

  if (!isShiftDown(keys)) return;

  if (isDown(keys, "j", "J", "KeyJ")) selected.rotation.y += rotateSpeed;
  if (isDown(keys, "l", "L", "KeyL")) selected.rotation.y -= rotateSpeed;
  if (isDown(keys, "i", "I", "KeyI")) selected.rotation.x += rotateSpeed;
  if (isDown(keys, "k", "K", "KeyK")) selected.rotation.x -= rotateSpeed;
  if (isDown(keys, "z", "Z", "KeyZ")) selected.rotation.z += rotateSpeed;
  if (isDown(keys, "x", "X", "KeyX")) selected.rotation.z -= rotateSpeed;
}

export function adjustActiveLightIntensity(spotLight, directionalLight, delta) {
  if (state.controlMode === "spotlight") {
    spotLight.intensity = THREE.MathUtils.clamp(
      spotLight.intensity + delta,
      0,
      10
    );

    return;
  }

  if (state.controlMode === "directional") {
    directionalLight.intensity = THREE.MathUtils.clamp(
      directionalLight.intensity + delta,
      0,
      8
    );
  }
}

function initDirectionalLightControlData(directionalLight) {
  if (directionalLight.userData.control) return;

  directionalLight.userData.control = {
    yaw: 0.65,
    pitch: 0.42,
    roll: 0,
    radius: 12
  };
}