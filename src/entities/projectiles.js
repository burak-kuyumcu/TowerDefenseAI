import * as THREE from "three";
import { state } from "../game/state.js";
import { createGameMaterial } from "../visuals/materials.js";
import { removeHealthBar } from "../visuals/healthBars.js";
import {
  spawnHitEffect,
  spawnDeathExplosion,
  spawnSplashEffect,
  spawnMuzzleFlash,
  spawnRecoilSpark,
  spawnProjectileTrailEffect,
  spawnEnemyHitFlash,
  spawnCritBurst
} from "../visuals/effects.js";
import { spawnFloatingText } from "../visuals/floatingText.js";
import { registerKill } from "../systems/combo.js";
import { spawnSplitterChildren } from "../entities/bossAbilities.js";
import { playShootSound, playExplosionSound } from "../game/audio.js";
import { addCameraShake } from "../systems/cameraShake.js";
import { showScreenFlash } from "../ui/announcer.js";
import { getDirectionalFocusBonus } from "../systems/directionalFocus.js";
import {
  getCurrentStageTowerDamageMultiplier,
  getCurrentStageSlowBonus
} from "../game/stages.js";

export function shoot(scene, tower, enemy) {
  const color = getProjectileColor(tower);
  const bulletSize = getProjectileSize(tower);
  const muzzlePosition = getTowerMuzzleWorldPosition(tower);
  const focusBonus = getDirectionalFocusBonus(tower, enemy);

  triggerTowerFireAnimation(tower);

  spawnMuzzleFlash(scene, muzzlePosition, color, bulletSize * 1.8);
  spawnRecoilSpark(scene, muzzlePosition, color);

  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(bulletSize, 12, 12),
    createGameMaterial(color, "projectile")
  );

  bullet.position.copy(muzzlePosition);
  bullet.castShadow = true;
  bullet.receiveShadow = true;

  bullet.userData = {
    target: enemy,
    speed: tower.userData.type === "sniper" ? 0.36 : 0.22,
    damage: getEffectiveTowerDamage(tower, enemy),
    critChance: getEffectiveCritChance(tower, enemy),
    dead: false,
    baseColor: color,
    slowEffect: getEffectiveSlowEffect(tower, enemy),
    splashEffect: getEffectiveSplashEffect(tower, enemy),
    trailTimer: 0,
    sourceTowerType: tower.userData.type,
    ultimateActive: tower.userData.ultimateActiveTimer > 0,
    focusActive: focusBonus.active
  };

  playShootSound();

  scene.add(bullet);
  state.projectiles.push(bullet);
}

export function updateProjectiles(scene) {
  for (const projectile of state.projectiles) {
    if (projectile.userData.dead) continue;

    const target = projectile.userData.target;

    if (!target || target.userData.dead || !scene.children.includes(target)) {
      projectile.userData.dead = true;
      disposeProjectile(scene, projectile);
      continue;
    }

    projectile.userData.trailTimer++;

    if (projectile.userData.trailTimer % 2 === 0) {
      spawnProjectileTrailEffect(
        scene,
        projectile.position,
        projectile.userData.baseColor,
        projectile.userData.ultimateActive || projectile.userData.focusActive
          ? 0.09
          : 0.065
      );
    }

    const targetPoint = getTargetImpactPoint(target);
    const dir = new THREE.Vector3().subVectors(targetPoint, projectile.position);
    const distance = dir.length();

    if (distance < 0.25) {
      handleProjectileHit(scene, projectile, target);
      continue;
    }

    projectile.position.add(
      dir.normalize().multiplyScalar(projectile.userData.speed)
    );
  }

  cleanupProjectiles();
}

function handleProjectileHit(scene, projectile, target) {
  const hitResult = buildHitResult(
    projectile.userData.damage,
    projectile.userData.critChance
  );

  const hitColor = hitResult.isCrit
    ? "#fb923c"
    : projectile.userData.focusActive
      ? "#fde68a"
      : "#facc15";

  const effectColor = hitResult.isCrit
    ? 0xfb923c
    : projectile.userData.focusActive
      ? 0xfde68a
      : projectile.userData.baseColor;

  const killed = damageEnemy(
    scene,
    target,
    hitResult.damage,
    hitColor,
    hitResult.isCrit,
    projectile.userData.focusActive
  );

  applySlowEffect(scene, target, projectile.userData.slowEffect);

  spawnHitEffect(scene, target.position, effectColor);
  spawnEnemyHitFlash(scene, target, effectColor);

  if (hitResult.isCrit) {
    spawnCritBurst(scene, target.position, effectColor);
    showScreenFlash("rgba(251, 146, 60, 0.16)", 8);
    addCameraShake(0.055, 8);
  }

  if (projectile.userData.focusActive && !hitResult.isCrit) {
    spawnFloatingText(scene, "FOCUS", target.position, "#fde68a", {
      variant: "big",
      yOffset: 1.15,
      life: 38
    });
  }

  if (projectile.userData.splashEffect) {
    applySplashDamage(
      scene,
      target.position,
      projectile.userData.splashEffect,
      hitResult.isCrit,
      projectile.userData.focusActive
    );
  }

  projectile.userData.dead = true;
  disposeProjectile(scene, projectile);

  if (killed && projectile.userData.sourceTowerType === "sniper") {
    addCameraShake(0.08, 10);
  }
}

