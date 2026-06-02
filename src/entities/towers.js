import * as THREE from "three";
import { state } from "../game/state.js";
import { shoot } from "./projectiles.js";
import { createGameMaterial } from "../visuals/materials.js";
import { createTowerLabel, updateTowerLabelText } from "../visuals/towerLabels.js";
import { getPlacementState, getPlacementMessage } from "../game/placement.js";
import {
  initializeTowerUltimate,
  updateTowerUltimateTimers,
  chargeTowerUltimate
} from "./towerUltimates.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";
import { getDirectionalFocusBonus } from "../systems/directionalFocus.js";

const TARGET_MODES = ["nearest", "first", "strongest", "weakest"];

export function placeTower(scene) {
  const placementState = getPlacementState();

  if (placementState !== "valid") {
    const message = getPlacementMessage();

    addEventLog(message);

    if (placementState === "tower-limit") {
      showAnnouncement("Tower limit reached for this stage");
    } else if (placementState === "no-gold") {
      showAnnouncement("Not enough gold");
    }

    return;
  }

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
    ultimateWasReady: false,

    focusAngle: 0,
    focusArc: Math.PI / 2.35,
    focusWasManuallyRotated: false,

    upgradeVisualLevel: 1,
    upgradeSpinners: [],
    upgradeBobbers: []
  };

  initializeTowerUltimate(tower);

  scene.add(tower);
  state.towers.push(tower);
  state.towerSet.add(key);

  createTowerLabel(scene, tower);

  state.gold -= config.cost;

  spawnPlaceEffect(scene, tower.position);
  addEventLog(`${formatTowerName(state.selectedTowerType)} placed.`);
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
      const focusBonus = getDirectionalFocusBonus(tower, target);

      tower.userData.cooldown = Math.max(
        3,
        Math.floor(
          tower.userData.fireRate *
            slowMultiplier *
            ultimateFireRateMultiplier *
            focusBonus.fireRateMultiplier
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
  addEventLog(
    `${formatTowerName(tower.userData.type)} target mode: ${formatTargetMode(tower.userData.targetMode)}.`
  );
}

export function applyTowerUpgradeVisual(tower) {
  if (!tower) return;

  const level = tower.userData.level ?? 1;
  const appliedLevel = tower.userData.upgradeVisualLevel ?? 1;

  if (appliedLevel >= level) return;

  tower.userData.upgradeVisualLevel = level;

  if (tower.userData.type === "rapid") {
    addRapidUpgradeVisual(tower, level);
  } else if (tower.userData.type === "sniper") {
    addSniperUpgradeVisual(tower, level);
  } else if (tower.userData.type === "slow") {
    addSlowUpgradeVisual(tower, level);
  } else if (tower.userData.type === "splash") {
    addSplashUpgradeVisual(tower, level);
  } else {
    addNormalUpgradeVisual(tower, level);
  }

  spawnUpgradePulse(tower, level);
  setTowerEmissive(
    tower,
    getUltimateColor(tower.userData.type),
    level >= 3 ? 0.42 : 0.26
  );
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
    addEventLog(`${formatTowerName(tower.userData.type)} ultimate ready.`);
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

    setMeshEmissive(
      muzzle,
      shouldFlash ? color : 0x000000,
      shouldFlash ? 0.85 : 0
    );
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

  const upgradeSpinners = tower.userData.upgradeSpinners ?? [];

  for (const spinnerData of upgradeSpinners) {
    const object = spinnerData.object;
    if (!object) continue;

    const speed = spinnerData.speed ?? 0.02;

    if (spinnerData.axis === "x") {
      object.rotation.x += speed;
    } else if (spinnerData.axis === "y") {
      object.rotation.y += speed;
    } else {
      object.rotation.z += speed;
    }
  }

  const upgradeBobbers = tower.userData.upgradeBobbers ?? [];

  for (const bobber of upgradeBobbers) {
    const object = bobber.object;
    if (!object) continue;

    const baseY = bobber.baseY ?? object.position.y;
    const speed = bobber.speed ?? 0.004;
    const amount = bobber.amount ?? 0.03;

    object.position.y = baseY + Math.sin(Date.now() * speed) * amount;
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

  const base = mesh(new THREE.CylinderGeometry(0.52, 0.68, 0.22, 24), 0x172554);
  base.position.y = 0.11;

  const armoredFoot = mesh(new THREE.CylinderGeometry(0.44, 0.54, 0.18, 24), 0x1e3a8a);
  armoredFoot.position.y = 0.31;

  const body = mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.5, 20), config.color);
  body.position.y = 0.62;

  const neck = mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.18, 16), 0x1e40af);
  neck.position.y = 0.96;

  const head = new THREE.Group();
  head.position.y = 1.1;

  const turret = mesh(new THREE.BoxGeometry(0.62, 0.3, 0.46), 0x1d4ed8);
  turret.position.y = 0;

  const barrel = mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.8, 14), 0x020617);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.55;
  markBaseTransform(barrel);

  const muzzle = mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.14, 14), 0x60a5fa, true);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.z = 0.98;
  markBaseTransform(muzzle);

  const core = mesh(new THREE.SphereGeometry(0.12, 14, 14), 0x93c5fd, true);
  core.position.y = 0.22;
  core.userData.baseY = core.position.y;
  core.userData.bob = 0.025;

  head.add(turret, barrel, muzzle, core);
  group.add(base, armoredFoot, body, neck, head);

  group.userData.head = head;
  group.userData.barrel = barrel;
  group.userData.muzzles = [muzzle];
  group.userData.recoilParts = [barrel, muzzle];
  group.userData.core = core;

  return group;
}

