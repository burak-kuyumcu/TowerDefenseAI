import * as THREE from "three";
import { state } from "../game/state.js";
import { shoot } from "../entities/projectiles.js"
import { createGameMaterial } from "../visuals/materials.js";
import { createTowerLabel, updateTowerLabelText } from "../visuals/towerLabels.js";
import { getPlacementState } from "../game/placement.js";
import {
  initializeTowerUltimate,
  updateTowerUltimateTimers,
  chargeTowerUltimate
} from "../entities/towerUltimates.js";

const TARGET_MODES = ["nearest", "first", "strongest", "weakest"];

export function placeTower(scene) {
  if (getPlacementState() !== "valid") return;

  const key = `${state.selectedTile.x},${state.selectedTile.z}`;
  const config = getTowerConfig(state.selectedTowerType);

  const tower = createTowerModel(state.selectedTowerType, config);

  const visualHead = tower.userData.head ?? null;
  const visualCore = tower.userData.core ?? null;
  const visualBarrel = tower.userData.barrel ?? null;
  const visualMuzzles = tower.userData.muzzles ?? [];
  const visualSpinner = tower.userData.spinner ?? null;
  const visualSecondarySpinner = tower.userData.secondarySpinner ?? null;
  const visualRecoilParts = tower.userData.recoilParts ?? [];

  tower.position.set(state.selectedTile.x, 0, state.selectedTile.z);

  tower.userData = {
    type: state.selectedTowerType,
    level: 1,
    cooldown: 0,

    head: visualHead,
    core: visualCore,
    barrel: visualBarrel,
    muzzles: visualMuzzles,
    spinner: visualSpinner,
    secondarySpinner: visualSecondarySpinner,
    recoilParts: visualRecoilParts,

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
    slowMultiplier: 1,

    recoilTimer: 0,
    recoilMaxTimer: 1,
    fireFlashTimer: 0,
    fireFlashColor: 0xfacc15,
    activeBarrelSide: "left",

    ultimateAura: null,
    ultimateWasReady: false
  };

  initializeTowerUltimate(tower);

  scene.add(tower);
  state.towers.push(tower);
  state.towerSet.add(key);

  createTowerLabel(scene, tower);

  state.gold -= config.cost;

  spawnPlaceEffect(scene, tower.position);
}