function getTargetImpactPoint(target) {
  const offset = target.userData.type?.startsWith("boss") ? 0.85 : 0.45;

  return new THREE.Vector3(
    target.position.x,
    target.position.y + offset,
    target.position.z
  );
}

function getProjectileColor(tower) {
  if (tower.userData.type === "slow") return 0x5eead4;
  if (tower.userData.type === "splash") return 0xfb923c;

  if (
    tower.userData.type === "rapid" &&
    tower.userData.ultimateActiveTimer > 0
  ) {
    return 0x38bdf8;
  }

  if (
    tower.userData.type === "sniper" &&
    tower.userData.ultimateActiveTimer > 0
  ) {
    return 0xc084fc;
  }

  return 0xfacc15;
}

function getProjectileSize(tower) {
  if (tower.userData.ultimateActiveTimer > 0) return 0.17;
  if (tower.userData.type === "sniper") return 0.14;
  if (tower.userData.type === "splash") return 0.16;
  return 0.12;
}

function triggerTowerFireAnimation(tower) {
  tower.userData.recoilTimer = getRecoilDuration(tower);
  tower.userData.fireFlashTimer = 8;
  tower.userData.fireFlashColor = getProjectileColor(tower);

  if (tower.userData.type === "rapid") {
    tower.userData.activeBarrelSide =
      tower.userData.activeBarrelSide === "left" ? "right" : "left";
  }
}

function getRecoilDuration(tower) {
  if (tower.userData.type === "rapid") return 5;
  if (tower.userData.type === "sniper") return 12;
  if (tower.userData.type === "splash") return 14;
  if (tower.userData.type === "slow") return 10;
  return 8;
}

function getTowerMuzzleWorldPosition(tower) {
  const muzzle = getActiveMuzzleObject(tower);

  if (muzzle) {
    const localPoint = new THREE.Vector3(0, 0, 0);
    muzzle.getWorldPosition(localPoint);
    return localPoint;
  }

  return new THREE.Vector3(
    tower.position.x,
    tower.position.y + 0.75,
    tower.position.z
  );
}

function getActiveMuzzleObject(tower) {
  const muzzles = tower.userData.muzzles ?? [];

  if (muzzles.length === 0) return tower.userData.barrel ?? null;

  if (tower.userData.type !== "rapid") {
    return muzzles[0];
  }

  if (tower.userData.activeBarrelSide === "right") {
    return muzzles[1] ?? muzzles[0];
  }

  return muzzles[0];
}

function getEffectiveTowerDamage(tower, enemy) {
  const baseDamage = tower.userData.damage ?? 1;
  const ultimateMultiplier = tower.userData.ultimateDamageMultiplier ?? 1;
  const focusBonus = getDirectionalFocusBonus(tower, enemy);
  const stageDamageMultiplier = getCurrentStageTowerDamageMultiplier();

  return (
    baseDamage *
    ultimateMultiplier *
    focusBonus.damageMultiplier *
    stageDamageMultiplier
  );
}

function getEffectiveCritChance(tower, enemy) {
  const baseCrit = tower.userData.critChance ?? 0.1;
  const focusBonus = getDirectionalFocusBonus(tower, enemy);

  return Math.min(0.95, baseCrit + focusBonus.critBonus);
}

function getEffectiveSlowEffect(tower, enemy) {
  const slowEffect = tower.userData.slowEffect ?? null;
  if (!slowEffect) return null;

  const focusBonus = getDirectionalFocusBonus(tower, enemy);

  return {
    ...slowEffect,
    duration: Math.floor(
      slowEffect.duration * focusBonus.slowDurationMultiplier
    ),
    multiplier: slowEffect.multiplier
  };
}

