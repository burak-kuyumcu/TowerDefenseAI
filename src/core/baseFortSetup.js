import * as THREE from "three";
import { getActiveBasePosition } from "./constants.js";
import { createGameMaterial } from "../visuals/materials.js";
import { applyShaderData } from "./sceneObjectUtils.js";

let baseLight = null;
let baseBeacon = null;
let baseShieldRing = null;
let baseFlag = null;
let baseGroup = null;

export function createBaseFort(scene) {
  const basePosition = getActiveBasePosition();

  const group = new THREE.Group();
  group.position.set(basePosition.x, 0, basePosition.z);

  const foundation = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.95, 0.26, 32),
      createGameMaterial(0x0f172a, "base")
    ),
    0x0f172a,
    "base"
  );

  foundation.position.y = 0.13;
  foundation.castShadow = true;
  foundation.receiveShadow = true;

  const lowerRing = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.78, 0.18, 32),
      createGameMaterial(0x1e3a8a, "base")
    ),
    0x1e3a8a,
    "base"
  );

  lowerRing.position.y = 0.34;
  lowerRing.castShadow = true;
  lowerRing.receiveShadow = true;

  const coreTower = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.55, 1.15, 24),
      createGameMaterial(0x1d4ed8, "base")
    ),
    0x1d4ed8,
    "base"
  );

  coreTower.position.y = 0.92;
  coreTower.castShadow = true;
  coreTower.receiveShadow = true;

  const armorBand = applyShaderData(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.055, 10, 36),
      createGameMaterial(0x60a5fa, "base")
    ),
    0x60a5fa,
    "base"
  );

  armorBand.position.y = 1.15;
  armorBand.rotation.x = Math.PI / 2;

  const roof = applyShaderData(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.58, 0.45, 24),
      createGameMaterial(0x020617, "base")
    ),
    0x020617,
    "base"
  );

  roof.position.y = 1.72;
  roof.castShadow = true;

  const beacon = applyShaderData(
    new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22),
      createGameMaterial(0x38bdf8, "base")
    ),
    0x38bdf8,
    "base"
  );

  beacon.position.y = 2.05;

  const shieldRing = applyShaderData(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.82, 0.025, 8, 64),
      createGameMaterial(0x38bdf8, "base")
    ),
    0x38bdf8,
    "base"
  );

  shieldRing.position.y = 1.02;
  shieldRing.rotation.x = Math.PI / 2;

  if (shieldRing.material) {
    shieldRing.material.transparent = true;
    shieldRing.material.opacity = 0.74;
    shieldRing.material.depthWrite = false;
  }

  const frontPanel = createBasePanel(0, 0.78, 0.54, 0);
  const backPanel = createBasePanel(0, 0.78, -0.54, Math.PI);
  const leftPanel = createBasePanel(-0.54, 0.78, 0, -Math.PI / 2);
  const rightPanel = createBasePanel(0.54, 0.78, 0, Math.PI / 2);

  const turretA = createBaseMiniTurret(-0.48, 0.38, 0.48);
  const turretB = createBaseMiniTurret(0.48, 0.38, 0.48);
  const turretC = createBaseMiniTurret(0, 0.38, -0.58);

  const antenna = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.035, 0.5, 8),
      createGameMaterial(0x93c5fd, "base")
    ),
    0x93c5fd,
    "base"
  );

  antenna.position.set(-0.32, 2.14, 0);

  const antennaOrb = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 12),
      createGameMaterial(0x38bdf8, "base")
    ),
    0x38bdf8,
    "base"
  );

  antennaOrb.position.set(-0.32, 2.42, 0);

  const flagPole = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.58, 8),
      createGameMaterial(0xe5e7eb, "base")
    ),
    0xe5e7eb,
    "base"
  );

  flagPole.position.set(0.31, 2.14, 0);

  const flag = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.2, 0.035),
      createGameMaterial(0x22c55e, "base")
    ),
    0x22c55e,
    "base"
  );

  flag.position.set(0.4, 2.42, 0);

  group.add(
    foundation,
    lowerRing,
    coreTower,
    armorBand,
    roof,
    beacon,
    shieldRing,
    frontPanel,
    backPanel,
    leftPanel,
    rightPanel,
    turretA,
    turretB,
    turretC,
    antenna,
    antennaOrb,
    flagPole,
    flag
  );

  scene.add(group);

  baseGroup = group;
  baseBeacon = beacon;
  baseShieldRing = shieldRing;
  baseFlag = flag;

  baseLight = new THREE.PointLight(0x38bdf8, 1.25, 5);
  baseLight.position.set(basePosition.x, 2.1, basePosition.z);
  scene.add(baseLight);

  group.userData.baseTurrets = [turretA, turretB, turretC];

  return group;
}

export function updateBaseFortPosition(base) {
  const basePosition = getActiveBasePosition();

  if (base) {
    base.position.set(basePosition.x, 0, basePosition.z);
  }

  if (baseGroup && baseGroup !== base) {
    baseGroup.position.set(basePosition.x, 0, basePosition.z);
  }

  if (baseLight) {
    baseLight.position.set(basePosition.x, 2.1, basePosition.z);
  }
}

export function animateBaseFort(time) {
  if (baseBeacon) {
    const pulse = 1 + Math.sin(time * 0.006) * 0.16;

    baseBeacon.scale.setScalar(pulse);
    baseBeacon.rotation.y += 0.025;
  }

  if (baseShieldRing) {
    baseShieldRing.rotation.z += 0.01;

    const pulse = 1 + Math.sin(time * 0.005) * 0.035;
    baseShieldRing.scale.set(pulse, pulse, pulse);
  }

  if (baseFlag) {
    baseFlag.rotation.z = Math.sin(time * 0.006) * 0.08;
  }

  if (baseLight) {
    baseLight.intensity = 1.05 + Math.sin(time * 0.007) * 0.16;
  }

  if (baseShieldRing?.parent?.userData?.baseTurrets) {
    const turrets = baseShieldRing.parent.userData.baseTurrets;

    turrets.forEach((turret, index) => {
      turret.rotation.y += 0.006 + index * 0.0015;

      const head = turret.userData.turretHead;

      if (head) {
        head.position.y = 0.2 + Math.sin(time * 0.006 + index) * 0.015;
      }
    });
  }
}

export function clearBaseFortRefs() {
  baseLight = null;
  baseBeacon = null;
  baseShieldRing = null;
  baseFlag = null;
  baseGroup = null;
}

function createBasePanel(x, y, z, rotationY) {
  const panel = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.34, 0.08),
      createGameMaterial(0x172554, "base")
    ),
    0x172554,
    "base"
  );

  panel.position.set(x, y, z);
  panel.rotation.y = rotationY;
  panel.castShadow = true;
  panel.receiveShadow = true;

  const gem = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.12, 0.025),
      createGameMaterial(0x38bdf8, "base")
    ),
    0x38bdf8,
    "base"
  );

  gem.position.set(0, 0.02, 0.045);
  panel.add(gem);

  return panel;
}

function createBaseMiniTurret(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const base = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, 0.12, 12),
      createGameMaterial(0x1e40af, "base")
    ),
    0x1e40af,
    "base"
  );

  base.position.y = 0.06;

  const head = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.16, 0.22),
      createGameMaterial(0x2563eb, "base")
    ),
    0x2563eb,
    "base"
  );

  head.position.y = 0.2;

  const barrel = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.03, 0.36, 8),
      createGameMaterial(0x93c5fd, "base")
    ),
    0x93c5fd,
    "base"
  );

  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.2, 0.25);

  group.add(base, head, barrel);
  group.userData.turretHead = head;

  return group;
}