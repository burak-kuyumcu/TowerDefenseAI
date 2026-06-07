import * as THREE from "three";
import { state } from "../game/state.js";

const GROUP_NAME = "ProjectileImpactFx";
const MAX_IMPACTS = 120;
const SPARK_COUNT = 8;

let sceneRef = null;
let groupRef = null;

let trackedProjectiles = new Map();
let impacts = [];
let time = 0;

const COLORS = {
  normal: 0x38bdf8,
  rapid: 0x22c55e,
  sniper: 0xfacc15,
  slow: 0x60a5fa,
  splash: 0xfb923c,
  poison: 0x84cc16,
  unknown: 0xe0f2fe
};

export function initProjectileImpactFx(scene) {
  sceneRef = scene;

  clearProjectileImpactFx();

  groupRef = new THREE.Group();
  groupRef.name = GROUP_NAME;

  scene.add(groupRef);
}

export function updateProjectileImpactFx() {
  if (!groupRef) return;

  time += 0.04;

  detectProjectileImpacts();
  updateImpacts();
}

export function resetProjectileImpactFx() {
  trackedProjectiles.clear();

  for (const impact of impacts) {
    disposeObject(impact.group);
  }

  impacts = [];

  if (groupRef) {
    groupRef.clear();
  }

  time = 0;
}

export function clearProjectileImpactFx() {
  if (groupRef && sceneRef) {
    sceneRef.remove(groupRef);
  }

  if (groupRef) {
    groupRef.traverse((child) => {
      disposeChild(child);
    });

    groupRef.clear();
  }

  groupRef = null;
  trackedProjectiles.clear();
  impacts = [];
}

function detectProjectileImpacts() {
  const currentProjectiles = new Set();

  for (const projectile of state.projectiles) {
    if (!projectile) continue;

    currentProjectiles.add(projectile);

    trackedProjectiles.set(projectile, {
      position: projectile.position
        ? projectile.position.clone()
        : new THREE.Vector3(0, 0.15, 0),
      type: getProjectileType(projectile),
      scale: getProjectileScale(projectile)
    });
  }

  for (const [projectile, snapshot] of trackedProjectiles.entries()) {
    if (currentProjectiles.has(projectile)) continue;

    spawnImpact(snapshot);
    trackedProjectiles.delete(projectile);
  }
}

function spawnImpact(snapshot) {
  if (!groupRef) return;

  if (impacts.length >= MAX_IMPACTS) {
    const oldImpact = impacts.shift();

    if (oldImpact) {
      groupRef.remove(oldImpact.group);
      disposeObject(oldImpact.group);
    }
  }

  const profile = getImpactProfile(snapshot);
  const impactGroup = new THREE.Group();

  impactGroup.position.copy(snapshot.position);
  impactGroup.position.y = Math.max(0.08, snapshot.position.y || 0.08);

  const shockRing = new THREE.Mesh(
    new THREE.RingGeometry(0.08, 0.14, 40),
    createAdditiveMaterial(profile.color, 0.72)
  );
  shockRing.rotation.x = -Math.PI / 2;

  const coreFlash = new THREE.Mesh(
    new THREE.SphereGeometry(profile.coreSize, 14, 14),
    createAdditiveMaterial(profile.color, 0.7)
  );
  coreFlash.position.y = 0.08;

  const afterGlow = new THREE.Mesh(
    new THREE.CircleGeometry(0.14, 36),
    createAdditiveMaterial(profile.color, 0.22)
  );
  afterGlow.rotation.x = -Math.PI / 2;
  afterGlow.position.y = -0.015;

  impactGroup.add(afterGlow);
  impactGroup.add(shockRing);
  impactGroup.add(coreFlash);

  const sparks = createSparks(profile);

  for (const spark of sparks) {
    impactGroup.add(spark);
  }

  groupRef.add(impactGroup);

  impacts.push({
    group: impactGroup,
    shockRing,
    coreFlash,
    afterGlow,
    sparks,
    life: 1,
    age: 0,
    profile
  });
}

function createSparks(profile) {
  const sparks = [];

  for (let i = 0; i < profile.sparkCount; i++) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(profile.sparkSize, 8, 8),
      createAdditiveMaterial(
        i % 3 === 0 ? profile.accentColor : profile.color,
        0.66
      )
    );

    const angle = Math.random() * Math.PI * 2;
    const speed = randomRange(profile.sparkSpeedMin, profile.sparkSpeedMax);

    spark.position.set(0, 0.04, 0);

    spark.userData.velocity = new THREE.Vector3(
      Math.cos(angle) * speed,
      randomRange(0.012, 0.038),
      Math.sin(angle) * speed
    );

    spark.userData.phase = Math.random() * Math.PI * 2;
    spark.userData.spin = randomRange(-0.05, 0.05);

    sparks.push(spark);
  }

  return sparks;
}

function updateImpacts() {
  for (let i = impacts.length - 1; i >= 0; i--) {
    const impact = impacts[i];

    impact.age++;
    impact.life -= impact.profile.decay;

    const progress = 1 - impact.life;
    const eased = 1 - Math.pow(1 - progress, 2);

    updateShockRing(impact, eased);
    updateCoreFlash(impact);
    updateAfterGlow(impact, eased);
    updateSparks(impact);

    if (impact.life <= 0) {
      groupRef.remove(impact.group);
      disposeObject(impact.group);
      impacts.splice(i, 1);
    }
  }
}

