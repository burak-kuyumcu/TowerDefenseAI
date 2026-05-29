import * as THREE from "three";
import { state } from "../game/state.js";
import { chooseEnemyType, getEnemyConfig } from "../ai/aiDirector.js";
import { createGameMaterial } from "../visuals/materials.js";
import { createHealthBar, removeHealthBar } from "../visuals/healthBars.js";
import { damageBase } from "../systems/base.js";
import {
  spawnEliteAura,
  spawnBossAura,
  spawnFootstepDust
} from "../visuals/effects.js";
import { showAnnouncement } from "../ui/announcer.js";
import { addEventLog } from "../ui/eventLog.js";
import { getCurrentStage } from "../game/stages.js";

export function spawnEnemy(scene) {
  const enemyType = chooseEnemyType();
  const stage = getCurrentStage();

  const config = {
    ...getEnemyConfig(enemyType)
  };

  config.speed *= stage.enemySpeedMultiplier ?? 1;
  config.health = Math.floor(
    config.health * (stage.enemyHealthMultiplier ?? 1)
  );

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

    stageId: stage.id,
    stageSlowBonus: stage.slowBonus ?? 1,

    score: config.score,
    gold: config.gold,
    baseDamage: config.baseDamage,

    reachedGoal: false,
    dead: false,
    selectable: true,
    baseColor: config.color,

    modelScale: config.scale ?? 1,
    healthBarOffset: isBoss ? 1.7 : 0.9,

    slowTimer: 0,
    slowMultiplier: 1,
    freezeFlashTimer: 0,

    armor: 0,
    shieldArmor: false,

    pulseCooldown: config.type === "boss_purple" ? 120 : 0,
    pulseInterval: config.type === "boss_purple" ? 180 : 0,

    speedBoostTimer: 0,
    disruptTimer: 150,
    auraEffect: null,
    bossAuraEffect: null,

    walkPhase: Math.random() * Math.PI * 2,
    stepTimer: Math.floor(Math.random() * 20),
    previousX: startPoint.x,
    previousZ: startPoint.z
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
    spawnBossAura(scene, enemy, getBossAuraColor(config.type));
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
  body.position.y = 0.32;

  const head = mesh(new THREE.BoxGeometry(0.38, 0.32, 0.38), 0xef4444);
  head.position.y = 0.72;

  const eyeLeft = mesh(new THREE.SphereGeometry(0.045, 8, 8), 0xffffff, true);
  eyeLeft.position.set(-0.11, 0.72, 0.2);

  const eyeRight = mesh(new THREE.SphereGeometry(0.045, 8, 8), 0xffffff, true);
  eyeRight.position.set(0.11, 0.72, 0.2);

  const footLeft = mesh(new THREE.BoxGeometry(0.18, 0.08, 0.26), 0x7f1d1d);
  footLeft.position.set(-0.17, 0.06, 0.08);

  const footRight = mesh(new THREE.BoxGeometry(0.18, 0.08, 0.26), 0x7f1d1d);
  footRight.position.set(0.17, 0.06, 0.08);

  group.add(body, head, eyeLeft, eyeRight, footLeft, footRight);
  group.userData.core = head;
  group.userData.body = body;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markBaseTransform(body);
  markBaseTransform(head);
  markBaseTransform(footLeft);
  markBaseTransform(footRight);

  return group;
}

