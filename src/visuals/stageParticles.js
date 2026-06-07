import * as THREE from "three";
import { state } from "../game/state.js";
import { getCurrentStage, getCurrentStageEffect } from "../game/stages.js";

const PARTICLE_COUNT = 180;
const FIELD_SIZE = 22;
const HALF_FIELD = FIELD_SIZE / 2;
const EDGE_PADDING = 0.35;

let particlePoints = null;
let particleGeometry = null;
let particleMaterial = null;

let positions = null;
let velocities = [];
let seeds = [];

let activeProfileKey = "";
let sceneRef = null;
let time = 0;

const PROFILE_MAP = {
  forest: {
    key: "forest",
    color: 0x4ade80,
    size: 0.048,
    opacity: 0.42,
    heightMin: 0.55,
    heightMax: 2.6,
    driftX: 0.0015,
    driftZ: 0.001,
    verticalSpeed: 0.0015,
    turbulence: 0.008,
    mode: "float",
    spread: 1.0
  },
  canyon: {
    key: "canyon",
    color: 0xd6a35a,
    size: 0.042,
    opacity: 0.36,
    heightMin: 0.25,
    heightMax: 1.55,
    driftX: 0.026,
    driftZ: 0.004,
    verticalSpeed: 0.0005,
    turbulence: 0.006,
    mode: "wind",
    spread: 1.12
  },
  frozen: {
    key: "frozen",
    color: 0xbae6fd,
    size: 0.047,
    opacity: 0.52,
    heightMin: 0.9,
    heightMax: 4.1,
    driftX: -0.004,
    driftZ: 0.01,
    verticalSpeed: -0.016,
    turbulence: 0.004,
    mode: "fall",
    spread: 1.02
  },
  ancient: {
    key: "ancient",
    color: 0xa8a29e,
    size: 0.045,
    opacity: 0.32,
    heightMin: 0.35,
    heightMax: 2.25,
    driftX: 0.003,
    driftZ: -0.003,
    verticalSpeed: 0.002,
    turbulence: 0.006,
    mode: "dust",
    spread: 1.08
  },
  lava: {
    key: "lava",
    color: 0xfb923c,
    size: 0.062,
    opacity: 0.63,
    heightMin: 0.35,
    heightMax: 2.85,
    driftX: 0.002,
    driftZ: -0.002,
    verticalSpeed: 0.021,
    turbulence: 0.008,
    mode: "rise",
    spread: 0.95
  },
  swamp: {
    key: "swamp",
    color: 0x84cc16,
    size: 0.052,
    opacity: 0.40,
    heightMin: 0.28,
    heightMax: 1.9,
    driftX: -0.001,
    driftZ: 0.001,
    verticalSpeed: 0.004,
    turbulence: 0.007,
    mode: "float",
    spread: 1.0
  },
  crystal: {
    key: "crystal",
    color: 0xc084fc,
    size: 0.055,
    opacity: 0.56,
    heightMin: 0.7,
    heightMax: 3.4,
    driftX: 0.002,
    driftZ: 0.002,
    verticalSpeed: 0.009,
    turbulence: 0.007,
    mode: "spark",
    spread: 0.92
  }
};

export function initStageParticles(scene) {
  sceneRef = scene;

  clearStageParticles();

  positions = new Float32Array(PARTICLE_COUNT * 3);
  velocities = [];
  seeds = [];

  const profile = getCurrentParticleProfile();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    velocities.push(createVelocity(profile));
    seeds.push(Math.random() * 1000);
    resetParticleAnywhere(i, profile);
  }

  particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  particleMaterial = new THREE.PointsMaterial({
    color: profile.color,
    size: profile.size,
    transparent: true,
    opacity: profile.opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  particlePoints = new THREE.Points(particleGeometry, particleMaterial);
  particlePoints.name = "StageAmbientParticles";
  particlePoints.frustumCulled = false;

  scene.add(particlePoints);

  activeProfileKey = profile.key;
}

export function updateStageParticles() {
  if (!particlePoints || !particleGeometry || !particleMaterial || !positions) {
    return;
  }

  time += 0.016;

  const profile = getCurrentParticleProfile();

  if (profile.key !== activeProfileKey) {
    applyParticleProfile(profile);
  }

  const waveBoost = state.waveActive ? 1.22 : 0.78;
  const bossBoost = state.wave % 5 === 0 && state.waveActive ? 1.35 : 1.0;
  const speedMultiplier = waveBoost * bossBoost;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    updateParticle(i, profile, speedMultiplier);
  }

  particleGeometry.attributes.position.needsUpdate = true;

  particleMaterial.opacity = getTargetOpacity(profile);
  particleMaterial.size = getTargetSize(profile);
}

export function resetStageParticles() {
  time = 0;

  if (!particlePoints || !particleGeometry || !positions) return;

  const profile = getCurrentParticleProfile();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    velocities[i] = createVelocity(profile);
    resetParticleAnywhere(i, profile);
  }

  applyParticleProfile(profile);
  particleGeometry.attributes.position.needsUpdate = true;
}

export function clearStageParticles() {
  if (particlePoints && sceneRef) {
    sceneRef.remove(particlePoints);
  }

  if (particleGeometry) {
    particleGeometry.dispose();
  }

  if (particleMaterial) {
    particleMaterial.dispose();
  }

  particlePoints = null;
  particleGeometry = null;
  particleMaterial = null;

  positions = null;
  velocities = [];
  seeds = [];
  activeProfileKey = "";
}

