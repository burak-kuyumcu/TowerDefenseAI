import * as THREE from "three";
import { state } from "../game/state.js";

const GROUP_NAME = "BaseCoreReactiveShield";

let sceneRef = null;
let baseRef = null;
let groupRef = null;

let shieldDome = null;
let groundRing = null;
let innerRing = null;
let damageRing = null;
let coreSparkGroup = null;

let lastBaseHp = null;
let damagePulse = 0;
let time = 0;

export function initBaseCoreShield(scene, base) {
  sceneRef = scene;
  baseRef = base;

  clearBaseCoreShield();

  groupRef = new THREE.Group();
  groupRef.name = GROUP_NAME;

  createShieldMeshes();

  scene.add(groupRef);

  lastBaseHp = state.baseHp;
  damagePulse = 0;
  time = 0;

  updateBaseCoreShield();
}

export function updateBaseCoreShield() {
  if (!groupRef || !baseRef) return;

  time += 0.035;

  syncBasePosition();
  detectDamagePulse();

  const hpRatio = getHpRatio();
  const danger = 1 - hpRatio;
  const waveBoost = state.waveActive ? 1 : 0;
  const gameOver = state.gameOver ? 1 : 0;

  if (damagePulse > 0) {
    damagePulse = Math.max(0, damagePulse - 0.025);
  }

  updateShieldDome(hpRatio, danger, waveBoost, gameOver);
  updateGroundRing(hpRatio, danger, waveBoost);
  updateInnerRing(hpRatio, danger, waveBoost);
  updateDamageRing(danger);
  updateCoreSparks(hpRatio, danger, waveBoost);
}

export function resetBaseCoreShield() {
  lastBaseHp = state.baseHp;
  damagePulse = 0;
  time = 0;

  if (!groupRef) return;

  groupRef.visible = true;

  updateBaseCoreShield();
}

export function clearBaseCoreShield() {
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
  shieldDome = null;
  groundRing = null;
  innerRing = null;
  damageRing = null;
  coreSparkGroup = null;
}

