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

  state.hoveredObject = getHoveredSelectable(raycaster);

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

  const hovered = getHoveredSelectable(raycaster);

  if (hovered) {
    state.selectedObject = hovered;
    state.hoveredObject = hovered;
    return true;
  }

  state.selectedObject = null;
  return false;
}

function getHoveredSelectable(raycaster) {
  const towerMeshes = collectSelectableMeshes(state.towers, "parentTower");
  const towerHits = raycaster.intersectObjects(towerMeshes);

  if (towerHits.length > 0) {
    return towerHits[0].object.userData.parentTower;
  }

  const enemyMeshes = collectSelectableMeshes(state.enemies, "parentEnemy");
  const enemyHits = raycaster.intersectObjects(enemyMeshes);

  if (enemyHits.length > 0) {
    return enemyHits[0].object.userData.parentEnemy;
  }

  return null;
}

function collectSelectableMeshes(objects, parentKey) {
  const meshes = [];

  for (const object of objects) {
    if (!object) continue;

    if (object.isMesh) {
      object.userData[parentKey] = object;
      meshes.push(object);
      continue;
    }

    object.traverse((child) => {
      if (!child.isMesh) return;

      child.userData[parentKey] = object;
      meshes.push(child);
    });
  }

  return meshes;
}

export function updateHighlights() {
  updateTowerHighlights();
  updateEnemyHighlights();
}

function updateTowerHighlights() {
  for (const tower of state.towers) {
    const isSelected = tower === state.selectedObject;
    const isHovered = tower === state.hoveredObject;
    const isSlowed = tower.userData.slowTimer > 0;

    const isUltimateActive = tower.userData.ultimateActiveTimer > 0;
    const isUltimateReady =
      (tower.userData.ultimateCharge ?? 0) >= 100 &&
      tower.userData.ultimateCooldown <= 0;

    let color = 0x000000;
    let intensity = 0;

    if (isSelected) {
      color = 0xfacc15;
      intensity = 0.78;
    } else if (isHovered) {
      color = 0x60a5fa;
      intensity = 0.42;
    } else if (isSlowed) {
      color = 0x581c87;
      intensity = 0.55;
    } else if (isUltimateActive) {
      color = getUltimateColor(tower.userData.type);
      intensity = 0.62;
    } else if (isUltimateReady) {
      color = getUltimateColor(tower.userData.type);
      intensity = 0.28;
    }

    setObjectEmissive(tower, color, intensity);
  }
}

function updateEnemyHighlights() {
  for (const enemy of state.enemies) {
    const isSelected = enemy === state.selectedObject;
    const isHovered = enemy === state.hoveredObject;
    const isSlowed = enemy.userData.slowTimer > 0;

    let color = 0x000000;
    let intensity = 0;

    if (isSelected) {
      color = 0xef4444;
      intensity = 0.85;
    } else if (isHovered) {
      color = 0xf97316;
      intensity = 0.55;
    } else if (isSlowed) {
      color = 0x14b8a6;
      intensity = 0.6;
    }

    setObjectEmissive(enemy, color, intensity);
  }
}

function setObjectEmissive(object, color, intensity) {
  if (!object) return;

  if (object.isMesh) {
    setMeshEmissive(object, color, intensity);
    return;
  }

  object.traverse((child) => {
    if (!child.isMesh) return;
    setMeshEmissive(child, color, intensity);
  });
}

function setMeshEmissive(mesh, color, intensity) {
  if (mesh.material?.emissive?.set) {
    mesh.material.emissive.set(color);
  }

  if (typeof mesh.material?.emissiveIntensity === "number") {
    mesh.material.emissiveIntensity = intensity;
  }

  if (mesh.material?.uniforms?.uEmissive?.value?.set) {
    mesh.material.uniforms.uEmissive.value.set(color);
  }

  if (mesh.material?.uniforms?.uEmissiveIntensity) {
    mesh.material.uniforms.uEmissiveIntensity.value = intensity;
  }
}

function getUltimateColor(type) {
  if (type === "rapid") return 0x38bdf8;
  if (type === "sniper") return 0xc084fc;
  if (type === "slow") return 0x5eead4;
  if (type === "splash") return 0xfb923c;

  return 0x60a5fa;
}