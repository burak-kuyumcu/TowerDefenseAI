import * as THREE from "three";
import { state } from "../game/state.js";

const GROUP_NAME = "EconomyRewardFx";
const MAX_EFFECTS = 90;
const ORB_COUNT = 16;

let sceneRef = null;
let baseRef = null;
let groupRef = null;

let effects = [];
let lastGold = 0;
let lastScore = 0;
let lastCombo = 0;
let time = 0;

const COLORS = {
  gold: 0xfacc15,
  goldSoft: 0xfef3c7,
  score: 0x38bdf8,
  combo: 0xfb923c,
  spend: 0x94a3b8
};

export function initEconomyRewardFx(scene, base) {
  sceneRef = scene;
  baseRef = base;

  clearEconomyRewardFx();

  groupRef = new THREE.Group();
  groupRef.name = GROUP_NAME;

  scene.add(groupRef);

  lastGold = Number(state.gold || 0);
  lastScore = Number(state.score || 0);
  lastCombo = Number(state.combo || 0);
  time = 0;
}

export function updateEconomyRewardFx() {
  if (!groupRef) return;

  time += 0.04;

  detectEconomyChanges();
  updateEffects();
}

export function resetEconomyRewardFx() {
  lastGold = Number(state.gold || 0);
  lastScore = Number(state.score || 0);
  lastCombo = Number(state.combo || 0);
  time = 0;

  for (const effect of effects) {
    disposeObject(effect.group);
  }

  effects = [];

  if (groupRef) {
    groupRef.clear();
  }
}

export function clearEconomyRewardFx() {
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
  effects = [];
}

function detectEconomyChanges() {
  const currentGold = Number(state.gold || 0);
  const currentScore = Number(state.score || 0);
  const currentCombo = Number(state.combo || 0);

  const goldDelta = currentGold - lastGold;
  const scoreDelta = currentScore - lastScore;
  const comboDelta = currentCombo - lastCombo;

  if (goldDelta > 0) {
    spawnRewardEffect({
      kind: "gold",
      amount: goldDelta,
      color: COLORS.gold,
      accentColor: COLORS.goldSoft,
      scale: getRewardScale(goldDelta),
      orbCount: ORB_COUNT + Math.min(14, Math.floor(goldDelta / 10)),
      decay: 0.024
    });
  }

  if (goldDelta < 0) {
    spawnRewardEffect({
      kind: "spend",
      amount: Math.abs(goldDelta),
      color: COLORS.spend,
      accentColor: COLORS.goldSoft,
      scale: 0.82,
      orbCount: 8,
      decay: 0.038
    });
  }

  if (scoreDelta > 0 && goldDelta <= 0) {
    spawnRewardEffect({
      kind: "score",
      amount: scoreDelta,
      color: COLORS.score,
      accentColor: COLORS.goldSoft,
      scale: getScoreScale(scoreDelta),
      orbCount: 10,
      decay: 0.03
    });
  }

  if (comboDelta > 0 && currentCombo >= 2) {
    spawnRewardEffect({
      kind: "combo",
      amount: comboDelta,
      color: COLORS.combo,
      accentColor: COLORS.gold,
      scale: 1 + Math.min(1.1, currentCombo * 0.08),
      orbCount: 12 + Math.min(12, currentCombo),
      decay: 0.026
    });
  }

  lastGold = currentGold;
  lastScore = currentScore;
  lastCombo = currentCombo;
}

function spawnRewardEffect(config) {
  if (!groupRef) return;

  if (effects.length >= MAX_EFFECTS) {
    const oldEffect = effects.shift();

    if (oldEffect) {
      groupRef.remove(oldEffect.group);
      disposeObject(oldEffect.group);
    }
  }

  const origin = getEffectOrigin();
  const effectGroup = new THREE.Group();

  effectGroup.position.set(origin.x, origin.y, origin.z);

  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(0.24, 0.36, 56),
    createAdditiveMaterial(config.color, getRingOpacity(config.kind))
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = 0.08;

  const innerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.16, 42),
    createAdditiveMaterial(config.accentColor, 0.52)
  );
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.1;

  const coreFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.12 * config.scale, 18, 18),
    createAdditiveMaterial(config.color, 0.72)
  );
  coreFlash.position.y = 0.72;

  effectGroup.add(baseRing);
  effectGroup.add(innerRing);
  effectGroup.add(coreFlash);

  const orbs = createRewardOrbs(config);

  for (const orb of orbs) {
    effectGroup.add(orb);
  }

  groupRef.add(effectGroup);

  effects.push({
    group: effectGroup,
    baseRing: baseRing,
    innerRing: innerRing,
    coreFlash: coreFlash,
    orbs: orbs,
    life: 1,
    age: 0,
    config: config
  });
}

