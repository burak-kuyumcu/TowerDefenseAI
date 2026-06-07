import * as THREE from "three";
import { state } from "../game/state.js";

const GROUP_NAME = "EnemyTrailFx";
const MAX_TRAILS = 75;

let sceneRef = null;
let groupRef = null;

let enemyTrackers = new Map();
let trails = [];
let time = 0;

const COLORS = {
  normal: 0x38bdf8,
  fast: 0x22c55e,
  tank: 0xfacc15,
  boss: 0xfb7185,
  lowHp: 0xef4444
};

export function initEnemyTrailFx(scene) {
  sceneRef = scene;

  clearEnemyTrailFx();

  groupRef = new THREE.Group();
  groupRef.name = GROUP_NAME;

  scene.add(groupRef);
}

export function updateEnemyTrailFx() {
  if (!groupRef) return;

  time += 0.04;

  emitEnemyTrails();
  updateTrails();
}

export function resetEnemyTrailFx() {
  enemyTrackers.clear();

  for (const trail of trails) {
    disposeObject(trail.mesh);
  }

  trails = [];

  if (groupRef) {
    groupRef.clear();
  }

  time = 0;
}

export function clearEnemyTrailFx() {
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
  enemyTrackers.clear();
  trails = [];
}

function emitEnemyTrails() {
  if (!state.waveActive) return;
  if (!Array.isArray(state.enemies)) return;

  const liveEnemies = new Set();

  for (const enemy of state.enemies) {
    if (!isValidEnemy(enemy)) continue;

    liveEnemies.add(enemy);

    if (!enemyTrackers.has(enemy)) {
      enemyTrackers.set(enemy, {
        lastPosition: enemy.position.clone(),
        emitTimer: randomInt(4, 12)
      });
    }

    const tracker = enemyTrackers.get(enemy);
    const profile = getEnemyProfile(enemy);
    const movedDistance = tracker.lastPosition.distanceTo(enemy.position);

    tracker.emitTimer--;

    if (tracker.emitTimer <= 0 && movedDistance >= profile.minDistance) {
      spawnTrail(enemy, profile);

      tracker.lastPosition.copy(enemy.position);
      tracker.emitTimer = profile.interval;
    }
  }

  const trackedEnemies = Array.from(enemyTrackers.keys());

  for (const enemy of trackedEnemies) {
    if (!liveEnemies.has(enemy)) {
      enemyTrackers.delete(enemy);
    }
  }
}

function spawnTrail(enemy, profile) {
  if (!groupRef) return;
  if (!enemy || !enemy.position) return;

  if (trails.length >= MAX_TRAILS) {
    const oldTrail = trails.shift();

    if (oldTrail) {
      groupRef.remove(oldTrail.mesh);
      disposeObject(oldTrail.mesh);
    }
  }

  const hpRatio = getHpRatio(enemy);
  const color = hpRatio <= 0.35 ? COLORS.lowHp : profile.color;

  const geometry = new THREE.CircleGeometry(profile.radius, 22);
  const material = createAdditiveMaterial(color, profile.opacity);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = Math.random() * Math.PI * 2;
  mesh.position.set(enemy.position.x, 0.038, enemy.position.z);
  mesh.scale.set(profile.scaleX, profile.scaleY, 1);

  groupRef.add(mesh);

  trails.push({
    mesh: mesh,
    life: 1,
    decay: profile.decay,
    grow: profile.grow,
    spin: profile.spin,
    baseOpacity: profile.opacity
  });
}

function updateTrails() {
  for (let i = trails.length - 1; i >= 0; i--) {
    const trail = trails[i];

    trail.life -= trail.decay;

    trail.mesh.scale.x += trail.grow;
    trail.mesh.scale.y += trail.grow * 0.45;
    trail.mesh.rotation.z += trail.spin;

    if (trail.mesh.material) {
      trail.mesh.material.opacity = clamp(
        trail.life * trail.baseOpacity,
        0,
        trail.baseOpacity
      );
    }

    if (trail.life <= 0) {
      groupRef.remove(trail.mesh);
      disposeObject(trail.mesh);
      trails.splice(i, 1);
    }
  }
}

function isValidEnemy(enemy) {
  if (!enemy) return false;
  if (!enemy.parent) return false;
  if (!enemy.position) return false;

  const data = enemy.userData || {};

  if (data.dead) return false;
  if (data.removed) return false;
  if (data.reachedGoal) return false;

  return true;
}

function getEnemyProfile(enemy) {
  const type = getEnemyType(enemy);

  if (type === "boss") {
    return {
      color: COLORS.boss,
      radius: 0.14,
      opacity: 0.18,
      interval: 10,
      minDistance: 0.22,
      decay: 0.05,
      grow: 0.002,
      spin: 0.004,
      scaleX: 1.28,
      scaleY: 0.54
    };
  }

  if (type === "tank") {
    return {
      color: COLORS.tank,
      radius: 0.105,
      opacity: 0.13,
      interval: 14,
      minDistance: 0.25,
      decay: 0.065,
      grow: 0.0016,
      spin: 0.002,
      scaleX: 1.12,
      scaleY: 0.5
    };
  }

  if (type === "fast") {
    return {
      color: COLORS.fast,
      radius: 0.09,
      opacity: 0.15,
      interval: 8,
      minDistance: 0.22,
      decay: 0.075,
      grow: 0.0018,
      spin: 0.006,
      scaleX: 1.18,
      scaleY: 0.46
    };
  }

  return {
    color: COLORS.normal,
    radius: 0.095,
    opacity: 0.12,
    interval: 12,
    minDistance: 0.24,
    decay: 0.07,
    grow: 0.0015,
    spin: 0.003,
    scaleX: 1.06,
    scaleY: 0.48
  };
}

function getEnemyType(enemy) {
  const data = enemy.userData || {};

  const rawType =
    data.type ||
    data.enemyType ||
    data.kind ||
    enemy.name ||
    "";

  const text = String(rawType).toLowerCase();
  const maxHp = Number(data.maxHp || data.maxHealth || 0);
  const speed = Number(data.speed || 0);

  if (text.indexOf("boss") !== -1 || data.isBoss || data.boss) {
    return "boss";
  }

  if (
    text.indexOf("tank") !== -1 ||
    text.indexOf("heavy") !== -1 ||
    text.indexOf("armor") !== -1 ||
    text.indexOf("armored") !== -1 ||
    maxHp >= 120
  ) {
    return "tank";
  }

  if (
    text.indexOf("fast") !== -1 ||
    text.indexOf("runner") !== -1 ||
    text.indexOf("speed") !== -1 ||
    speed > 0.045
  ) {
    return "fast";
  }

  return "normal";
}

function getHpRatio(enemy) {
  const data = enemy.userData || {};

  const hp = firstValidNumber(
    data.hp,
    data.health,
    data.currentHp,
    data.currentHealth,
    data.life,
    1
  );

  const maxHp = firstValidNumber(
    data.maxHp,
    data.maxHealth,
    data.totalHp,
    data.totalHealth,
    data.maxLife,
    hp,
    1
  );

  if (!Number.isFinite(hp)) return 1;
  if (!Number.isFinite(maxHp)) return 1;
  if (maxHp <= 0) return 1;

  return clamp(hp / maxHp, 0, 1);
}

function firstValidNumber() {
  for (let i = 0; i < arguments.length; i++) {
    const value = Number(arguments[i]);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return 1;
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

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}