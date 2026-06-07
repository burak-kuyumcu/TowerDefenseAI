import * as THREE from "three";
import { state } from "../game/state.js";
import { getCurrentStageEffect } from "../game/stages.js";

const MARKER_COUNT = 9;
const FLOW_DOT_COUNT = 6;
const GROUP_NAME = "PathPressureBeacons";

let sceneRef = null;
let groupRef = null;

let markerMeshes = [];
let flowDots = [];

let pathCache = null;
let lastSignature = "";
let time = 0;

const STAGE_COLORS = {
  forest_balance: {
    marker: 0x38bdf8,
    flow: 0x22c55e
  },
  canyon_wind: {
    marker: 0xfbbf24,
    flow: 0xf97316
  },
  frozen_chill: {
    marker: 0xbae6fd,
    flow: 0x38bdf8
  },
  ancient_armor: {
    marker: 0xd6d3d1,
    flow: 0xfacc15
  },
  lava_pressure: {
    marker: 0xfb7185,
    flow: 0xfb923c
  },
  swamp_mud: {
    marker: 0xa3e635,
    flow: 0x84cc16
  },
  crystal_resonance: {
    marker: 0xc084fc,
    flow: 0x22d3ee
  }
};

export function initPathPressure(scene) {
  sceneRef = scene;

  clearPathPressure();

  groupRef = new THREE.Group();
  groupRef.name = GROUP_NAME;
  groupRef.visible = false;

  scene.add(groupRef);

  rebuildPathPressure();
}

export function updatePathPressure() {
  if (!groupRef) return;

  time += 0.035;

  const signature = getPathSignature();

  if (signature !== lastSignature) {
    rebuildPathPressure();
  }

  if (!pathCache || pathCache.points.length < 2) {
    groupRef.visible = false;
    return;
  }

  groupRef.visible = Boolean(state.started);

  if (!groupRef.visible) return;

  const pressure = getPressureLevel();
  const effectColors = getStageColors();

  updateMarkers(pressure, effectColors);
  updateFlowDots(pressure, effectColors);
}

export function resetPathPressure() {
  lastSignature = "";
  rebuildPathPressure();
}

export function clearPathPressure() {
  if (groupRef && sceneRef) {
    sceneRef.remove(groupRef);
  }

  for (const marker of markerMeshes) {
    disposeObject(marker);
  }

  for (const dot of flowDots) {
    disposeObject(dot);
  }

  markerMeshes = [];
  flowDots = [];

  if (groupRef) {
    groupRef.clear();
  }

  groupRef = null;
  pathCache = null;
  lastSignature = "";
}

function rebuildPathPressure() {
  if (!sceneRef) return;

  if (!groupRef) {
    groupRef = new THREE.Group();
    groupRef.name = GROUP_NAME;
    sceneRef.add(groupRef);
  }

  groupRef.clear();

  markerMeshes = [];
  flowDots = [];

  const points = getNormalizedPathPoints();

  pathCache = buildPathCache(points);
  lastSignature = getPathSignature();

  if (!pathCache || pathCache.points.length < 2) {
    groupRef.visible = false;
    return;
  }

  createMarkers();
  createFlowDots();

  groupRef.visible = Boolean(state.started);
}

