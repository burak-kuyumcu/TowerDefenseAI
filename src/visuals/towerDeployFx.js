import * as THREE from "three";
import { state } from "../game/state.js";

const GROUP_NAME = "TowerDeployFx";
const MAX_EFFECTS = 90;
const SPARK_COUNT = 16;

let sceneRef = null;
let groupRef = null;
let trackedTowers = new Map();
let effects = [];
let time = 0;

const COLORS = {
  normal: 0x38bdf8,
  rapid: 0x22c55e,
  sniper: 0xfacc15,
  slow: 0x60a5fa,
  splash: 0xfb923c,
  upgrade: 0xfacc15,
  recall: 0x94a3b8,
  unknown: 0xe0f2fe
};

export function initTowerDeployFx(scene) {
  sceneRef = scene;
  clearTowerDeployFx();

  groupRef = new THREE.Group();
  groupRef.name = GROUP_NAME;

  scene.add(groupRef);
}

export function updateTowerDeployFx() {
  if (!groupRef) return;

  time += 0.04;

  detectTowerChanges();
  updateEffects();
}

export function resetTowerDeployFx() {
  trackedTowers.clear();

  for (const effect of effects) {
    disposeObject(effect.group);
  }

  effects = [];

  if (groupRef) {
    groupRef.clear();
  }

  time = 0;
}

export function clearTowerDeployFx() {
  if (groupRef && sceneRef) {
    sceneRef.remove(groupRef);
  }

  if (groupRef) {
    groupRef.traverse(function (child) {
      disposeChild(child);
    });

    groupRef.clear();
  }

  groupRef = null;
  trackedTowers.clear();
  effects = [];
}

function detectTowerChanges() {
  const currentTowers = new Set();

  if (!Array.isArray(state.towers)) return;

  for (const tower of state.towers) {
    if (!isValidTower(tower)) continue;

    currentTowers.add(tower);

    const type = getTowerType(tower);
    const level = getTowerLevel(tower);
    const position = tower.position.clone();

    if (!trackedTowers.has(tower)) {
      trackedTowers.set(tower, {
        position: position,
        type: type,
        level: level
      });

      spawnDeployEffect(position, type);
      continue;
    }

    const snapshot = trackedTowers.get(tower);

    if (snapshot && level > snapshot.level) {
      spawnUpgradeEffect(position, type, level);
    }

    if (snapshot) {
      snapshot.position.copy(position);
      snapshot.type = type;
      snapshot.level = level;
    }
  }

  for (const tower of trackedTowers.keys()) {
    if (!currentTowers.has(tower)) {
      const snapshot = trackedTowers.get(tower);

      if (snapshot) {
        spawnRecallEffect(snapshot.position, snapshot.type);
      }

      trackedTowers.delete(tower);
    }
  }
}

function spawnDeployEffect(position, type) {
  const color = getTowerColor(type);

  spawnEffect({
    position: position,
    color: color,
    accentColor: 0xe0f2fe,
    ringStart: 0.16,
    ringEnd: 0.28,
    ringScale: 2.4,
    coreSize: 0.16,
    coreHeight: 0.45,
    beamHeight: 1.4,
    sparkCount: SPARK_COUNT,
    sparkSpeedMin: 0.018,
    sparkSpeedMax: 0.052,
    decay: 0.026,
    kind: "deploy"
  });
}

function spawnUpgradeEffect(position, type, level) {
  const power = Math.min(2.2, 1 + level * 0.12);

  spawnEffect({
    position: position,
    color: COLORS.upgrade,
    accentColor: getTowerColor(type),
    ringStart: 0.22,
    ringEnd: 0.34,
    ringScale: 2.8 * power,
    coreSize: 0.14 * power,
    coreHeight: 0.78,
    beamHeight: 1.75,
    sparkCount: SPARK_COUNT + 8,
    sparkSpeedMin: 0.02 * power,
    sparkSpeedMax: 0.065 * power,
    decay: 0.023,
    kind: "upgrade"
  });
}