function createRapidTower(config) {
  const group = new THREE.Group();

  const base = mesh(new THREE.CylinderGeometry(0.5, 0.66, 0.2, 24), 0x0e7490);
  base.position.y = 0.1;

  const engineBody = mesh(new THREE.CylinderGeometry(0.34, 0.44, 0.48, 20), config.color);
  engineBody.position.y = 0.43;

  const rearBattery = mesh(new THREE.BoxGeometry(0.42, 0.25, 0.28), 0x155e75, true);
  rearBattery.position.set(0, 0.58, -0.36);

  const head = new THREE.Group();
  head.position.y = 0.83;

  const turret = mesh(new THREE.BoxGeometry(0.7, 0.23, 0.38), 0x0284c7);

  const barrelLeft = mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.82, 10), 0x020617);
  barrelLeft.rotation.x = Math.PI / 2;
  barrelLeft.position.set(-0.17, 0.02, 0.58);
  markBaseTransform(barrelLeft);

  const barrelRight = mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.82, 10), 0x020617);
  barrelRight.rotation.x = Math.PI / 2;
  barrelRight.position.set(0.17, 0.02, 0.58);
  markBaseTransform(barrelRight);

  const leftTip = mesh(new THREE.SphereGeometry(0.065, 10, 10), 0x67e8f9, true);
  leftTip.position.set(-0.17, 0.02, 1.02);
  leftTip.userData.muzzleSide = "left";
  markBaseTransform(leftTip);

  const rightTip = mesh(new THREE.SphereGeometry(0.065, 10, 10), 0x67e8f9, true);
  rightTip.position.set(0.17, 0.02, 1.02);
  rightTip.userData.muzzleSide = "right";
  markBaseTransform(rightTip);

  const rotor = mesh(new THREE.TorusGeometry(0.28, 0.03, 8, 28), 0xa5f3fc, true);
  rotor.position.y = 0.21;
  rotor.rotation.x = Math.PI / 2;

  head.add(turret, barrelLeft, barrelRight, leftTip, rightTip, rotor);
  group.add(base, engineBody, rearBattery, head);

  group.userData.head = head;
  group.userData.barrel = barrelLeft;
  group.userData.muzzles = [leftTip, rightTip];
  group.userData.recoilParts = [barrelLeft, barrelRight, leftTip, rightTip];
  group.userData.core = rotor;
  group.userData.spinner = rotor;

  return group;
}

