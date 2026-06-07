import * as THREE from "three";
import { state } from "../game/state.js";

const GROUP_NAME = "TowerSynergyLinks";
const LINK_DISTANCE = 3.15;
const MAX_LINKS = 80;
const MAX_NODE_EFFECTS = 80;

let sceneRef = null;
let groupRef = null;
let linkObjects = [];
let nodeEffects = new Map();
let time = 0;

const COLORS = {
  normal: 0x38bdf8,
  rapid: 0x22c55e,
  sniper: 0xfacc15,
  slow: 0x60a5fa,
  splash: 0xfb923c,
  mixed: 0xc084fc,
  selected: 0xfacc15
};

export function initTowerSynergyLinks(scene) {
  sceneRef = scene;
  clearTowerSynergyLinks();

  groupRef = new THREE.Group();
  groupRef.name = GROUP_NAME;
  scene.add(groupRef);
}

export function updateTowerSynergyLinks() {
  if (!groupRef) return;

  time += 0.04;

  resetTowerSynergyData();
  rebuildLinks();
  syncNodeEffects();
  updateLinkVisuals();
  updateNodeEffects();
}

export function resetTowerSynergyLinks() {
  clearLinksOnly();

  for (const effect of nodeEffects.values()) {
    if (effect && effect.group) {
      disposeObject(effect.group);
    }
  }

  nodeEffects.clear();

  if (groupRef) {
    groupRef.clear();
  }

  time = 0;
}

export function clearTowerSynergyLinks() {
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
  linkObjects = [];
  nodeEffects.clear();
  time = 0;
}

function resetTowerSynergyData() {
  const towers = getValidTowers();

  for (const tower of towers) {
    if (!tower.userData) {
      tower.userData = {};
    }

    tower.userData.synergyLinks = 0;
    tower.userData.synergyLevel = 0;
    tower.userData.synergyBoost = 1;
  }
}

function rebuildLinks() {
  clearLinksOnly();

  const towers = getValidTowers();
  let created = 0;

  for (let i = 0; i < towers.length; i++) {
    for (let j = i + 1; j < towers.length; j++) {
      if (created >= MAX_LINKS) {
        applySynergyLevels();
        return;
      }

      const towerA = towers[i];
      const towerB = towers[j];
      const distance = towerA.position.distanceTo(towerB.position);

      if (distance > LINK_DISTANCE) continue;

      registerTowerSynergy(towerA);
      registerTowerSynergy(towerB);
      createLink(towerA, towerB, distance);

      created++;
    }
  }

  applySynergyLevels();
}

function clearLinksOnly() {
  if (!groupRef) {
    linkObjects = [];
    return;
  }

  for (const link of linkObjects) {
    if (link.line) {
      groupRef.remove(link.line);
      disposeObject(link.line);
    }

    if (link.orb) {
      groupRef.remove(link.orb);
      disposeObject(link.orb);
    }
  }

  linkObjects = [];
}

function createLink(towerA, towerB, distance) {
  if (!groupRef) return;

  const color = getLinkColor(towerA, towerB);

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(6);
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const line = new THREE.Line(geometry, material);
  line.frustumCulled = false;

  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 10, 10),
    createAdditiveMaterial(color, 0.52)
  );

  orb.userData.phase = Math.random() * Math.PI * 2;

  groupRef.add(line);
  groupRef.add(orb);

  linkObjects.push({
    towerA: towerA,
    towerB: towerB,
    line: line,
    orb: orb,
    distance: distance,
    color: color,
    phase: Math.random() * Math.PI * 2
  });
}

function registerTowerSynergy(tower) {
  if (!tower.userData) {
    tower.userData = {};
  }

  tower.userData.synergyLinks = Number(tower.userData.synergyLinks || 0) + 1;
}

function applySynergyLevels() {
  const towers = getValidTowers();

  for (const tower of towers) {
    const links = Number(tower.userData.synergyLinks || 0);
    const level = Math.min(3, links);

    tower.userData.synergyLevel = level;
    tower.userData.synergyBoost = 1 + level * 0.04;
  }
}

function syncNodeEffects() {
  if (!groupRef) return;

  const towers = getValidTowers();
  const liveTowers = new Set(towers);

  for (const tower of towers) {
    if (!nodeEffects.has(tower) && nodeEffects.size < MAX_NODE_EFFECTS) {
      nodeEffects.set(tower, createNodeEffect(tower));
    }
  }

  const trackedTowers = Array.from(nodeEffects.keys());

  for (const tower of trackedTowers) {
    if (!liveTowers.has(tower)) {
      const effect = nodeEffects.get(tower);

      if (effect && effect.group) {
        groupRef.remove(effect.group);
        disposeObject(effect.group);
      }

      nodeEffects.delete(tower);
    }
  }
}

