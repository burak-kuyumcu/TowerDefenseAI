import * as THREE from "three";
import { state } from "../game/state.js";

const GROUP_NAME = "EnemyBurstFx";
const MAX_BURSTS = 80;
const SPARKS_PER_BURST = 14;

let sceneRef = null;
let groupRef = null;

let trackedEnemies = new Map();
let bursts = [];
let time = 0;

const COLORS = {
  normal: 0x38bdf8,
  fast: 0x22c55e,
  tank: 0xfacc15,
  boss: 0xfb7185,
  gold: 0xfacc15
};

export function initEnemyBurstFx(scene) {
  sceneRef = scene;

  clearEnemyBurstFx();

  groupRef = new THREE.Group();
  groupRef.name = GROUP_NAME;

  scene.add(groupRef);
}

export function updateEnemyBurstFx() {
  if (!groupRef) return;

  time += 0.04;

  detectRemovedEnemies();
  updateBursts();
}

export function resetEnemyBurstFx() {
  trackedEnemies.clear();

  for (const burst of bursts) {
    disposeObject(burst.group);
  }

  bursts = [];

  if (groupRef) {
    groupRef.clear();
  }

  time = 0;
}

export function clearEnemyBurstFx() {
  if (groupRef && sceneRef) {
    sceneRef.remove(groupRef);
  }

  if (groupRef) {
    groupRef.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        if (Array.isArray(child.material)) {
          for (const material of child.material) {
            material.dispose();
          }
        } else {
          child.material.dispose();
        }
      }
    });

    groupRef.clear();
  }

  groupRef = null;
  trackedEnemies.clear();
  bursts = [];
}

function detectRemovedEnemies() {
  const currentEnemies = new Set();

  for (const enemy of state.enemies) {
    if (!enemy) continue;

    currentEnemies.add(enemy);

    trackedEnemies.set(enemy, {
      position: enemy.position
        ? enemy.position.clone()
        : new THREE.Vector3(0, 0, 0),
      type: getEnemyType(enemy),
      hpRatio: getHpRatio(enemy),
      isBoss: isBossEnemy(enemy),
      wasDead: Boolean(enemy.userData?.dead)
    });
  }

  for (const [enemy, snapshot] of trackedEnemies.entries()) {
    if (currentEnemies.has(enemy)) continue;

    const shouldBurst =
      snapshot.wasDead ||
      snapshot.hpRatio <= 0.15 ||
      !enemy.userData?.reachedGoal;

    if (shouldBurst) {
      spawnBurst(snapshot);
    }

    trackedEnemies.delete(enemy);
  }
}

function spawnBurst(snapshot) {
  if (!groupRef) return;

  if (bursts.length >= MAX_BURSTS) {
    const oldBurst = bursts.shift();
    groupRef.remove(oldBurst.group);
    disposeObject(oldBurst.group);
  }

  const profile = getBurstProfile(snapshot);
  const burstGroup = new THREE.Group();

  burstGroup.position.copy(snapshot.position);
  burstGroup.position.y = 0.08;

  const shockRing = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.24, 48),
    createAdditiveMaterial(profile.color, 0.78)
  );
  shockRing.rotation.x = -Math.PI / 2;
  shockRing.position.y = 0.02;

  const goldRing = new THREE.Mesh(
    new THREE.RingGeometry(0.08, 0.12, 36),
    createAdditiveMaterial(COLORS.gold, snapshot.isBoss ? 0.82 : 0.45)
  );
  goldRing.rotation.x = -Math.PI / 2;
  goldRing.position.y = 0.035;

  const coreFlash = new THREE.Mesh(
    new THREE.SphereGeometry(profile.coreSize, 18, 18),
    createAdditiveMaterial(profile.color, 0.82)
  );
  coreFlash.position.y = profile.coreHeight;

  burstGroup.add(shockRing);
  burstGroup.add(goldRing);
  burstGroup.add(coreFlash);

  const sparks = createSparks(profile, snapshot.isBoss);
  for (const spark of sparks) {
    burstGroup.add(spark);
  }

  groupRef.add(burstGroup);

  bursts.push({
    group: burstGroup,
    shockRing,
    goldRing,
    coreFlash,
    sparks,
    life: 1,
    age: 0,
    profile
  });
}

function createSparks(profile, isBoss) {
  const sparks = [];
  const count = isBoss ? SPARKS_PER_BURST + 10 : SPARKS_PER_BURST;

  for (let i = 0; i < count; i++) {
    const material = createAdditiveMaterial(
      i % 4 === 0 ? COLORS.gold : profile.color,
      0.72
    );

    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(isBoss ? 0.045 : 0.032, 8, 8),
      material
    );

    const angle = Math.random() * Math.PI * 2;
    const speed = randomRange(profile.sparkSpeedMin, profile.sparkSpeedMax);

    spark.position.set(0, randomRange(0.12, 0.45), 0);

    spark.userData.velocity = new THREE.Vector3(
      Math.cos(angle) * speed,
      randomRange(0.025, 0.07) * (isBoss ? 1.25 : 1),
      Math.sin(angle) * speed
    );

    spark.userData.spin = randomRange(-0.05, 0.05);
    spark.userData.phase = Math.random() * Math.PI * 2;

    sparks.push(spark);
  }

  return sparks;
}