function createSniperTower(config) {
  const group = new THREE.Group();

  const base = mesh(new THREE.CylinderGeometry(0.46, 0.64, 0.22, 5), 0x581c87);
  base.position.y = 0.11;
  base.rotation.y = Math.PI / 5;

  const tripodHub = mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.18, 12), 0x6b21a8);
  tripodHub.position.y = 0.38;

  const body = mesh(new THREE.ConeGeometry(0.4, 0.95, 5), config.color);
  body.position.y = 0.82;

  const neck = mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.24, 12), 0x6b21a8);
  neck.position.y = 1.28;

  const head = new THREE.Group();
  head.position.y = 1.45;

  const scopeBlock = mesh(new THREE.BoxGeometry(0.42, 0.23, 0.34), 0x7e22ce);
  markBaseTransform(scopeBlock);

  const barrel = mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.55, 14), 0x020617);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.93;
  markBaseTransform(barrel);

  const railLeft = mesh(new THREE.BoxGeometry(0.045, 0.045, 1.02), 0xc084fc, true);
  railLeft.position.set(-0.17, 0.08, 0.76);
  markBaseTransform(railLeft);

  const railRight = mesh(new THREE.BoxGeometry(0.045, 0.045, 1.02), 0xc084fc, true);
  railRight.position.set(0.17, 0.08, 0.76);
  markBaseTransform(railRight);

  const tip = mesh(new THREE.SphereGeometry(0.09, 12, 12), 0xe9d5ff, true);
  tip.position.z = 1.74;
  tip.userData.baseY = tip.position.y;
  tip.userData.bob = 0.018;
  markBaseTransform(tip);

  const sight = mesh(new THREE.TorusGeometry(0.18, 0.016, 8, 28), 0xe9d5ff, true);
  sight.position.y = 0.18;
  sight.rotation.x = Math.PI / 2;

  head.add(scopeBlock, barrel, railLeft, railRight, tip, sight);
  group.add(base, tripodHub, body, neck, head);

  group.userData.head = head;
  group.userData.barrel = barrel;
  group.userData.muzzles = [tip];
  group.userData.recoilParts = [scopeBlock, barrel, railLeft, railRight, tip];
  group.userData.core = tip;
  group.userData.spinner = sight;

  return group;
}

function createSlowTower(config) {
  const group = new THREE.Group();

  const base = mesh(new THREE.CylinderGeometry(0.52, 0.68, 0.24, 6), 0x0f766e);
  base.position.y = 0.12;

  const runeBase = mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.12, 6), 0x134e4a);
  runeBase.position.y = 0.32;

  const pillar = mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.62, 12), config.color);
  pillar.position.y = 0.6;

  const core = mesh(new THREE.OctahedronGeometry(0.42), 0x5eead4, true);
  core.position.y = 1.14;
  core.userData.baseY = core.position.y;
  core.userData.bob = 0.075;
  markBaseTransform(core);

  const verticalShardLeft = mesh(new THREE.ConeGeometry(0.06, 0.36, 6), 0xccfbf1, true);
  verticalShardLeft.position.set(-0.22, 0.95, 0);
  verticalShardLeft.rotation.z = Math.PI;

  const verticalShardRight = mesh(new THREE.ConeGeometry(0.06, 0.36, 6), 0xccfbf1, true);
  verticalShardRight.position.set(0.22, 0.95, 0);
  verticalShardRight.rotation.z = Math.PI;

  const orbit = mesh(new THREE.TorusGeometry(0.5, 0.035, 10, 40), 0x99f6e4, true);
  orbit.position.y = 1.14;
  orbit.rotation.x = Math.PI / 2;
  markBaseTransform(orbit);

  const crossOrbit = mesh(new THREE.TorusGeometry(0.34, 0.026, 10, 36), 0xccfbf1, true);
  crossOrbit.position.y = 1.14;
  crossOrbit.rotation.z = Math.PI / 2;
  markBaseTransform(crossOrbit);

  group.add(
    base,
    runeBase,
    pillar,
    verticalShardLeft,
    verticalShardRight,
    core,
    orbit,
    crossOrbit
  );

  group.userData.core = core;
  group.userData.barrel = core;
  group.userData.muzzles = [core];
  group.userData.recoilParts = [core, orbit, crossOrbit];
  group.userData.spinner = orbit;
  group.userData.secondarySpinner = crossOrbit;

  return group;
}