function createFastEnemy(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.ConeGeometry(0.28, 0.85, 16), config.color);
  body.position.y = 0.48;
  body.rotation.x = Math.PI;

  const core = mesh(new THREE.SphereGeometry(0.2, 14, 14), 0xfacc15, true);
  core.position.y = 0.58;

  const trail = mesh(new THREE.ConeGeometry(0.2, 0.45, 12), 0xfb923c, true);
  trail.position.set(0, 0.25, -0.35);
  trail.rotation.x = -Math.PI / 2;

  const sideFinLeft = mesh(new THREE.BoxGeometry(0.08, 0.2, 0.35), 0xffedd5);
  sideFinLeft.position.set(-0.24, 0.42, -0.05);

  const sideFinRight = sideFinLeft.clone();
  sideFinRight.position.x = 0.24;

  const footLeft = mesh(new THREE.BoxGeometry(0.13, 0.06, 0.22), 0x7c2d12);
  footLeft.position.set(-0.16, 0.05, 0.08);

  const footRight = mesh(new THREE.BoxGeometry(0.13, 0.06, 0.22), 0x7c2d12);
  footRight.position.set(0.16, 0.05, 0.08);

  group.add(body, core, trail, sideFinLeft, sideFinRight, footLeft, footRight);
  group.userData.core = core;
  group.userData.body = body;
  group.userData.extraSpin = trail;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markBaseTransform(body);
  markBaseTransform(core);
  markBaseTransform(trail);
  markBaseTransform(footLeft);
  markBaseTransform(footRight);

  return group;
}

function createTankEnemy(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.BoxGeometry(0.85, 0.55, 0.75), config.color);
  body.position.y = 0.38;

  const armor = mesh(new THREE.BoxGeometry(0.95, 0.22, 0.85), 0x450a0a);
  armor.position.y = 0.75;

  const frontPlate = mesh(new THREE.BoxGeometry(0.72, 0.35, 0.08), 0x991b1b);
  frontPlate.position.set(0, 0.41, 0.42);

  const core = mesh(new THREE.BoxGeometry(0.22, 0.22, 0.08), 0xfca5a5, true);
  core.position.set(0, 0.45, 0.48);

  const treadLeft = mesh(new THREE.BoxGeometry(0.16, 0.16, 0.82), 0x111827);
  treadLeft.position.set(-0.52, 0.18, 0);

  const treadRight = mesh(new THREE.BoxGeometry(0.16, 0.16, 0.82), 0x111827);
  treadRight.position.set(0.52, 0.18, 0);

  group.add(body, armor, frontPlate, core, treadLeft, treadRight);
  group.userData.core = core;
  group.userData.body = body;
  group.userData.extraSpin = core;
  group.userData.leftFoot = treadLeft;
  group.userData.rightFoot = treadRight;

  markBaseTransform(body);
  markBaseTransform(armor);
  markBaseTransform(frontPlate);
  markBaseTransform(core);
  markBaseTransform(treadLeft);
  markBaseTransform(treadRight);

  return group;
}

function createEliteEnemy(config) {
  const group = new THREE.Group();

  const body = mesh(
    new THREE.CylinderGeometry(0.38, 0.45, 0.8, 6),
    config.color,
    true
  );
  body.position.y = 0.48;

  const crown = mesh(
    new THREE.TorusGeometry(0.34, 0.045, 10, 28),
    0xf9a8d4,
    true
  );
  crown.position.y = 0.95;
  crown.rotation.x = Math.PI / 2;

  const core = mesh(new THREE.OctahedronGeometry(0.24), 0xf472b6, true);
  core.position.y = 0.5;

  const shoulderRing = mesh(
    new THREE.TorusGeometry(0.48, 0.035, 8, 28),
    0xec4899,
    true
  );
  shoulderRing.position.y = 0.65;
  shoulderRing.rotation.x = Math.PI / 2;

  const footLeft = mesh(new THREE.BoxGeometry(0.15, 0.07, 0.26), 0x831843);
  footLeft.position.set(-0.2, 0.06, 0.04);

  const footRight = mesh(new THREE.BoxGeometry(0.15, 0.07, 0.26), 0x831843);
  footRight.position.set(0.2, 0.06, 0.04);

  group.add(body, crown, core, shoulderRing, footLeft, footRight);
  group.userData.core = core;
  group.userData.body = body;
  group.userData.extraSpin = shoulderRing;
  group.userData.secondarySpin = crown;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markBaseTransform(body);
  markBaseTransform(crown);
  markBaseTransform(core);
  markBaseTransform(shoulderRing);
  markBaseTransform(footLeft);
  markBaseTransform(footRight);

  return group;
}

function createPurpleBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.BoxGeometry(0.9, 1.05, 0.9), config.color, true);
  body.position.y = 0.7;

  const crown = mesh(
    new THREE.TorusGeometry(0.58, 0.06, 12, 36),
    0xc084fc,
    true
  );
  crown.position.y = 1.35;
  crown.rotation.x = Math.PI / 2;

  const core = mesh(new THREE.OctahedronGeometry(0.34), 0xfacc15, true);
  core.position.y = 0.76;

  const footLeft = mesh(new THREE.BoxGeometry(0.28, 0.1, 0.38), 0x4c1d95);
  footLeft.position.set(-0.28, 0.07, 0.1);

  const footRight = mesh(new THREE.BoxGeometry(0.28, 0.1, 0.38), 0x4c1d95);
  footRight.position.set(0.28, 0.07, 0.1);

  group.add(body, crown, core, footLeft, footRight);
  group.userData.core = core;
  group.userData.body = body;
  group.userData.extraSpin = crown;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markBaseTransform(body);
  markBaseTransform(crown);
  markBaseTransform(core);
  markBaseTransform(footLeft);
  markBaseTransform(footRight);

  return group;
}

function createCrusherBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.CylinderGeometry(0.65, 0.8, 1.2, 18), config.color);
  body.position.y = 0.78;

  const armorTop = mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.22, 18), 0x450a0a);
  armorTop.position.y = 1.43;

  const spikes = new THREE.Group();
  spikes.position.y = 1.58;

  for (let i = 0; i < 6; i++) {
    const spike = mesh(new THREE.ConeGeometry(0.09, 0.32, 8), 0xfca5a5, true);
    const angle = (Math.PI * 2 * i) / 6;
    spike.position.set(Math.cos(angle) * 0.48, 0, Math.sin(angle) * 0.48);
    spike.rotation.z = Math.PI;
    spikes.add(spike);
  }

  const footLeft = mesh(new THREE.BoxGeometry(0.3, 0.11, 0.42), 0x450a0a);
  footLeft.position.set(-0.32, 0.07, 0.08);

  const footRight = mesh(new THREE.BoxGeometry(0.3, 0.11, 0.42), 0x450a0a);
  footRight.position.set(0.32, 0.07, 0.08);

  group.add(body, armorTop, spikes, footLeft, footRight);
  group.userData.core = armorTop;
  group.userData.body = body;
  group.userData.extraSpin = spikes;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markBaseTransform(body);
  markBaseTransform(armorTop);
  markBaseTransform(spikes);
  markBaseTransform(footLeft);
  markBaseTransform(footRight);

  return group;
}

function createRunnerBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.SphereGeometry(0.55, 20, 20), config.color, true);
  body.position.y = 0.82;
  body.scale.z = 1.35;

  const front = mesh(new THREE.ConeGeometry(0.32, 0.65, 16), 0xfacc15, true);
  front.position.set(0, 0.82, 0.72);
  front.rotation.x = Math.PI / 2;

  const trail = mesh(new THREE.TorusGeometry(0.62, 0.045, 10, 34), 0xfb923c, true);
  trail.position.y = 0.82;
  trail.rotation.x = Math.PI / 2;

  const footLeft = mesh(new THREE.BoxGeometry(0.2, 0.08, 0.32), 0x9a3412);
  footLeft.position.set(-0.26, 0.06, 0.08);

  const footRight = mesh(new THREE.BoxGeometry(0.2, 0.08, 0.32), 0x9a3412);
  footRight.position.set(0.26, 0.06, 0.08);

  group.add(body, front, trail, footLeft, footRight);
  group.userData.core = trail;
  group.userData.body = body;
  group.userData.extraSpin = trail;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markBaseTransform(body);
  markBaseTransform(front);
  markBaseTransform(trail);
  markBaseTransform(footLeft);
  markBaseTransform(footRight);

  return group;
}

