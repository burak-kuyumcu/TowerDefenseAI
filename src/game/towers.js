import * as THREE from "three";
import { state } from "./state.js";
import { shoot } from "./projectiles.js";
import { createGameMaterial } from "./materials.js";
import { createTowerLabel, updateTowerLabelText } from "./towerLabels.js";
import { getPlacementState } from "./placement.js";

const TARGET_MODES = ["nearest", "first", "strongest", "weakest"];

export function placeTower(scene) {
  if (getPlacementState() !== "valid") return;

  const key = `${state.selectedTile.x},${state.selectedTile.z}`;
  const config = getTowerConfig(state.selectedTowerType);

  const tower = createTowerModel(state.selectedTowerType, config);

  const visualHead = tower.userData.head ?? null;
  const visualCore = tower.userData.core ?? null;
  const visualBarrel = tower.userData.barrel ?? null;

  tower.position.set(state.selectedTile.x, 0, state.selectedTile.z);

  tower.userData = {
    type: state.selectedTowerType,
    level: 1,
    cooldown: 0,

    head: visualHead,
    core: visualCore,
    barrel: visualBarrel,

    range: config.range,
    fireRate: config.fireRate,
    damage: config.damage,
    critChance: config.critChance,

    occupiedKey: key,
    selectable: true,
    baseColor: config.color,
    targetMode: config.defaultTargetMode ?? "nearest",

    slowEffect: config.slowEffect ?? null,
    splashEffect: config.splashEffect ?? null,

    slowTimer: 0,
    slowMultiplier: 1
  };

  scene.add(tower);
  state.towers.push(tower);
  state.towerSet.add(key);

  createTowerLabel(scene, tower);

  state.gold -= config.cost;

  spawnPlaceEffect(scene, tower.position);
}

export function updateTowers(scene) {
  for (const tower of state.towers) {
    updateTowerSlowState(tower);
    animateTowerIdle(tower);

    if (tower.userData.cooldown > 0) {
      tower.userData.cooldown--;
      continue;
    }

    const target = findTargetEnemy(tower);

    if (target) {
      aimTowerAtTarget(tower, target);
      shoot(scene, tower, target);

      const slowMultiplier = tower.userData.slowMultiplier ?? 1;

      tower.userData.cooldown = Math.floor(
        tower.userData.fireRate * slowMultiplier
      );
    }
  }
}

export function cycleSelectedTowerTargetMode() {
  if (!state.selectedObject) return;
  if (!state.towers.includes(state.selectedObject)) return;

  const tower = state.selectedObject;
  const currentMode = tower.userData.targetMode ?? "nearest";
  const currentIndex = TARGET_MODES.indexOf(currentMode);

  const nextIndex = (currentIndex + 1) % TARGET_MODES.length;
  tower.userData.targetMode = TARGET_MODES[nextIndex];

  updateTowerLabelText(tower);
}

function updateTowerSlowState(tower) {
  const meshes = [];

  tower.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });

  if (tower.userData.slowTimer > 0) {
    tower.userData.slowTimer--;
    tower.userData.slowMultiplier = 1.8;

    for (const mesh of meshes) {
      if (mesh.material?.emissive) {
        mesh.material.emissive.set(0x581c87);
      }
    }

    return;
  }

  tower.userData.slowMultiplier = 1;

  for (const mesh of meshes) {
    if (mesh.material?.emissive) {
      mesh.material.emissive.set(0x000000);
    }
  }
}

export function getClickedTower(raycaster, mouse, renderer, camera, clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const meshes = [];

  for (const tower of state.towers) {
    tower.traverse((child) => {
      if (child.isMesh) {
        child.userData.parentTower = tower;
        meshes.push(child);
      }
    });
  }

  const hits = raycaster.intersectObjects(meshes);
  return hits.length > 0 ? hits[0].object.userData.parentTower : null;
}

export function updateTowerOccupiedKey(tower) {
  if (!state.towers.includes(tower)) return;

  const oldKey = tower.userData.occupiedKey;
  const newKey = `${Math.round(tower.position.x)},${Math.round(tower.position.z)}`;

  if (oldKey === newKey) return;

  if (oldKey) {
    state.towerSet.delete(oldKey);
  }

  tower.userData.occupiedKey = newKey;
  state.towerSet.add(newKey);
}