export function updateTowers(scene) {
  for (const tower of state.towers) {
    updateTowerUltimateTimers(tower);
    updateTowerSlowState(tower);
    updateTowerUltimateVisual(scene, tower);
    updateTowerFireAnimation(tower);
    animateTowerIdle(tower);

    if (tower.userData.cooldown > 0) {
      tower.userData.cooldown--;
      continue;
    }

    const target = findTargetEnemy(tower);

    if (target) {
      aimTowerAtTarget(tower, target);
      shoot(scene, tower, target);
      chargeTowerUltimate(tower, getUltimateChargePerShot(tower));

      const slowMultiplier = tower.userData.slowMultiplier ?? 1;
      const ultimateFireRateMultiplier =
        tower.userData.ultimateFireRateMultiplier ?? 1;

      tower.userData.cooldown = Math.max(
        3,
        Math.floor(
          tower.userData.fireRate *
            slowMultiplier *
            ultimateFireRateMultiplier
        )
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
      setMeshEmissive(mesh, 0x581c87, 0.55);
    }

    return;
  }

  tower.userData.slowMultiplier = 1;

  for (const mesh of meshes) {
    setMeshEmissive(mesh, 0x000000, 0);
  }
}

function updateTowerUltimateVisual(scene, tower) {
  const charge = tower.userData.ultimateCharge ?? 0;
  const active = tower.userData.ultimateActiveTimer > 0;
  const ready = charge >= 100 && tower.userData.ultimateCooldown <= 0;

  if ((ready || active) && !tower.userData.ultimateAura) {
    tower.userData.ultimateAura = createUltimateAura(tower.userData.type);
    tower.add(tower.userData.ultimateAura);
  }

  const aura = tower.userData.ultimateAura;

  if (aura) {
    aura.visible = ready || active;

    if (aura.visible) {
      const pulseSpeed = active ? 0.018 : 0.01;
      const pulse = active
        ? 1.12 + Math.sin(Date.now() * pulseSpeed) * 0.14
        : 1.0 + Math.sin(Date.now() * pulseSpeed) * 0.07;

      aura.scale.set(pulse, pulse, pulse);
      aura.rotation.z += active ? 0.045 : 0.022;

      if (aura.material?.opacity !== undefined) {
        aura.material.opacity = active ? 0.62 : 0.34;
      }
    }
  }

  if (ready && !tower.userData.ultimateWasReady) {
    tower.userData.ultimateWasReady = true;
    spawnReadyMiniPulse(scene, tower);
  }

  if (!ready) {
    tower.userData.ultimateWasReady = false;
  }

  if (active) {
    setTowerEmissive(tower, getUltimateColor(tower.userData.type), 0.62);
  } else if (ready) {
    setTowerEmissive(tower, getUltimateColor(tower.userData.type), 0.28);
  }
}

function updateTowerFireAnimation(tower) {
  if (tower.userData.recoilTimer > 0) {
    tower.userData.recoilTimer--;
  }

  if (tower.userData.fireFlashTimer > 0) {
    tower.userData.fireFlashTimer--;
  }

  const recoilMax = tower.userData.recoilMaxTimer || getRecoilDuration(tower);
  const recoilRatio = Math.max(0, tower.userData.recoilTimer / recoilMax);
  const recoilAmount = getRecoilAmount(tower) * Math.sin(recoilRatio * Math.PI);

  const parts = tower.userData.recoilParts ?? [];

  for (const part of parts) {
    const baseZ = part.userData.baseZ ?? part.position.z;
    const baseY = part.userData.baseY ?? part.position.y;

    if (tower.userData.type === "splash") {
      part.position.z = baseZ - recoilAmount * 0.75;
      part.position.y = baseY + recoilAmount * 0.22;
    } else if (tower.userData.type === "slow") {
      const pulse = 1 + recoilAmount * 0.55;
      part.scale.set(pulse, pulse, pulse);
    } else {
      part.position.z = baseZ - recoilAmount;
    }
  }

  updateFireGlow(tower);
}

function updateFireGlow(tower) {
  const muzzles = tower.userData.muzzles ?? [];
  const flashActive = tower.userData.fireFlashTimer > 0;
  const color = tower.userData.fireFlashColor ?? 0xfacc15;

  for (const muzzle of muzzles) {
    if (!muzzle) continue;

    const isRapid = tower.userData.type === "rapid";
    const isLeft = muzzle.userData.muzzleSide === "left";
    const activeSide = tower.userData.activeBarrelSide ?? "left";

    const shouldFlash =
      flashActive &&
      (!isRapid ||
        (activeSide === "left" && isLeft) ||
        (activeSide === "right" && !isLeft));

    setMeshEmissive(muzzle, shouldFlash ? color : 0x000000, shouldFlash ? 0.85 : 0);
  }
}

function getRecoilDuration(tower) {
  if (tower.userData.type === "rapid") return 5;
  if (tower.userData.type === "sniper") return 12;
  if (tower.userData.type === "splash") return 14;
  if (tower.userData.type === "slow") return 10;
  return 8;
}

function getRecoilAmount(tower) {
  if (tower.userData.type === "rapid") return 0.12;
  if (tower.userData.type === "sniper") return 0.26;
  if (tower.userData.type === "splash") return 0.2;
  if (tower.userData.type === "slow") return 0.18;
  return 0.16;
}

function createUltimateAura(type) {
  const color = getUltimateColor(type);

  const aura = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.58, 72),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.36,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.065;
  aura.userData.isTowerUltimateAura = true;

  return aura;
}

