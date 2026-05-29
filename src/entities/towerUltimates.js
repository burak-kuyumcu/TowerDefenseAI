import * as THREE from "three";
import { state } from "../game/state.js";
import { createGameMaterial } from "../visuals/materials.js";
import { removeHealthBar } from "../visuals/healthBars.js";
import {
  spawnHitEffect,
  spawnDeathExplosion,
  spawnSplashEffect,
  spawnFreezeBurst
} from "../visuals/effects.js";
import { spawnFloatingText } from "../visuals/floatingText.js";
import { registerKill } from "../systems/combo.js";
import { showAnnouncement } from "../ui/announcer.js";
import { addEventLog } from "../ui/eventLog.js";

const ULTIMATE_CHARGE_MAX = 100;

export function initializeTowerUltimate(tower) {
  tower.userData.ultimateCharge = ULTIMATE_CHARGE_MAX;
  tower.userData.ultimateActiveTimer = 0;
  tower.userData.ultimateCooldown = 0;
  tower.userData.ultimateFireRateMultiplier = 1;
  tower.userData.ultimateDamageMultiplier = 1;
  tower.userData.ultimateName = getUltimateName(tower.userData.type);
}

export function updateTowerUltimateTimers(tower) {
  if (tower.userData.ultimateCooldown > 0) {
    tower.userData.ultimateCooldown--;
  }

  if (tower.userData.ultimateActiveTimer > 0) {
    tower.userData.ultimateActiveTimer--;

    if (tower.userData.ultimateActiveTimer <= 0) {
      clearTowerUltimateBuffs(tower);
    }
  }

  if (tower.userData.ultimateCharge < ULTIMATE_CHARGE_MAX) {
    tower.userData.ultimateCharge += 0.06;
    tower.userData.ultimateCharge = Math.min(
      ULTIMATE_CHARGE_MAX,
      tower.userData.ultimateCharge
    );
  }
}

export function chargeTowerUltimate(tower, amount = 4) {
  if (!tower) return;

  tower.userData.ultimateCharge = Math.min(
    ULTIMATE_CHARGE_MAX,
    (tower.userData.ultimateCharge ?? 0) + amount
  );
}

export function activateSelectedTowerUltimate(scene) {
  const tower = state.selectedObject;

  if (!tower || !state.towers.includes(tower)) {
    showAnnouncement("Select a tower first");
    return false;
  }

  return activateTowerUltimate(scene, tower);
}

export function activateTowerUltimate(scene, tower) {
  if (!tower || tower.userData.ultimateCooldown > 0) {
    showAnnouncement("Ultimate is cooling down");
    return false;
  }

  if ((tower.userData.ultimateCharge ?? 0) < ULTIMATE_CHARGE_MAX) {
    showAnnouncement("Ultimate is charging");
    return false;
  }

  const type = tower.userData.type;

  tower.userData.ultimateCharge = 0;
  tower.userData.ultimateCooldown = 420;

  if (type === "rapid") {
    activateRapidUltimate(scene, tower);
  } else if (type === "sniper") {
    activateSniperUltimate(scene, tower);
  } else if (type === "slow") {
    activateSlowUltimate(scene, tower);
  } else if (type === "splash") {
    activateSplashUltimate(scene, tower);
  } else {
    activateNormalUltimate(scene, tower);
  }

  spawnUltimateRing(scene, tower.position, getUltimateColor(type));
  addEventLog(`${getTowerName(type)} ultimate activated: ${getUltimateName(type)}.`);

  return true;
}

export function getSelectedTowerUltimateText() {
  const tower = state.selectedObject;

  if (!tower || !state.towers.includes(tower)) {
    return "-";
  }

  const name = tower.userData.ultimateName ?? getUltimateName(tower.userData.type);
  const charge = Math.floor(tower.userData.ultimateCharge ?? 0);

  if (tower.userData.ultimateActiveTimer > 0) {
    return `${name}: Active`;
  }

  if (tower.userData.ultimateCooldown > 0) {
    return `${name}: Cooldown`;
  }

  if (charge >= ULTIMATE_CHARGE_MAX) {
    return `${name}: Ready`;
  }

  return `${name}: ${charge}%`;
}

function activateNormalUltimate(scene, tower) {
  tower.userData.ultimateActiveTimer = 360;
  tower.userData.ultimateDamageMultiplier = 2.2;

  showAnnouncement("FOCUS BURST: Normal Tower damage boosted");
  spawnFloatingText(scene, "FOCUS BURST", tower.position, "#60a5fa");
  spawnTowerColumn(scene, tower.position, 0x60a5fa);
}

