import * as THREE from "three";
import { state } from "../game/state.js";
import { addEventLog } from "../ui/eventLog.js";
import { createHealthBar } from "../visuals/healthBars.js";
import { updateTowerLabelText } from "../visuals/towerLabels.js";
import { createGameMaterial } from "../visuals/materials.js";
import { spawnPortalSpawnEffect, spawnProjectileTrailEffect } from "../visuals/effects.js";
import { addCameraShake } from "../systems/cameraShake.js";

const pulseEffects = [];
const auraEffects = [];

const TARGET_MODES = ["nearest", "first", "strongest", "weakest"];

export function updateBossAbilities(scene) {
  for (const enemy of state.enemies) {
    if (enemy.userData.dead) continue;
    if (!enemy.userData.type?.startsWith("boss")) continue;

    if (enemy.userData.type === "boss_purple") updatePurpleBoss(scene, enemy);
    if (enemy.userData.type === "boss_crusher") updateCrusherBoss(scene, enemy);
    if (enemy.userData.type === "boss_runner") updateRunnerBoss(scene, enemy);
    if (enemy.userData.type === "boss_shield") updateShieldBoss(scene, enemy);

    if (enemy.userData.type === "boss_disruptor") {
      updateDisruptorBoss(scene, enemy);
    }
  }

  updatePulseEffects(scene);
  updateAuraEffects(scene);
}

function updatePurpleBoss(scene, boss) {
  boss.userData.pulseCooldown--;

  if (boss.userData.pulseCooldown <= 0) {
    triggerPurplePulse(scene, boss);
    boss.userData.pulseCooldown = boss.userData.pulseInterval || 180;
  }
}

function triggerPurplePulse(scene, boss) {
  const radius = 3.2;

  spawnPulseEffect(scene, boss.position, radius, 0xa855f7);
  addCameraShake(0.06, 12);
  addEventLog("Purple Boss pulse slowed nearby towers.");

  for (const tower of state.towers) {
    const distance = tower.position.distanceTo(boss.position);

    if (distance <= radius) {
      tower.userData.slowTimer = 180;
      tower.userData.slowMultiplier = 1.8;
    }
  }
}

function updateCrusherBoss(scene, boss) {
  boss.userData.armor = 0.5;

  if (!boss.userData.auraEffect) {
    boss.userData.auraEffect = spawnAuraEffect(scene, boss, 0x7f1d1d, {
      radius: 1.45,
      opacity: 0.32,
      speed: 0.018
    });
  }

  boss.userData.crusherStepTimer = (boss.userData.crusherStepTimer ?? 0) + 1;

  if (boss.userData.crusherStepTimer >= 90) {
    boss.userData.crusherStepTimer = 0;
    spawnGroundCrackPulse(scene, boss.position, 0xef4444);
    addCameraShake(0.045, 8);
  }
}

function updateRunnerBoss(scene, boss) {
  boss.userData.speedBoostTimer++;

  const isBoosting = boss.userData.speedBoostTimer % 220 < 70;
  boss.userData.speedMultiplier = isBoosting ? 2 : 1;

  if (isBoosting && !boss.userData.auraEffect) {
    boss.userData.auraEffect = spawnAuraEffect(scene, boss, 0xfb923c, {
      radius: 1.38,
      opacity: 0.38,
      speed: 0.05
    });

    addEventLog("Runner Boss activated speed burst.");
  }

  if (isBoosting) {
    maybeSpawnRunnerBoostTrail(scene, boss);
  }

  if (!isBoosting && boss.userData.auraEffect) {
    boss.userData.auraEffect.userData.life = 0;
    boss.userData.auraEffect = null;
  }
}

