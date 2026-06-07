import * as THREE from "three";
import { state } from "../game/state.js";
import { getCurrentStageEffect } from "../game/stages.js";

const GROUP_NAME = "PortalSurgeVisual";
const SPARK_COUNT = 28;

let sceneRef = null;
let groupRef = null;

let outerRing = null;
let innerRing = null;
let coreDisc = null;
let verticalBeam = null;
let sparks = [];

let lastSignature = "";
let time = 0;

const COLOR_MAP = {
  forest_balance: {
    main: 0x22c55e,
    accent: 0xfacc15,
    beam: 0x38bdf8
  },
  canyon_wind: {
    main: 0xf59e0b,
    accent: 0xfb923c,
    beam: 0xfacc15
  },
  frozen_chill: {
    main: 0xbae6fd,
    accent: 0x38bdf8,
    beam: 0xe0f2fe
  },
  ancient_armor: {
    main: 0xd6d3d1,
    accent: 0xfacc15,
    beam: 0xa8a29e
  },
  lava_pressure: {
    main: 0xfb7185,
    accent: 0xfb923c,
    beam: 0xf97316
  },
  swamp_mud: {
    main: 0x84cc16,
    accent: 0x22c55e,
    beam: 0xa3e635
  },
  crystal_resonance: {
    main: 0xc084fc,
    accent: 0x22d3ee,
    beam: 0xe879f9
  }
};

export function initPortalSurge(scene) {
  sceneRef = scene;

  clearPortalSurge();

  groupRef = new THREE.Group();
  groupRef.name = GROUP_NAME;
  groupRef.visible = false;

  scene.add(groupRef);

  createPortalSurgeMeshes();
  rebuildPortalSurge();
}

export function updatePortalSurge() {
  if (!groupRef) return;

  time += 0.035;

  const signature = getPortalSignature();

  if (signature !== lastSignature) {
    rebuildPortalSurge();
  }

  const point = getSpawnPoint();

  if (!point) {
    groupRef.visible = false;
    return;
  }

  groupRef.visible = Boolean(state.started);

  if (!groupRef.visible) return;

  groupRef.position.set(point.x, 0.08, point.z);

  const colors = getStageColors();
  const pressure = getSurgePressure();

  updateMaterialColors(colors);
  updateRings(pressure);
  updateBeam(pressure);
  updateSparks(pressure, colors);
}

export function resetPortalSurge() {
  time = 0;
  lastSignature = "";
  rebuildPortalSurge();
}

export function clearPortalSurge() {
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
  outerRing = null;
  innerRing = null;
  coreDisc = null;
  verticalBeam = null;
  sparks = [];
  lastSignature = "";
}

function createPortalSurgeMeshes() {
  if (!groupRef) return;

  const colors = getStageColors();

  const outerRingGeometry = new THREE.RingGeometry(0.42, 0.58, 48);
  const innerRingGeometry = new THREE.RingGeometry(0.18, 0.28, 40);
  const coreGeometry = new THREE.CircleGeometry(0.14, 32);
  const beamGeometry = new THREE.CylinderGeometry(0.07, 0.16, 1.8, 24, 1, true);

  const outerRingMaterial = createAdditiveMaterial(colors.main, 0.58);
  const innerRingMaterial = createAdditiveMaterial(colors.accent, 0.72);
  const coreMaterial = createAdditiveMaterial(colors.accent, 0.48);
  const beamMaterial = createAdditiveMaterial(colors.beam, 0.18);

  outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.02;

  innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.035;

  coreDisc = new THREE.Mesh(coreGeometry, coreMaterial);
  coreDisc.rotation.x = -Math.PI / 2;
  coreDisc.position.y = 0.045;

  verticalBeam = new THREE.Mesh(beamGeometry, beamMaterial);
  verticalBeam.position.y = 0.9;

  groupRef.add(outerRing);
  groupRef.add(innerRing);
  groupRef.add(coreDisc);
  groupRef.add(verticalBeam);

  createSparks(colors);
}

function createSparks(colors) {
  const sparkGeometry = new THREE.SphereGeometry(0.035, 8, 8);

  for (let i = 0; i < SPARK_COUNT; i++) {
    const material = createAdditiveMaterial(
      i % 2 === 0 ? colors.main : colors.accent,
      0.65
    );

    const spark = new THREE.Mesh(sparkGeometry, material);

    spark.userData.angle = Math.random() * Math.PI * 2;
    spark.userData.radius = randomRange(0.45, 1.15);
    spark.userData.height = randomRange(0.08, 0.9);
    spark.userData.speed = randomRange(0.006, 0.018);
    spark.userData.phase = Math.random() * Math.PI * 2;

    groupRef.add(spark);
    sparks.push(spark);
  }
}