function createShieldBoss(config) {
  const group = new THREE.Group();

  const body = mesh(
    new THREE.CylinderGeometry(0.55, 0.65, 1.1, 20),
    config.color,
    true
  );
  body.position.y = 0.7;

  const shield = mesh(new THREE.TorusGeometry(0.78, 0.06, 12, 40), 0x86efac, true);
  shield.position.y = 0.8;
  shield.rotation.x = Math.PI / 2;

  const gem = mesh(new THREE.OctahedronGeometry(0.28), 0xbbf7d0, true);
  gem.position.y = 1.3;

  const shield2 = mesh(new THREE.TorusGeometry(0.5, 0.035, 10, 34), 0xdcfce7, true);
  shield2.position.y = 0.8;
  shield2.rotation.z = Math.PI / 2;

  const footLeft = mesh(new THREE.BoxGeometry(0.26, 0.09, 0.36), 0x14532d);
  footLeft.position.set(-0.28, 0.06, 0.08);

  const footRight = mesh(new THREE.BoxGeometry(0.26, 0.09, 0.36), 0x14532d);
  footRight.position.set(0.28, 0.06, 0.08);

  group.add(body, shield, gem, shield2, footLeft, footRight);
  group.userData.core = shield;
  group.userData.body = body;
  group.userData.extraSpin = shield2;
  group.userData.secondarySpin = shield;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markBaseTransform(body);
  markBaseTransform(shield);
  markBaseTransform(gem);
  markBaseTransform(shield2);
  markBaseTransform(footLeft);
  markBaseTransform(footRight);

  return group;
}

function createSplitterBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.SphereGeometry(0.62, 18, 18), config.color, true);
  body.position.y = 0.78;

  const small1 = mesh(new THREE.SphereGeometry(0.24, 12, 12), 0xfde047, true);
  small1.position.set(-0.45, 0.88, 0.18);

  const small2 = mesh(new THREE.SphereGeometry(0.22, 12, 12), 0xfacc15, true);
  small2.position.set(0.42, 0.64, -0.12);

  const small3 = mesh(new THREE.SphereGeometry(0.2, 12, 12), 0xeab308, true);
  small3.position.set(0.1, 1.23, 0.18);

  const orbitRing = mesh(new THREE.TorusGeometry(0.78, 0.035, 8, 34), 0xfef08a, true);
  orbitRing.position.y = 0.8;
  orbitRing.rotation.x = Math.PI / 2;

  const footLeft = mesh(new THREE.BoxGeometry(0.22, 0.08, 0.32), 0x713f12);
  footLeft.position.set(-0.28, 0.06, 0.08);

  const footRight = mesh(new THREE.BoxGeometry(0.22, 0.08, 0.32), 0x713f12);
  footRight.position.set(0.28, 0.06, 0.08);

  group.add(body, small1, small2, small3, orbitRing, footLeft, footRight);
  group.userData.core = body;
  group.userData.body = body;
  group.userData.extraSpin = orbitRing;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markBaseTransform(body);
  markBaseTransform(small1);
  markBaseTransform(small2);
  markBaseTransform(small3);
  markBaseTransform(orbitRing);
  markBaseTransform(footLeft);
  markBaseTransform(footRight);

  return group;
}

function createDisruptorBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.BoxGeometry(0.9, 0.95, 0.9), config.color, true);
  body.position.y = 0.72;

  const antenna = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.75, 8), 0x67e8f9, true);
  antenna.position.y = 1.46;

  const orb = mesh(new THREE.SphereGeometry(0.16, 14, 14), 0x22d3ee, true);
  orb.position.y = 1.89;

  const ring = mesh(new THREE.TorusGeometry(0.6, 0.045, 10, 36), 0x06b6d4, true);
  ring.position.y = 0.79;
  ring.rotation.x = Math.PI / 2;

  const sideOrbLeft = mesh(new THREE.SphereGeometry(0.08, 10, 10), 0x67e8f9, true);
  sideOrbLeft.position.set(-0.52, 0.79, 0);

  const sideOrbRight = sideOrbLeft.clone();
  sideOrbRight.position.x = 0.52;

  const footLeft = mesh(new THREE.BoxGeometry(0.24, 0.08, 0.34), 0x155e75);
  footLeft.position.set(-0.28, 0.06, 0.08);

  const footRight = mesh(new THREE.BoxGeometry(0.24, 0.08, 0.34), 0x155e75);
  footRight.position.set(0.28, 0.06, 0.08);

  group.add(
    body,
    antenna,
    orb,
    ring,
    sideOrbLeft,
    sideOrbRight,
    footLeft,
    footRight
  );

  group.userData.core = ring;
  group.userData.body = body;
  group.userData.extraSpin = ring;
  group.userData.secondarySpin = orb;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markBaseTransform(body);
  markBaseTransform(antenna);
  markBaseTransform(orb);
  markBaseTransform(ring);
  markBaseTransform(sideOrbLeft);
  markBaseTransform(sideOrbRight);
  markBaseTransform(footLeft);
  markBaseTransform(footRight);

  return group;
}

