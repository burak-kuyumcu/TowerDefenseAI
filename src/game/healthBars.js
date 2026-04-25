import * as THREE from "three";
import { state } from "./state.js";

export function createHealthBar(enemy) {
  const isBoss = enemy.userData.type?.startsWith("boss");
  const width = isBoss ? 1.5 : 0.8;
  const height = isBoss ? 0.16 : 0.12;

  const group = new THREE.Group();

  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      color: 0x7f1d1d,
      side: THREE.DoubleSide
    })
  );

  const foreground = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      color: isBoss ? 0xfacc15 : 0x22c55e,
      side: THREE.DoubleSide
    })
  );

  foreground.position.z = 0.01;

  group.userData.barWidth = width;

  group.add(background);
  group.add(foreground);

  enemy.userData.healthBar = group;
  enemy.userData.healthBarFill = foreground;

  return group;
}

export function updateHealthBars(camera) {
  for (const enemy of state.enemies) {
    if (!enemy.userData.healthBar) continue;

    const bar = enemy.userData.healthBar;
    const fill = enemy.userData.healthBarFill;

    const offset = enemy.userData.healthBarOffset ?? 0.75;
    const width = bar.userData.barWidth ?? 0.8;

    bar.position.set(
      enemy.position.x,
      enemy.position.y + offset,
      enemy.position.z
    );

    bar.lookAt(camera.position);

    const healthRatio = Math.max(
      0,
      enemy.userData.health / enemy.userData.maxHealth
    );

    fill.scale.x = healthRatio;
    fill.position.x = -(width / 2) * (1 - healthRatio);
  }
}

export function removeHealthBar(scene, enemy) {
  if (!enemy.userData.healthBar) return;

  scene.remove(enemy.userData.healthBar);
  enemy.userData.healthBar = null;
  enemy.userData.healthBarFill = null;
}