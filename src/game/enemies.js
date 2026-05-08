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

  const enemy = createEnemyModel(config);

  const startPoint = state.currentPath[0];

  enemy.position.set(startPoint.x, startPoint.y, startPoint.z);
  enemy.scale.setScalar(config.scale ?? 1);

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

    healthBarOffset: isBoss ? 1.7 : 0.9,

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
    const bossName = formatBossType(config.type);
    showAnnouncement(`⚠ BOSS DEPLOYED: ${bossName}`);
    addEventLog(`${bossName} spawned.`);
  }

  state.enemies.push(enemy);
}

function createEnemyModel(config) {
  if (config.type === "fast") return createFastEnemy(config);
  if (config.type === "tank") return createTankEnemy(config);
  if (config.type === "elite") return createEliteEnemy(config);

  if (config.type === "boss_purple") return createPurpleBoss(config);
  if (config.type === "boss_crusher") return createCrusherBoss(config);
  if (config.type === "boss_runner") return createRunnerBoss(config);
  if (config.type === "boss_shield") return createShieldBoss(config);
  if (config.type === "boss_splitter") return createSplitterBoss(config);
  if (config.type === "boss_disruptor") return createDisruptorBoss(config);

  return createNormalEnemy(config);
}

function createNormalEnemy(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), config.color);
  body.position.y = 0.25;

  const head = mesh(new THREE.BoxGeometry(0.38, 0.32, 0.38), 0xef4444);
  head.position.y = 0.68;

  const eyeLeft = mesh(new THREE.SphereGeometry(0.045, 8, 8), 0xffffff);
  eyeLeft.position.set(-0.11, 0.72, 0.2);

  const eyeRight = mesh(new THREE.SphereGeometry(0.045, 8, 8), 0xffffff);
  eyeRight.position.set(0.11, 0.72, 0.2);

  group.add(body, head, eyeLeft, eyeRight);
  return group;
}

function createFastEnemy(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.ConeGeometry(0.28, 0.85, 16), config.color);
  body.position.y = 0.42;
  body.rotation.x = Math.PI;

  const core = mesh(new THREE.SphereGeometry(0.2, 14, 14), 0xfacc15, true);
  core.position.y = 0.55;

  const trail = mesh(new THREE.ConeGeometry(0.2, 0.45, 12), 0xfb923c, true);
  trail.position.set(0, 0.25, -0.35);
  trail.rotation.x = -Math.PI / 2;

  group.add(body, core, trail);
  group.userData.core = core;

  return group;
}

function createTankEnemy(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.BoxGeometry(0.85, 0.55, 0.75), config.color);
  body.position.y = 0.35;

  const armor = mesh(new THREE.BoxGeometry(0.95, 0.22, 0.85), 0x450a0a);
  armor.position.y = 0.72;

  const frontPlate = mesh(new THREE.BoxGeometry(0.72, 0.35, 0.08), 0x991b1b);
  frontPlate.position.set(0, 0.38, 0.42);

  group.add(body, armor, frontPlate);
  return group;
}

function createEliteEnemy(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.CylinderGeometry(0.38, 0.45, 0.8, 6), config.color, true);
  body.position.y = 0.45;

  const crown = mesh(new THREE.TorusGeometry(0.34, 0.045, 10, 28), 0xf9a8d4, true);
  crown.position.y = 0.92;
  crown.rotation.x = Math.PI / 2;

  const core = mesh(new THREE.OctahedronGeometry(0.24), 0xf472b6, true);
  core.position.y = 0.48;

  group.add(body, crown, core);
  group.userData.core = core;

  return group;
}

function createPurpleBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.BoxGeometry(0.9, 1.05, 0.9), config.color, true);
  body.position.y = 0.65;

  const crown = mesh(new THREE.TorusGeometry(0.58, 0.06, 12, 36), 0xc084fc, true);
  crown.position.y = 1.3;
  crown.rotation.x = Math.PI / 2;

  const core = mesh(new THREE.OctahedronGeometry(0.34), 0xfacc15, true);
  core.position.y = 0.72;

  group.add(body, crown, core);
  group.userData.core = core;

  return group;
}

function createCrusherBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.CylinderGeometry(0.65, 0.8, 1.2, 18), config.color);
  body.position.y = 0.7;

  const armorTop = mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.22, 18), 0x450a0a);
  armorTop.position.y = 1.35;

  const spikes = new THREE.Group();
  spikes.position.y = 1.5;

  for (let i = 0; i < 6; i++) {
    const spike = mesh(new THREE.ConeGeometry(0.09, 0.32, 8), 0xfca5a5);
    const angle = (Math.PI * 2 * i) / 6;
    spike.position.set(Math.cos(angle) * 0.48, 0, Math.sin(angle) * 0.48);
    spike.rotation.z = Math.PI;
    spikes.add(spike);
  }

  group.add(body, armorTop, spikes);
  return group;
}

function createRunnerBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.SphereGeometry(0.55, 20, 20), config.color, true);
  body.position.y = 0.75;
  body.scale.z = 1.35;

  const front = mesh(new THREE.ConeGeometry(0.32, 0.65, 16), 0xfacc15, true);
  front.position.set(0, 0.75, 0.72);
  front.rotation.x = Math.PI / 2;

  const trail = mesh(new THREE.TorusGeometry(0.62, 0.045, 10, 34), 0xfb923c, true);
  trail.position.y = 0.75;
  trail.rotation.x = Math.PI / 2;

  group.add(body, front, trail);
  group.userData.core = trail;

  return group;
}

function createShieldBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.1, 20), config.color, true);
  body.position.y = 0.65;

  const shield = mesh(new THREE.TorusGeometry(0.78, 0.06, 12, 40), 0x86efac, true);
  shield.position.y = 0.75;
  shield.rotation.x = Math.PI / 2;

  const gem = mesh(new THREE.OctahedronGeometry(0.28), 0xbbf7d0, true);
  gem.position.y = 1.25;

  group.add(body, shield, gem);
  group.userData.core = shield;

  return group;
}

function createSplitterBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.SphereGeometry(0.62, 18, 18), config.color, true);
  body.position.y = 0.72;

  const small1 = mesh(new THREE.SphereGeometry(0.24, 12, 12), 0xfde047, true);
  small1.position.set(-0.45, 0.82, 0.18);

  const small2 = mesh(new THREE.SphereGeometry(0.22, 12, 12), 0xfacc15, true);
  small2.position.set(0.42, 0.58, -0.12);

  const small3 = mesh(new THREE.SphereGeometry(0.2, 12, 12), 0xeab308, true);
  small3.position.set(0.1, 1.17, 0.18);

  group.add(body, small1, small2, small3);
  group.userData.core = body;

  return group;
}

function createDisruptorBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.BoxGeometry(0.9, 0.95, 0.9), config.color, true);
  body.position.y = 0.68;

  const antenna = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.75, 8), 0x67e8f9, true);
  antenna.position.y = 1.42;

  const orb = mesh(new THREE.SphereGeometry(0.16, 14, 14), 0x22d3ee, true);
  orb.position.y = 1.85;

  const ring = mesh(new THREE.TorusGeometry(0.6, 0.045, 10, 36), 0x06b6d4, true);
  ring.position.y = 0.75;
  ring.rotation.x = Math.PI / 2;

  group.add(body, antenna, orb, ring);
  group.userData.core = ring;

  return group;
}

function mesh(geometry, color, emissive = false) {
  const material = createGameMaterial(color);

  if (material.emissive) {
    material.emissive.set(emissive ? color : 0x000000);
    material.emissiveIntensity = emissive ? 0.4 : 0;
  }

  const object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  object.receiveShadow = true;
  object.userData.baseColor = color;

  return object;
}

export function updateEnemies(scene) {
  for (const enemy of state.enemies) {
    if (enemy.userData.dead || enemy.userData.reachedGoal) continue;

    updateEnemySlowState(enemy);
    animateEnemy(enemy);

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

      const angle = Math.atan2(dir.x, dir.z);
      enemy.rotation.y = angle;

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

    setEnemyEmissive(enemy, 0x0f766e);
    return;
  }

  enemy.userData.speed = enemy.userData.baseSpeed;
  setEnemyEmissive(enemy, 0x000000);
}

function animateEnemy(enemy) {
  const core = enemy.userData.core;

  if (core) {
    core.rotation.y += 0.035;
    core.rotation.z += 0.018;
  }

  const bob = Math.sin(Date.now() * 0.006 + enemy.position.x) * 0.025;
  enemy.position.y = 0.15 + bob;
}

function setEnemyEmissive(enemy, color) {
  enemy.traverse((child) => {
    if (!child.isMesh || !child.material?.emissive) return;
    child.material.emissive.set(color);
  });
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