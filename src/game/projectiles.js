import * as THREE from "three";
import { state } from "./state.js";

export function shoot(scene, tower, enemy) {
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xfacc15 })
  );

  bullet.position.set(tower.position.x, tower.position.y + 0.5, tower.position.z);
  bullet.castShadow = true;
  bullet.receiveShadow = true;

  bullet.userData = {
    target: enemy,
    speed: 0.2,
    damage: tower.userData.damage,
    dead: false
  };

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

    const dir = new THREE.Vector3().subVectors(target.position, projectile.position);
    const distance = dir.length();

    if (distance < 0.25) {
      target.userData.health -= projectile.userData.damage;

      projectile.userData.dead = true;
      scene.remove(projectile);

      if (target.userData.health <= 0) {
        target.userData.dead = true;
        scene.remove(target);

        state.score += target.userData.score ?? 10;
        state.gold += target.userData.gold ?? 5;
      }

      continue;
    }

    projectile.position.add(dir.normalize().multiplyScalar(projectile.userData.speed));
  }

  cleanupProjectiles();
}

function cleanupProjectiles() {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    if (state.projectiles[i].userData.dead) {
      state.projectiles.splice(i, 1);
    }
  }
}