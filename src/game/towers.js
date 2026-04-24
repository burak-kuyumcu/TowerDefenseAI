import * as THREE from "three";
import { state } from "./state.js";
import { pathSet } from "../core/constants.js";
import { shoot } from "./projectiles.js";

export function placeTower(scene) {
  const key = `${state.selectedTile.x},${state.selectedTile.z}`;

  if (pathSet.has(key)) return;
  if (state.towerSet.has(key)) return;

  const config = getTowerConfig(state.selectedTowerType);
  if (state.gold < config.cost) return;

  const tower = new THREE.Mesh(config.geometry, config.material.clone());
  tower.position.set(state.selectedTile.x, config.height / 2, state.selectedTile.z);
  tower.castShadow = true;
  tower.receiveShadow = true;

  tower.userData = {
    type: state.selectedTowerType,
    level: 1,
    cooldown: 0,
    range: config.range,
    fireRate: config.fireRate,
    damage: config.damage,
    occupiedKey: key,
    selectable: true
  };

  scene.add(tower);
  state.towers.push(tower);
  state.towerSet.add(key);

  state.gold -= config.cost;
}

export function updateTowers(scene) {
  for (const tower of state.towers) {
    if (tower.userData.cooldown > 0) {
      tower.userData.cooldown--;
      continue;
    }

    const target = findNearestEnemy(tower);

    if (target) {
      shoot(scene, tower, target);
      tower.userData.cooldown = tower.userData.fireRate;
    }
  }
}

export function getClickedTower(raycaster, mouse, renderer, camera, clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(state.towers);
  return hits.length > 0 ? hits[0].object : null;
}

export function updateTowerOccupiedKey(tower) {
  if (!state.towers.includes(tower)) return;

  const oldKey = tower.userData.occupiedKey;
  const newKey = `${Math.round(tower.position.x)},${Math.round(tower.position.z)}`;

  if (oldKey === newKey) return;

  if (oldKey) state.towerSet.delete(oldKey);

  tower.userData.occupiedKey = newKey;
  state.towerSet.add(newKey);
}

function findNearestEnemy(tower) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const enemy of state.enemies) {
    if (enemy.userData.dead) continue;

    const distance = tower.position.distanceTo(enemy.position);

    if (distance <= tower.userData.range && distance < nearestDistance) {
      nearest = enemy;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function getTowerConfig(type) {
  if (type === "rapid") {
    return {
      geometry: new THREE.CylinderGeometry(0.35, 0.45, 0.9, 16),
      material: new THREE.MeshStandardMaterial({ color: 0x38bdf8 }),
      height: 0.9,
      range: 2.7,
      fireRate: 18,
      damage: 1,
      cost: 30
    };
  }

  return {
    geometry: new THREE.BoxGeometry(0.8, 1.2, 0.8),
    material: new THREE.MeshStandardMaterial({ color: 0x2563eb }),
    height: 1.2,
    range: 3.2,
    fireRate: 45,
    damage: 2,
    cost: 25
  };
}