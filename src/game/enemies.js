import * as THREE from "three";
import { state } from "./state.js";
import { chooseEnemyType, getEnemyConfig } from "./aiDirector.js";
import { createGameMaterial } from "./materials.js";
import { createHealthBar, removeHealthBar } from "./healthBars.js";
import { damageBase } from "./base.js";
import { spawnEliteAura } from "./effects.js";
import { showAnnouncement } from "./announcer.js";
import { addEventLog } from "./eventLog.js";

export function spawnEnemy(scene) {
  const enemyType = chooseEnemyType();
  const config = getEnemyConfig(enemyType);

  const enemy = new THREE.Mesh(
    createEnemyGeometry(config.geometryType),
    createGameMaterial(config.color)
  );

  const startPoint = state.currentPath[0];

  enemy.position.set(startPoint.x, startPoint.y, startPoint.z);
  enemy.scale.setScalar(config.scale ?? 1);

  enemy.castShadow = true;
  enemy.receiveShadow = true;

  const isBoss = config.type.startsWith("boss");

  enemy.userData = {
    type: config.type,
    index: 0,
    speed: config.speed,
    baseSpeed: config.speed,
    speedMultiplier: 1,

    health: config.health,
    maxHealth: config.health,
    score: config.score,
    gold: config.gold,
    baseDamage: config.baseDamage,

    reachedGoal: false,
    dead: false,
    selectable: true,
    baseColor: config.color,

    healthBarOffset: isBoss ? 1.5 : 0.75,

    slowTimer: 0,
    slowMultiplier: 1,

    armor: 0,
    shieldArmor: false,

    pulseCooldown: config.type === "boss_purple" ? 120 : 0,
    pulseInterval: config.type === "boss_purple" ? 180 : 0,

    speedBoostTimer: 0,
    disruptTimer: 150,
    auraEffect: null
  };

  scene.add(enemy);

  const healthBar = createHealthBar(enemy);
  scene.add(healthBar);

  if (config.type === "elite") {
    spawnEliteAura(scene, enemy);
    showAnnouncement("⚠ ELITE ENEMY APPROACHING!");
    addEventLog("Elite enemy spawned.");
  }

  if (config.type.startsWith("boss")) {
    addEventLog(`${formatBossType(config.type)} spawned.`);
  }

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

    updateEnemySlowState(enemy);

    const next = state.currentPath[enemy.userData.index + 1];

    if (!next) {
      enemy.userData.reachedGoal = true;
      enemy.userData.dead = true;

      damageBase(enemy.userData.baseDamage ?? 1);

      removeHealthBar(scene, enemy);
      scene.remove(enemy);
      continue;
    }

    const dir = new THREE.Vector3().subVectors(next, enemy.position);

    if (dir.length() < 0.08) {
      enemy.userData.index++;
    } else {
      const finalSpeed =
        enemy.userData.speed * (enemy.userData.speedMultiplier ?? 1);

      enemy.position.add(dir.normalize().multiplyScalar(finalSpeed));
    }
  }

  cleanupEnemies(scene);
}

function updateEnemySlowState(enemy) {
  if (enemy.userData.slowTimer > 0) {
    enemy.userData.slowTimer--;
    enemy.userData.speed =
      enemy.userData.baseSpeed * enemy.userData.slowMultiplier;

    if (enemy.material?.emissive) {
      enemy.material.emissive.set(0x0f766e);
    }

    return;
  }

  enemy.userData.speed = enemy.userData.baseSpeed;

  if (enemy.material?.emissive) {
    enemy.material.emissive.set(0x000000);
  }
}

export function cleanupEnemies(scene) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];

    if (enemy.userData.dead) {
      if (state.selectedObject === enemy) {
        state.selectedObject = null;
      }

      removeHealthBar(scene, enemy);
      state.enemies.splice(i, 1);
    }
  }
}

function formatBossType(type) {
  if (type === "boss_crusher") return "Crusher Boss";
  if (type === "boss_runner") return "Runner Boss";
  if (type === "boss_shield") return "Shield Boss";
  if (type === "boss_splitter") return "Splitter Boss";
  if (type === "boss_disruptor") return "Disruptor Boss";
  return "Purple Boss";
}