function createNodeEffect(tower) {
  const color = getTowerColor(getTowerType(tower));

  const effectGroup = new THREE.Group();
  effectGroup.name = "TowerSynergyNode";

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.66, 48),
    createAdditiveMaterial(color, 0)
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.075;

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 12, 12),
    createAdditiveMaterial(color, 0)
  );
  core.position.y = getNodeHeight(tower);

  effectGroup.add(ring);
  effectGroup.add(core);
  groupRef.add(effectGroup);

  return {
    group: effectGroup,
    ring: ring,
    core: core,
    phase: Math.random() * Math.PI * 2
  };
}

function updateLinkVisuals() {
  for (const link of linkObjects) {
    if (!isValidTower(link.towerA) || !isValidTower(link.towerB)) continue;

    const selected =
      state.selectedObject === link.towerA ||
      state.selectedObject === link.towerB;

    const pulse = 0.5 + Math.sin(time * getLinkPulseSpeed() + link.phase) * 0.5;
    const activeBoost = state.waveActive ? 0.18 : 0;
    const selectedBoost = selected ? 0.32 : 0;

    updateLinePositions(link);

    if (link.line && link.line.material) {
      link.line.material.color.setHex(selected ? COLORS.selected : link.color);
      link.line.material.opacity = clamp(
        0.14 + pulse * 0.22 + activeBoost + selectedBoost,
        0.08,
        0.82
      );
    }

    updateFlowOrb(link, pulse, selected);
  }
}

function updateLinePositions(link) {
  if (!link.line || !link.line.geometry) return;

  const attribute = link.line.geometry.attributes.position;
  const positions = attribute.array;

  positions[0] = link.towerA.position.x;
  positions[1] = 0.42;
  positions[2] = link.towerA.position.z;

  positions[3] = link.towerB.position.x;
  positions[4] = 0.42;
  positions[5] = link.towerB.position.z;

  attribute.needsUpdate = true;
}

function updateFlowOrb(link, pulse, selected) {
  if (!link.orb) return;

  const flow = 0.5 + Math.sin(time * 1.7 + link.orb.userData.phase) * 0.5;

  const ax = link.towerA.position.x;
  const az = link.towerA.position.z;
  const bx = link.towerB.position.x;
  const bz = link.towerB.position.z;

  const x = ax + (bx - ax) * flow;
  const z = az + (bz - az) * flow;

  link.orb.position.set(x, 0.48 + pulse * 0.08, z);

  const scale = selected ? 1.32 : 0.9 + pulse * 0.32;
  link.orb.scale.setScalar(scale);

  if (link.orb.material) {
    link.orb.material.color.setHex(selected ? COLORS.selected : link.color);
    link.orb.material.opacity = clamp(
      0.22 + pulse * 0.42 + (state.waveActive ? 0.12 : 0),
      0.12,
      0.82
    );
  }
}

function updateNodeEffects() {
  const towers = Array.from(nodeEffects.keys());

  for (const tower of towers) {
    const effect = nodeEffects.get(tower);

    if (!effect || !isValidTower(tower)) continue;

    const links = Number(tower.userData.synergyLinks || 0);
    const level = Number(tower.userData.synergyLevel || 0);
    const selected = state.selectedObject === tower;

    effect.group.position.set(tower.position.x, 0, tower.position.z);

    const color = selected ? COLORS.selected : getTowerColor(getTowerType(tower));
    const pulse = 0.5 + Math.sin(time * 2.3 + effect.phase) * 0.5;
    const visiblePower = links > 0 ? 1 : 0;
    const scale = 1 + level * 0.12 + pulse * 0.06 + (selected ? 0.18 : 0);

    effect.ring.scale.setScalar(scale);
    effect.ring.rotation.z += 0.01 + level * 0.004;

    if (effect.ring.material) {
      effect.ring.material.color.setHex(color);
      effect.ring.material.opacity = clamp(
        visiblePower * (0.12 + level * 0.12 + pulse * 0.12) +
          (selected ? 0.28 : 0),
        0,
        0.76
      );
    }

    effect.core.position.y = getNodeHeight(tower);
    effect.core.scale.setScalar(0.8 + pulse * 0.24 + level * 0.16);

    if (effect.core.material) {
      effect.core.material.color.setHex(color);
      effect.core.material.opacity = clamp(
        visiblePower * (0.1 + level * 0.12 + pulse * 0.18) +
          (selected ? 0.24 : 0),
        0,
        0.84
      );
    }
  }
}

function getValidTowers() {
  const result = [];

  if (!Array.isArray(state.towers)) return result;

  for (const tower of state.towers) {
    if (isValidTower(tower)) {
      result.push(tower);
    }
  }

  return result;
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

  return "normal";
}

function getTowerColor(type) {
  return COLORS[type] || COLORS.normal;
}

function getLinkColor(towerA, towerB) {
  const typeA = getTowerType(towerA);
  const typeB = getTowerType(towerB);

  if (typeA === typeB) {
    return getTowerColor(typeA);
  }

  return COLORS.mixed;
}

function getNodeHeight(tower) {
  const data = tower.userData || {};
  const level = Number(data.level || 1);

  return 0.95 + Math.min(0.32, level * 0.06);
}

function getLinkPulseSpeed() {
  if (state.waveActive) return 3.4;

  return 2.1;
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}