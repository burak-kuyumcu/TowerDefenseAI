import * as THREE from "three";
import { state } from "./state.js";
import { addEventLog } from "./eventLog.js";
import { createHealthBar } from "./healthBars.js";
import { updateTowerLabelText } from "./towerLabels.js";

const pulseEffects = [];
const auraEffects = [];

const TARGET_MODES = ["nearest", "first", "strongest", "weakest"];

export function updateBossAbilities(scene) {
  for (const enemy of state.enemies) {
    if (enemy.userData.dead) continue;
    if (!enemy.userData.type?.startsWith("boss")) continue;

    if (enemy.userData.type === "boss_purple") updatePurpleBoss(scene, enemy);
    if (enemy.userData.type === "boss_crusher") updateCrusherBoss(scene, enemy);
    if (enemy.userData.type === "boss_runner") updateRunnerBoss(scene, enemy);
    if (enemy.userData.type === "boss_shield") updateShieldBoss(scene, enemy);
    if (enemy.userData.type === "boss_disruptor") updateDisruptorBoss(scene, enemy);
  }

  updatePulseEffects(scene);
  updateAuraEffects(scene);
}

function updatePurpleBoss(scene, boss) {
  boss.userData.pulseCooldown--;

  if (boss.userData.pulseCooldown <= 0) {
    triggerPurplePulse(scene, boss);
    boss.userData.pulseCooldown = boss.userData.pulseInterval || 180;
  }
}

function triggerPurplePulse(scene, boss) {
  const radius = 3.2;

  spawnPulseEffect(scene, boss.position, radius, 0xa855f7);
  addEventLog("Purple Boss pulse slowed nearby towers.");

  for (const tower of state.towers) {
    const distance = tower.position.distanceTo(boss.position);

    if (distance <= radius) {
      tower.userData.slowTimer = 180;
      tower.userData.slowMultiplier = 1.8;
    }
  }
}

function updateCrusherBoss(scene, boss) {
  boss.userData.armor = 0.5;

  if (!boss.userData.auraEffect) {
    boss.userData.auraEffect = spawnAuraEffect(scene, boss, 0x7f1d1d);
  }
}

function updateRunnerBoss(scene, boss) {
  boss.userData.speedBoostTimer++;

  const isBoosting = boss.userData.speedBoostTimer % 220 < 70;
  boss.userData.speedMultiplier = isBoosting ? 2 : 1;

  if (isBoosting && !boss.userData.auraEffect) {
    boss.userData.auraEffect = spawnAuraEffect(scene, boss, 0xfb923c);
    addEventLog("Runner Boss activated speed burst.");
  }

  if (!isBoosting && boss.userData.auraEffect) {
    boss.userData.auraEffect.userData.life = 0;
    boss.userData.auraEffect = null;
  }
}

function updateShieldBoss(scene, boss) {
  boss.userData.armor = 0.25;

  if (!boss.userData.auraEffect) {
    boss.userData.auraEffect = spawnAuraEffect(scene, boss, 0x22c55e);
  }

  for (const enemy of state.enemies) {
    if (enemy.userData.type?.startsWith("boss")) continue;

    if (enemy.userData.shieldArmor) {
      enemy.userData.armor = 0;
      enemy.userData.shieldArmor = false;
    }
  }

  for (const enemy of state.enemies) {
    if (enemy === boss || enemy.userData.dead) continue;
    if (enemy.userData.type?.startsWith("boss")) continue;

    const distance = enemy.position.distanceTo(boss.position);

    if (distance <= 3.5) {
      enemy.userData.armor = Math.max(enemy.userData.armor ?? 0, 0.35);
      enemy.userData.shieldArmor = true;
    }
  }
}

