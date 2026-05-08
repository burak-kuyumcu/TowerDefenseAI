import * as THREE from "three";
import { state } from "./state.js";
import { GRID_MIN, GRID_MAX } from "../core/constants.js";
import { updatePlacementVisual } from "./placement.js";

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

  const hits = raycaster.intersectObject(pickingPlane);
  if (hits.length === 0) return;

  const point = hits[0].point;

  state.selectedTile.x = THREE.MathUtils.clamp(
    Math.round(point.x),
    GRID_MIN,
    GRID_MAX
  );

  state.selectedTile.z = THREE.MathUtils.clamp(
    Math.round(point.z),
    GRID_MIN,
    GRID_MAX
  );
}

export function updateSelector(selector) {
  selector.position.set(
    state.selectedTile.x,
    0.05,
    state.selectedTile.z
  );

  updatePlacementVisual(selector);
}

export function handleSelectionClick(
  event,
  renderer,
  camera,
  raycaster,
  mouse
) {
  if (event.button !== 0) return false;

  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const towerMeshes = collectSelectableMeshes(state.towers, "parentTower");
  const towerHits = raycaster.intersectObjects(towerMeshes);

  if (towerHits.length > 0) {
    state.selectedObject = towerHits[0].object.userData.parentTower;
    return true;
  }

  const enemyMeshes = collectSelectableMeshes(state.enemies, "parentEnemy");
  const enemyHits = raycaster.intersectObjects(enemyMeshes);

  if (enemyHits.length > 0) {
    state.selectedObject = enemyHits[0].object.userData.parentEnemy;
    return true;
  }

  state.selectedObject = null;
  return false;
}

function collectSelectableMeshes(objects, parentKey) {
  const meshes = [];

  for (const object of objects) {
    if (object.isMesh) {
      object.userData[parentKey] = object;
      meshes.push(object);
      continue;
    }

    object.traverse((child) => {
      if (child.isMesh) {
        child.userData[parentKey] = object;
        meshes.push(child);
      }
    });
  }

  return meshes;
}

export function updateHighlights() {
  for (const tower of state.towers) {
    tower.traverse((child) => {
      if (!child.isMesh || !child.material?.emissive) return;

      if (tower === state.selectedObject) {
        child.material.emissive.set(0xffff00);
      } else if (tower.userData.slowTimer > 0) {
        child.material.emissive.set(0x581c87);
      } else {
        child.material.emissive.set(0x000000);
      }
    });
  }

  for (const enemy of state.enemies) {
    if (enemy.isMesh) {
      updateSingleEnemyHighlight(enemy, enemy);
      continue;
    }

    enemy.traverse((child) => {
      if (!child.isMesh || !child.material?.emissive) return;

      if (enemy === state.selectedObject) {
        child.material.emissive.set(0xffff00);
      } else if (enemy.userData.slowTimer > 0) {
        child.material.emissive.set(0x14b8a6);
      } else {
        child.material.emissive.set(0x000000);
      }
    });
  }
}

function updateSingleEnemyHighlight(enemy, root) {
  if (!enemy.material?.emissive) return;

  if (root === state.selectedObject) {
    enemy.material.emissive.set(0xffff00);
  } else if (root.userData.slowTimer > 0) {
    enemy.material.emissive.set(0x14b8a6);
  } else {
    enemy.material.emissive.set(0x000000);
  }
}