function createSplashTower(config) {
  const group = new THREE.Group();

  const base = mesh(new THREE.CylinderGeometry(0.56, 0.72, 0.24, 24), 0x7c2d12);
  base.position.y = 0.12;

  const heavyBody = mesh(new THREE.CylinderGeometry(0.42, 0.54, 0.52, 20), config.color);
  heavyBody.position.y = 0.48;

  const ammoBox = mesh(new THREE.BoxGeometry(0.46, 0.24, 0.32), 0x9a3412, true);
  ammoBox.position.set(0, 0.62, -0.42);

  const head = new THREE.Group();
  head.position.y = 0.94;

  const pivot = mesh(new THREE.SphereGeometry(0.22, 16, 16), 0xea580c, true);

  const launcherLeft = createRocketTube(-0.16);
  const launcherRight = createRocketTube(0.16);

  const brace = mesh(new THREE.BoxGeometry(0.52, 0.12, 0.18), 0x431407);
  brace.position.set(0, -0.12, 0.16);
  markBaseTransform(brace);

  const shell = mesh(new THREE.SphereGeometry(0.14, 14, 14), 0xfacc15, true);
  shell.position.set(0, 0.26, -0.18);
  shell.userData.baseY = shell.position.y;
  shell.userData.bob = 0.03;

  const exhaustLeft = mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.38, 10), 0x431407);
  exhaustLeft.position.set(-0.24, -0.02, -0.36);
  exhaustLeft.rotation.x = Math.PI / 2;

  const exhaustRight = mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.38, 10), 0x431407);
  exhaustRight.position.set(0.24, -0.02, -0.36);
  exhaustRight.rotation.x = Math.PI / 2;

  head.add(pivot, launcherLeft, launcherRight, brace, shell, exhaustLeft, exhaustRight);
  group.add(base, heavyBody, ammoBox, head);

  const leftMuzzle = launcherLeft.userData.muzzle;
  const rightMuzzle = launcherRight.userData.muzzle;

  group.userData.head = head;
  group.userData.barrel = launcherLeft;
  group.userData.muzzles = [leftMuzzle, rightMuzzle];
  group.userData.recoilParts = [
    launcherLeft,
    launcherRight,
    brace,
    leftMuzzle,
    rightMuzzle
  ];
  group.userData.core = shell;

  return group;
}

function createRocketTube(xOffset) {
  const tubeGroup = new THREE.Group();
  tubeGroup.position.x = 0;
  markBaseTransform(tubeGroup);

  const barrel = mesh(new THREE.CylinderGeometry(0.105, 0.14, 0.78, 18), 0x431407);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(xOffset, 0, 0.34);
  markBaseTransform(barrel);

  const muzzle = mesh(new THREE.TorusGeometry(0.14, 0.026, 8, 24), 0xfb923c, true);
  muzzle.position.set(xOffset, 0, 0.75);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.userData.muzzleSide = xOffset < 0 ? "left" : "right";
  markBaseTransform(muzzle);

  const innerGlow = mesh(new THREE.SphereGeometry(0.055, 10, 10), 0xfacc15, true);
  innerGlow.position.set(xOffset, 0, 0.82);
  markBaseTransform(innerGlow);

  tubeGroup.add(barrel, muzzle, innerGlow);
  tubeGroup.userData.muzzle = innerGlow;

  return tubeGroup;
}