function updateBursts() {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const burst = bursts[i];

    burst.age += 1;
    burst.life -= burst.profile.decay;

    const progress = 1 - burst.life;
    const easeOut = 1 - Math.pow(1 - progress, 2);

    updateShockRing(burst, easeOut);
    updateGoldRing(burst, easeOut);
    updateCoreFlash(burst);
    updateSparks(burst);

    if (burst.life <= 0) {
      groupRef.remove(burst.group);
      disposeObject(burst.group);
      bursts.splice(i, 1);
    }
  }
}

function updateShockRing(burst, progress) {
  const scale = 1 + progress * burst.profile.ringScale;

  burst.shockRing.scale.setScalar(scale);
  burst.shockRing.rotation.z += 0.025;
  burst.shockRing.material.opacity = clamp(burst.life * 0.78, 0, 0.78);
}

function updateGoldRing(burst, progress) {
  const scale = 0.8 + progress * (burst.profile.ringScale * 0.75);

  burst.goldRing.scale.setScalar(scale);
  burst.goldRing.rotation.z -= 0.035;
  burst.goldRing.material.opacity = clamp(burst.life * 0.52, 0, 0.72);
}

function updateCoreFlash(burst) {
  const pulse = 0.75 + Math.sin(time * 5.0 + burst.age * 0.08) * 0.12;

  burst.coreFlash.scale.setScalar(clamp(burst.life * pulse, 0.05, 1.2));
  burst.coreFlash.material.opacity = clamp(burst.life * 0.85, 0, 0.85);
}

function updateSparks(burst) {
  for (const spark of burst.sparks) {
    const velocity = spark.userData.velocity;

    spark.position.x += velocity.x;
    spark.position.y += velocity.y;
    spark.position.z += velocity.z;

    velocity.y -= 0.0028;

    spark.rotation.y += spark.userData.spin;
    spark.rotation.x += spark.userData.spin * 0.6;

    const scale = clamp(burst.life * 1.1, 0.05, 1);
    spark.scale.setScalar(scale);

    if (spark.material) {
      spark.material.opacity = clamp(burst.life * 0.72, 0, 0.72);
    }
  }
}

function getBurstProfile(snapshot) {
  if (snapshot.isBoss) {
    return {
      color: COLORS.boss,
      coreSize: 0.22,
      coreHeight: 0.56,
      ringScale: 3.4,
      sparkSpeedMin: 0.035,
      sparkSpeedMax: 0.085,
      decay: 0.018
    };
  }

  if (snapshot.type === "tank") {
    return {
      color: COLORS.tank,
      coreSize: 0.15,
      coreHeight: 0.42,
      ringScale: 2.4,
      sparkSpeedMin: 0.025,
      sparkSpeedMax: 0.055,
      decay: 0.025
    };
  }

  if (snapshot.type === "fast") {
    return {
      color: COLORS.fast,
      coreSize: 0.12,
      coreHeight: 0.36,
      ringScale: 2.0,
      sparkSpeedMin: 0.032,
      sparkSpeedMax: 0.07,
      decay: 0.032
    };
  }

  return {
    color: COLORS.normal,
    coreSize: 0.13,
    coreHeight: 0.38,
    ringScale: 2.1,
    sparkSpeedMin: 0.024,
    sparkSpeedMax: 0.058,
    decay: 0.028
  };
}

function getEnemyType(enemy) {
  const text = String(
    enemy?.userData?.type ||
      enemy?.userData?.enemyType ||
      enemy?.userData?.kind ||
      enemy?.name ||
      ""
  ).toLowerCase();

  const maxHp = Number(enemy?.userData?.maxHp || enemy?.userData?.maxHealth || 0);
  const speed = Number(enemy?.userData?.speed || 0);

  if (text.includes("boss") || enemy?.userData?.isBoss || enemy?.userData?.boss) {
    return "boss";
  }

  if (
    text.includes("tank") ||
    text.includes("heavy") ||
    text.includes("armor") ||
    maxHp >= 120
  ) {
    return "tank";
  }

  if (
    text.includes("fast") ||
    text.includes("runner") ||
    text.includes("speed") ||
    speed > 0.045
  ) {
    return "fast";
  }

  return "normal";
}

function isBossEnemy(enemy) {
  return getEnemyType(enemy) === "boss";
}

function getHpRatio(enemy) {
  const data = enemy?.userData || {};

  const hp = Number(
    data.hp ??
      data.health ??
      data.currentHp ??
      data.currentHealth ??
      data.life ??
      1
  );

  const maxHp = Number(
    data.maxHp ??
      data.maxHealth ??
      data.totalHp ??
      data.totalHealth ??
      data.maxLife ??
      hp ??
      1
  );

  if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0) {
    return 1;
  }

  return clamp(hp / maxHp, 0, 1);
}

function createAdditiveMaterial(color, opacity) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
}

function disposeObject(object) {
  if (!object) return;

  object.traverse?.((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      if (Array.isArray(child.material)) {
        for (const material of child.material) {
          material.dispose();
        }
      } else {
        child.material.dispose();
      }
    }
  });
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}