function updateParticle(index, profile, speedMultiplier) {
  const bufferIndex = index * 3;
  const seed = seeds[index] || 0;
  const velocity = velocities[index] || createVelocity(profile);

  const windX = Math.sin(time * 0.9 + seed) * profile.turbulence;
  const windZ = Math.cos(time * 0.75 + seed * 0.6) * profile.turbulence;
  const flutterY = Math.sin(time * 1.45 + seed * 1.3) * profile.turbulence * 0.45;

  positions[bufferIndex] +=
    (profile.driftX + velocity.x + windX) * speedMultiplier;

  positions[bufferIndex + 1] +=
    (profile.verticalSpeed + velocity.y + flutterY) * speedMultiplier;

  positions[bufferIndex + 2] +=
    (profile.driftZ + velocity.z + windZ) * speedMultiplier;

  keepParticleDistributed(index, profile);
}

function keepParticleDistributed(index, profile) {
  const bufferIndex = index * 3;
  const spread = HALF_FIELD * profile.spread;

  const x = positions[bufferIndex];
  const y = positions[bufferIndex + 1];
  const z = positions[bufferIndex + 2];

  if (x > spread + EDGE_PADDING) {
    positions[bufferIndex] = -spread + randomRange(0, 1.2);
    positions[bufferIndex + 2] = randomRange(-spread, spread);
    positions[bufferIndex + 1] = getRespawnHeight(profile);
    return;
  }

  if (x < -spread - EDGE_PADDING) {
    positions[bufferIndex] = spread - randomRange(0, 1.2);
    positions[bufferIndex + 2] = randomRange(-spread, spread);
    positions[bufferIndex + 1] = getRespawnHeight(profile);
    return;
  }

  if (z > spread + EDGE_PADDING) {
    positions[bufferIndex + 2] = -spread + randomRange(0, 1.2);
    positions[bufferIndex] = randomRange(-spread, spread);
    positions[bufferIndex + 1] = getRespawnHeight(profile);
    return;
  }

  if (z < -spread - EDGE_PADDING) {
    positions[bufferIndex + 2] = spread - randomRange(0, 1.2);
    positions[bufferIndex] = randomRange(-spread, spread);
    positions[bufferIndex + 1] = getRespawnHeight(profile);
    return;
  }

  if (y > profile.heightMax + 0.9) {
    positions[bufferIndex + 1] = profile.heightMin + randomRange(0, 0.45);
    positions[bufferIndex] = randomRange(-spread, spread);
    positions[bufferIndex + 2] = randomRange(-spread, spread);
    return;
  }

  if (y < profile.heightMin - 0.7) {
    positions[bufferIndex + 1] = profile.heightMax - randomRange(0, 0.45);
    positions[bufferIndex] = randomRange(-spread, spread);
    positions[bufferIndex + 2] = randomRange(-spread, spread);
  }
}

function resetParticleAnywhere(index, profile) {
  if (!positions) return;

  const bufferIndex = index * 3;
  const spread = HALF_FIELD * profile.spread;

  positions[bufferIndex] = randomRange(-spread, spread);
  positions[bufferIndex + 1] = randomRange(profile.heightMin, profile.heightMax);
  positions[bufferIndex + 2] = randomRange(-spread, spread);
}

function getRespawnHeight(profile) {
  if (profile.mode === "fall") {
    return profile.heightMax - randomRange(0, 0.5);
  }

  if (profile.mode === "rise") {
    return profile.heightMin + randomRange(0, 0.35);
  }

  return randomRange(profile.heightMin, profile.heightMax);
}

function createVelocity(profile) {
  const base = profile.mode === "wind" ? 0.004 : 0.0025;

  return {
    x: randomRange(-base, base),
    y: randomRange(-base * 0.45, base * 0.45),
    z: randomRange(-base, base)
  };
}

function applyParticleProfile(profile) {
  activeProfileKey = profile.key;

  if (particleMaterial) {
    particleMaterial.color.setHex(profile.color);
    particleMaterial.size = profile.size;
    particleMaterial.opacity = profile.opacity;
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    velocities[i] = createVelocity(profile);
    resetParticleAnywhere(i, profile);
  }

  if (particleGeometry) {
    particleGeometry.attributes.position.needsUpdate = true;
  }
}

function getCurrentParticleProfile() {
  const stage = getCurrentStage();
  const effect = getCurrentStageEffect();

  const text = (
    String(stage?.name || "") +
    " " +
    String(stage?.id || "") +
    " " +
    String(effect?.id || "") +
    " " +
    String(effect?.label || "")
  ).toLowerCase();

  if (text.includes("canyon") || text.includes("wind")) {
    return PROFILE_MAP.canyon;
  }

  if (text.includes("frozen") || text.includes("cryo") || text.includes("ice")) {
    return PROFILE_MAP.frozen;
  }

  if (
    text.includes("ancient") ||
    text.includes("armor") ||
    text.includes("ruin")
  ) {
    return PROFILE_MAP.ancient;
  }

  if (text.includes("lava") || text.includes("thermal") || text.includes("heat")) {
    return PROFILE_MAP.lava;
  }

  if (text.includes("swamp") || text.includes("mud")) {
    return PROFILE_MAP.swamp;
  }

  if (text.includes("crystal") || text.includes("resonance")) {
    return PROFILE_MAP.crystal;
  }

  return PROFILE_MAP.forest;
}

function getTargetOpacity(profile) {
  let opacity = profile.opacity;

  if (state.waveActive) {
    opacity += 0.07;
  }

  if (state.wave % 5 === 0 && state.waveActive) {
    opacity += 0.08;
  }

  if (state.paused) {
    opacity *= 0.42;
  }

  return clamp(opacity, 0.10, 0.78);
}

function getTargetSize(profile) {
  let size = profile.size;

  if (state.waveActive) {
    size *= 1.06;
  }

  if (state.wave % 5 === 0 && state.waveActive) {
    size *= 1.12;
  }

  return size;
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}