function addNormalUpgradeVisual(tower, level) {
  const head = tower.userData.head ?? tower;

  if (level === 2) {
    const leftArmor = accentMesh(new THREE.BoxGeometry(0.08, 0.24, 0.34), 0x93c5fd, 0.92);
    leftArmor.position.set(-0.42, 0.01, 0);

    const rightArmor = accentMesh(new THREE.BoxGeometry(0.08, 0.24, 0.34), 0x93c5fd, 0.92);
    rightArmor.position.set(0.42, 0.01, 0);

    const barrelSleeve = accentMesh(new THREE.CylinderGeometry(0.095, 0.11, 0.22, 14), 0x60a5fa, 0.85);
    barrelSleeve.rotation.x = Math.PI / 2;
    barrelSleeve.position.set(0, 0, 0.84);

    head.add(leftArmor, rightArmor, barrelSleeve);
  }

  if (level === 3) {
    const commanderCore = accentMesh(new THREE.OctahedronGeometry(0.14), 0x60a5fa, 0.95);
    commanderCore.position.set(0, 0.36, 0);
    addUpgradeBobber(tower, commanderCore, commanderCore.position.y, 0.026, 0.004);

    const sideCannonLeft = accentMesh(new THREE.CylinderGeometry(0.035, 0.045, 0.46, 10), 0x020617, 1);
    sideCannonLeft.rotation.x = Math.PI / 2;
    sideCannonLeft.position.set(-0.24, -0.06, 0.48);

    const sideCannonRight = accentMesh(new THREE.CylinderGeometry(0.035, 0.045, 0.46, 10), 0x020617, 1);
    sideCannonRight.rotation.x = Math.PI / 2;
    sideCannonRight.position.set(0.24, -0.06, 0.48);

    const commandFlag = accentMesh(new THREE.BoxGeometry(0.04, 0.28, 0.18), 0xfacc15, 0.88);
    commandFlag.position.set(0.28, 0.32, -0.12);

    head.add(commanderCore, sideCannonLeft, sideCannonRight, commandFlag);

    tower.userData.core = commanderCore;
    tower.userData.recoilParts.push(sideCannonLeft, sideCannonRight);
  }
}

function addRapidUpgradeVisual(tower, level) {
  const head = tower.userData.head ?? tower;

  if (level === 2) {
    const drumLeft = accentMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 14), 0xa5f3fc, 0.92);
    drumLeft.rotation.z = Math.PI / 2;
    drumLeft.position.set(-0.42, 0.02, -0.12);

    const drumRight = accentMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 14), 0xa5f3fc, 0.92);
    drumRight.rotation.z = Math.PI / 2;
    drumRight.position.set(0.42, 0.02, -0.12);

    const upperBarrelLeft = accentMesh(new THREE.CylinderGeometry(0.032, 0.032, 0.72, 8), 0x020617, 1);
    upperBarrelLeft.rotation.x = Math.PI / 2;
    upperBarrelLeft.position.set(-0.09, 0.12, 0.58);

    const upperBarrelRight = accentMesh(new THREE.CylinderGeometry(0.032, 0.032, 0.72, 8), 0x020617, 1);
    upperBarrelRight.rotation.x = Math.PI / 2;
    upperBarrelRight.position.set(0.09, 0.12, 0.58);

    head.add(drumLeft, drumRight, upperBarrelLeft, upperBarrelRight);
    tower.userData.recoilParts.push(upperBarrelLeft, upperBarrelRight);
  }

  if (level === 3) {
    const turbine = accentMesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 18), 0x22d3ee, 0.9);
    turbine.rotation.x = Math.PI / 2;
    turbine.position.set(0, 0.03, -0.48);

    const bladeA = accentMesh(new THREE.BoxGeometry(0.46, 0.035, 0.06), 0x67e8f9, 0.9);
    const bladeB = accentMesh(new THREE.BoxGeometry(0.035, 0.46, 0.06), 0x67e8f9, 0.9);
    turbine.add(bladeA, bladeB);

    const overdriveCell = accentMesh(new THREE.BoxGeometry(0.34, 0.16, 0.14), 0x38bdf8, 0.92);
    overdriveCell.position.set(0, 0.26, -0.24);

    head.add(turbine, overdriveCell);

    addUpgradeSpinner(tower, turbine, "z", 0.12);
    tower.userData.core = turbine;
  }
}

