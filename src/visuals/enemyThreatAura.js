import * as THREE from "three";
import { state } from "../game/state.js";

const GROUP_NAME = "EnemyThreatAura";
const MAX_ENEMY_AURAS = 120;

let sceneRef = null;
let groupRef = null;

let enemyEffects = new Map();
let time = 0;

const COLORS = {
  normal: 0x38bdf8,
  fast: 0x22c55e,
  tank: 0xfacc15,
  boss: 0xfb7185,
  lowHp: 0xef4444,
  selected: 0xfacc15
};

export function initEnemyThreatAura(scene) {
  sceneRef = scene;

  clearEnemyThreatAura();

  groupRef = new THREE.Group();
  groupRef.name = GROUP_NAME;

  scene.add(groupRef);
}

export function updateEnemyThreatAura(camera) {
  if (!groupRef) return;

  time += 0.04;

  syncEnemyEffects();
  updateEnemyEffects(camera);
}

export function resetEnemyThreatAura() {
  for (const effect of enemyEffects.values()) {
    disposeObject(effect.group);
  }

  enemyEffects.clear();

  if (groupRef) {
    groupRef.clear();
  }

  time = 0;
}

export function clearEnemyThreatAura() {
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
  enemyEffects.clear();
}

function syncEnemyEffects() {
  const liveEnemies = new Set(getVisibleEnemies());

  for (const enemy of liveEnemies) {
    if (!enemyEffects.has(enemy)) {
      enemyEffects.set(enemy, createEnemyEffect(enemy));
    }
  }

  for (const [enemy, effect] of enemyEffects.entries()) {
    if (!liveEnemies.has(enemy) || !enemy.parent) {
      if (groupRef) {
        groupRef.remove(effect.group);
      }

      disposeObject(effect.group);
      enemyEffects.delete(enemy);
    }
  }
}

function createEnemyEffect(enemy) {
  const profile = getEnemyProfile(enemy);

  const effectGroup = new THREE.Group();
  effectGroup.name = "EnemyThreatAuraEffect";

  const groundRing = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.44, 42),
    createAdditiveMaterial(profile.color, 0.34)
  );
  groundRing.rotation.x = -Math.PI / 2;
  groundRing.position.y = 0.045;

  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.52, 0.56, 56),
    createAdditiveMaterial(profile.color, 0.18)
  );
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.055;

  const selectedRing = new THREE.Mesh(
    new THREE.RingGeometry(0.66, 0.72, 64),
    createAdditiveMaterial(COLORS.selected, 0)
  );
  selectedRing.rotation.x = -Math.PI / 2;
  selectedRing.position.y = 0.065;

  const topMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 12, 12),
    createAdditiveMaterial(profile.color, 0.38)
  );
  topMarker.position.y = profile.topHeight;

  const bossCrown = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.025, 8, 36),
    createAdditiveMaterial(COLORS.boss, 0)
  );
  bossCrown.rotation.x = Math.PI / 2;
  bossCrown.position.y = profile.topHeight + 0.18;

  effectGroup.add(groundRing);
  effectGroup.add(outerRing);
  effectGroup.add(selectedRing);
  effectGroup.add(topMarker);
  effectGroup.add(bossCrown);

  groupRef.add(effectGroup);

  return {
    group: effectGroup,
    groundRing,
    outerRing,
    selectedRing,
    topMarker,
    bossCrown,
    phase: Math.random() * Math.PI * 2
  };
}

