import * as THREE from "three";
import { state } from "../game/state.js";

const GROUP_NAME = "BuildPlacementHologram";

let sceneRef = null;
let groupRef = null;

let baseRing = null;
let rangeRing = null;
let bodyGroup = null;
let statusDisc = null;

let lastTowerType = "";
let time = 0;

const TYPE_PROFILES = {
  normal: {
    bodyColor: 0x38bdf8,
    accentColor: 0x22d3ee,
    range: 2.25,
    bodyHeight: 0.55,
    bodyRadius: 0.22,
    barrelLength: 0.38
  },
  rapid: {
    bodyColor: 0x22c55e,
    accentColor: 0x86efac,
    range: 2.05,
    bodyHeight: 0.48,
    bodyRadius: 0.2,
    barrelLength: 0.34
  },
  sniper: {
    bodyColor: 0xfacc15,
    accentColor: 0xfbbf24,
    range: 3.35,
    bodyHeight: 0.68,
    bodyRadius: 0.18,
    barrelLength: 0.64
  },
  slow: {
    bodyColor: 0x60a5fa,
    accentColor: 0xbae6fd,
    range: 2.35,
    bodyHeight: 0.52,
    bodyRadius: 0.24,
    barrelLength: 0.32
  },
  splash: {
    bodyColor: 0xfb923c,
    accentColor: 0xf97316,
    range: 2.45,
    bodyHeight: 0.58,
    bodyRadius: 0.26,
    barrelLength: 0.42
  }
};

const VALID_COLOR = 0x22c55e;
const INVALID_COLOR = 0xfb7185;

export function initBuildHologram(scene) {
  sceneRef = scene;

  clearBuildHologram();

  groupRef = new THREE.Group();
  groupRef.name = GROUP_NAME;
  groupRef.visible = false;

  createBaseMeshes();
  rebuildTowerGhost();

  scene.add(groupRef);
}

export function updateBuildHologram() {
  if (!groupRef) return;

  time += 0.04;

  const tile = getSelectedTile();

  if (!shouldShow(tile)) {
    groupRef.visible = false;
    return;
  }

  const towerType = getTowerType();

  if (towerType !== lastTowerType) {
    rebuildTowerGhost();
  }

  const buildable = isTileBuildable(tile);
  const profile = getProfile();

  groupRef.visible = true;
  groupRef.position.set(tile.x, 0.08, tile.z);

  updateVisualState(buildable, profile);
}

export function resetBuildHologram() {
  time = 0;
  lastTowerType = "";

  if (!groupRef) return;

  rebuildTowerGhost();
  groupRef.visible = false;
}

export function clearBuildHologram() {
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
  baseRing = null;
  rangeRing = null;
  bodyGroup = null;
  statusDisc = null;
  lastTowerType = "";
}

function createBaseMeshes() {
  if (!groupRef) return;

  const ringMaterial = createHologramMaterial(VALID_COLOR, 0.58);
  const rangeMaterial = createHologramMaterial(VALID_COLOR, 0.18);
  const discMaterial = createHologramMaterial(VALID_COLOR, 0.16);

  baseRing = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.52, 48),
    ringMaterial
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = 0.03;

  rangeRing = new THREE.Mesh(
    new THREE.RingGeometry(1.0, 1.015, 96),
    rangeMaterial
  );
  rangeRing.rotation.x = -Math.PI / 2;
  rangeRing.position.y = 0.025;

  statusDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.46, 48),
    discMaterial
  );
  statusDisc.rotation.x = -Math.PI / 2;
  statusDisc.position.y = 0.018;

  groupRef.add(statusDisc);
  groupRef.add(rangeRing);
  groupRef.add(baseRing);
}

