import * as THREE from "three";
import { state } from "./state.js";

export function createHealthBar(enemy) {
  const type = enemy.userData.type ?? "normal";
  const isBoss = type.startsWith("boss");
  const isElite = type === "elite";

  const width = isBoss ? 1.5 : isElite ? 1.05 : 0.8;
  const height = isBoss ? 0.16 : isElite ? 0.14 : 0.12;

  const group = new THREE.Group();

  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      color: 0x7f1d1d,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false
    })
  );

  const foreground = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      color: isBoss ? 0xfacc15 : isElite ? 0xf472b6 : 0x22c55e,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false
    })
  );

  foreground.position.z = 0.01;

  group.userData.barWidth = width;
  group.userData.isHealthBar = true;

  group.add(background);
  group.add(foreground);

  enemy.userData.healthBar = group;
  enemy.userData.healthBarFill = foreground;

  return group;
}

export function updateHealthBars(camera) {
  for (const enemy of state.enemies) {
    if (!enemy.userData.healthBar) continue;
    if (enemy.userData.dead) continue;

    const bar = enemy.userData.healthBar;
    const fill = enemy.userData.healthBarFill;

    const offset = getHealthBarOffset(enemy);
    const width = bar.userData.barWidth ?? 0.8;

    bar.visible = true;

    bar.position.set(
      enemy.position.x,
      enemy.position.y + offset,
      enemy.position.z
    );

    bar.lookAt(camera.position);

    const maxHealth = Math.max(1, enemy.userData.maxHealth ?? 1);
    const currentHealth = Math.max(0, enemy.userData.health ?? 0);
    const healthRatio = Math.min(1, currentHealth / maxHealth);

    fill.scale.x = healthRatio;
    fill.position.x = -(width / 2) * (1 - healthRatio);
  }
}

export function removeHealthBar(scene, enemy) {
  if (!enemy.userData.healthBar) return;

  scene.remove(enemy.userData.healthBar);

  enemy.userData.healthBar.traverse((child) => {
    if (!child.isMesh) return;
    child.geometry?.dispose?.();
    child.material?.dispose?.();
  });

  enemy.userData.healthBar = null;
  enemy.userData.healthBarFill = null;
}

function getHealthBarOffset(enemy) {
  const type = enemy.userData.type ?? "normal";

  if (type.startsWith("boss")) return 1.85;
  if (type === "elite") return 1.35;
  if (type === "tank") return 1.15;
  if (type === "fast") return 1.0;

  return 1.05;
}