function mesh(geometry, color, emissive = false, role = "enemy") {
  const material = createGameMaterial(color, role);

  if (material.emissive?.set) {
    material.emissive.set(emissive ? color : 0x000000);
  }

  if (typeof material.emissiveIntensity === "number") {
    material.emissiveIntensity = emissive ? 0.4 : 0;
  }

  const object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  object.receiveShadow = true;

  object.userData.baseColor = color;
  object.userData.shaderRole = role;

  return object;
}

export function updateEnemies(scene) {
  for (const enemy of state.enemies) {
    if (enemy.userData.dead || enemy.userData.reachedGoal) continue;

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

      const angle = Math.atan2(dir.x, dir.z);
      enemy.rotation.y = angle;

      enemy.position.add(dir.normalize().multiplyScalar(finalSpeed));

      animateEnemy(enemy, finalSpeed);
      maybeSpawnFootstepDust(scene, enemy, finalSpeed);
    }
  }

  cleanupEnemies(scene);
}

function updateEnemySlowState(enemy) {
  if (enemy.userData.freezeFlashTimer > 0) {
    enemy.userData.freezeFlashTimer--;
  }

  if (enemy.userData.slowTimer > 0) {
    enemy.userData.slowTimer--;

    const stageSlowBonus = enemy.userData.stageSlowBonus ?? 1;

    enemy.userData.speed =
      enemy.userData.baseSpeed *
      enemy.userData.slowMultiplier /
      stageSlowBonus;

    enemy.userData.isSlowed = true;

    if (enemy.userData.slowVisual) {
      enemy.userData.slowVisual.visible = true;

      const pulse = 1 + Math.sin(Date.now() * 0.012) * 0.08;
      enemy.userData.slowVisual.scale.set(pulse, 1, pulse);
    }

    const freezeColor =
      enemy.userData.freezeFlashTimer > 0 ? 0x5eead4 : 0x164e63;

    setEnemyEmissive(enemy, freezeColor, 0.72);
    return;
  }

  enemy.userData.speed = enemy.userData.baseSpeed;
  enemy.userData.isSlowed = false;

  if (enemy.userData.slowVisual) {
    enemy.userData.slowVisual.visible = false;
  }

  setEnemyEmissive(enemy, 0x000000, 0);
}

