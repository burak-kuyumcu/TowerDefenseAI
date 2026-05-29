import * as THREE from "three";
import { createGameMaterial } from "../visuals/materials.js";

const effects = [];

export function spawnHitEffect(scene, position, color = 0xffffff) {
  const effect = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 12),
    createGameMaterial(color)
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

export function spawnMuzzleFlash(scene, position, color = 0xfacc15, size = 0.24) {
  const flash = new THREE.Group();

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(size, 12, 12),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    })
  );

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(size * 0.8, size * 1.4, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = Math.PI / 2;

  flash.position.copy(position);
  flash.add(core, ring);

  flash.userData = {
    life: 10,
    maxLife: 10,
    type: "muzzleFlash"
  };

  scene.add(flash);
  effects.push(flash);
}

export function spawnRecoilSpark(scene, position, color = 0xfacc15) {
  for (let i = 0; i < 4; i++) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9
      })
    );

    spark.position.copy(position);

    spark.userData = {
      life: 14,
      maxLife: 14,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.06,
        Math.random() * 0.05,
        (Math.random() - 0.5) * 0.06
      ),
      type: "spark"
    };

    scene.add(spark);
    effects.push(spark);
  }
}

export function spawnFootstepDust(scene, position, color = 0x9ca3af) {
  const dust = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 8),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.32,
      depthWrite: false
    })
  );

  dust.position.set(
    position.x + (Math.random() - 0.5) * 0.22,
    0.08,
    position.z + (Math.random() - 0.5) * 0.22
  );

  dust.scale.set(1.4, 0.35, 1.4);

  dust.userData = {
    life: 18,
    maxLife: 18,
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 0.012,
      0.004,
      (Math.random() - 0.5) * 0.012
    ),
    type: "footstepDust"
  };

  scene.add(dust);
  effects.push(dust);
}

export function spawnDeathExplosion(scene, position) {
  for (let i = 0; i < 10; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      createGameMaterial(i % 2 === 0 ? 0xfacc15 : 0xfb923c)
    );

    particle.position.copy(position);

    particle.userData = {
      life: 30,
      maxLife: 30,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.13,
        Math.random() * 0.13,
        (Math.random() - 0.5) * 0.13
      ),
      type: "explosion"
    };

    scene.add(particle);
    effects.push(particle);
  }

  spawnShockwave(scene, position, 1.5, 0xfacc15);
}

export function spawnSplashEffect(scene, position, radius) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1, 96),
    new THREE.MeshBasicMaterial({
      color: 0xfb923c,
      transparent: true,
      opacity: 0.72,
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
    new THREE.RingGeometry(0.78, 1.05, 96),
    new THREE.MeshBasicMaterial({
      color: 0xec4899,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(enemy.position.x, 0.11, enemy.position.z);
  ring.scale.set(1.05, 1.05, 1.05);

  ring.userData = {
    type: "eliteAura",
    enemy,
    life: 999999,
    maxLife: 999999
  };

  scene.add(ring);
  effects.push(ring);

  enemy.userData.auraEffect = ring;
}

export function spawnBossAura(scene, enemy, color = 0xa855f7) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.32, 112),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(enemy.position.x, 0.12, enemy.position.z);

  ring.userData = {
    type: "bossAura",
    enemy,
    life: 999999,
    maxLife: 999999
  };

  scene.add(ring);
  effects.push(ring);

  enemy.userData.bossAuraEffect = ring;
}

export function spawnFreezeBurst(scene, position, radius = 1.4) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.55, radius, 96),
    new THREE.MeshBasicMaterial({
      color: 0x5eead4,
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(position.x, 0.13, position.z);

  ring.userData = {
    life: 42,
    maxLife: 42,
    targetRadius: radius,
    type: "freezeBurst"
  };

  scene.add(ring);
  effects.push(ring);

  for (let i = 0; i < 8; i++) {
    const shard = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.28, 6),
      new THREE.MeshBasicMaterial({
        color: 0x99f6e4,
        transparent: true,
        opacity: 0.9
      })
    );

    const angle = (Math.PI * 2 * i) / 8;

    shard.position.set(
      position.x + Math.cos(angle) * 0.35,
      0.18,
      position.z + Math.sin(angle) * 0.35
    );

    shard.rotation.z = Math.random() * Math.PI;

    shard.userData = {
      life: 34,
      maxLife: 34,
      velocity: new THREE.Vector3(
        Math.cos(angle) * 0.035,
        0.035 + Math.random() * 0.035,
        Math.sin(angle) * 0.035
      ),
      type: "freezeShard"
    };

    scene.add(shard);
    effects.push(shard);
  }
}