function updateShieldBoss(scene, boss) {
  boss.userData.armor = 0.25;

  if (!boss.userData.auraEffect) {
    boss.userData.auraEffect = spawnAuraEffect(scene, boss, 0x22c55e, {
      radius: 1.55,
      opacity: 0.34,
      speed: 0.026
    });
  }

  clearShieldArmor();

  for (const enemy of state.enemies) {
    if (enemy === boss || enemy.userData.dead) continue;
    if (enemy.userData.type?.startsWith("boss")) continue;

    const distance = enemy.position.distanceTo(boss.position);

    if (distance <= 3.5) {
      enemy.userData.armor = Math.max(enemy.userData.armor ?? 0, 0.35);
      enemy.userData.shieldArmor = true;
      enemy.userData.shieldedByBoss = true;
    }
  }

  boss.userData.shieldPulseTimer = (boss.userData.shieldPulseTimer ?? 0) + 1;

  if (boss.userData.shieldPulseTimer >= 120) {
    boss.userData.shieldPulseTimer = 0;
    spawnPulseEffect(scene, boss.position, 3.5, 0x86efac);
    addEventLog("Shield Boss reinforced nearby enemies.");
  }
}

function clearShieldArmor() {
  for (const enemy of state.enemies) {
    if (enemy.userData.type?.startsWith("boss")) continue;

    if (enemy.userData.shieldArmor) {
      enemy.userData.armor = 0;
      enemy.userData.shieldArmor = false;
      enemy.userData.shieldedByBoss = false;
    }
  }
}

function updateDisruptorBoss(scene, boss) {
  boss.userData.disruptTimer = (boss.userData.disruptTimer ?? 150) - 1;

  if (boss.userData.disruptTimer > 0) {
    maybeSpawnDisruptorSpark(scene, boss);
    return;
  }

  boss.userData.disruptTimer = 220;

  spawnPulseEffect(scene, boss.position, 4, 0x06b6d4);
  spawnDataGlitchPulse(scene, boss.position);
  addCameraShake(0.07, 12);

  addEventLog("Disruptor Boss scrambled tower targeting.");

  for (const tower of state.towers) {
    const distance = tower.position.distanceTo(boss.position);
    if (distance > 4) continue;

    const randomMode =
      TARGET_MODES[Math.floor(Math.random() * TARGET_MODES.length)];

    tower.userData.targetMode = randomMode;
    updateTowerLabelText(tower);
  }
}

export function spawnSplitterChildren(scene, boss) {
  if (!boss || boss.userData.type !== "boss_splitter") return;

  const childCount = 4;

  for (let i = 0; i < childCount; i++) {
    const child = createSplitterChildModel(i);

    const angle = (Math.PI * 2 * i) / childCount + Math.random() * 0.32;
    const distance = 0.52 + Math.random() * 0.34;

    child.position.set(
      boss.position.x + Math.cos(angle) * distance,
      0.08,
      boss.position.z + Math.sin(angle) * distance
    );

    child.rotation.y = angle;

    const speed = 0.045 + state.wave * 0.002;
    const health = 8 + state.wave;

    child.userData = {
      ...child.userData,

      type: "fast",
      index: boss.userData.index,
      speed,
      baseSpeed: speed,
      speedMultiplier: 1,

      health,
      maxHealth: health,

      score: 15,
      gold: 7,
      baseDamage: 1,

      reachedGoal: false,
      dead: false,
      selectable: true,
      baseColor: 0xeab308,

      modelScale: 0.85,
      healthBarOffset: 0.75,

      slowTimer: 0,
      slowMultiplier: 1,
      freezeFlashTimer: 0,

      armor: 0,
      shieldArmor: false,

      auraEffect: null,
      bossAuraEffect: null,

      walkPhase: Math.random() * Math.PI * 2,
      stepTimer: Math.floor(Math.random() * 12),
      trailTimer: Math.floor(Math.random() * 8),
      specialAnimTimer: Math.floor(Math.random() * 40),

      previousX: child.position.x,
      previousZ: child.position.z
    };

    scene.add(child);

    spawnPortalSpawnEffect(scene, child.position, 0xeab308);
    spawnFragmentBirthEffect(scene, child.position, i);

    const healthBar = createHealthBar(child);
    scene.add(healthBar);

    state.enemies.push(child);
  }

  spawnPulseEffect(scene, boss.position, 2.4, 0xeab308);
  addCameraShake(0.08, 14);
  addEventLog("Splitter Boss released animated fragments.");
}