function createShieldMeshes() {
  if (!groupRef) return;

  const domeGeometry = new THREE.SphereGeometry(1.28, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMaterial = createAdditiveMaterial(0x38bdf8, 0.16);

  shieldDome = new THREE.Mesh(domeGeometry, domeMaterial);
  shieldDome.position.y = 0.14;
  shieldDome.scale.set(1.15, 1.05, 1.15);

  const ringGeometry = new THREE.RingGeometry(1.18, 1.34, 64);
  const ringMaterial = createAdditiveMaterial(0x38bdf8, 0.54);

  groundRing = new THREE.Mesh(ringGeometry, ringMaterial);
  groundRing.rotation.x = -Math.PI / 2;
  groundRing.position.y = 0.06;

  const innerRingGeometry = new THREE.RingGeometry(0.72, 0.82, 64);
  const innerRingMaterial = createAdditiveMaterial(0x22d3ee, 0.44);

  innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.075;

  const damageRingGeometry = new THREE.RingGeometry(0.88, 0.98, 72);
  const damageRingMaterial = createAdditiveMaterial(0xfb7185, 0);

  damageRing = new THREE.Mesh(damageRingGeometry, damageRingMaterial);
  damageRing.rotation.x = -Math.PI / 2;
  damageRing.position.y = 0.09;
  damageRing.scale.setScalar(1);

  coreSparkGroup = new THREE.Group();
  createCoreSparks();

  groupRef.add(shieldDome);
  groupRef.add(groundRing);
  groupRef.add(innerRing);
  groupRef.add(damageRing);
  groupRef.add(coreSparkGroup);
}

function createCoreSparks() {
  const geometry = new THREE.SphereGeometry(0.035, 8, 8);

  for (let i = 0; i < 18; i++) {
    const material = createAdditiveMaterial(i % 2 === 0 ? 0x38bdf8 : 0xfacc15, 0.48);
    const spark = new THREE.Mesh(geometry, material);

    spark.userData.angle = Math.random() * Math.PI * 2;
    spark.userData.radius = randomRange(0.75, 1.32);
    spark.userData.height = randomRange(0.18, 1.12);
    spark.userData.speed = randomRange(0.008, 0.018);
    spark.userData.phase = Math.random() * Math.PI * 2;

    coreSparkGroup.add(spark);
  }
}

function syncBasePosition() {
  const position = getBasePosition();

  groupRef.position.set(position.x, position.y, position.z);
}

function getBasePosition() {
  if (baseRef?.position) {
    return {
      x: baseRef.position.x,
      y: baseRef.position.y || 0,
      z: baseRef.position.z
    };
  }

  return {
    x: 7.5,
    y: 0,
    z: 4.5
  };
}

function detectDamagePulse() {
  if (lastBaseHp === null) {
    lastBaseHp = state.baseHp;
    return;
  }

  if (state.baseHp < lastBaseHp) {
    damagePulse = 1;
  }

  lastBaseHp = state.baseHp;
}

function updateShieldDome(hpRatio, danger, waveBoost, gameOver) {
  if (!shieldDome) return;

  const pulse = 1 + Math.sin(time * 2.2) * 0.035 + waveBoost * 0.035 + damagePulse * 0.12;

  shieldDome.scale.set(1.15 * pulse, 1.05 * pulse, 1.15 * pulse);

  const color = getShieldColor(hpRatio, gameOver);
  shieldDome.material.color.setHex(color);

  shieldDome.material.opacity = clamp(
    0.08 + hpRatio * 0.08 + waveBoost * 0.04 + damagePulse * 0.16 - gameOver * 0.04,
    0.04,
    0.34
  );

  shieldDome.rotation.y += 0.002 + waveBoost * 0.002;
}

function updateGroundRing(hpRatio, danger, waveBoost) {
  if (!groundRing) return;

  const pulse = 1 + Math.sin(time * 2.8) * 0.045 + damagePulse * 0.22;

  groundRing.scale.setScalar(pulse);
  groundRing.rotation.z += 0.01 + waveBoost * 0.006;

  groundRing.material.color.setHex(getRingColor(hpRatio));
  groundRing.material.opacity = clamp(
    0.26 + hpRatio * 0.24 + waveBoost * 0.12 + damagePulse * 0.22,
    0.14,
    0.78
  );
}

function updateInnerRing(hpRatio, danger, waveBoost) {
  if (!innerRing) return;

  const pulse = 1 + Math.cos(time * 3.1) * 0.055 + damagePulse * 0.16;

  innerRing.scale.setScalar(pulse);
  innerRing.rotation.z -= 0.016 + waveBoost * 0.007;

  innerRing.material.color.setHex(hpRatio <= 0.45 ? 0xfb7185 : 0x22d3ee);
  innerRing.material.opacity = clamp(
    0.20 + hpRatio * 0.18 + waveBoost * 0.10 + damagePulse * 0.22,
    0.12,
    0.68
  );
}

function updateDamageRing(danger) {
  if (!damageRing) return;

  if (damagePulse <= 0) {
    damageRing.material.opacity = 0;
    return;
  }

  const scale = 1 + (1 - damagePulse) * 1.35;

  damageRing.scale.setScalar(scale);
  damageRing.rotation.z += 0.025;

  damageRing.material.opacity = clamp(damagePulse * (0.62 + danger * 0.25), 0, 0.88);
  damageRing.material.color.setHex(0xfb7185);
}

function updateCoreSparks(hpRatio, danger, waveBoost) {
  if (!coreSparkGroup) return;

  const color = hpRatio <= 0.45 ? 0xfb7185 : 0x38bdf8;
  const accent = hpRatio <= 0.45 ? 0xf97316 : 0xfacc15;

  for (let i = 0; i < coreSparkGroup.children.length; i++) {
    const spark = coreSparkGroup.children[i];

    spark.userData.angle += spark.userData.speed * (1 + waveBoost * 1.4 + damagePulse * 2);

    const angle = spark.userData.angle;
    const radius =
      spark.userData.radius +
      Math.sin(time * 1.8 + spark.userData.phase) * 0.05;

    const height =
      spark.userData.height +
      Math.sin(time * 2.4 + spark.userData.phase) * 0.06 +
      waveBoost * 0.08 +
      damagePulse * 0.15;

    spark.position.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );

    const scale = 0.72 + Math.sin(time * 3.2 + spark.userData.phase) * 0.18 + damagePulse * 0.35;
    spark.scale.setScalar(clamp(scale, 0.42, 1.45));

    if (spark.material) {
      spark.material.color.setHex(i % 2 === 0 ? color : accent);
      spark.material.opacity = clamp(
        0.18 + waveBoost * 0.22 + damagePulse * 0.45 + danger * 0.16,
        0.10,
        0.86
      );
    }
  }
}

function getHpRatio() {
  const maxHp = Math.max(1, state.baseMaxHp || 10);

  return clamp(state.baseHp / maxHp, 0, 1);
}

function getShieldColor(hpRatio, gameOver) {
  if (gameOver) return 0x7f1d1d;
  if (hpRatio <= 0.25) return 0xef4444;
  if (hpRatio <= 0.45) return 0xfb7185;
  if (hpRatio <= 0.7) return 0xfacc15;

  return 0x38bdf8;
}

function getRingColor(hpRatio) {
  if (hpRatio <= 0.25) return 0xef4444;
  if (hpRatio <= 0.45) return 0xfb7185;
  if (hpRatio <= 0.7) return 0xfacc15;

  return 0x22d3ee;
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

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}