function updateShockRing(impact, progress) {
  const scale = 1 + progress * impact.profile.ringScale;

  impact.shockRing.scale.setScalar(scale);
  impact.shockRing.rotation.z += impact.profile.spinSpeed;
  impact.shockRing.material.opacity = clamp(impact.life * 0.72, 0, 0.72);
}

function updateCoreFlash(impact) {
  const pulse = 0.8 + Math.sin(time * 5 + impact.age * 0.08) * 0.16;

  impact.coreFlash.scale.setScalar(clamp(impact.life * pulse, 0.04, 1));
  impact.coreFlash.material.opacity = clamp(impact.life * 0.7, 0, 0.7);
}

function updateAfterGlow(impact, progress) {
  impact.afterGlow.scale.setScalar(1 + progress * impact.profile.glowScale);
  impact.afterGlow.material.opacity = clamp(impact.life * 0.2, 0, 0.2);
}

function updateSparks(impact) {
  for (const spark of impact.sparks) {
    const velocity = spark.userData.velocity;

    spark.position.x += velocity.x;
    spark.position.y += velocity.y;
    spark.position.z += velocity.z;

    velocity.y -= 0.0019;

    spark.rotation.x += spark.userData.spin;
    spark.rotation.y -= spark.userData.spin * 0.7;

    const flicker = 0.85 + Math.sin(time * 4 + spark.userData.phase) * 0.15;
    spark.scale.setScalar(clamp(impact.life * flicker, 0.03, 1));

    if (spark.material) {
      spark.material.opacity = clamp(impact.life * 0.66, 0, 0.66);
    }
  }
}

function getImpactProfile(snapshot) {
  const color = COLORS[snapshot.type] || COLORS.unknown;
  const scale = snapshot.scale;

  if (snapshot.type === "sniper") {
    return {
      color,
      accentColor: 0xfef3c7,
      coreSize: 0.08 * scale,
      sparkSize: 0.028 * scale,
      sparkCount: SPARK_COUNT + 3,
      ringScale: 2.9 * scale,
      glowScale: 2.2 * scale,
      sparkSpeedMin: 0.03 * scale,
      sparkSpeedMax: 0.07 * scale,
      spinSpeed: 0.034,
      decay: 0.036
    };
  }

  if (snapshot.type === "splash") {
    return {
      color,
      accentColor: 0xfacc15,
      coreSize: 0.13 * scale,
      sparkSize: 0.037 * scale,
      sparkCount: SPARK_COUNT + 8,
      ringScale: 3.4 * scale,
      glowScale: 2.9 * scale,
      sparkSpeedMin: 0.024 * scale,
      sparkSpeedMax: 0.062 * scale,
      spinSpeed: 0.025,
      decay: 0.026
    };
  }

  if (snapshot.type === "slow") {
    return {
      color,
      accentColor: 0xbae6fd,
      coreSize: 0.09 * scale,
      sparkSize: 0.026 * scale,
      sparkCount: SPARK_COUNT + 2,
      ringScale: 2.45 * scale,
      glowScale: 2.4 * scale,
      sparkSpeedMin: 0.018 * scale,
      sparkSpeedMax: 0.044 * scale,
      spinSpeed: 0.018,
      decay: 0.03
    };
  }

  if (snapshot.type === "rapid") {
    return {
      color,
      accentColor: 0xbbf7d0,
      coreSize: 0.07 * scale,
      sparkSize: 0.024 * scale,
      sparkCount: SPARK_COUNT,
      ringScale: 2.1 * scale,
      glowScale: 1.8 * scale,
      sparkSpeedMin: 0.026 * scale,
      sparkSpeedMax: 0.064 * scale,
      spinSpeed: 0.04,
      decay: 0.042
    };
  }

  return {
    color,
    accentColor: 0xe0f2fe,
    coreSize: 0.085 * scale,
    sparkSize: 0.026 * scale,
    sparkCount: SPARK_COUNT + 1,
    ringScale: 2.25 * scale,
    glowScale: 2.0 * scale,
    sparkSpeedMin: 0.022 * scale,
    sparkSpeedMax: 0.054 * scale,
    spinSpeed: 0.03,
    decay: 0.034
  };
}

function getProjectileType(projectile) {
  const data = projectile.userData || {};

  const text = String(
    data.type ||
      data.projectileType ||
      data.towerType ||
      data.sourceTowerType ||
      data.damageType ||
      data.kind ||
      projectile.name ||
      ""
  ).toLowerCase();

  if (text.includes("sniper")) return "sniper";

  if (text.includes("splash") || text.includes("bomb") || text.includes("aoe")) {
    return "splash";
  }

  if (text.includes("slow") || text.includes("ice") || text.includes("frost")) {
    return "slow";
  }

  if (text.includes("rapid") || text.includes("fast")) return "rapid";
  if (text.includes("poison")) return "poison";
  if (text.includes("normal")) return "normal";

  return "unknown";
}

function getProjectileScale(projectile) {
  const data = projectile.userData || {};

  const damageScale = Number(data.damage) / 40;

  const rawScale =
    Number(data.impactScale) ||
    Number(data.scale) ||
    damageScale ||
    1;

  return clamp(rawScale, 0.75, 2.15);
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

  if (typeof object.traverse === "function") {
    object.traverse((child) => {
      disposeChild(child);
    });
  } else {
    disposeChild(object);
  }
}

function disposeChild(child) {
  if (!child) return;

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
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}