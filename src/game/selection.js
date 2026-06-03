import * as THREE from "three";
import { state } from "./state.js";
import {
  GRID_MIN,
  GRID_MAX,
  getActivePathSet
} from "../core/constants.js";

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

  if (hits.length === 0) {
    state.selectedTile.x = null;
    state.selectedTile.z = null;
    return;
  }

  const point = hits[0].point;

  const tileX = THREE.MathUtils.clamp(
    Math.round(point.x),
    GRID_MIN,
    GRID_MAX
  );

  const tileZ = THREE.MathUtils.clamp(
    Math.round(point.z),
    GRID_MIN,
    GRID_MAX
  );

  state.selectedTile.x = tileX;
  state.selectedTile.z = tileZ;
}

export function updateSelector(selector) {
  if (!selector) return;

  const tileX = state.selectedTile.x;
  const tileZ = state.selectedTile.z;

  if (!Number.isFinite(tileX) || !Number.isFinite(tileZ)) {
    selector.visible = false;
    return;
  }

  selector.position.set(tileX, 0.145, tileZ);
  selector.visible = true;

  const canPlace = isTileBuildable(tileX, tileZ);

  selector.userData.canPlace = canPlace;

  applySelectorMaterial(selector, canPlace);
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

function isTileBuildable(x, z) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;

  if (x < GRID_MIN || x > GRID_MAX) return false;
  if (z < GRID_MIN || z > GRID_MAX) return false;

  const key = `${x},${z}`;
  const pathSet = getActivePathSet();

  if (pathSet.has(key)) return false;
  if (state.towerSet?.has(key)) return false;
  if (state.terrainBlockedSet?.has(key)) return false;

  return true;
}

function applySelectorMaterial(selector, canPlace) {
  const validColor = 0x22c55e;
  const invalidColor = 0xef4444;

  if (selector.material?.color?.set) {
    selector.material.color.set(canPlace ? validColor : invalidColor);
  }

  if (typeof selector.material?.opacity === "number") {
    selector.material.opacity = canPlace ? 0.5 : 0.38;
  }

  selector.scale.set(canPlace ? 1 : 0.92, 1, canPlace ? 1 : 0.92);
}

function getHoveredSelectable(raycaster) {
  const transformableMeshes = collectSceneTransformableMeshes();
  const transformableHits = raycaster.intersectObjects(
    transformableMeshes,
    true
  );

  if (transformableHits.length > 0) {
    return transformableHits[0].object.userData.parentTransformObject;
  }

  const towerMeshes = collectSelectableMeshes(state.towers, "parentTower");
  const towerHits = raycaster.intersectObjects(towerMeshes, true);

  if (towerHits.length > 0) {
    return towerHits[0].object.userData.parentTower;
  }

  const enemyMeshes = collectSelectableMeshes(state.enemies, "parentEnemy");
  const enemyHits = raycaster.intersectObjects(enemyMeshes, true);

  if (enemyHits.length > 0) {
    return enemyHits[0].object.userData.parentEnemy;
  }

  return null;
}

function collectSceneTransformableMeshes() {
  const meshes = [];

  if (!window.__transformShowcaseObjects) return meshes;

  for (const object of window.__transformShowcaseObjects) {
    if (!object) continue;

    if (object.isMesh) {
      object.userData.parentTransformObject = object;
      meshes.push(object);
      continue;
    }

    object.traverse((child) => {
      if (!child.isMesh) return;

      child.userData.parentTransformObject = object;
      meshes.push(child);
    });
  }

  return meshes;
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
  updateTransformShowcaseHighlights();
  updateTowerHighlights();
  updateEnemyHighlights();
}

function updateTransformShowcaseHighlights() {
  if (!window.__transformShowcaseObjects) return;

  for (const object of window.__transformShowcaseObjects) {
    const isSelected = object === state.selectedObject;
    const isHovered = object === state.hoveredObject;

    let color = 0x000000;
    let intensity = 0;

    if (isSelected) {
      color = 0xfacc15;
      intensity = 0.85;
    } else if (isHovered) {
      color = 0x38bdf8;
      intensity = 0.45;
    }

    setObjectEmissive(object, color, intensity);
  }
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