function updateDisruptorBoss(scene, boss) {
  boss.userData.disruptTimer = (boss.userData.disruptTimer ?? 150) - 1;

  if (boss.userData.disruptTimer > 0) return;

  boss.userData.disruptTimer = 220;

  spawnPulseEffect(scene, boss.position, 4, 0x06b6d4);
  addEventLog("Disruptor Boss scrambled tower targeting.");

  for (const tower of state.towers) {
    const distance = tower.position.distanceTo(boss.position);
    if (distance > 4) continue;

    const randomMode =
      TARGET_MODES[Math.floor(Math.random() * TARGET_MODES.length)];

    tower.userData.targetMode = randomMode;
    updateTowerLabelText(tower);
  }
}

export function spawnSplitterChildren(scene, boss) {
  if (!boss || boss.userData.type !== "boss_splitter") return;

  for (let i = 0; i < 3; i++) {
    const child = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xeab308,
        emissive: 0x000000
      })
    );

    child.position.set(
      boss.position.x + (Math.random() - 0.5) * 0.8,
      boss.position.y,
      boss.position.z + (Math.random() - 0.5) * 0.8
    );

    child.castShadow = true;
    child.receiveShadow = true;

    child.userData = {
      type: "fast",
      index: boss.userData.index,
      speed: 0.045 + state.wave * 0.002,
      baseSpeed: 0.045 + state.wave * 0.002,
      speedMultiplier: 1,
      health: 8 + state.wave,
      maxHealth: 8 + state.wave,
      score: 15,
      gold: 7,
      baseDamage: 1,
      reachedGoal: false,
      dead: false,
      selectable: true,
      baseColor: 0xeab308,
      healthBarOffset: 0.75,
      slowTimer: 0,
      slowMultiplier: 1,
      armor: 0,
      shieldArmor: false,
      auraEffect: null
    };

    scene.add(child);

    const healthBar = createHealthBar(child);
    scene.add(healthBar);

    state.enemies.push(child);
  }

  addEventLog("Splitter Boss released fragments.");
}

function spawnPulseEffect(scene, position, radius, color) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1, 96),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(position.x, 0.09, position.z);
  ring.scale.set(0.2, 0.2, 0.2);

  ring.userData = {
    life: 45,
    maxLife: 45,
    targetRadius: radius
  };

  scene.add(ring);
  pulseEffects.push(ring);
}

function spawnAuraEffect(scene, boss, color) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1, 72),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(boss.position.x, 0.1, boss.position.z);
  ring.scale.set(1.5, 1.5, 1.5);

  ring.userData = {
    boss,
    life: Infinity,
    maxLife: Infinity
  };

  scene.add(ring);
  auraEffects.push(ring);

  return ring;
}

function updatePulseEffects(scene) {
  for (const effect of pulseEffects) {
    effect.userData.life--;

    const progress = 1 - effect.userData.life / effect.userData.maxLife;
    const scale = Math.max(0.2, progress * effect.userData.targetRadius);

    effect.scale.set(scale, scale, scale);
    effect.material.opacity = Math.max(
      0,
      effect.userData.life / effect.userData.maxLife
    );
  }

  for (let i = pulseEffects.length - 1; i >= 0; i--) {
    if (pulseEffects[i].userData.life <= 0) {
      scene.remove(pulseEffects[i]);
      pulseEffects[i].geometry.dispose();
      pulseEffects[i].material.dispose();
      pulseEffects.splice(i, 1);
    }
  }
}

function updateAuraEffects(scene) {
  for (const aura of auraEffects) {
    const boss = aura.userData.boss;

    if (!boss || boss.userData.dead || aura.userData.life <= 0) {
      aura.userData.life = 0;
      continue;
    }

    aura.position.set(boss.position.x, 0.1, boss.position.z);
    aura.rotation.z += 0.025;
  }

  for (let i = auraEffects.length - 1; i >= 0; i--) {
    if (auraEffects[i].userData.life <= 0) {
      scene.remove(auraEffects[i]);
      auraEffects[i].geometry.dispose();
      auraEffects[i].material.dispose();
      auraEffects.splice(i, 1);
    }
  }
}