function getEffectiveSplashEffect(tower, enemy) {
  const splashEffect = tower.userData.splashEffect ?? null;
  if (!splashEffect) return null;

  const focusBonus = getDirectionalFocusBonus(tower, enemy);

  return {
    ...splashEffect,
    radius: splashEffect.radius * focusBonus.splashRadiusMultiplier
  };
}

function buildHitResult(baseDamage, critChance) {
  const isCrit = Math.random() < critChance;

  return {
    isCrit,
    damage: isCrit ? baseDamage * 2 : baseDamage
  };
}

function damageEnemy(
  scene,
  enemy,
  damage,
  color = "#ffffff",
  isCrit = false,
  focusActive = false
) {
  if (!enemy || enemy.userData.dead) return false;

  let finalDamage = damage;

  if (enemy.userData.armor) {
    finalDamage *= 1 - enemy.userData.armor;
  }

  enemy.userData.health -= finalDamage;

  const prefix = isCrit ? "CRIT " : focusActive ? "FOCUS " : "";

  spawnFloatingText(
    scene,
    `${prefix}-${Math.ceil(finalDamage)}`,
    enemy.position,
    color,
    {
      variant: isCrit ? "crit" : focusActive ? "big" : "normal",
      yOffset: isCrit ? 1.25 : focusActive ? 1.1 : 0.9
    }
  );

  if (enemy.userData.health <= 0) {
    enemy.userData.dead = true;

    if (enemy.userData.type === "boss_splitter") {
      spawnSplitterChildren(scene, enemy);
    }

    spawnDeathExplosion(scene, enemy.position);
    playExplosionSound();

    scene.remove(enemy);
    removeHealthBar(scene, enemy);

    registerKill(enemy.userData.score ?? 10);
    state.gold += enemy.userData.gold ?? 5;

    return true;
  }

  return false;
}

function applySplashDamage(
  scene,
  centerPosition,
  splashEffect,
  mainHitWasCrit = false,
  focusActive = false
) {
  const radius = splashEffect.radius ?? 1.2;
  const baseDamage = splashEffect.damage ?? 1;
  const damage = mainHitWasCrit ? baseDamage * 2 : baseDamage;

  spawnSplashEffect(scene, centerPosition, radius);
  addCameraShake(mainHitWasCrit ? 0.12 : focusActive ? 0.095 : 0.075, 12);

  for (const enemy of state.enemies) {
    if (enemy.userData.dead) continue;

    const distance = enemy.position.distanceTo(centerPosition);

    if (distance <= radius) {
      damageEnemy(
        scene,
        enemy,
        damage,
        focusActive ? "#fed7aa" : "#fb923c",
        mainHitWasCrit,
        focusActive
      );

      spawnHitEffect(scene, enemy.position, 0xfb923c);
      spawnEnemyHitFlash(scene, enemy, 0xfb923c);
    }
  }
}

function applySlowEffect(scene, enemy, slowEffect) {
  if (!slowEffect) return;
  if (enemy.userData.type?.startsWith("boss")) return;

  const stageSlowBonus =
    enemy.userData.stageSlowBonus ?? getCurrentStageSlowBonus();

  enemy.userData.slowTimer = Math.floor(slowEffect.duration * stageSlowBonus);
  enemy.userData.slowMultiplier = slowEffect.multiplier;
  enemy.userData.isSlowed = true;

  addSlowVisual(scene, enemy);
}

function addSlowVisual(scene, enemy) {
  if (enemy.userData.slowVisual) {
    enemy.userData.slowVisual.visible = true;
    return;
  }

  const visual = new THREE.Group();

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.58, 48),
    new THREE.MeshBasicMaterial({
      color: 0x5eead4,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;

  const crystal1 = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.22, 6),
    new THREE.MeshBasicMaterial({
      color: 0x99f6e4,
      transparent: true,
      opacity: 0.85
    })
  );

  crystal1.position.set(0.28, 0.14, 0.12);

  const crystal2 = crystal1.clone();
  crystal2.position.set(-0.22, 0.12, -0.18);
  crystal2.scale.setScalar(0.8);

  visual.add(ring, crystal1, crystal2);
  visual.userData.isSlowVisual = true;

  enemy.add(visual);
  enemy.userData.slowVisual = visual;
}

function disposeProjectile(scene, projectile) {
  scene.remove(projectile);
  projectile.geometry?.dispose?.();

  if (Array.isArray(projectile.material)) {
    projectile.material.forEach((material) => material.dispose?.());
  } else {
    projectile.material?.dispose?.();
  }
}

function cleanupProjectiles() {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    if (state.projectiles[i].userData.dead) {
      state.projectiles.splice(i, 1);
    }
  }
}