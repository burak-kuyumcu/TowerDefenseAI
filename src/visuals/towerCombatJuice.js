import * as THREE from "three";
import { state } from "../game/state.js";

const GROUP_NAME = "TowerCombatJuice";
const MAX_PULSES = 90;

let sceneRef = null;
let groupRef = null;

let towerEffects = new Map();
let pulses = [];
let time = 0;

const TYPE_COLORS = {
  normal: 0x38bdf8,
  rapid: 0x22c55e,
  sniper: 0xfacc15,
  slow: 0x60a5fa,
  splash: 0xfb923c,
  unknown: 0xe0f2fe
};

export function initTowerCombatJuice(scene) {
  sceneRef = scene;

  clearTowerCombatJuice();

  groupRef = new THREE.Group();
  groupRef.name = GROUP_NAME;

  scene.add(groupRef);
}

export function updateTowerCombatJuice() {
  if (!groupRef) return;

  time += 0.04;

  syncTowerEffects();
  updateTowerEffects();
  updatePulses();
}

export function resetTowerCombatJuice() {
  for (const effect of towerEffects.values()) {
    disposeObject(effect.group);
  }

  towerEffects.clear();

  for (const pulse of pulses) {
    disposeObject(pulse);
  }

  pulses = [];

  if (groupRef) {
    groupRef.clear();
  }

  time = 0;
}

export function clearTowerCombatJuice() {
  if (groupRef && sceneRef) {
    sceneRef.remove(groupRef);
  }

  if (groupRef) {
    groupRef.traverse((child) => {
      if (child.geometry) child.geometry.dispose();

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
  towerEffects.clear();
  pulses = [];
}

function syncTowerEffects() {
  const liveTowers = new Set(state.towers);

  for (const tower of state.towers) {
    if (!towerEffects.has(tower)) {
      towerEffects.set(tower, createTowerEffect(tower));
    }
  }

  for (const [tower, effect] of towerEffects.entries()) {
    if (!liveTowers.has(tower) || !tower.parent) {
      if (groupRef) {
        groupRef.remove(effect.group);
      }

      disposeObject(effect.group);
      towerEffects.delete(tower);
    }
  }
}

function createTowerEffect(tower) {
  const type = getTowerType(tower);
  const color = getTowerColor(type);

  const effectGroup = new THREE.Group();
  effectGroup.name = "TowerJuiceEffect";

  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.48, 42),
    createAdditiveMaterial(color, 0.0)
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = 0.045;

  const selectedRing = new THREE.Mesh(
    new THREE.RingGeometry(0.56, 0.6, 48),
    createAdditiveMaterial(0xfacc15, 0.0)
  );
  selectedRing.rotation.x = -Math.PI / 2;
  selectedRing.position.y = 0.055;

  const topGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 16),
    createAdditiveMaterial(color, 0.0)
  );
  topGlow.position.y = getTowerGlowHeight(tower);

  effectGroup.add(baseRing);
  effectGroup.add(selectedRing);
  effectGroup.add(topGlow);

  groupRef.add(effectGroup);

  return {
    group: effectGroup,
    baseRing,
    selectedRing,
    topGlow,
    lastShotValue: getShotSignature(tower),
    shotFlash: 0,
    idlePhase: Math.random() * Math.PI * 2
  };
}

function updateTowerEffects() {
  for (const [tower, effect] of towerEffects.entries()) {
    if (!tower?.position) continue;

    const type = getTowerType(tower);
    const color = getTowerColor(type);
    const level = getTowerLevel(tower);
    const selected = state.selectedObject === tower;

    effect.group.position.copy(tower.position);
    effect.group.position.y = 0;

    const shotSignature = getShotSignature(tower);

    if (shotSignature !== effect.lastShotValue) {
      effect.lastShotValue = shotSignature;
      effect.shotFlash = 1;
      spawnPulse(tower, color, level);
    }

    if (effect.shotFlash > 0) {
      effect.shotFlash = Math.max(0, effect.shotFlash - 0.08);
    }

    const waveEnergy = state.waveActive ? 0.22 : 0.08;
    const idlePulse = 0.5 + Math.sin(time * 1.8 + effect.idlePhase) * 0.5;
    const levelBoost = 1 + level * 0.08;

    const baseOpacity =
      waveEnergy * idlePulse +
      effect.shotFlash * 0.46 +
      (selected ? 0.16 : 0);

    effect.baseRing.scale.setScalar(
      levelBoost + effect.shotFlash * 0.18 + idlePulse * 0.04
    );
    effect.baseRing.rotation.z += 0.012 + effect.shotFlash * 0.018;
    effect.baseRing.material.color.setHex(color);
    effect.baseRing.material.opacity = clamp(baseOpacity, 0.02, 0.72);

    effect.selectedRing.scale.setScalar(1 + Math.sin(time * 2.4) * 0.045);
    effect.selectedRing.rotation.z -= 0.018;
    effect.selectedRing.material.opacity = selected ? 0.52 : 0.0;

    effect.topGlow.position.y = getTowerGlowHeight(tower);
    effect.topGlow.scale.setScalar(
      0.8 + idlePulse * 0.22 + effect.shotFlash * 0.75
    );
    effect.topGlow.material.color.setHex(color);
    effect.topGlow.material.opacity = clamp(
      0.10 + waveEnergy * 0.35 + effect.shotFlash * 0.70,
      0.0,
      0.86
    );
  }
}

function spawnPulse(tower, color, level) {
  if (!groupRef || !tower?.position) return;

  if (pulses.length >= MAX_PULSES) {
    const oldPulse = pulses.shift();
    groupRef.remove(oldPulse);
    disposeObject(oldPulse);
  }

  const pulse = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.23, 40),
    createAdditiveMaterial(color, 0.68)
  );

  pulse.rotation.x = -Math.PI / 2;
  pulse.position.set(tower.position.x, 0.09, tower.position.z);

  pulse.userData.life = 1;
  pulse.userData.speed = 0.045 + level * 0.006;
  pulse.userData.maxScale = 1.35 + level * 0.22;

  groupRef.add(pulse);
  pulses.push(pulse);
}

function updatePulses() {
  for (let i = pulses.length - 1; i >= 0; i--) {
    const pulse = pulses[i];

    pulse.userData.life -= pulse.userData.speed;

    const progress = 1 - pulse.userData.life;
    const scale = 1 + progress * pulse.userData.maxScale;

    pulse.scale.setScalar(scale);
    pulse.material.opacity = clamp(pulse.userData.life * 0.68, 0, 0.68);

    if (pulse.userData.life <= 0) {
      groupRef.remove(pulse);
      disposeObject(pulse);
      pulses.splice(i, 1);
    }
  }
}

function getTowerType(tower) {
  return (
    tower?.userData?.type ||
    tower?.userData?.towerType ||
    tower?.userData?.kind ||
    "unknown"
  );
}

function getTowerColor(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.unknown;
}

function getTowerLevel(tower) {
  return Number(tower?.userData?.level || tower?.userData?.upgradeLevel || 1);
}

function getTowerGlowHeight(tower) {
  const level = getTowerLevel(tower);
  return 0.82 + Math.min(0.45, level * 0.08);
}

function getShotSignature(tower) {
  const data = tower?.userData || {};

  return [
    data.shotsFired || 0,
    data.lastShotTime || 0,
    data.attackTimer || 0,
    data.cooldown || 0,
    data.fireCooldown || 0,
    data.target ? 1 : 0
  ].join("|");
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}