function rebuildPortalSurge() {
  const point = getSpawnPoint();

  lastSignature = getPortalSignature();

  if (!groupRef || !point) {
    if (groupRef) {
      groupRef.visible = false;
    }

    return;
  }

  groupRef.position.set(point.x, 0.08, point.z);
  groupRef.visible = Boolean(state.started);
}

function updateRings(pressure) {
  if (!outerRing || !innerRing || !coreDisc) return;

  const outerPulse = 1 + Math.sin(time * 2.0) * 0.08 + pressure * 0.18;
  const innerPulse = 1 + Math.cos(time * 2.8) * 0.10 + pressure * 0.24;
  const corePulse = 1 + Math.sin(time * 3.4) * 0.12 + pressure * 0.20;

  outerRing.scale.setScalar(outerPulse);
  innerRing.scale.setScalar(innerPulse);
  coreDisc.scale.setScalar(corePulse);

  outerRing.rotation.z += 0.008 + pressure * 0.006;
  innerRing.rotation.z -= 0.014 + pressure * 0.008;

  outerRing.material.opacity = clamp(0.24 + pressure * 0.36, 0.16, 0.72);
  innerRing.material.opacity = clamp(0.32 + pressure * 0.45, 0.20, 0.88);
  coreDisc.material.opacity = clamp(0.22 + pressure * 0.34, 0.12, 0.66);
}

function updateBeam(pressure) {
  if (!verticalBeam) return;

  const beamScale = 0.8 + pressure * 0.55 + Math.sin(time * 2.2) * 0.08;

  verticalBeam.scale.set(beamScale, 1 + pressure * 0.35, beamScale);
  verticalBeam.material.opacity = clamp(0.06 + pressure * 0.22, 0.04, 0.34);

  verticalBeam.rotation.y += 0.01;
}

function updateSparks(pressure, colors) {
  for (let i = 0; i < sparks.length; i++) {
    const spark = sparks[i];

    spark.userData.angle += spark.userData.speed * (1 + pressure * 1.5);

    const angle = spark.userData.angle;
    const radius =
      spark.userData.radius +
      Math.sin(time * 1.8 + spark.userData.phase) * 0.08;

    const height =
      spark.userData.height +
      Math.sin(time * 2.4 + spark.userData.phase) * 0.08 +
      pressure * 0.18;

    spark.position.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );

    const pulse = 0.75 + Math.sin(time * 3.2 + spark.userData.phase) * 0.22;
    spark.scale.setScalar(clamp(pulse + pressure * 0.26, 0.45, 1.35));

    if (spark.material) {
      spark.material.color.setHex(i % 2 === 0 ? colors.main : colors.accent);
      spark.material.opacity = clamp(0.22 + pressure * 0.48, 0.18, 0.86);
    }
  }
}

function updateMaterialColors(colors) {
  if (outerRing?.material) {
    outerRing.material.color.setHex(colors.main);
  }

  if (innerRing?.material) {
    innerRing.material.color.setHex(colors.accent);
  }

  if (coreDisc?.material) {
    coreDisc.material.color.setHex(colors.accent);
  }

  if (verticalBeam?.material) {
    verticalBeam.material.color.setHex(colors.beam);
  }
}

function getSpawnPoint() {
  const path = Array.isArray(state.currentPath) ? state.currentPath : [];

  if (path.length === 0) return null;

  return normalizePoint(path[0]);
}

function normalizePoint(point) {
  if (!point) return null;

  if (Array.isArray(point) && point.length >= 2) {
    return {
      x: Number(point[0]),
      z: Number(point[1])
    };
  }

  if (typeof point.x === "number" && typeof point.z === "number") {
    return {
      x: point.x,
      z: point.z
    };
  }

  if (typeof point.x === "number" && typeof point.y === "number") {
    return {
      x: point.x,
      z: point.y
    };
  }

  return null;
}

function getPortalSignature() {
  const point = getSpawnPoint();

  if (!point) {
    return "none";
  }

  return [
    state.stageVersion,
    point.x.toFixed(2),
    point.z.toFixed(2),
    getCurrentStageEffect()?.id || "default"
  ].join("|");
}

function getSurgePressure() {
  let pressure = 0.34;

  if (state.waitingForNextWave) {
    pressure += 0.12;
  }

  if (state.waveActive) {
    pressure += 0.30;
  }

  if (state.enemies.length >= 4) {
    pressure += 0.14;
  }

  if (state.wave % 5 === 0) {
    pressure += 0.16;
  }

  if (state.baseHp <= Math.ceil((state.baseMaxHp || 10) * 0.4)) {
    pressure += 0.10;
  }

  return clamp(pressure, 0.22, 1);
}

function getStageColors() {
  const effect = getCurrentStageEffect();
  const id = effect?.id || "forest_balance";

  return COLOR_MAP[id] || COLOR_MAP.forest_balance;
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