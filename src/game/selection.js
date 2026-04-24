import * as THREE from "three";
import { state } from "./state.js";
import { GRID_MIN, GRID_MAX } from "../core/constants.js";

export function updateSelectorFromMouse(
  clientX,
  clientY,
  renderer,
  camera,
  raycaster,
  mouse,
  pickingPlane
) {
  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObject(pickingPlane);

  if (hit.length) {
    state.selectedTile.x = THREE.MathUtils.clamp(
      Math.round(hit[0].point.x),
      GRID_MIN,
      GRID_MAX
    );

    state.selectedTile.z = THREE.MathUtils.clamp(
      Math.round(hit[0].point.z),
      GRID_MIN,
      GRID_MAX
    );
  }
}

export function updateSelector(selector) {
  selector.position.set(
    state.selectedTile.x,
    0.05,
    state.selectedTile.z
  );
}

export function updateHighlights() {
  for (const tower of state.towers) {
    tower.material.emissive.set(0x000000);
  }

  for (const enemy of state.enemies) {
    enemy.material.emissive.set(0x000000);
  }

  if (state.selectedObject && state.selectedObject.material.emissive) {
    state.selectedObject.material.emissive.set(0xffff00);
  }
}

export function handleSelectionClick(
  e,
  renderer,
  camera,
  raycaster,
  mouse
) {
  if (e.button !== 0) return false;

  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const selectableObjects = [...state.towers, ...state.enemies];
  const hits = raycaster.intersectObjects(selectableObjects);

  if (hits.length > 0) {
    state.selectedObject = hits[0].object;
    return true;
  }

  state.selectedObject = null;
  return false;
}