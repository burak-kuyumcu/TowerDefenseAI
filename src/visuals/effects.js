import * as THREE from "three";
import { createGameMaterial } from "./materials.js";

const effects = [];

export function clearEffects(scene) {
  for (let i = effects.length - 1; i >= 0; i--) {
    removeEffect(scene, effects[i]);
    effects.splice(i, 1);
  }
}

function removeEffect(scene, effect) {
  if (!effect) return;

  const parent = effect.parent ?? scene;
  parent?.remove?.(effect);

  if (scene && effect.parent) {
    scene.remove(effect);
  }

  disposeEffect(effect);
}

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

export function spawnEnemyHitFlash(scene, enemy, color = 0xfacc15) {
  if (!enemy) return;

  const isBoss = enemy.userData.type?.startsWith("boss");
  const radius = isBoss ? 0.95 : 0.52;

  const flash = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.62, radius, 72),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  flash.rotation.x = -Math.PI / 2;
  flash.position.set(enemy.position.x, 0.16, enemy.position.z);

  flash.userData = {
    life: isBoss ? 18 : 13,
    maxLife: isBoss ? 18 : 13,
    type: "enemyHitFlash",
    targetRadius: isBoss ? 1.45 : 0.85
  };

  scene.add(flash);
  effects.push(flash);
}

export function spawnCritBurst(scene, position, color = 0xfb923c) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.52, 96),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(position.x, 0.18, position.z);

  ring.userData = {
    life: 26,
    maxLife: 26,
    targetRadius: 1.35,
    type: "critBurst"
  };

  scene.add(ring);
  effects.push(ring);

  for (let i = 0; i < 8; i++) {
    const shard = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.32, 6),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? color : 0xfacc15,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      })
    );

    const angle = (Math.PI * 2 * i) / 8;

    shard.position.set(
      position.x + Math.cos(angle) * 0.18,
      position.y + 0.48,
      position.z + Math.sin(angle) * 0.18
    );

    shard.rotation.x = Math.random() * Math.PI;
    shard.rotation.z = Math.random() * Math.PI;

    shard.userData = {
      life: 26,
      maxLife: 26,
      velocity: new THREE.Vector3(
        Math.cos(angle) * 0.055,
        0.035 + Math.random() * 0.045,
        Math.sin(angle) * 0.055
      ),
      type: "critShard"
    };

    scene.add(shard);
    effects.push(shard);
  }
}

export function spawnProjectileTrailEffect(
  scene,
  position,
  color = 0xfacc15,
  size = 0.065
) {
  const trail = new THREE.Mesh(
    new THREE.SphereGeometry(size, 8, 8),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    })
  );

  trail.position.copy(position);

  trail.userData = {
    life: 14,
    maxLife: 14,
    type: "projectileTrail"
  };

  scene.add(trail);
  effects.push(trail);
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
  for (let i = 0; i < 14; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(i % 3 === 0 ? 0.105 : 0.075, 8, 8),
      createGameMaterial(i % 2 === 0 ? 0xfacc15 : 0xfb923c)
    );

    particle.position.copy(position);

    particle.userData = {
      life: 34,
      maxLife: 34,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.16,
        Math.random() * 0.15,
        (Math.random() - 0.5) * 0.16
      ),
      type: "explosion"
    };

    scene.add(particle);
    effects.push(particle);
  }

  spawnShockwave(scene, position, 1.8, 0xfacc15, 36);
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

export function spawnPortalSpawnEffect(scene, position, color = 0xfb923c) {
  const group = new THREE.Group();

  const shockRing = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.52, 72),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  shockRing.rotation.x = -Math.PI / 2;
  shockRing.position.y = 0.08;

  const verticalRing = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.48, 72),
    new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  verticalRing.position.y = 0.8;
  verticalRing.rotation.y = Math.PI / 2;

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    })
  );

  core.position.y = 0.72;

  group.position.set(position.x, 0, position.z);
  group.add(shockRing, verticalRing, core);

  group.userData = {
    life: 34,
    maxLife: 34,
    type: "portalSpawn"
  };

  scene.add(group);
  effects.push(group);

  for (let i = 0; i < 10; i++) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? color : 0xfacc15,
        transparent: true,
        opacity: 0.85
      })
    );

    spark.position.set(position.x, 0.5, position.z);

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.025 + Math.random() * 0.045;

    spark.userData = {
      life: 24,
      maxLife: 24,
      velocity: new THREE.Vector3(
        Math.cos(angle) * speed,
        0.035 + Math.random() * 0.045,
        Math.sin(angle) * speed
      ),
      type: "portalSpark"
    };

    scene.add(spark);
    effects.push(spark);
  }
}