function createSplitterChildModel(index) {
  const group = new THREE.Group();

  const bodyColor = index % 2 === 0 ? 0xeab308 : 0xfacc15;
  const coreColor = index % 2 === 0 ? 0xfef08a : 0xfde047;

  const body = childMesh(
    new THREE.SphereGeometry(0.28, 14, 14),
    bodyColor,
    true
  );
  body.position.y = 0.42;
  body.scale.set(1.1, 0.9, 1.25);

  const facePlate = childMesh(
    new THREE.BoxGeometry(0.22, 0.14, 0.08),
    0x713f12
  );
  facePlate.position.set(0, 0.42, 0.28);

  const core = childMesh(
    new THREE.OctahedronGeometry(0.13),
    coreColor,
    true
  );
  core.position.set(0, 0.5, 0.34);

  const shellLeft = childMesh(
    new THREE.BoxGeometry(0.1, 0.24, 0.28),
    0xfef08a,
    true
  );
  shellLeft.position.set(-0.26, 0.43, -0.02);
  shellLeft.rotation.z = 0.18;

  const shellRight = childMesh(
    new THREE.BoxGeometry(0.1, 0.24, 0.28),
    0xfef08a,
    true
  );
  shellRight.position.set(0.26, 0.43, -0.02);
  shellRight.rotation.z = -0.18;

  const backPod = childMesh(
    new THREE.SphereGeometry(0.13, 10, 10),
    0xfef3c7,
    true
  );
  backPod.position.set(0, 0.48, -0.28);

  const tailSpike = childMesh(
    new THREE.ConeGeometry(0.06, 0.28, 6),
    0xfef08a,
    true
  );
  tailSpike.position.set(0, 0.43, -0.43);
  tailSpike.rotation.x = -Math.PI / 2;

  const hornLeft = childMesh(
    new THREE.ConeGeometry(0.045, 0.18, 6),
    0xfef3c7,
    true
  );
  hornLeft.position.set(-0.16, 0.68, 0.08);
  hornLeft.rotation.z = Math.PI;

  const hornRight = childMesh(
    new THREE.ConeGeometry(0.045, 0.18, 6),
    0xfef3c7,
    true
  );
  hornRight.position.set(0.16, 0.68, 0.08);
  hornRight.rotation.z = Math.PI;

  const footLeft = childMesh(
    new THREE.BoxGeometry(0.13, 0.06, 0.22),
    0x713f12
  );
  footLeft.position.set(-0.14, 0.05, 0.08);

  const footRight = childMesh(
    new THREE.BoxGeometry(0.13, 0.06, 0.22),
    0x713f12
  );
  footRight.position.set(0.14, 0.05, 0.08);

  const armLeft = childMesh(
    new THREE.BoxGeometry(0.06, 0.18, 0.08),
    0x92400e
  );
  armLeft.position.set(-0.31, 0.32, 0.08);
  armLeft.rotation.z = 0.35;

  const armRight = childMesh(
    new THREE.BoxGeometry(0.06, 0.18, 0.08),
    0x92400e
  );
  armRight.position.set(0.31, 0.32, 0.08);
  armRight.rotation.z = -0.35;

  group.add(
    body,
    facePlate,
    core,
    shellLeft,
    shellRight,
    backPod,
    tailSpike,
    hornLeft,
    hornRight,
    footLeft,
    footRight,
    armLeft,
    armRight
  );

  group.scale.setScalar(0.85);

  group.userData.body = body;
  group.userData.core = core;
  group.userData.head = facePlate;
  group.userData.extraSpin = backPod;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;
  group.userData.leftArm = armLeft;
  group.userData.rightArm = armRight;
  group.userData.floatingParts = [backPod, tailSpike];

  markAllBaseTransforms(group);

  return group;
}