function addSniperUpgradeVisual(tower, level) {
  const head = tower.userData.head ?? tower;

  if (level === 2) {
    const longScope = accentMesh(new THREE.CylinderGeometry(0.06, 0.075, 0.52, 14), 0xe9d5ff, 0.92);
    longScope.rotation.x = Math.PI / 2;
    longScope.position.set(0, 0.24, 0.08);

    const frontLens = accentMesh(new THREE.SphereGeometry(0.075, 12, 12), 0xc084fc, 0.95);
    frontLens.position.set(0, 0.24, 0.36);

    const railFinLeft = accentMesh(new THREE.BoxGeometry(0.035, 0.18, 0.42), 0xc084fc, 0.86);
    railFinLeft.position.set(-0.21, 0.02, 0.78);

    const railFinRight = accentMesh(new THREE.BoxGeometry(0.035, 0.18, 0.42), 0xc084fc, 0.86);
    railFinRight.position.set(0.21, 0.02, 0.78);

    head.add(longScope, frontLens, railFinLeft, railFinRight);
  }

  if (level === 3) {
    const railGem = accentMesh(new THREE.OctahedronGeometry(0.11), 0xe9d5ff, 0.96);
    railGem.position.set(0, 0.2, 0.56);
    addUpgradeBobber(tower, railGem, railGem.position.y, 0.018, 0.005);

    const antenna = accentMesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8), 0xc084fc, 0.9);
    antenna.position.set(-0.22, 0.38, -0.02);

    const antennaTip = accentMesh(new THREE.SphereGeometry(0.045, 10, 10), 0xe9d5ff, 0.95);
    antennaTip.position.set(-0.22, 0.61, -0.02);

    const muzzleLens = accentMesh(new THREE.TorusGeometry(0.13, 0.014, 8, 30), 0xe9d5ff, 0.92);
    muzzleLens.rotation.x = Math.PI / 2;
    muzzleLens.position.set(0, 0, 1.84);

    head.add(railGem, antenna, antennaTip, muzzleLens);

    tower.userData.core = railGem;
  }
}

function addSlowUpgradeVisual(tower, level) {
  if (level === 2) {
    const shardRingGroup = new THREE.Group();
    shardRingGroup.position.y = 0.74;

    for (let i = 0; i < 6; i++) {
      const shard = accentMesh(new THREE.ConeGeometry(0.035, 0.22, 6), 0xccfbf1, 0.9);
      const angle = (Math.PI * 2 * i) / 6;

      shard.position.set(Math.cos(angle) * 0.36, 0, Math.sin(angle) * 0.36);
      shard.rotation.z = Math.PI;
      shardRingGroup.add(shard);
    }

    tower.add(shardRingGroup);
    addUpgradeSpinner(tower, shardRingGroup, "y", 0.018);
  }

  if (level === 3) {
    const floatingCrystalGroup = new THREE.Group();
    floatingCrystalGroup.position.y = 1.34;

    for (let i = 0; i < 4; i++) {
      const crystal = accentMesh(new THREE.OctahedronGeometry(0.11), 0x99f6e4, 0.94);
      const angle = (Math.PI * 2 * i) / 4;

      crystal.position.set(Math.cos(angle) * 0.42, 0, Math.sin(angle) * 0.42);
      addUpgradeBobber(tower, crystal, crystal.position.y, 0.02, 0.004 + i * 0.0003);
      floatingCrystalGroup.add(crystal);
    }

    const frostCrown = accentMesh(new THREE.ConeGeometry(0.16, 0.28, 6), 0xccfbf1, 0.92);
    frostCrown.position.y = 1.63;

    tower.add(floatingCrystalGroup, frostCrown);

    addUpgradeSpinner(tower, floatingCrystalGroup, "y", 0.02);
  }
}