export function spawnTowerTranslateEffect(scene, from, to, color = 0x60a5fa) {
  const start = new THREE.Vector3(from.x, 0.18, from.z);
  const end = new THREE.Vector3(to.x, 0.18, to.z);

  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);

  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.85
  });

  const line = new THREE.Line(geometry, material);

  line.userData = {
    life: 34,
    maxLife: 34,
    type: "translateLine"
  };

  scene.add(line);
  effects.push(line);

  const distance = Math.max(1, Math.hypot(to.x - from.x, to.z - from.z));
  const sparkCount = Math.max(4, Math.floor(distance * 5));

  for (let i = 0; i <= sparkCount; i++) {
    const t = i / sparkCount;

    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.75,
        depthWrite: false
      })
    );

    spark.position.set(
      THREE.MathUtils.lerp(from.x, to.x, t),
      0.18 + Math.sin(t * Math.PI) * 0.12,
      THREE.MathUtils.lerp(from.z, to.z, t)
    );

    spark.userData = {
      life: 24 + Math.floor(Math.random() * 8),
      maxLife: 32,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.018,
        0.012 + Math.random() * 0.012,
        (Math.random() - 0.5) * 0.018
      ),
      type: "translateSpark"
    };

    scene.add(spark);
    effects.push(spark);
  }
}

export function spawnRelocationPulse(scene, position, color = 0x60a5fa) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.36, 0.62, 72),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(position.x, 0.12, position.z);

  ring.userData = {
    life: 26,
    maxLife: 26,
    targetRadius: 1.05,
    type: "relocationPulse"
  };

  scene.add(ring);
  effects.push(ring);
}

export function spawnRelocationBlockedEffect(scene, position) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.58, 48),
    new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(position.x, 0.13, position.z);

  ring.userData = {
    life: 22,
    maxLife: 22,
    targetRadius: 0.9,
    type: "relocationBlocked"
  };

  scene.add(ring);
  effects.push(ring);
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
  for (let i = effects.length - 1; i >= 0; i--) {
    const effect = effects[i];

    if (
      !effect ||
      (!effect.parent &&
        effect.userData.type !== "eliteAura" &&
        effect.userData.type !== "bossAura")
    ) {
      removeEffect(scene, effect);
      effects.splice(i, 1);
    }
  }

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
      effect.userData.type === "freezeBurst" ||
      effect.userData.type === "critBurst" ||
      effect.userData.type === "enemyHitFlash" ||
      effect.userData.type === "relocationPulse" ||
      effect.userData.type === "relocationBlocked"
    ) {
      const progress = 1 - ratio;
      const scale = Math.max(
        0.15,
        progress * (effect.userData.targetRadius ?? 1.4)
      );

      effect.scale.set(scale, scale, scale);

      effect.rotation.z +=
        effect.userData.type === "enemyHitFlash"
          ? -0.04
          : effect.userData.type === "relocationBlocked"
            ? -0.08
            : 0.035;
    } else if (effect.userData.type === "portalSpawn") {
      const progress = 1 - ratio;
      const pulse = 1 + progress * 1.6;

      effect.scale.set(pulse, pulse, pulse);
      effect.rotation.y += 0.08;

      effect.children.forEach((child, index) => {
        child.rotation.z += index % 2 === 0 ? 0.08 : -0.06;
      });
    } else if (effect.userData.type === "muzzleFlash") {
      const pulse = 1 + (1 - ratio) * 1.4;
      effect.scale.set(pulse, pulse, pulse);
      effect.rotation.y += 0.22;
    } else if (effect.userData.type === "footstepDust") {
      const spread = 1 + (1 - ratio) * 1.8;
      effect.scale.set(spread, 0.25, spread);
    } else if (effect.userData.type === "projectileTrail") {
      const scale = Math.max(0.08, ratio);
      effect.scale.set(scale, scale, scale);
    } else if (effect.userData.type === "translateSpark") {
      const scale = Math.max(0.12, ratio);
      effect.scale.set(scale, scale, scale);
    } else if (effect.userData.type === "translateLine") {
      if (effect.material?.opacity !== undefined) {
        effect.material.opacity = Math.max(0, ratio * 0.85);
      }
    } else {
      effect.scale.setScalar(Math.max(0.1, ratio));
    }

    applyOpacity(effect, ratio);
  }

  for (let i = effects.length - 1; i >= 0; i--) {
    if (effects[i].userData.life <= 0) {
      removeEffect(scene, effects[i]);
      effects.splice(i, 1);
    }
  }
}

function updateAttachedAura(effect, rotationSpeed, basePulse, pulseAmount) {
  const enemy = effect.userData.enemy;

  if (!enemy || enemy.userData.dead || !enemy.parent) {
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
    child.geometry?.dispose?.();

    if (Array.isArray(child.material)) {
      child.material.forEach(disposeMaterial);
    } else {
      disposeMaterial(child.material);
    }
  });

  effect.geometry?.dispose?.();

  if (Array.isArray(effect.material)) {
    effect.material.forEach(disposeMaterial);
  } else {
    disposeMaterial(effect.material);
  }
}

function disposeMaterial(material) {
  if (!material) return;

  material.map?.dispose?.();
  material.dispose?.();
}