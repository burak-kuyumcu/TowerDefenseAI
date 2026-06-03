import * as THREE from "three";
import { createGameMaterial } from "../visuals/materials.js";

import {
  applyShaderData,
  markStageDecoration,
  blockTerrainArea,
  isAreaSafe,
  hash01
} from "./sceneObjectUtils.js";

import {
  reserveDecorSpot,
  isDecorSpotFree,
  registerAnimatedObject
} from "./decorRegistry.js";

export function createCrystalField(scene, x, z, count = 5, spread = 0.9) {
  if (!isAreaSafe(x, z, 1.35, 1.35, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.72)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < count; i++) {
    const color = i % 2 === 0 ? 0x7dd3fc : 0xc084fc;

    const crystal = applyShaderData(
      new THREE.Mesh(
        new THREE.OctahedronGeometry(0.18 + hash01(x + i, z, 991) * 0.08),
        createGameMaterial(color, "decor")
      ),
      color,
      "decor"
    );

    crystal.position.set(
      (hash01(x + i, z, 993) - 0.5) * spread,
      0.28 + hash01(x, z + i, 995) * 0.18,
      (hash01(x, z + i, 997) - 0.5) * spread
    );

    crystal.scale.y = 1.35 + hash01(x + i, z, 999) * 0.8;
    crystal.rotation.y = hash01(x + i, z, 1001) * Math.PI;
    crystal.castShadow = true;
    crystal.receiveShadow = true;

    group.add(crystal);
  }

  const glow = applyShaderData(
    new THREE.Mesh(
      new THREE.RingGeometry(0.34, 0.62, 48),
      createGameMaterial(0x7dd3fc, "decor")
    ),
    0x7dd3fc,
    "decor"
  );

  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.055;

  if (glow.material) {
    glow.material.transparent = true;
    glow.material.opacity = 0.22;
    glow.material.depthWrite = false;
    glow.material.side = THREE.DoubleSide;
  }

  group.add(glow);

  markStageDecoration(group);
  registerAnimatedObject(group, "crystal", {
    speed: 0.003 + hash01(x, z, 1003) * 0.004
  });

  reserveDecorSpot(x, z, 0.72);
  blockTerrainArea(x, z, 1.2, 1.2);
  scene.add(group);
}

export function createLargeCrystalFormation(scene, x, z) {
  if (!isAreaSafe(x, z, 1.45, 1.45, 0.24)) return;
  if (!isDecorSpotFree(x, z, 0.82)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const crystals = [
    { x: 0, z: 0, height: 1.25, radius: 0.22, color: 0x7dd3fc },
    { x: 0.34, z: 0.18, height: 0.95, radius: 0.17, color: 0xc084fc },
    { x: -0.34, z: 0.22, height: 0.82, radius: 0.16, color: 0x38bdf8 },
    { x: 0.12, z: -0.34, height: 0.72, radius: 0.14, color: 0xa78bfa }
  ];

  for (const config of crystals) {
    const crystal = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(config.radius, config.height, 6),
        createGameMaterial(config.color, "decor")
      ),
      config.color,
      "decor"
    );

    crystal.position.set(config.x, config.height / 2, config.z);
    crystal.rotation.y = hash01(x + config.x, z + config.z, 1011) * Math.PI;
    crystal.rotation.z = (hash01(x + config.x, z, 1013) - 0.5) * 0.18;
    crystal.castShadow = true;
    crystal.receiveShadow = true;

    group.add(crystal);
  }

  const base = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.72, 0.16, 18),
      createGameMaterial(0x1e1b4b, "decor")
    ),
    0x1e1b4b,
    "decor"
  );

  base.position.y = 0.08;
  base.castShadow = true;
  base.receiveShadow = true;

  group.add(base);

  markStageDecoration(group);
  registerAnimatedObject(group, "crystal", {
    speed: 0.0025 + hash01(x, z, 1015) * 0.0025
  });

  reserveDecorSpot(x, z, 0.82);
  blockTerrainArea(x, z, 1.35, 1.35);
  scene.add(group);
}

export function createRunePlate(scene, x, z, scale = 1) {
  if (!isAreaSafe(x, z, 0.9 * scale, 0.9 * scale, 0.14, true)) return;
  if (!isDecorSpotFree(x, z, 0.5 * scale)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.065, z);
  group.scale.setScalar(scale);

  const plate = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.4, 0.055, 24),
      createGameMaterial(0x1e1b4b, "decor")
    ),
    0x1e1b4b,
    "decor"
  );

  plate.castShadow = true;
  plate.receiveShadow = true;

  const rune = applyShaderData(
    new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.27, 36),
      createGameMaterial(0xc084fc, "decor")
    ),
    0xc084fc,
    "decor"
  );

  rune.rotation.x = -Math.PI / 2;
  rune.position.y = 0.04;

  if (rune.material) {
    rune.material.transparent = true;
    rune.material.opacity = 0.65;
    rune.material.depthWrite = false;
    rune.material.side = THREE.DoubleSide;
  }

  const innerRune = applyShaderData(
    new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 24),
      createGameMaterial(0x7dd3fc, "decor")
    ),
    0x7dd3fc,
    "decor"
  );

  innerRune.rotation.x = -Math.PI / 2;
  innerRune.position.y = 0.045;

  if (innerRune.material) {
    innerRune.material.transparent = true;
    innerRune.material.opacity = 0.42;
    innerRune.material.depthWrite = false;
    innerRune.material.side = THREE.DoubleSide;
  }

  group.add(plate, rune, innerRune);

  markStageDecoration(group);
  registerAnimatedObject(group, "runeGlow");
  reserveDecorSpot(x, z, 0.5 * scale);
  scene.add(group);
}