function spawnRecallEffect(position, type) {
  spawnEffect({
    position: position,
    color: COLORS.recall,
    accentColor: getTowerColor(type),
    ringStart: 0.14,
    ringEnd: 0.22,
    ringScale: 1.9,
    coreSize: 0.11,
    coreHeight: 0.34,
    beamHeight: 0.9,
    sparkCount: 10,
    sparkSpeedMin: 0.012,
    sparkSpeedMax: 0.036,
    decay: 0.04,
    kind: "recall"
  });
}

function spawnEffect(config) {
  if (!groupRef) return;
  if (!config || !config.position) return;

  if (effects.length >= MAX_EFFECTS) {
    const oldEffect = effects.shift();

    if (oldEffect) {
      groupRef.remove(oldEffect.group);
      disposeObject(oldEffect.group);
    }
  }

  const effectGroup = new THREE.Group();
  effectGroup.position.set(config.position.x, 0.08, config.position.z);

  const shockRing = new THREE.Mesh(
    new THREE.RingGeometry(config.ringStart, config.ringEnd, 56),
    createAdditiveMaterial(config.color, 0.78)
  );
  shockRing.rotation.x = -Math.PI / 2;
  shockRing.position.y = 0.02;

  const innerRing = new THREE.Mesh(
    new THREE.RingGeometry(config.ringStart * 0.48, config.ringEnd * 0.58, 42),
    createAdditiveMaterial(config.accentColor, 0.58)
  );
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.04;

  const coreFlash = new THREE.Mesh(
    new THREE.SphereGeometry(config.coreSize, 18, 18),
    createAdditiveMaterial(config.color, 0.78)
  );
  coreFlash.position.y = config.coreHeight;

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.16, config.beamHeight, 24, 1, true),
    createAdditiveMaterial(config.color, getBeamStartOpacity(config.kind))
  );
  beam.position.y = config.beamHeight / 2;

  effectGroup.add(shockRing);
  effectGroup.add(innerRing);
  effectGroup.add(coreFlash);
  effectGroup.add(beam);

  const sparks = createSparks(config);

  for (const spark of sparks) {
    effectGroup.add(spark);
  }

  groupRef.add(effectGroup);

  effects.push({
    group: effectGroup,
    shockRing: shockRing,
    innerRing: innerRing,
    coreFlash: coreFlash,
    beam: beam,
    sparks: sparks,
    life: 1,
    age: 0,
    config: config
  });
}

function createSparks(config) {
  const sparks = [];

  for (let i = 0; i < config.sparkCount; i++) {
    const sparkColor = i % 3 === 0 ? config.accentColor : config.color;

    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 8, 8),
      createAdditiveMaterial(sparkColor, 0.72)
    );

    const angle = Math.random() * Math.PI * 2;
    const speed = randomRange(config.sparkSpeedMin, config.sparkSpeedMax);

    spark.position.set(0, randomRange(0.08, 0.55), 0);

    spark.userData.velocity = new THREE.Vector3(
      Math.cos(angle) * speed,
      randomRange(0.018, 0.06),
      Math.sin(angle) * speed
    );

    spark.userData.phase = Math.random() * Math.PI * 2;
    spark.userData.spin = randomRange(-0.045, 0.045);

    sparks.push(spark);
  }

  return sparks;
}

function updateEffects() {
  for (let i = effects.length - 1; i >= 0; i--) {
    const effect = effects[i];

    effect.age += 1;
    effect.life -= effect.config.decay;

    const progress = 1 - effect.life;
    const eased = 1 - Math.pow(1 - progress, 2);

    updateShockRing(effect, eased);
    updateInnerRing(effect, eased);
    updateCoreFlash(effect);
    updateBeam(effect);
    updateSparks(effect);

    if (effect.life <= 0) {
      groupRef.remove(effect.group);
      disposeObject(effect.group);
      effects.splice(i, 1);
    }
  }
}

