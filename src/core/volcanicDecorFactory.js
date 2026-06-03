import * as THREE from "three";
import { createGameMaterial } from "../visuals/materials.js";

import {
  applyShaderData,
  markStageDecoration,
  isAreaSafe,
  hash01
} from "./sceneObjectUtils.js";

import {
  reserveDecorSpot,
  isDecorSpotFree
} from "./decorRegistry.js";

export function createLavaCrack(scene, x, z, length = 1.4, width = 0.3) {
  if (!isAreaSafe(x, z, length, width + 0.35, 0.12, true)) return;
  if (!isDecorSpotFree(x, z, 0.55)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.07, z);
  group.rotation.y = hash01(x, z, 521) * Math.PI;

  const crackCount = 4;

  for (let i = 0; i < crackCount; i++) {
    const segmentLength = length * (0.22 + hash01(x + i, z, 523) * 0.14);

    const glow = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(
          segmentLength,
          0.022,
          width * (0.16 + hash01(x, z + i, 525) * 0.12)
        ),
        createGameMaterial(0xf97316, "decor")
      ),
      0xf97316,
      "decor"
    );

    glow.position.set(
      -length * 0.38 + i * length * 0.25,
      0.012,
      (hash01(x + i, z, 527) - 0.5) * width
    );

    glow.rotation.y = (hash01(x, z + i, 529) - 0.5) * 0.75;

    if (glow.material) {
      glow.material.transparent = true;
      glow.material.opacity = 0.78;
      glow.material.depthWrite = false;
    }

    const darkRim = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(segmentLength * 1.1, 0.018, width * 0.12),
        createGameMaterial(0x2a0b08, "decor")
      ),
      0x2a0b08,
      "decor"
    );

    darkRim.position.copy(glow.position);
    darkRim.position.y = 0;
    darkRim.rotation.copy(glow.rotation);

    group.add(darkRim, glow);
  }

  const emberLight = new THREE.PointLight(0xf97316, 0.55, 2.2);
  emberLight.position.set(0, 0.35, 0);
  group.add(emberLight);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.55);
  scene.add(group);
}

export function createAshPatch(scene, x, z) {
  if (!isAreaSafe(x, z, 1.35, 1.0, 0.12, true)) return;

  const patch = applyShaderData(
    new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 30),
      createGameMaterial(0x1f1f1f, "decor")
    ),
    0x1f1f1f,
    "decor"
  );

  patch.rotation.x = -Math.PI / 2;
  patch.rotation.z = hash01(x, z, 541) * Math.PI;
  patch.position.set(x, 0.063, z);
  patch.scale.set(1.35, 0.72, 1);

  if (patch.material) {
    patch.material.transparent = true;
    patch.material.opacity = 0.38;
    patch.material.depthWrite = false;
    patch.material.side = THREE.DoubleSide;
  }

  markStageDecoration(patch);
  scene.add(patch);

  createAshPebbles(scene, x, z);
}

function createAshPebbles(scene, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0.08, z);

  const colors = [0x111827, 0x27272a, 0x3f3f46];

  for (let i = 0; i < 7; i++) {
    const pebble = applyShaderData(
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.045 + hash01(x + i, z, 551) * 0.035),
        createGameMaterial(colors[i % colors.length], "decor")
      ),
      colors[i % colors.length],
      "decor"
    );

    pebble.position.set(
      (hash01(x + i, z, 553) - 0.5) * 0.9,
      0.035,
      (hash01(x, z + i, 555) - 0.5) * 0.55
    );

    pebble.scale.y = 0.55;
    pebble.rotation.y = hash01(x + i, z, 557) * Math.PI;
    pebble.castShadow = true;
    pebble.receiveShadow = true;

    group.add(pebble);
  }

  markStageDecoration(group);
  scene.add(group);
}