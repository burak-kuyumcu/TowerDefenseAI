import * as THREE from "three";
import { state } from "./state.js";
import { createGameMaterial } from "./materials.js";
import { removeHealthBar } from "./healthBars.js";
import {
  spawnHitEffect,
  spawnDeathExplosion,
  spawnSplashEffect
} from "./effects.js";
import { playShootSound, playExplosionSound } from "./audio.js";

export function shoot(scene, tower, enemy) {
  const color =
    tower.userData.type === "slow"
      ? 0x5eead4
      : tower.userData.type === "splash"
        ? 0xfb923c
        : 0xfacc15;

  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 12),
    createGameMaterial(color)
  );

  bullet.position.set(
    tower.position.x,
    tower.position.y + 0.5,
    tower.position.z
  );

  bullet.castShadow = true;
  bullet.receiveShadow = true;

  bullet.userData = {
    target: enemy,
    speed: tower.userData.type === "sniper" ? 0.32 : 0.2,
    damage: tower.userData.damage,
    dead: false,
    baseColor: color,
    slowEffect: tower.userData.slowEffect ?? null,
    splashEffect: tower.userData.splashEffect ?? null
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
      scene.remove(projectile);
      continue;
    }

    const dir = new THREE.Vector3().subVectors(
      target.position,
      projectile.position
    );

    const distance = dir.length();

    if (distance < 0.25) {
      damageEnemy(scene, target, projectile.userData.damage);

      applySlowEffect(target, projectile.userData.slowEffect);
      spawnHitEffect(scene, target.position);

      if (projectile.userData.splashEffect) {
        applySplashDamage(
          scene,
          target.position,
          projectile.userData.splashEffect
        );
      }

      projectile.userData.dead = true;
      scene.remove(projectile);

      continue;
    }

    projectile.position.add(
      dir.normalize().multiplyScalar(projectile.userData.speed)
    );
  }

  cleanupProjectiles();
}

function damageEnemy(scene, enemy, damage) {
  if (!enemy || enemy.userData.dead) return;

  let finalDamage = damage;

  if (enemy.userData.armor) {
    finalDamage *= 1 - enemy.userData.armor;
  }

  enemy.userData.health -= finalDamage;

  if (enemy.userData.health <= 0) {
    enemy.userData.dead = true;

    spawnDeathExplosion(scene, enemy.position);
    playExplosionSound();

    scene.remove(enemy);
    removeHealthBar(scene, enemy);

    state.score += enemy.userData.score ?? 10;
    state.gold += enemy.userData.gold ?? 5;
  }
}

function applySplashDamage(scene, centerPosition, splashEffect) {
  const radius = splashEffect.radius ?? 1.2;
  const damage = splashEffect.damage ?? 1;

  spawnSplashEffect(scene, centerPosition, radius);

  for (const enemy of state.enemies) {
    if (enemy.userData.dead) continue;

    const distance = enemy.position.distanceTo(centerPosition);

    if (distance <= radius) {
      damageEnemy(scene, enemy, damage);
      spawnHitEffect(scene, enemy.position);
    }
  }
}

function applySlowEffect(enemy, slowEffect) {
  if (!slowEffect) return;
  if (enemy.userData.type?.startsWith("boss")) return;

  enemy.userData.slowTimer = slowEffect.duration;
  enemy.userData.slowMultiplier = slowEffect.multiplier;
}

function cleanupProjectiles() {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    if (state.projectiles[i].userData.dead) {
      state.projectiles.splice(i, 1);
    }
  }
}