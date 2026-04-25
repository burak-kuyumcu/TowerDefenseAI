import * as THREE from "three";
import { state } from "./state.js";

const pulseEffects = [];
const auraEffects = [];

export function updateBossAbilities(scene) {
  for (const enemy of state.enemies) {
    if (enemy.userData.dead) continue;
    if (!enemy.userData.type?.startsWith("boss")) continue;

    if (enemy.userData.type === "boss_purple") {
      updatePurpleBoss(scene, enemy);
    }

    if (enemy.userData.type === "boss_crusher") {
      updateCrusherBoss(scene, enemy);
    }

    if (enemy.userData.type === "boss_runner") {
      updateRunnerBoss(scene, enemy);
    }
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
  }

  if (!isBoosting && boss.userData.auraEffect) {
    boss.userData.auraEffect.userData.life = 0;
    boss.userData.auraEffect = null;
  }
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

    const progress =
      1 - effect.userData.life / effect.userData.maxLife;

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