function animateEnemy(enemy, finalSpeed) {
  const core = enemy.userData.core;
  const body = enemy.userData.body;
  const extraSpin = enemy.userData.extraSpin;
  const secondarySpin = enemy.userData.secondarySpin;
  const leftFoot = enemy.userData.leftFoot;
  const rightFoot = enemy.userData.rightFoot;

  const type = enemy.userData.type;
  const isBoss = type?.startsWith("boss");
  const isElite = type === "elite";
  const isFast = type === "fast";
  const isTank = type === "tank" || type === "boss_crusher";

  enemy.userData.walkPhase += finalSpeed * (isFast ? 85 : isTank ? 38 : isBoss ? 32 : 58);

  const phase = enemy.userData.walkPhase;
  const step = Math.sin(phase);
  const counterStep = Math.sin(phase + Math.PI);

  const bobStrength = isBoss ? 0.025 : isElite ? 0.03 : isTank ? 0.018 : 0.026;
  const baseY = isBoss ? 0.12 : 0.08;
  const bob = Math.abs(step) * bobStrength;

  enemy.position.y = baseY + bob;

  if (body) {
    body.rotation.z = step * (isBoss ? 0.025 : isTank ? 0.018 : 0.055);
    body.rotation.x = isFast ? -0.22 + step * 0.03 : step * 0.018;
  }

  if (core) {
    core.rotation.y += isBoss ? 0.045 : isElite ? 0.04 : 0.03;
    core.rotation.z += isBoss ? 0.024 : 0.018;
  }

  if (extraSpin) {
    extraSpin.rotation.y += isBoss ? 0.035 : 0.026;
    extraSpin.rotation.z += isBoss ? 0.03 : 0.018;
  }

  if (secondarySpin) {
    secondarySpin.rotation.y -= isBoss ? 0.028 : 0.02;
    secondarySpin.rotation.z += 0.02;
  }

  if (leftFoot) {
    leftFoot.position.z =
      (leftFoot.userData.baseZ ?? leftFoot.position.z) + step * 0.08;
    leftFoot.position.y =
      (leftFoot.userData.baseY ?? leftFoot.position.y) + Math.max(0, step) * 0.07;
    leftFoot.rotation.x = step * 0.22;
  }

  if (rightFoot) {
    rightFoot.position.z =
      (rightFoot.userData.baseZ ?? rightFoot.position.z) + counterStep * 0.08;
    rightFoot.position.y =
      (rightFoot.userData.baseY ?? rightFoot.position.y) +
      Math.max(0, counterStep) * 0.07;
    rightFoot.rotation.x = counterStep * 0.22;
  }

  if (isBoss) {
    const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.012;
    enemy.scale.setScalar(pulse * (enemy.userData.modelScale ?? 1));
  }
}

function maybeSpawnFootstepDust(scene, enemy, finalSpeed) {
  if (enemy.userData.isSlowed) return;

  const type = enemy.userData.type;
  const isBoss = type?.startsWith("boss");
  const isFast = type === "fast" || type === "boss_runner";
  const isTank = type === "tank" || type === "boss_crusher";

  enemy.userData.stepTimer++;

  const threshold = isFast ? 8 : isTank ? 18 : isBoss ? 22 : 13;

  if (enemy.userData.stepTimer < threshold) return;

  enemy.userData.stepTimer = 0;

  const dustColor = isTank
    ? 0x78716c
    : isFast
      ? 0xfbbf24
      : isBoss
        ? 0xa78bfa
        : 0x9ca3af;

  spawnFootstepDust(scene, enemy.position, dustColor);
}

function setEnemyEmissive(enemy, color, intensity = 0.65) {
  enemy.traverse((child) => {
    if (!child.isMesh) return;

    if (child.material?.emissive?.set) {
      child.material.emissive.set(color);
    }

    if (typeof child.material?.emissiveIntensity === "number") {
      child.material.emissiveIntensity = color === 0x000000 ? 0 : intensity;
    }

    if (child.material?.uniforms?.uEmissive?.value?.set) {
      child.material.uniforms.uEmissive.value.set(color);
    }

    if (child.material?.uniforms?.uEmissiveIntensity) {
      child.material.uniforms.uEmissiveIntensity.value =
        color === 0x000000 ? 0 : intensity;
    }
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

function markBaseTransform(object) {
  object.userData.baseX = object.position.x;
  object.userData.baseY = object.position.y;
  object.userData.baseZ = object.position.z;
}

function formatBossType(type) {
  if (type === "boss_crusher") return "Crusher Boss";
  if (type === "boss_runner") return "Runner Boss";
  if (type === "boss_shield") return "Shield Boss";
  if (type === "boss_splitter") return "Splitter Boss";
  if (type === "boss_disruptor") return "Disruptor Boss";
  return "Purple Boss";
}

function getBossAuraColor(type) {
  if (type === "boss_crusher") return 0xef4444;
  if (type === "boss_runner") return 0xfb923c;
  if (type === "boss_shield") return 0x22c55e;
  if (type === "boss_splitter") return 0xeab308;
  if (type === "boss_disruptor") return 0x06b6d4;

  return 0xa855f7;
}