function spawnReadyMiniPulse(scene, tower) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.85, 72),
    new THREE.MeshBasicMaterial({
      color: getUltimateColor(tower.userData.type),
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(tower.position.x, 0.1, tower.position.z);

  scene.add(ring);

  let life = 28;

  const interval = setInterval(() => {
    ring.scale.multiplyScalar(1.04);
    ring.material.opacity *= 0.9;
    life--;

    if (life <= 0) {
      scene.remove(ring);
      ring.geometry.dispose();
      ring.material.dispose();
      clearInterval(interval);
    }
  }, 16);
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
  const active = tower.userData.ultimateActiveTimer > 0;

  if (core) {
    core.rotation.y += active ? 0.09 : 0.04;
    core.rotation.z += active ? 0.025 : 0.01;
    core.position.y = core.userData.baseY ?? core.position.y;
  }

  if (core?.userData?.bob) {
    core.position.y =
      core.userData.baseY + Math.sin(Date.now() * 0.004) * core.userData.bob;
  }

  const spinner = tower.userData.spinner;
  if (spinner) {
    spinner.rotation.z += active ? 0.12 : 0.045;
  }

  const secondarySpinner = tower.userData.secondarySpinner;
  if (secondarySpinner) {
    secondarySpinner.rotation.x += active ? 0.08 : 0.032;
    secondarySpinner.rotation.z -= active ? 0.06 : 0.025;
  }

  const head = tower.userData.head;
  if (head && tower.userData.type === "rapid") {
    head.rotation.z = Math.sin(Date.now() * 0.012) * 0.018;
  }

  if (head && tower.userData.type === "splash") {
    head.rotation.x = -0.08 + Math.sin(Date.now() * 0.004) * 0.018;
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

  const base = mesh(
    new THREE.CylinderGeometry(0.5, 0.64, 0.24, 24),
    0x172554
  );
  base.position.y = 0.12;

  const plinth = mesh(
    new THREE.CylinderGeometry(0.42, 0.48, 0.18, 24),
    0x1e3a8a
  );
  plinth.position.y = 0.34;

  const body = mesh(
    new THREE.CylinderGeometry(0.32, 0.4, 0.58, 20),
    config.color
  );
  body.position.y = 0.68;

  const head = new THREE.Group();
  head.position.y = 1.08;

  const turret = mesh(
    new THREE.BoxGeometry(0.62, 0.32, 0.5),
    0x1d4ed8
  );

  const barrel = mesh(
    new THREE.CylinderGeometry(0.07, 0.085, 0.78, 14),
    0x020617
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.55;
  markBaseTransform(barrel);

  const muzzle = mesh(
    new THREE.CylinderGeometry(0.105, 0.105, 0.12, 14),
    0x60a5fa,
    true
  );
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.z = 0.96;
  markBaseTransform(muzzle);

  const cap = mesh(
    new THREE.SphereGeometry(0.12, 14, 14),
    0x93c5fd,
    true
  );
  cap.position.y = 0.22;
  cap.userData.baseY = cap.position.y;
  cap.userData.bob = 0.03;

  head.add(turret, barrel, muzzle, cap);
  group.add(base, plinth, body, head);

  group.userData.head = head;
  group.userData.barrel = barrel;
  group.userData.muzzles = [muzzle];
  group.userData.recoilParts = [barrel, muzzle];
  group.userData.core = cap;

  return group;
}

function createRapidTower(config) {
  const group = new THREE.Group();

  const base = mesh(
    new THREE.CylinderGeometry(0.48, 0.62, 0.22, 24),
    0x0e7490
  );
  base.position.y = 0.11;

  const body = mesh(
    new THREE.CylinderGeometry(0.34, 0.44, 0.52, 20),
    config.color
  );
  body.position.y = 0.48;

  const head = new THREE.Group();
  head.position.y = 0.86;

  const turret = mesh(
    new THREE.BoxGeometry(0.68, 0.24, 0.42),
    0x0284c7
  );

  const barrelLeft = mesh(
    new THREE.CylinderGeometry(0.043, 0.043, 0.86, 10),
    0x020617
  );
  barrelLeft.rotation.x = Math.PI / 2;
  barrelLeft.position.set(-0.17, 0.02, 0.59);
  markBaseTransform(barrelLeft);

  const barrelRight = mesh(
    new THREE.CylinderGeometry(0.043, 0.043, 0.86, 10),
    0x020617
  );
  barrelRight.rotation.x = Math.PI / 2;
  barrelRight.position.set(0.17, 0.02, 0.59);
  markBaseTransform(barrelRight);

  const leftTip = mesh(
    new THREE.SphereGeometry(0.065, 10, 10),
    0x67e8f9,
    true
  );
  leftTip.position.set(-0.17, 0.02, 1.05);
  leftTip.userData.muzzleSide = "left";
  markBaseTransform(leftTip);

  const rightTip = mesh(
    new THREE.SphereGeometry(0.065, 10, 10),
    0x67e8f9,
    true
  );
  rightTip.position.set(0.17, 0.02, 1.05);
  rightTip.userData.muzzleSide = "right";
  markBaseTransform(rightTip);

  const spinner = mesh(
    new THREE.TorusGeometry(0.29, 0.032, 8, 28),
    0xa5f3fc,
    true
  );
  spinner.position.y = 0.22;
  spinner.rotation.x = Math.PI / 2;

  const backCell = mesh(
    new THREE.BoxGeometry(0.28, 0.18, 0.18),
    0x155e75,
    true
  );
  backCell.position.z = -0.34;

  head.add(turret, barrelLeft, barrelRight, leftTip, rightTip, spinner, backCell);
  group.add(base, body, head);

  group.userData.head = head;
  group.userData.barrel = barrelLeft;
  group.userData.muzzles = [leftTip, rightTip];
  group.userData.recoilParts = [barrelLeft, barrelRight, leftTip, rightTip];
  group.userData.core = spinner;
  group.userData.spinner = spinner;

  return group;
}

function createSniperTower(config) {
  const group = new THREE.Group();

  const base = mesh(
    new THREE.CylinderGeometry(0.48, 0.62, 0.22, 5),
    0x581c87
  );
  base.position.y = 0.11;
  base.rotation.y = Math.PI / 5;

  const body = mesh(
    new THREE.ConeGeometry(0.42, 1.08, 5),
    config.color
  );
  body.position.y = 0.75;

  const neck = mesh(
    new THREE.CylinderGeometry(0.18, 0.24, 0.24, 12),
    0x6b21a8
  );
  neck.position.y = 1.24;

  const head = new THREE.Group();
  head.position.y = 1.42;

  const scope = mesh(
    new THREE.BoxGeometry(0.42, 0.25, 0.36),
    0x7e22ce
  );
  markBaseTransform(scope);

  const barrel = mesh(
    new THREE.CylinderGeometry(0.045, 0.06, 1.55, 14),
    0x020617
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.93;
  markBaseTransform(barrel);

  const stabilizer = mesh(
    new THREE.BoxGeometry(0.52, 0.06, 0.12),
    0xc084fc,
    true
  );
  stabilizer.position.z = 0.52;
  markBaseTransform(stabilizer);

  const tip = mesh(
    new THREE.SphereGeometry(0.09, 12, 12),
    0xe9d5ff,
    true
  );
  tip.position.z = 1.74;
  tip.userData.baseY = tip.position.y;
  tip.userData.bob = 0.02;
  markBaseTransform(tip);

  const sight = mesh(
    new THREE.TorusGeometry(0.2, 0.018, 8, 28),
    0xe9d5ff,
    true
  );
  sight.position.y = 0.18;
  sight.rotation.x = Math.PI / 2;

  head.add(scope, barrel, stabilizer, tip, sight);
  group.add(base, body, neck, head);

  group.userData.head = head;
  group.userData.barrel = barrel;
  group.userData.muzzles = [tip];
  group.userData.recoilParts = [scope, barrel, stabilizer, tip];
  group.userData.core = tip;
  group.userData.spinner = sight;

  return group;
}

function createSlowTower(config) {
  const group = new THREE.Group();

  const base = mesh(
    new THREE.CylinderGeometry(0.52, 0.66, 0.24, 6),
    0x0f766e
  );
  base.position.y = 0.12;

  const lowerRing = mesh(
    new THREE.TorusGeometry(0.46, 0.04, 10, 36),
    0x99f6e4,
    true
  );
  lowerRing.position.y = 0.28;
  lowerRing.rotation.x = Math.PI / 2;

  const pillar = mesh(
    new THREE.CylinderGeometry(0.24, 0.34, 0.66, 12),
    config.color
  );
  pillar.position.y = 0.56;

  const core = mesh(
    new THREE.OctahedronGeometry(0.42),
    0x5eead4,
    true
  );
  core.position.y = 1.12;
  core.userData.baseY = core.position.y;
  core.userData.bob = 0.08;
  markBaseTransform(core);

  const ring = mesh(
    new THREE.TorusGeometry(0.52, 0.045, 10, 40),
    0x99f6e4,
    true
  );
  ring.position.y = 1.12;
  ring.rotation.x = Math.PI / 2;
  markBaseTransform(ring);

  const ring2 = mesh(
    new THREE.TorusGeometry(0.37, 0.032, 10, 36),
    0xccfbf1,
    true
  );
  ring2.position.y = 1.12;
  ring2.rotation.z = Math.PI / 2;
  markBaseTransform(ring2);

  const topShard = mesh(
    new THREE.ConeGeometry(0.12, 0.28, 6),
    0xccfbf1,
    true
  );
  topShard.position.y = 1.56;

  group.add(base, lowerRing, pillar, core, ring, ring2, topShard);

  group.userData.core = core;
  group.userData.barrel = core;
  group.userData.muzzles = [core];
  group.userData.recoilParts = [core, ring, ring2];
  group.userData.spinner = ring;
  group.userData.secondarySpinner = ring2;

  return group;
}

function createSplashTower(config) {
  const group = new THREE.Group();

  const base = mesh(
    new THREE.CylinderGeometry(0.54, 0.7, 0.24, 24),
    0x7c2d12
  );
  base.position.y = 0.12;

  const body = mesh(
    new THREE.CylinderGeometry(0.4, 0.52, 0.56, 20),
    config.color
  );
  body.position.y = 0.5;

  const armorRing = mesh(
    new THREE.TorusGeometry(0.43, 0.04, 10, 36),
    0xfdba74,
    true
  );
  armorRing.position.y = 0.82;
  armorRing.rotation.x = Math.PI / 2;

  const head = new THREE.Group();
  head.position.y = 0.96;

  const pivot = mesh(
    new THREE.SphereGeometry(0.22, 16, 16),
    0xea580c,
    true
  );

  const launcherLeft = createRocketTube(-0.16);
  const launcherRight = createRocketTube(0.16);

  const brace = mesh(
    new THREE.BoxGeometry(0.52, 0.12, 0.18),
    0x431407
  );
  brace.position.set(0, -0.12, 0.16);
  markBaseTransform(brace);

  const shell = mesh(
    new THREE.SphereGeometry(0.14, 14, 14),
    0xfacc15,
    true
  );
  shell.position.set(0, 0.26, -0.18);
  shell.userData.baseY = shell.position.y;
  shell.userData.bob = 0.035;

  const rearCell = mesh(
    new THREE.BoxGeometry(0.42, 0.18, 0.22),
    0x9a3412,
    true
  );
  rearCell.position.set(0, -0.02, -0.34);
  markBaseTransform(rearCell);

  head.add(pivot, launcherLeft, launcherRight, brace, shell, rearCell);
  group.add(base, body, armorRing, head);

  const leftMuzzle = launcherLeft.userData.muzzle;
  const rightMuzzle = launcherRight.userData.muzzle;

  group.userData.head = head;
  group.userData.barrel = launcherLeft;
  group.userData.muzzles = [leftMuzzle, rightMuzzle];
  group.userData.recoilParts = [
    launcherLeft,
    launcherRight,
    brace,
    rearCell,
    leftMuzzle,
    rightMuzzle
  ];
  group.userData.core = shell;
  group.userData.spinner = armorRing;

  return group;
}

function createRocketTube(xOffset) {
  const tubeGroup = new THREE.Group();
  tubeGroup.position.x = 0;
  markBaseTransform(tubeGroup);

  const barrel = mesh(
    new THREE.CylinderGeometry(0.105, 0.14, 0.78, 18),
    0x431407
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(xOffset, 0, 0.34);
  markBaseTransform(barrel);

  const muzzle = mesh(
    new THREE.TorusGeometry(0.14, 0.026, 8, 24),
    0xfb923c,
    true
  );
  muzzle.position.set(xOffset, 0, 0.75);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.userData.muzzleSide = xOffset < 0 ? "left" : "right";
  markBaseTransform(muzzle);

  const innerGlow = mesh(
    new THREE.SphereGeometry(0.055, 10, 10),
    0xfacc15,
    true
  );
  innerGlow.position.set(xOffset, 0, 0.82);
  markBaseTransform(innerGlow);

  tubeGroup.add(barrel, muzzle, innerGlow);
  tubeGroup.userData.muzzle = innerGlow;

  return tubeGroup;
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

function markBaseTransform(object) {
  object.userData.baseX = object.position.x;
  object.userData.baseY = object.position.y;
  object.userData.baseZ = object.position.z;
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

function getUltimateChargePerShot(tower) {
  if (tower.userData.type === "rapid") return 1.4;
  if (tower.userData.type === "sniper") return 9;
  if (tower.userData.type === "slow") return 5;
  if (tower.userData.type === "splash") return 6;

  return 4;
}

function getUltimateColor(type) {
  if (type === "rapid") return 0x38bdf8;
  if (type === "sniper") return 0xc084fc;
  if (type === "slow") return 0x5eead4;
  if (type === "splash") return 0xfb923c;

  return 0x60a5fa;
}

function setTowerEmissive(tower, color, intensity) {
  tower.traverse((child) => {
    if (!child.isMesh) return;
    setMeshEmissive(child, color, intensity);
  });
}

function setMeshEmissive(mesh, color, intensity) {
  if (mesh.material?.emissive?.set) {
    mesh.material.emissive.set(color);
  }

  if (typeof mesh.material?.emissiveIntensity === "number") {
    mesh.material.emissiveIntensity = intensity;
  }

  if (mesh.material?.uniforms?.uEmissive?.value?.set) {
    mesh.material.uniforms.uEmissive.value.set(color);
  }

  if (mesh.material?.uniforms?.uEmissiveIntensity) {
    mesh.material.uniforms.uEmissiveIntensity.value = intensity;
  }
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