function childMesh(geometry, color, emissive = false) {
  const material = createGameMaterial(color, "enemy");

  if (material.emissive?.set) {
    material.emissive.set(emissive ? color : 0x000000);
  }

  if (typeof material.emissiveIntensity === "number") {
    material.emissiveIntensity = emissive ? 0.45 : 0;
  }

  const object = new THREE.Mesh(geometry, material);

  object.castShadow = true;
  object.receiveShadow = true;

  object.userData.baseColor = color;
  object.userData.shaderRole = "enemy";

  return object;
}

function spawnPulseEffect(scene, position, radius, color) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1, 96),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(position.x, 0.09, position.z);
  ring.scale.set(0.2, 0.2, 0.2);

  ring.userData = {
    life: 45,
    maxLife: 45,
    targetRadius: radius
  };

  scene.add(ring);
  pulseEffects.push(ring);
}

function spawnGroundCrackPulse(scene, position, color = 0xef4444) {
  const group = new THREE.Group();

  for (let i = 0; i < 8; i++) {
    const crack = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.018, 0.5 + Math.random() * 0.3),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.75,
        depthWrite: false
      })
    );

    const angle = (Math.PI * 2 * i) / 8;

    crack.position.set(
      Math.cos(angle) * 0.42,
      0.03,
      Math.sin(angle) * 0.42
    );

    crack.rotation.y = angle;
    group.add(crack);
  }

  group.position.set(position.x, 0.04, position.z);

  group.userData = {
    life: 24,
    maxLife: 24,
    type: "groundCrack"
  };

  scene.add(group);
  pulseEffects.push(group);
}

function spawnDataGlitchPulse(scene, position) {
  for (let i = 0; i < 10; i++) {
    const shard = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.18),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x67e8f9 : 0x22d3ee,
        transparent: true,
        opacity: 0.78,
        depthWrite: false
      })
    );

    const angle = Math.random() * Math.PI * 2;
    const radius = 0.4 + Math.random() * 0.9;

    shard.position.set(
      position.x + Math.cos(angle) * radius,
      0.35 + Math.random() * 0.8,
      position.z + Math.sin(angle) * radius
    );

    shard.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    shard.userData = {
      life: 30,
      maxLife: 30,
      velocity: new THREE.Vector3(
        Math.cos(angle) * 0.025,
        0.015 + Math.random() * 0.025,
        Math.sin(angle) * 0.025
      )
    };

    scene.add(shard);
    pulseEffects.push(shard);
  }
}

function spawnFragmentBirthEffect(scene, position, index) {
  const color = index % 2 === 0 ? 0xfacc15 : 0xeab308;

  for (let i = 0; i < 5; i++) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
      })
    );

    const angle = Math.random() * Math.PI * 2;

    spark.position.set(
      position.x,
      position.y + 0.35,
      position.z
    );

    spark.userData = {
      life: 18,
      maxLife: 18,
      velocity: new THREE.Vector3(
        Math.cos(angle) * 0.045,
        0.035 + Math.random() * 0.035,
        Math.sin(angle) * 0.045
      )
    };

    scene.add(spark);
    pulseEffects.push(spark);
  }
}

function spawnAuraEffect(scene, boss, color, options = {}) {
  const radius = options.radius ?? 1.5;
  const opacity = options.opacity ?? 0.35;
  const speed = options.speed ?? 0.025;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.78, radius, 72),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(boss.position.x, 0.1, boss.position.z);
  ring.scale.set(1, 1, 1);

  ring.userData = {
    boss,
    life: Infinity,
    maxLife: Infinity,
    speed,
    radius
  };

  scene.add(ring);
  auraEffects.push(ring);

  return ring;
}