export function spawnTowerReadyPulse(scene, position, color = 0x38bdf8) {
  spawnShockwave(scene, position, 1.25, color, 24);
}

function spawnShockwave(scene, position, radius, color, life = 32) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.62, 96),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(position.x, 0.11, position.z);

  ring.userData = {
    life,
    maxLife: life,
    targetRadius: radius,
    type: "shockwave"
  };

  scene.add(ring);
  effects.push(ring);
}

export function updateEffects(scene) {
  for (const effect of effects) {
    if (effect.userData.type === "eliteAura") {
      updateAttachedAura(effect, 0.03, 1.08, 0.1);
      continue;
    }

    if (effect.userData.type === "bossAura") {
      updateAttachedAura(effect, -0.018, 1.16, 0.08);
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
    } else if (
      effect.userData.type === "shockwave" ||
      effect.userData.type === "freezeBurst"
    ) {
      const progress = 1 - ratio;
      const scale = Math.max(0.15, progress * (effect.userData.targetRadius ?? 1.4));
      effect.scale.set(scale, scale, scale);
      effect.rotation.z += 0.035;
    } else if (effect.userData.type === "muzzleFlash") {
      const pulse = 1 + (1 - ratio) * 1.4;
      effect.scale.set(pulse, pulse, pulse);
      effect.rotation.y += 0.22;
    } else if (effect.userData.type === "footstepDust") {
      const spread = 1 + (1 - ratio) * 1.8;
      effect.scale.set(spread, 0.25, spread);
    } else {
      effect.scale.setScalar(Math.max(0.1, ratio));
    }

    applyOpacity(effect, ratio);
  }

  for (let i = effects.length - 1; i >= 0; i--) {
    if (effects[i].userData.life <= 0) {
      scene.remove(effects[i]);
      disposeEffect(effects[i]);
      effects.splice(i, 1);
    }
  }
}

function updateAttachedAura(effect, rotationSpeed, basePulse, pulseAmount) {
  const enemy = effect.userData.enemy;

  if (!enemy || enemy.userData.dead) {
    effect.userData.life = 0;
    return;
  }

  effect.position.set(enemy.position.x, 0.11, enemy.position.z);
  effect.rotation.z += rotationSpeed;

  const pulse = basePulse + Math.sin(Date.now() * 0.008) * pulseAmount;
  effect.scale.set(pulse, pulse, pulse);
}

function applyOpacity(object, ratio) {
  object.traverse?.((child) => {
    if (!child.material) return;

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => {
        if (material.opacity !== undefined) {
          material.transparent = true;
          material.opacity = Math.max(0, ratio);
        }
      });
    } else if (child.material.opacity !== undefined) {
      child.material.transparent = true;
      child.material.opacity = Math.max(0, ratio);
    }
  });

  if (object.material?.opacity !== undefined) {
    object.material.transparent = true;
    object.material.opacity = Math.max(0, ratio);
  }
}

function disposeEffect(effect) {
  effect.traverse?.((child) => {
    if (!child.isMesh) return;

    child.geometry?.dispose?.();

    if (Array.isArray(child.material)) {
      child.material.forEach((mat) => mat.dispose?.());
    } else {
      child.material?.dispose?.();
    }
  });
}