function updateEnemyEffects(camera) {
  for (const [enemy, effect] of enemyEffects.entries()) {
    if (!enemy?.position) continue;

    const profile = getEnemyProfile(enemy);
    const hpRatio = getHpRatio(enemy);
    const selected = state.selectedObject === enemy;
    const lowHp = hpRatio <= 0.35;
    const auraColor = lowHp ? COLORS.lowHp : profile.color;

    effect.group.position.copy(enemy.position);
    effect.group.position.y = 0;

    const pulse = 1 + Math.sin(time * profile.pulseSpeed + effect.phase) * 0.055;
    const hpPulse = lowHp ? Math.abs(Math.sin(time * 4.4 + effect.phase)) * 0.12 : 0;
    const bossPulse = profile.isBoss ? Math.sin(time * 2.1 + effect.phase) * 0.08 : 0;

    const scale = profile.scale * (pulse + hpPulse + bossPulse);

    effect.groundRing.scale.setScalar(scale);
    effect.groundRing.rotation.z += profile.rotationSpeed;
    effect.groundRing.material.color.setHex(auraColor);
    effect.groundRing.material.opacity = clamp(
      profile.opacity * (0.65 + (1 - hpRatio) * 0.45),
      0.10,
      0.82
    );

    effect.outerRing.scale.setScalar(scale * (1.18 + (1 - hpRatio) * 0.12));
    effect.outerRing.rotation.z -= profile.rotationSpeed * 0.65;
    effect.outerRing.material.color.setHex(auraColor);
    effect.outerRing.material.opacity = clamp(
      profile.opacity * 0.42 + (lowHp ? 0.16 : 0),
      0.06,
      0.62
    );

    effect.selectedRing.scale.setScalar(1 + Math.sin(time * 2.7) * 0.04);
    effect.selectedRing.rotation.z += 0.025;
    effect.selectedRing.material.opacity = selected ? 0.72 : 0;

    effect.topMarker.position.y = profile.topHeight + Math.sin(time * 2.4 + effect.phase) * 0.055;
    effect.topMarker.scale.setScalar(profile.markerScale * (0.9 + pulse * 0.25));
    effect.topMarker.material.color.setHex(auraColor);
    effect.topMarker.material.opacity = clamp(
      0.18 + profile.opacity * 0.62 + (lowHp ? 0.18 : 0),
      0.08,
      0.86
    );

    if (camera && effect.topMarker) {
      effect.topMarker.lookAt(camera.position);
    }

    if (profile.isBoss) {
      effect.bossCrown.visible = true;
      effect.bossCrown.position.y = profile.topHeight + 0.22;
      effect.bossCrown.scale.setScalar(1.1 + Math.sin(time * 2.0 + effect.phase) * 0.08);
      effect.bossCrown.rotation.z += 0.02;
      effect.bossCrown.material.color.setHex(lowHp ? COLORS.lowHp : COLORS.boss);
      effect.bossCrown.material.opacity = clamp(0.32 + (1 - hpRatio) * 0.28, 0.22, 0.72);
    } else {
      effect.bossCrown.visible = false;
      effect.bossCrown.material.opacity = 0;
    }
  }
}

function getVisibleEnemies() {
  const enemies = Array.isArray(state.enemies) ? state.enemies : [];

  return enemies
    .filter((enemy) => enemy && enemy.parent && !enemy.userData?.dead)
    .slice(0, MAX_ENEMY_AURAS);
}

function getEnemyProfile(enemy) {
  const typeText = getEnemyTypeText(enemy);

  const isBoss =
    Boolean(enemy?.userData?.isBoss) ||
    Boolean(enemy?.userData?.boss) ||
    typeText.includes("boss");

  const isFast =
    typeText.includes("fast") ||
    typeText.includes("runner") ||
    typeText.includes("speed") ||
    Number(enemy?.userData?.speed || 0) > 0.045;

  const isTank =
    typeText.includes("tank") ||
    typeText.includes("heavy") ||
    typeText.includes("armored") ||
    typeText.includes("armor") ||
    Number(enemy?.userData?.maxHp || enemy?.userData?.maxHealth || 0) >= 120;

  if (isBoss) {
    return {
      color: COLORS.boss,
      scale: 1.62,
      opacity: 0.56,
      pulseSpeed: 2.6,
      rotationSpeed: 0.018,
      topHeight: 1.36,
      markerScale: 1.35,
      isBoss: true
    };
  }

  if (isTank) {
    return {
      color: COLORS.tank,
      scale: 1.18,
      opacity: 0.42,
      pulseSpeed: 1.8,
      rotationSpeed: 0.009,
      topHeight: 1.02,
      markerScale: 1.12,
      isBoss: false
    };
  }

  if (isFast) {
    return {
      color: COLORS.fast,
      scale: 0.95,
      opacity: 0.38,
      pulseSpeed: 3.2,
      rotationSpeed: 0.026,
      topHeight: 0.86,
      markerScale: 0.92,
      isBoss: false
    };
  }

  return {
    color: COLORS.normal,
    scale: 1.0,
    opacity: 0.32,
    pulseSpeed: 2.1,
    rotationSpeed: 0.014,
    topHeight: 0.92,
    markerScale: 0.95,
    isBoss: false
  };
}

function getEnemyTypeText(enemy) {
  return String(
    enemy?.userData?.type ||
      enemy?.userData?.enemyType ||
      enemy?.userData?.kind ||
      enemy?.name ||
      ""
  ).toLowerCase();
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}