function getEnemiesInRange(tower) {
  return state.enemies.filter((enemy) => {
    if (enemy.userData.dead) return false;

    const distance = tower.position.distanceTo(enemy.position);
    return distance <= tower.userData.range;
  });
}

function findTargetEnemy(tower) {
  const enemies = getEnemiesInRange(tower);

  if (enemies.length === 0) return null;

  const mode = tower.userData.targetMode ?? "nearest";

  if (mode === "first") {
    return enemies.sort((a, b) => {
      if (b.userData.index !== a.userData.index) {
        return b.userData.index - a.userData.index;
      }

      return (
        a.position.distanceTo(tower.position) -
        b.position.distanceTo(tower.position)
      );
    })[0];
  }

  if (mode === "strongest") {
    return enemies.sort((a, b) => b.userData.health - a.userData.health)[0];
  }

  if (mode === "weakest") {
    return enemies.sort((a, b) => a.userData.health - b.userData.health)[0];
  }

  return enemies.sort((a, b) => {
    return (
      a.position.distanceTo(tower.position) -
      b.position.distanceTo(tower.position)
    );
  })[0];
}

function aimTowerAtTarget(tower, target) {
  const head = tower.userData.head;
  if (!head) return;

  const dx = target.position.x - tower.position.x;
  const dz = target.position.z - tower.position.z;

  head.rotation.y = Math.atan2(dx, dz);
}

function animateTowerIdle(tower) {
  const core = tower.userData.core;

  if (core) {
    core.rotation.y += 0.04;
    core.position.y = 1.12 + Math.sin(Date.now() * 0.004) * 0.08;
  }

  const barrel = tower.userData.barrel;

  if (barrel && tower.userData.cooldown <= 2) {
    const pulse = 1 + Math.sin(Date.now() * 0.04) * 0.08;
    barrel.scale.y = pulse;
  } else if (barrel) {
    barrel.scale.y = 1;
  }
}

function createTowerModel(type, config) {
  if (type === "rapid") return createRapidTower(config);
  if (type === "sniper") return createSniperTower(config);
  if (type === "slow") return createSlowTower(config);
  if (type === "splash") return createSplashTower(config);

  return createNormalTower(config);
}

function createNormalTower(config) {
  const group = new THREE.Group();

  const base = mesh(new THREE.CylinderGeometry(0.48, 0.58, 0.25, 18), 0x1e3a8a);
  base.position.y = 0.13;

  const body = mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.75, 18), config.color);
  body.position.y = 0.62;

  const head = new THREE.Group();
  head.position.y = 1.05;

  const turret = mesh(new THREE.BoxGeometry(0.62, 0.34, 0.5), 0x1d4ed8);

  const barrel = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.85, 12), 0x111827);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.58;

  head.add(turret, barrel);
  group.add(base, body, head);

  group.userData.head = head;
  group.userData.barrel = barrel;

  return group;
}

function createRapidTower(config) {
  const group = new THREE.Group();

  const base = mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.22, 20), 0x0e7490);
  base.position.y = 0.11;

  const body = mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.58, 20), config.color);
  body.position.y = 0.5;

  const head = new THREE.Group();
  head.position.y = 0.86;

  const turret = mesh(new THREE.BoxGeometry(0.6, 0.26, 0.42), 0x0284c7);

  const barrelLeft = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.8, 10), 0x0f172a);
  barrelLeft.rotation.x = Math.PI / 2;
  barrelLeft.position.set(-0.15, 0.02, 0.56);

  const barrelRight = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.8, 10), 0x0f172a);
  barrelRight.rotation.x = Math.PI / 2;
  barrelRight.position.set(0.15, 0.02, 0.56);

  head.add(turret, barrelLeft, barrelRight);
  group.add(base, body, head);

  group.userData.head = head;
  group.userData.barrel = barrelLeft;

  return group;
}