function createMarkers() {
  const colors = getStageColors();

  const ringGeometry = new THREE.RingGeometry(0.18, 0.26, 36);
  const coreGeometry = new THREE.CircleGeometry(0.055, 24);

  for (let i = 0; i < MARKER_COUNT; i++) {
    const markerGroup = new THREE.Group();

    const t = MARKER_COUNT === 1 ? 0 : i / (MARKER_COUNT - 1);
    const point = getPointAtNormalizedDistance(t);

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: colors.marker,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    const coreMaterial = new THREE.MeshBasicMaterial({
      color: colors.flow,
      transparent: true,
      opacity: 0.74,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;

    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.rotation.x = -Math.PI / 2;
    core.position.y = 0.008;

    markerGroup.add(ring);
    markerGroup.add(core);

    markerGroup.position.set(point.x, 0.075, point.z);

    markerGroup.userData.phase = Math.random() * Math.PI * 2;
    markerGroup.userData.index = i;
    markerGroup.userData.ring = ring;
    markerGroup.userData.core = core;

    groupRef.add(markerGroup);
    markerMeshes.push(markerGroup);
  }
}

function createFlowDots() {
  const colors = getStageColors();

  const dotGeometry = new THREE.SphereGeometry(0.085, 12, 12);

  for (let i = 0; i < FLOW_DOT_COUNT; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: colors.flow,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const dot = new THREE.Mesh(dotGeometry, material);

    dot.userData.offset = i / FLOW_DOT_COUNT;
    dot.userData.phase = Math.random() * Math.PI * 2;

    groupRef.add(dot);
    flowDots.push(dot);
  }
}

function updateMarkers(pressure, colors) {
  for (const marker of markerMeshes) {
    const phase = marker.userData.phase || 0;
    const index = marker.userData.index || 0;

    const wave = Math.sin(time * 1.7 + phase + index * 0.35);
    const pulse = 1 + pressure * 0.22 + wave * 0.08;

    marker.scale.setScalar(pulse);

    const ring = marker.userData.ring;
    const core = marker.userData.core;

    if (ring?.material) {
      ring.material.color.setHex(colors.marker);
      ring.material.opacity = clamp(0.22 + pressure * 0.32 + wave * 0.08, 0.14, 0.72);
    }

    if (core?.material) {
      core.material.color.setHex(colors.flow);
      core.material.opacity = clamp(0.38 + pressure * 0.42 + wave * 0.08, 0.18, 0.92);
    }
  }
}

function updateFlowDots(pressure, colors) {
  const speed = state.waveActive ? 0.115 : 0.045;
  const bossBoost = state.wave % 5 === 0 && state.waveActive ? 0.045 : 0;

  for (const dot of flowDots) {
    const offset = dot.userData.offset || 0;
    const phase = dot.userData.phase || 0;

    const t = (offset + time * (speed + bossBoost)) % 1;
    const point = getPointAtNormalizedDistance(t);

    const hover = 0.12 + Math.sin(time * 2.4 + phase) * 0.035;

    dot.position.set(point.x, hover, point.z);

    const sizePulse = 1 + Math.sin(time * 2.7 + phase) * 0.12 + pressure * 0.18;
    dot.scale.setScalar(sizePulse);

    if (dot.material) {
      dot.material.color.setHex(colors.flow);
      dot.material.opacity = state.waveActive
        ? clamp(0.55 + pressure * 0.34, 0.4, 0.92)
        : 0.34;
    }
  }
}

function getPressureLevel() {
  let pressure = 0.35;

  if (state.waveActive) pressure += 0.25;
  if (state.enemies.length >= 4) pressure += 0.14;
  if (state.enemies.length >= 8) pressure += 0.18;
  if (state.wave % 5 === 0 && state.waveActive) pressure += 0.18;
  if (state.baseHp <= Math.ceil((state.baseMaxHp || 10) * 0.4)) pressure += 0.12;

  return clamp(pressure, 0.25, 1);
}

function getStageColors() {
  const effect = getCurrentStageEffect();
  const id = effect?.id || "forest_balance";

  return STAGE_COLORS[id] || STAGE_COLORS.forest_balance;
}

function getNormalizedPathPoints() {
  const path = Array.isArray(state.currentPath) ? state.currentPath : [];

  return path
    .map(normalizePoint)
    .filter(Boolean);
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

function buildPathCache(points) {
  if (!points || points.length < 2) {
    return null;
  }

  const segments = [];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];

    const length = Math.hypot(end.x - start.x, end.z - start.z);

    if (length <= 0.001) continue;

    segments.push({
      start,
      end,
      length,
      startDistance: totalLength
    });

    totalLength += length;
  }

  if (segments.length === 0) {
    return null;
  }

  return {
    points,
    segments,
    totalLength
  };
}

function getPointAtNormalizedDistance(t) {
  if (!pathCache) {
    return { x: 0, z: 0 };
  }

  const distance = clamp(t, 0, 1) * pathCache.totalLength;

  return getPointAtDistance(distance);
}

function getPointAtDistance(distance) {
  if (!pathCache) {
    return { x: 0, z: 0 };
  }

  const clampedDistance = clamp(distance, 0, pathCache.totalLength);

  let selectedSegment = pathCache.segments[pathCache.segments.length - 1];

  for (const segment of pathCache.segments) {
    const segmentEnd = segment.startDistance + segment.length;

    if (clampedDistance <= segmentEnd) {
      selectedSegment = segment;
      break;
    }
  }

  const localDistance = clampedDistance - selectedSegment.startDistance;
  const ratio = clamp(localDistance / selectedSegment.length, 0, 1);

  return {
    x: lerp(selectedSegment.start.x, selectedSegment.end.x, ratio),
    z: lerp(selectedSegment.start.z, selectedSegment.end.z, ratio)
  };
}

function getPathSignature() {
  const path = getNormalizedPathPoints();

  return [
    state.stageVersion,
    path.length,
    path
      .map((point) => `${point.x.toFixed(2)},${point.z.toFixed(2)}`)
      .join("|")
  ].join("::");
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

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}