function maybeSpawnRunnerBoostTrail(scene, boss) {
  boss.userData.runnerTrailTimer = (boss.userData.runnerTrailTimer ?? 0) + 1;

  if (boss.userData.runnerTrailTimer < 4) return;

  boss.userData.runnerTrailTimer = 0;

  const backward = new THREE.Vector3(0, 0, -1)
    .applyEuler(boss.rotation)
    .normalize();

  const pos = new THREE.Vector3(
    boss.position.x + backward.x * 0.65,
    boss.position.y + 0.7,
    boss.position.z + backward.z * 0.65
  );

  spawnProjectileTrailEffect(scene, pos, 0xfb923c, 0.12);
}

function maybeSpawnDisruptorSpark(scene, boss) {
  boss.userData.disruptSparkTimer = (boss.userData.disruptSparkTimer ?? 0) + 1;

  if (boss.userData.disruptSparkTimer < 18) return;

  boss.userData.disruptSparkTimer = 0;

  const angle = Math.random() * Math.PI * 2;
  const radius = 0.55 + Math.random() * 0.25;

  const spark = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, 0.14),
    new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0x67e8f9 : 0x22d3ee,
      transparent: true,
      opacity: 0.72,
      depthWrite: false
    })
  );

  spark.position.set(
    boss.position.x + Math.cos(angle) * radius,
    boss.position.y + 0.8 + Math.random() * 0.7,
    boss.position.z + Math.sin(angle) * radius
  );

  spark.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );

  spark.userData = {
    life: 20,
    maxLife: 20,
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 0.018,
      0.012,
      (Math.random() - 0.5) * 0.018
    )
  };

  scene.add(spark);
  pulseEffects.push(spark);
}

function updatePulseEffects(scene) {
  for (const effect of pulseEffects) {
    effect.userData.life--;

    if (effect.userData.velocity) {
      effect.position.add(effect.userData.velocity);
      effect.userData.velocity.y -= 0.002;
    }

    const ratio = effect.userData.life / effect.userData.maxLife;

    if (effect.userData.targetRadius) {
      const progress = 1 - ratio;
      const scale = Math.max(0.2, progress * effect.userData.targetRadius);

      effect.scale.set(scale, scale, scale);
      effect.rotation.z += 0.035;
    } else {
      const scale = Math.max(0.08, ratio);
      effect.scale.set(scale, scale, scale);
    }

    applyOpacity(effect, ratio);
  }

  for (let i = pulseEffects.length - 1; i >= 0; i--) {
    if (pulseEffects[i].userData.life <= 0) {
      scene.remove(pulseEffects[i]);
      disposeEffect(pulseEffects[i]);
      pulseEffects.splice(i, 1);
    }
  }
}

function updateAuraEffects(scene) {
  for (const aura of auraEffects) {
    const boss = aura.userData.boss;

    if (!boss || boss.userData.dead || aura.userData.life <= 0) {
      aura.userData.life = 0;
      continue;
    }

    aura.position.set(boss.position.x, 0.1, boss.position.z);
    aura.rotation.z += aura.userData.speed ?? 0.025;

    const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.08;
    aura.scale.set(pulse, pulse, pulse);
  }

  for (let i = auraEffects.length - 1; i >= 0; i--) {
    if (auraEffects[i].userData.life <= 0) {
      scene.remove(auraEffects[i]);
      disposeEffect(auraEffects[i]);
      auraEffects.splice(i, 1);
    }
  }
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

function markBaseTransform(object) {
  object.userData.baseX = object.position.x;
  object.userData.baseY = object.position.y;
  object.userData.baseZ = object.position.z;
  object.userData.baseRotX = object.rotation.x;
  object.userData.baseRotY = object.rotation.y;
  object.userData.baseRotZ = object.rotation.z;
}

function markAllBaseTransforms(group) {
  group.traverse((child) => {
    markBaseTransform(child);
  });
}