function createSniperTower(config) {
  const group = new THREE.Group();

  const base = mesh(new THREE.CylinderGeometry(0.48, 0.58, 0.22, 5), 0x581c87);
  base.position.y = 0.11;
  base.rotation.y = Math.PI / 5;

  const body = mesh(new THREE.ConeGeometry(0.42, 1.15, 5), config.color);
  body.position.y = 0.78;

  const head = new THREE.Group();
  head.position.y = 1.35;

  const scope = mesh(new THREE.BoxGeometry(0.35, 0.25, 0.35), 0x7e22ce);

  const barrel = mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.45, 12), 0x020617);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.88;

  const tip = mesh(new THREE.SphereGeometry(0.09, 12, 12), 0xc084fc);
  tip.position.z = 1.62;

  head.add(scope, barrel, tip);
  group.add(base, body, head);

  group.userData.head = head;
  group.userData.barrel = barrel;

  return group;
}

function createSlowTower(config) {
  const group = new THREE.Group();

  const base = mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.24, 6), 0x0f766e);
  base.position.y = 0.12;

  const pillar = mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.7, 12), config.color);
  pillar.position.y = 0.55;

  const core = mesh(new THREE.OctahedronGeometry(0.42), 0x5eead4, true);
  core.position.y = 1.12;

  const ring = mesh(new THREE.TorusGeometry(0.5, 0.045, 10, 32), 0x99f6e4, true);
  ring.position.y = 1.12;
  ring.rotation.x = Math.PI / 2;

  group.add(base, pillar, core, ring);

  group.userData.core = core;

  return group;
}

function createSplashTower(config) {
  const group = new THREE.Group();

  const base = mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.24, 18), 0x9a3412);
  base.position.y = 0.12;

  const body = mesh(new THREE.CylinderGeometry(0.38, 0.48, 0.62, 18), config.color);
  body.position.y = 0.52;

  const head = new THREE.Group();
  head.position.y = 0.9;

  const mortar = mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.75, 18), 0x431407);
  mortar.rotation.x = Math.PI / 4;
  mortar.position.z = 0.18;

  const shell = mesh(new THREE.SphereGeometry(0.16, 14, 14), 0xfacc15);
  shell.position.set(0, 0.2, -0.25);

  head.add(mortar, shell);
  group.add(base, body, head);

  group.userData.head = head;
  group.userData.barrel = mortar;

  return group;
}

function mesh(geometry, color, emissive = false) {
  const material = createGameMaterial(color, "tower");

  if (material.emissive?.set) {
    material.emissive.set(emissive ? color : 0x000000);
  }

  if (typeof material.emissiveIntensity === "number") {
    material.emissiveIntensity = emissive ? 0.35 : 0;
  }

  const object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  object.receiveShadow = true;

  object.userData.baseColor = color;
  object.userData.shaderRole = "tower";

  return object;
}

function getTowerConfig(type) {
  if (type === "rapid") {
    return {
      color: 0x38bdf8,
      range: 2.7,
      fireRate: 18,
      damage: 1,
      critChance: 0.08,
      cost: 30,
      defaultTargetMode: "weakest"
    };
  }

  if (type === "sniper") {
    return {
      color: 0xa855f7,
      range: 6.2,
      fireRate: 95,
      damage: 6,
      critChance: 0.28,
      cost: 45,
      defaultTargetMode: "strongest"
    };
  }

  if (type === "slow") {
    return {
      color: 0x14b8a6,
      range: 3.7,
      fireRate: 60,
      damage: 1,
      critChance: 0.06,
      cost: 35,
      defaultTargetMode: "first",
      slowEffect: {
        multiplier: 0.45,
        duration: 150
      }
    };
  }

  if (type === "splash") {
    return {
      color: 0xf97316,
      range: 4.2,
      fireRate: 75,
      damage: 4,
      critChance: 0.12,
      cost: 50,
      defaultTargetMode: "first",
      splashEffect: {
        radius: 2.1,
        damage: 3
      }
    };
  }

  return {
    color: 0x2563eb,
    range: 3.2,
    fireRate: 45,
    damage: 2,
    critChance: 0.1,
    cost: 25,
    defaultTargetMode: "nearest"
  };
}

function spawnPlaceEffect(scene, position) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.6, 32),
    new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.copy(position);
  ring.position.y = 0.05;

  scene.add(ring);

  let life = 20;

  const interval = setInterval(() => {
    ring.scale.multiplyScalar(1.1);
    ring.material.opacity *= 0.85;
    life--;

    if (life <= 0) {
      scene.remove(ring);
      ring.geometry.dispose();
      ring.material.dispose();
      clearInterval(interval);
    }
  }, 16);
}