function rebuildTowerGhost() {
  if (!groupRef) return;

  if (bodyGroup) {
    groupRef.remove(bodyGroup);
    disposeObject(bodyGroup);
  }

  bodyGroup = new THREE.Group();

  const profile = getProfile();
  const bodyMaterial = createHologramMaterial(profile.bodyColor, 0.44);
  const accentMaterial = createHologramMaterial(profile.accentColor, 0.62);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(
      profile.bodyRadius,
      profile.bodyRadius * 1.15,
      profile.bodyHeight,
      24
    ),
    bodyMaterial
  );
  body.position.y = profile.bodyHeight / 2 + 0.08;

  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(
      profile.bodyRadius * 0.74,
      profile.bodyRadius * 0.92,
      0.18,
      24
    ),
    accentMaterial
  );
  head.position.y = profile.bodyHeight + 0.22;

  const barrel = new THREE.Mesh(
    new THREE.BoxGeometry(
      0.12,
      0.12,
      profile.barrelLength
    ),
    accentMaterial
  );
  barrel.position.set(0, profile.bodyHeight + 0.22, -profile.barrelLength * 0.48);

  if (getTowerType() === "sniper") {
    barrel.scale.set(0.75, 0.75, 1.25);
  }

  if (getTowerType() === "splash") {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 18, 18),
      accentMaterial
    );
    orb.position.y = profile.bodyHeight + 0.32;
    bodyGroup.add(orb);
  }

  if (getTowerType() === "slow") {
    const slowRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.025, 8, 32),
      accentMaterial
    );
    slowRing.rotation.x = Math.PI / 2;
    slowRing.position.y = profile.bodyHeight + 0.32;
    bodyGroup.add(slowRing);
  }

  bodyGroup.add(body);
  bodyGroup.add(head);
  bodyGroup.add(barrel);

  groupRef.add(bodyGroup);

  if (rangeRing) {
    rangeRing.scale.setScalar(profile.range);
  }

  lastTowerType = getTowerType();
}

function updateVisualState(buildable, profile) {
  const statusColor = buildable ? VALID_COLOR : INVALID_COLOR;
  const accentColor = buildable ? profile.accentColor : INVALID_COLOR;

  const pulse = 1 + Math.sin(time * 2.2) * 0.045;
  const warningPulse = buildable ? 0 : Math.abs(Math.sin(time * 3.8)) * 0.18;

  groupRef.scale.setScalar(pulse + warningPulse);

  if (baseRing?.material) {
    baseRing.material.color.setHex(statusColor);
    baseRing.material.opacity = buildable ? 0.56 : 0.72;
  }

  if (rangeRing?.material) {
    rangeRing.material.color.setHex(statusColor);
    rangeRing.material.opacity = buildable ? 0.14 : 0.24;
  }

  if (statusDisc?.material) {
    statusDisc.material.color.setHex(statusColor);
    statusDisc.material.opacity = buildable ? 0.10 : 0.18;
  }

  if (bodyGroup) {
    bodyGroup.rotation.y += buildable ? 0.012 : 0.028;

    for (const child of bodyGroup.children) {
      if (!child.material) continue;

      const useAccent =
        child.geometry?.type === "BoxGeometry" ||
        child.geometry?.type === "TorusGeometry" ||
        child.geometry?.type === "SphereGeometry";

      child.material.color.setHex(useAccent ? accentColor : profile.bodyColor);
      child.material.opacity = buildable ? 0.42 : 0.32;
    }
  }
}

function shouldShow(tile) {
  if (!tile) return false;
  if (!state.started) return false;
  if (state.gameOver) return false;
  if (state.paused) return false;
  if (state.selectedObject) return false;

  return true;
}

function getSelectedTile() {
  const tile = state.selectedTile;

  if (!tile) return null;

  const x = Number(tile.x);
  const z = Number(tile.z);

  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    return null;
  }

  return { x, z };
}

function isTileBuildable(tile) {
  if (!tile) return false;

  const keys = createTileKeys(tile);

  if (setHasAny(state.towerSet, keys)) {
    return false;
  }

  if (setHasAny(state.terrainBlockedSet, keys)) {
    return false;
  }

  return true;
}

function createTileKeys(tile) {
  const x = Math.round(tile.x);
  const z = Math.round(tile.z);

  return [
    `${x},${z}`,
    `${x}:${z}`,
    `${x}_${z}`,
    `${tile.x},${tile.z}`,
    `${tile.x}:${tile.z}`,
    `${tile.x}_${tile.z}`
  ];
}

function setHasAny(setLike, keys) {
  if (!setLike || typeof setLike.has !== "function") {
    return false;
  }

  for (const key of keys) {
    if (setLike.has(key)) {
      return true;
    }
  }

  return false;
}

function getTowerType() {
  return state.selectedTowerType || "normal";
}

function getProfile() {
  return TYPE_PROFILES[getTowerType()] || TYPE_PROFILES.normal;
}

function createHologramMaterial(color, opacity) {
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