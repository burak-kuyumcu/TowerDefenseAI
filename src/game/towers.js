import * as THREE from "three";
import { state } from "./state.js";
import { shoot } from "./projectiles.js";
import { createGameMaterial } from "./materials.js";
import { createTowerLabel, updateTowerLabelText } from "./towerLabels.js";
import { getPlacementState } from "./placement.js";

const TARGET_MODES = ["nearest", "first", "strongest", "weakest"];

export function placeTower(scene) {
  if (getPlacementState() !== "valid") return;

  const key = `${state.selectedTile.x},${state.selectedTile.z}`;
  const config = getTowerConfig(state.selectedTowerType);

  const tower = new THREE.Mesh(
    config.geometry,
    createGameMaterial(config.color)
  );

  tower.position.set(
    state.selectedTile.x,
    config.height / 2,
    state.selectedTile.z
  );

  tower.castShadow = true;
  tower.receiveShadow = true;

  tower.userData = {
    type: state.selectedTowerType,
    level: 1,
    cooldown: 0,
    range: config.range,
    fireRate: config.fireRate,
    damage: config.damage,
    critChance: config.critChance,
    occupiedKey: key,
    selectable: true,
    baseColor: config.color,
    targetMode: config.defaultTargetMode ?? "nearest",

    slowEffect: config.slowEffect ?? null,
    splashEffect: config.splashEffect ?? null,

    slowTimer: 0,
    slowMultiplier: 1
  };

  scene.add(tower);
  state.towers.push(tower);
  state.towerSet.add(key);

  createTowerLabel(scene, tower);

  state.gold -= config.cost;

  spawnPlaceEffect(scene, tower.position);
}

export function updateTowers(scene) {
  for (const tower of state.towers) {
    updateTowerSlowState(tower);

    if (tower.userData.cooldown > 0) {
      tower.userData.cooldown--;
      continue;
    }

    const target = findTargetEnemy(tower);

    if (target) {
      shoot(scene, tower, target);

      const slowMultiplier = tower.userData.slowMultiplier ?? 1;

      tower.userData.cooldown = Math.floor(
        tower.userData.fireRate * slowMultiplier
      );
    }
  }
}

export function cycleSelectedTowerTargetMode() {
  if (!state.selectedObject) return;
  if (!state.towers.includes(state.selectedObject)) return;

  const tower = state.selectedObject;
  const currentMode = tower.userData.targetMode ?? "nearest";
  const currentIndex = TARGET_MODES.indexOf(currentMode);

  const nextIndex = (currentIndex + 1) % TARGET_MODES.length;
  tower.userData.targetMode = TARGET_MODES[nextIndex];

  updateTowerLabelText(tower);
}

function updateTowerSlowState(tower) {
  if (tower.userData.slowTimer > 0) {
    tower.userData.slowTimer--;
    tower.userData.slowMultiplier = 1.8;

    if (tower.material?.emissive) {
      tower.material.emissive.set(0x581c87);
    }

    return;
  }

  tower.userData.slowMultiplier = 1;
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

  if (oldKey) {
    state.towerSet.delete(oldKey);
  }

  tower.userData.occupiedKey = newKey;
  state.towerSet.add(newKey);
}

function getEnemiesInRange(tower) {
  return state.enemies.filter((enemy) => {
    if (enemy.userData.dead) return false;

    const distance = tower.position.distanceTo(enemy.position);
    return distance <= tower.userData.range;
  });
}

function findTargetEnemy(tower) {
  const enemies = getEnemiesInRange(tower);

  if (enemies.length === 0) return null;

  const mode = tower.userData.targetMode ?? "nearest";

  if (mode === "first") {
    return enemies.sort((a, b) => {
      if (b.userData.index !== a.userData.index) {
        return b.userData.index - a.userData.index;
      }

      return a.position.distanceTo(tower.position) -
        b.position.distanceTo(tower.position);
    })[0];
  }

  if (mode === "strongest") {
    return enemies.sort((a, b) => b.userData.health - a.userData.health)[0];
  }

  if (mode === "weakest") {
    return enemies.sort((a, b) => a.userData.health - b.userData.health)[0];
  }

  return enemies.sort((a, b) => {
    return a.position.distanceTo(tower.position) -
      b.position.distanceTo(tower.position);
  })[0];
}

function getTowerConfig(type) {
  if (type === "rapid") {
    return {
      geometry: new THREE.CylinderGeometry(0.35, 0.45, 0.9, 16),
      color: 0x38bdf8,
      height: 0.9,
      range: 2.7,
      fireRate: 18,
      damage: 1,
      critChance: 0.08,
      cost: 30,
      defaultTargetMode: "weakest"
    };
  }

  if (type === "sniper") {
    return {
      geometry: new THREE.ConeGeometry(0.45, 1.45, 5),
      color: 0xa855f7,
      height: 1.45,
      range: 6.2,
      fireRate: 95,
      damage: 6,
      critChance: 0.28,
      cost: 45,
      defaultTargetMode: "strongest"
    };
  }

  if (type === "slow") {
    return {
      geometry: new THREE.CylinderGeometry(0.45, 0.55, 1.05, 20),
      color: 0x14b8a6,
      height: 1.05,
      range: 3.7,
      fireRate: 60,
      damage: 1,
      critChance: 0.06,
      cost: 35,
      defaultTargetMode: "first",
      slowEffect: {
        multiplier: 0.45,
        duration: 150
      }
    };
  }

  if (type === "splash") {
    return {
      geometry: new THREE.SphereGeometry(0.55, 18, 18),
      color: 0xf97316,
      height: 1.1,
      range: 4.2,
      fireRate: 75,
      damage: 4,
      critChance: 0.12,
      cost: 50,
      defaultTargetMode: "first",
      splashEffect: {
        radius: 2.1,
        damage: 3
      }
    };
  }

  return {
    geometry: new THREE.BoxGeometry(0.8, 1.2, 0.8),
    color: 0x2563eb,
    height: 1.2,
    range: 3.2,
    fireRate: 45,
    damage: 2,
    critChance: 0.1,
    cost: 25,
    defaultTargetMode: "nearest"
  };
}

function spawnPlaceEffect(scene, position) {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.6, 32),
    new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    })
  );

  mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(position);
  mesh.position.y = 0.05;

  scene.add(mesh);

  let life = 20;

  const interval = setInterval(() => {
    mesh.scale.multiplyScalar(1.1);
    mesh.material.opacity *= 0.85;
    life--;

    if (life <= 0) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      clearInterval(interval);
    }
  }, 16);
}