function addSplashUpgradeVisual(tower, level) {
  const head = tower.userData.head ?? tower;

  if (level === 2) {
    const rocketPodLeft = createRocketPod(-0.36);
    const rocketPodRight = createRocketPod(0.36);

    const armorPlate = accentMesh(new THREE.BoxGeometry(0.6, 0.07, 0.16), 0xfdba74, 0.9);
    armorPlate.position.set(0, 0.16, 0.18);

    head.add(rocketPodLeft, rocketPodRight, armorPlate);
  }

  if (level === 3) {
    const meteorCore = accentMesh(new THREE.IcosahedronGeometry(0.16, 0), 0xfacc15, 0.96);
    meteorCore.position.set(0, 0.36, -0.16);
    addUpgradeBobber(tower, meteorCore, meteorCore.position.y, 0.03, 0.004);

    const warningFinLeft = accentMesh(new THREE.BoxGeometry(0.06, 0.28, 0.18), 0xfb923c, 0.9);
    warningFinLeft.position.set(-0.24, 0.16, -0.18);
    warningFinLeft.rotation.z = 0.35;

    const warningFinRight = accentMesh(new THREE.BoxGeometry(0.06, 0.28, 0.18), 0xfb923c, 0.9);
    warningFinRight.position.set(0.24, 0.16, -0.18);
    warningFinRight.rotation.z = -0.35;

    const exhaustStack = accentMesh(new THREE.CylinderGeometry(0.05, 0.07, 0.42, 12), 0x431407, 1);
    exhaustStack.position.set(0, 0.1, -0.52);

    head.add(meteorCore, warningFinLeft, warningFinRight, exhaustStack);

    tower.userData.core = meteorCore;
  }
}

function createRocketPod(x) {
  const pod = new THREE.Group();
  pod.position.set(x, 0.03, 0.12);

  for (let i = 0; i < 3; i++) {
    const tube = accentMesh(new THREE.CylinderGeometry(0.035, 0.045, 0.34, 10), 0x431407, 1);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, (i - 1) * 0.08, 0);
    pod.add(tube);
  }

  const glow = accentMesh(new THREE.SphereGeometry(0.045, 10, 10), 0xfb923c, 0.92);
  glow.position.set(0, 0, 0.22);
  pod.add(glow);

  return pod;
}

function addUpgradeSpinner(tower, object, axis = "z", speed = 0.02) {
  if (!tower.userData.upgradeSpinners) {
    tower.userData.upgradeSpinners = [];
  }

  tower.userData.upgradeSpinners.push({
    object,
    axis,
    speed
  });
}

function addUpgradeBobber(tower, object, baseY, amount = 0.03, speed = 0.004) {
  if (!tower.userData.upgradeBobbers) {
    tower.userData.upgradeBobbers = [];
  }

  tower.userData.upgradeBobbers.push({
    object,
    baseY,
    amount,
    speed
  });
}

function spawnUpgradePulse(tower, level) {
  const scene = tower.parent;
  if (!scene) return;

  const color = getUltimateColor(tower.userData.type);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(level >= 3 ? 0.46 : 0.34, level >= 3 ? 0.76 : 0.58, 72),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: level >= 3 ? 0.62 : 0.48,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(tower.position.x, 0.12, tower.position.z);

  scene.add(ring);

  let life = 30;

  const interval = setInterval(() => {
    ring.scale.multiplyScalar(1.04);
    ring.rotation.z += 0.03;
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

function accentMesh(geometry, color, opacity = 0.9) {
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1
  });

  const object = new THREE.Mesh(geometry, material);
  object.castShadow = false;
  object.receiveShadow = false;

  object.userData.baseColor = color;
  object.userData.shaderRole = "tower";
  object.userData.isUpgradeVisual = true;

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

function formatTowerName(type) {
  if (type === "rapid") return "Rapid Tower";
  if (type === "sniper") return "Sniper Tower";
  if (type === "slow") return "Slow Tower";
  if (type === "splash") return "Splash Tower";

  return "Normal Tower";
}

function formatTargetMode(mode) {
  if (mode === "first") return "First";
  if (mode === "strongest") return "Strongest";
  if (mode === "weakest") return "Weakest";

  return "Nearest";
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