import * as THREE from "three";
import { state } from "./state.js";
import { pathPoints } from "../core/constants.js";
import { chooseEnemyType, getEnemyConfig } from "./aiDirector.js";

export function spawnEnemy(scene) {
  const enemyType = chooseEnemyType();
  const config = getEnemyConfig(enemyType);

  const geometry = createEnemyGeometry(config.geometryType);

  const enemy = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: config.color
    })
  );

  enemy.position.copy(pathPoints[0]);
  enemy.castShadow = true;
  enemy.receiveShadow = true;

  enemy.userData = {
    type: config.type,
    index: 0,
    speed: config.speed,
    health: config.health,
    maxHealth: config.health,
    score: config.score,
    gold: config.gold,
    baseDamage: config.baseDamage,
    reachedGoal: false,
    dead: false,
    selectable: true
  };

  scene.add(enemy);
  state.enemies.push(enemy);
}

function createEnemyGeometry(type) {
  if (type === "sphere") {
    return new THREE.SphereGeometry(0.35, 16, 16);
  }

  if (type === "cylinder") {
    return new THREE.CylinderGeometry(0.45, 0.55, 0.75, 16);
  }

  return new THREE.BoxGeometry(0.6, 0.6, 0.6);
}

export function updateEnemies(scene) {
  for (const enemy of state.enemies) {
    if (enemy.userData.dead || enemy.userData.reachedGoal) continue;
    if (enemy === state.selectedObject) continue;

    const next = pathPoints[enemy.userData.index + 1];

    if (!next) {
      enemy.userData.reachedGoal = true;
      enemy.userData.dead = true;

      state.baseHp -= enemy.userData.baseDamage ?? 1;
      scene.remove(enemy);
      continue;
    }

    const dir = new THREE.Vector3().subVectors(next, enemy.position);

    if (dir.length() < 0.08) {
      enemy.userData.index++;
    } else {
      enemy.position.add(dir.normalize().multiplyScalar(enemy.userData.speed));
    }
  }

  cleanupEnemies();
}

export function cleanupEnemies() {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    if (state.enemies[i].userData.dead) {
      if (state.selectedObject === state.enemies[i]) {
        state.selectedObject = null;
      }

      state.enemies.splice(i, 1);
    }
  }
}