function createRewardOrbs(config) {
  const orbs = [];

  for (let i = 0; i < config.orbCount; i++) {
    const color = i % 3 === 0 ? config.accentColor : config.color;

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.035 * config.scale, 8, 8),
      createAdditiveMaterial(color, 0.72)
    );

    const angle = Math.random() * Math.PI * 2;
    const radius = randomRange(0.12, 0.42) * config.scale;
    const speed = randomRange(0.012, 0.042) * config.scale;

    orb.position.set(
      Math.cos(angle) * radius,
      randomRange(0.18, 0.72),
      Math.sin(angle) * radius
    );

    orb.userData.angle = angle;
    orb.userData.radius = radius;
    orb.userData.orbitSpeed = randomRange(0.025, 0.055);
    orb.userData.velocity = new THREE.Vector3(
      Math.cos(angle) * speed,
      randomRange(0.018, 0.055),
      Math.sin(angle) * speed
    );
    orb.userData.phase = Math.random() * Math.PI * 2;
    orb.userData.spin = randomRange(-0.04, 0.04);

    orbs.push(orb);
  }

  return orbs;
}

function updateEffects() {
  for (let i = effects.length - 1; i >= 0; i--) {
    const effect = effects[i];

    effect.age += 1;
    effect.life -= effect.config.decay;

    const progress = 1 - effect.life;
    const eased = 1 - Math.pow(1 - progress, 2);

    updateBaseRing(effect, eased);
    updateInnerRing(effect, eased);
    updateCoreFlash(effect);
    updateOrbs(effect);

    if (effect.life <= 0) {
      groupRef.remove(effect.group);
      disposeObject(effect.group);
      effects.splice(i, 1);
    }
  }
}

function updateBaseRing(effect, progress) {
  const scale = 1 + progress * (2.2 * effect.config.scale);

  effect.baseRing.scale.setScalar(scale);
  effect.baseRing.rotation.z += effect.config.kind === "combo" ? 0.04 : 0.026;

  if (effect.baseRing.material) {
    effect.baseRing.material.opacity = clamp(effect.life * 0.68, 0, 0.72);
  }
}

function updateInnerRing(effect, progress) {
  const scale = 0.8 + progress * (1.5 * effect.config.scale);

  effect.innerRing.scale.setScalar(scale);
  effect.innerRing.rotation.z -= effect.config.kind === "combo" ? 0.05 : 0.03;

  if (effect.innerRing.material) {
    effect.innerRing.material.opacity = clamp(effect.life * 0.52, 0, 0.62);
  }
}

function updateCoreFlash(effect) {
  const pulse = 0.82 + Math.sin(time * 5 + effect.age * 0.08) * 0.15;

  effect.coreFlash.scale.setScalar(clamp(effect.life * pulse, 0.04, 1.18));

  if (effect.coreFlash.material) {
    effect.coreFlash.material.opacity = clamp(effect.life * 0.72, 0, 0.72);
  }
}

function updateOrbs(effect) {
  for (const orb of effect.orbs) {
    const velocity = orb.userData.velocity;

    orb.position.x += velocity.x;
    orb.position.y += velocity.y;
    orb.position.z += velocity.z;

    if (effect.config.kind === "spend") {
      velocity.y -= 0.0032;
    } else {
      velocity.y += 0.0006;
    }

    orb.userData.angle += orb.userData.orbitSpeed;

    const orbitAmount = 0.004 * effect.config.scale;
    orb.position.x += Math.cos(orb.userData.angle) * orbitAmount;
    orb.position.z += Math.sin(orb.userData.angle) * orbitAmount;

    orb.rotation.x += orb.userData.spin;
    orb.rotation.y -= orb.userData.spin * 0.7;

    const flicker = 0.86 + Math.sin(time * 4 + orb.userData.phase) * 0.14;
    orb.scale.setScalar(clamp(effect.life * flicker, 0.04, 1));

    if (orb.material) {
      orb.material.opacity = clamp(effect.life * 0.72, 0, 0.72);
    }
  }
}

function getEffectOrigin() {
  if (baseRef && baseRef.position) {
    return {
      x: baseRef.position.x,
      y: 0.08,
      z: baseRef.position.z
    };
  }

  return {
    x: 7.5,
    y: 0.08,
    z: 4.5
  };
}

function getRewardScale(amount) {
  const value = Number(amount || 0);

  return clamp(0.85 + value / 80, 0.85, 2.2);
}

function getScoreScale(amount) {
  const value = Number(amount || 0);

  return clamp(0.75 + value / 600, 0.75, 1.75);
}

function getRingOpacity(kind) {
  if (kind === "spend") return 0.28;
  if (kind === "combo") return 0.78;

  return 0.62;
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