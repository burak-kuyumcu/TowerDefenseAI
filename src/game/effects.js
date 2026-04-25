import * as THREE from "three";
import { createGameMaterial } from "./materials.js";

const effects = [];

export function spawnHitEffect(scene, position) {
  const effect = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 12),
    createGameMaterial(0xffffff)
  );

  effect.position.copy(position);
  effect.userData = {
    life: 12,
    maxLife: 12,
    type: "hit"
  };

  scene.add(effect);
  effects.push(effect);
}

export function spawnDeathExplosion(scene, position) {
  for (let i = 0; i < 8; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      createGameMaterial(0xfacc15)
    );

    particle.position.copy(position);

    particle.userData = {
      life: 30,
      maxLife: 30,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.12,
        Math.random() * 0.12,
        (Math.random() - 0.5) * 0.12
      ),
      type: "explosion"
    };

    scene.add(particle);
    effects.push(particle);
  }
}

export function spawnSplashEffect(scene, position, radius) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1, 96),
    new THREE.MeshBasicMaterial({
      color: 0xfb923c,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(position.x, 0.12, position.z);
  ring.scale.set(0.15, 0.15, 0.15);

  ring.userData = {
    life: 35,
    maxLife: 35,
    targetRadius: radius,
    type: "splash"
  };

  scene.add(ring);
  effects.push(ring);
}

export function spawnEliteAura(scene, enemy) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1, 72),
    new THREE.MeshBasicMaterial({
      color: 0xec4899,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(enemy.position.x, 0.11, enemy.position.z);
  ring.scale.set(1.05, 1.05, 1.05);

  ring.userData = {
    type: "eliteAura",
    enemy
  };

  scene.add(ring);
  effects.push(ring);

  enemy.userData.auraEffect = ring;
}

export function updateEffects(scene) {
  for (const effect of effects) {
    if (effect.userData.type === "eliteAura") {
      const enemy = effect.userData.enemy;

      if (!enemy || enemy.userData.dead) {
        effect.userData.life = 0;
        continue;
      }

      effect.position.set(enemy.position.x, 0.11, enemy.position.z);
      effect.rotation.z += 0.025;

      const pulse = 1.05 + Math.sin(Date.now() * 0.008) * 0.08;
      effect.scale.set(pulse, pulse, pulse);

      continue;
    }

    effect.userData.life--;

    if (effect.userData.velocity) {
      effect.position.add(effect.userData.velocity);
      effect.userData.velocity.y -= 0.004;
    }

    const ratio = effect.userData.life / effect.userData.maxLife;

    if (effect.userData.type === "splash") {
      const progress = 1 - ratio;
      const scale = Math.max(0.15, progress * effect.userData.targetRadius);
      effect.scale.set(scale, scale, scale);
    } else {
      effect.scale.setScalar(Math.max(0.1, ratio));
    }

    if (effect.material.opacity !== undefined) {
      effect.material.transparent = true;
      effect.material.opacity = ratio;
    }
  }

  for (let i = effects.length - 1; i >= 0; i--) {
    if (effects[i].userData.life <= 0) {
      scene.remove(effects[i]);

      if (effects[i].geometry) effects[i].geometry.dispose();
      if (effects[i].material) effects[i].material.dispose();

      effects.splice(i, 1);
    }
  }
}