function activateRapidUltimate(scene, tower) {
  tower.userData.ultimateActiveTimer = 360;
  tower.userData.ultimateFireRateMultiplier = 0.32;
  tower.userData.ultimateDamageMultiplier = 1.25;

  showAnnouncement("OVERDRIVE: Rapid Tower fire rate boosted");
  spawnFloatingText(scene, "OVERDRIVE", tower.position, "#38bdf8");
  spawnTowerColumn(scene, tower.position, 0x38bdf8);
}

function activateSniperUltimate(scene, tower) {
  const target = findStrongestEnemyInRange(tower, tower.userData.range + 1.8);

  if (!target) {
    showAnnouncement("No target for Piercing Shot");
    tower.userData.ultimateCharge = 65;
    tower.userData.ultimateCooldown = 90;
    return;
  }

  const damage = 28 + tower.userData.level * 8;

  damageEnemyByUltimate(scene, target, damage, "#c084fc", true);
  spawnLightningBeam(scene, tower.position, target.position, 0xc084fc);
  spawnFloatingText(scene, "PIERCING SHOT", tower.position, "#c084fc");
  spawnSniperImpact(scene, target.position);

  showAnnouncement("PIERCING SHOT: Sniper Tower executed high damage shot");
}

function activateSlowUltimate(scene, tower) {
  const radius = tower.userData.range + 1.2;
  let affected = 0;

  for (const enemy of state.enemies) {
    if (enemy.userData.dead || enemy.userData.type?.startsWith("boss")) continue;

    const distance = tower.position.distanceTo(enemy.position);
    if (distance > radius) continue;

    enemy.userData.slowTimer = 300;
    enemy.userData.slowMultiplier = 0.2;
    enemy.userData.isSlowed = true;
    enemy.userData.freezeFlashTimer = 90;

    affected++;

    spawnHitEffect(scene, enemy.position, 0x5eead4);
    spawnFloatingText(scene, "FREEZE", enemy.position, "#5eead4");
  }

  spawnFreezeField(scene, tower.position, radius);
  spawnFreezeBurst(scene, tower.position, radius);

  showAnnouncement(`FREEZE FIELD: ${affected} enemies slowed`);
}

function activateSplashUltimate(scene, tower) {
  const radius = tower.userData.range + 1.4;
  const damage = 10 + tower.userData.level * 5;

  let affected = 0;

  spawnSplashEffect(scene, tower.position, radius);

  for (const enemy of state.enemies) {
    if (enemy.userData.dead) continue;

    const distance = tower.position.distanceTo(enemy.position);
    if (distance > radius) continue;

    affected++;
    damageEnemyByUltimate(scene, enemy, damage, "#fb923c", false);
    spawnHitEffect(scene, enemy.position, 0xfb923c);
  }

  spawnMeteor(scene, tower.position);
  spawnFloatingText(scene, "METEOR BLAST", tower.position, "#fb923c");

  showAnnouncement(`METEOR BLAST: ${affected} enemies hit`);
}

function clearTowerUltimateBuffs(tower) {
  tower.userData.ultimateFireRateMultiplier = 1;
  tower.userData.ultimateDamageMultiplier = 1;
}

function findStrongestEnemyInRange(tower, range) {
  const enemies = state.enemies.filter((enemy) => {
    if (enemy.userData.dead) return false;
    return tower.position.distanceTo(enemy.position) <= range;
  });

  if (enemies.length === 0) return null;

  return enemies.sort((a, b) => b.userData.health - a.userData.health)[0];
}

function damageEnemyByUltimate(scene, enemy, damage, color = "#ffffff", isCrit = false) {
  if (!enemy || enemy.userData.dead) return;

  let finalDamage = damage;

  if (enemy.userData.armor) {
    finalDamage *= 1 - enemy.userData.armor;
  }

  enemy.userData.health -= finalDamage;

  spawnFloatingText(
    scene,
    isCrit ? `ULT CRIT -${Math.ceil(finalDamage)}` : `ULT -${Math.ceil(finalDamage)}`,
    enemy.position,
    color
  );

  if (enemy.userData.health <= 0) {
    enemy.userData.dead = true;

    spawnDeathExplosion(scene, enemy.position);
    scene.remove(enemy);
    removeHealthBar(scene, enemy);

    registerKill(enemy.userData.score ?? 10);
    state.gold += enemy.userData.gold ?? 5;
  }
}

function spawnUltimateRing(scene, position, color) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 1.25, 72),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(position.x, 0.09, position.z);

  scene.add(ring);

  let life = 36;

  const interval = setInterval(() => {
    ring.scale.multiplyScalar(1.06);
    ring.material.opacity *= 0.9;
    life--;

    if (life <= 0) {
      scene.remove(ring);
      ring.geometry.dispose();
      ring.material.dispose();
      clearInterval(interval);
    }
  }, 16);
}