function updateShockRing(effect, progress) {
  const scale = 1 + progress * effect.config.ringScale;
  const rotationSpeed = effect.config.kind === "upgrade" ? 0.035 : 0.022;

  effect.shockRing.scale.setScalar(scale);
  effect.shockRing.rotation.z += rotationSpeed;

  if (effect.shockRing.material) {
    effect.shockRing.material.opacity = clamp(effect.life * 0.78, 0, 0.78);
  }
}

function updateInnerRing(effect, progress) {
  const scale = 0.8 + progress * effect.config.ringScale * 0.64;
  const rotationSpeed = effect.config.kind === "upgrade" ? 0.045 : 0.026;

  effect.innerRing.scale.setScalar(scale);
  effect.innerRing.rotation.z -= rotationSpeed;

  if (effect.innerRing.material) {
    effect.innerRing.material.opacity = clamp(effect.life * 0.52, 0, 0.62);
  }
}

function updateCoreFlash(effect) {
  const pulse = 0.78 + Math.sin(time * 5 + effect.age * 0.08) * 0.14;

  effect.coreFlash.scale.setScalar(clamp(effect.life * pulse, 0.04, 1.25));

  if (effect.coreFlash.material) {
    effect.coreFlash.material.opacity = clamp(effect.life * 0.78, 0, 0.78);
  }
}

function updateBeam(effect) {
  const pulse = 0.85 + Math.sin(time * 3.2 + effect.age * 0.04) * 0.1;
  const maxOpacity = effect.config.kind === "upgrade" ? 0.26 : 0.18;

  effect.beam.scale.set(pulse, 1, pulse);
  effect.beam.rotation.y += 0.012;

  if (effect.beam.material) {
    effect.beam.material.opacity = clamp(effect.life * maxOpacity, 0, 0.3);
  }
}

function updateSparks(effect) {
  for (const spark of effect.sparks) {
    const velocity = spark.userData.velocity;

    spark.position.x += velocity.x;
    spark.position.y += velocity.y;
    spark.position.z += velocity.z;

    velocity.y -= 0.0023;

    spark.rotation.x += spark.userData.spin;
    spark.rotation.y -= spark.userData.spin * 0.7;

    const flicker = 0.85 + Math.sin(time * 4 + spark.userData.phase) * 0.15;
    spark.scale.setScalar(clamp(effect.life * flicker, 0.04, 1));

    if (spark.material) {
      spark.material.opacity = clamp(effect.life * 0.7, 0, 0.72);
    }
  }
}

function isValidTower(tower) {
  if (!tower) return false;
  if (!tower.parent) return false;
  if (!tower.position) return false;

  return true;
}

function getTowerType(tower) {
  const data = tower.userData || {};

  const rawType = data.type || data.towerType || data.kind || tower.name || "";
  const text = String(rawType).toLowerCase();

  if (text.indexOf("rapid") !== -1) return "rapid";
  if (text.indexOf("sniper") !== -1) return "sniper";
  if (text.indexOf("slow") !== -1) return "slow";
  if (text.indexOf("splash") !== -1) return "splash";
  if (text.indexOf("normal") !== -1) return "normal";

  return "unknown";
}

function getTowerLevel(tower) {
  const data = tower.userData || {};
  const level = Number(data.level || data.upgradeLevel || 1);

  if (!Number.isFinite(level)) return 1;

  return level;
}

function getTowerColor(type) {
  return COLORS[type] || COLORS.unknown;
}

function getBeamStartOpacity(kind) {
  if (kind === "recall") return 0.12;

  return 0.2;
}

function createAdditiveMaterial(color, opacity) {
  return new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
}

function disposeObject(object) {
  if (!object) return;

  if (typeof object.traverse === "function") {
    object.traverse(function (child) {
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