function spawnFreezeField(scene, position, radius) {
  const field = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.72, radius, 128),
    new THREE.MeshBasicMaterial({
      color: 0x5eead4,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  field.rotation.x = -Math.PI / 2;
  field.position.set(position.x, 0.11, position.z);

  scene.add(field);

  const inner = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.28, radius * 0.32, 96),
    new THREE.MeshBasicMaterial({
      color: 0xccfbf1,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  inner.rotation.x = -Math.PI / 2;
  inner.position.set(position.x, 0.13, position.z);
  scene.add(inner);

  let life = 72;

  const interval = setInterval(() => {
    field.rotation.z += 0.045;
    inner.rotation.z -= 0.055;

    field.scale.multiplyScalar(1.006);
    inner.scale.multiplyScalar(1.012);

    field.material.opacity *= 0.965;
    inner.material.opacity *= 0.955;

    life--;

    if (life <= 0) {
      scene.remove(field);
      scene.remove(inner);

      field.geometry.dispose();
      field.material.dispose();

      inner.geometry.dispose();
      inner.material.dispose();

      clearInterval(interval);
    }
  }, 16);
}

function spawnMeteor(scene, position) {
  const meteor = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 18, 18),
    createGameMaterial(0xfb923c, "projectile")
  );

  meteor.position.set(position.x - 0.9, 5.8, position.z - 0.9);
  scene.add(meteor);

  const trail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.18, 1.2, 12),
    new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.75
    })
  );

  trail.rotation.z = Math.PI / 4;
  meteor.add(trail);
  trail.position.y = 0.65;

  let life = 32;

  const interval = setInterval(() => {
    meteor.position.x += 0.03;
    meteor.position.z += 0.03;
    meteor.position.y -= 0.2;
    meteor.scale.multiplyScalar(1.018);
    meteor.rotation.y += 0.1;
    life--;

    if (life <= 0) {
      scene.remove(meteor);
      meteor.traverse((child) => {
        child.geometry?.dispose?.();
        child.material?.dispose?.();
      });
      clearInterval(interval);
    }
  }, 16);
}

function spawnLightningBeam(scene, from, to, color) {
  const start = new THREE.Vector3(from.x, from.y + 1.2, from.z);
  const end = new THREE.Vector3(to.x, to.y + 0.7, to.z);

  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, length, 8),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95
    })
  );

  beam.position.copy(start).add(direction.clone().multiplyScalar(0.5));
  beam.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );

  scene.add(beam);

  const glow = beam.clone();
  glow.scale.set(2.1, 1, 2.1);
  glow.material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.32
  });
  scene.add(glow);

  let life = 14;

  const interval = setInterval(() => {
    beam.material.opacity *= 0.82;
    glow.material.opacity *= 0.78;

    life--;

    if (life <= 0) {
      scene.remove(beam);
      scene.remove(glow);

      beam.geometry.dispose();
      beam.material.dispose();

      glow.geometry.dispose();
      glow.material.dispose();

      clearInterval(interval);
    }
  }, 16);
}

function spawnTowerColumn(scene, position, color) {
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.42, 2.4, 18),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.32,
      depthWrite: false
    })
  );

  column.position.set(position.x, 1.2, position.z);
  scene.add(column);

  let life = 45;

  const interval = setInterval(() => {
    column.scale.x *= 1.025;
    column.scale.z *= 1.025;
    column.material.opacity *= 0.95;
    life--;

    if (life <= 0) {
      scene.remove(column);
      column.geometry.dispose();
      column.material.dispose();
      clearInterval(interval);
    }
  }, 16);
}

function spawnSniperImpact(scene, position) {
  const impact = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.46, 48),
    new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  impact.rotation.x = -Math.PI / 2;
  impact.position.set(position.x, 0.15, position.z);
  scene.add(impact);

  let life = 22;

  const interval = setInterval(() => {
    impact.scale.multiplyScalar(1.08);
    impact.material.opacity *= 0.86;
    life--;

    if (life <= 0) {
      scene.remove(impact);
      impact.geometry.dispose();
      impact.material.dispose();
      clearInterval(interval);
    }
  }, 16);
}

function getUltimateName(type) {
  if (type === "rapid") return "Overdrive";
  if (type === "sniper") return "Piercing Shot";
  if (type === "slow") return "Freeze Field";
  if (type === "splash") return "Meteor Blast";

  return "Focus Burst";
}

function getTowerName(type) {
  if (type === "rapid") return "Rapid Tower";
  if (type === "sniper") return "Sniper Tower";
  if (type === "slow") return "Slow Tower";
  if (type === "splash") return "Splash Tower";

  return "Normal Tower";
}

function getUltimateColor(type) {
  if (type === "rapid") return 0x38bdf8;
  if (type === "sniper") return 0xc084fc;
  if (type === "slow") return 0x5eead4;
  if (type === "splash") return 0xfb923c;

  return 0x60a5fa;
}