import * as THREE from "three";
import { getActivePortalPosition } from "./constants.js";
import { createGameMaterial } from "../visuals/materials.js";
import { applyShaderData } from "./sceneObjectUtils.js";

let portalGroup = null;
let portalOuterRing = null;
let portalVerticalRing = null;
let portalInnerCore = null;
let portalGroundRing = null;
let portalLight = null;

export function createPortal(scene) {
  const portalPosition = getActivePortalPosition();

  const group = new THREE.Group();
  group.position.set(portalPosition.x, 0, portalPosition.z);

  const base = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 1.02, 0.28, 32),
      createGameMaterial(0x7c2d12, "portal")
    ),
    0x7c2d12,
    "portal"
  );

  base.position.y = 0.14;
  base.castShadow = true;
  base.receiveShadow = true;

  const outerRing = applyShaderData(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.105, 18, 56),
      createGameMaterial(0xef4444, "portal")
    ),
    0xef4444,
    "portal"
  );

  outerRing.position.y = 0.9;
  outerRing.rotation.x = Math.PI / 2;
  outerRing.castShadow = true;

  const verticalRing = applyShaderData(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.045, 12, 42),
      createGameMaterial(0xfacc15, "portal")
    ),
    0xfacc15,
    "portal"
  );

  verticalRing.position.y = 0.9;
  verticalRing.rotation.y = Math.PI / 2;

  const innerCore = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 24, 24),
      createGameMaterial(0xfacc15, "portal")
    ),
    0xfacc15,
    "portal"
  );

  innerCore.position.y = 0.9;

  const groundRing = applyShaderData(
    new THREE.Mesh(
      new THREE.RingGeometry(0.72, 0.98, 80),
      createGameMaterial(0xf97316, "portal")
    ),
    0xf97316,
    "portal"
  );

  groundRing.rotation.x = -Math.PI / 2;
  groundRing.position.y = 0.07;

  if (groundRing.material) {
    groundRing.material.transparent = true;
    groundRing.material.opacity = 0.82;
    groundRing.material.depthWrite = false;
    groundRing.material.side = THREE.DoubleSide;
  }

  const spikeGroup = new THREE.Group();

  for (let i = 0; i < 6; i++) {
    const spike = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.36, 8),
        createGameMaterial(0xffedd5, "portal")
      ),
      0xffedd5,
      "portal"
    );

    const angle = (Math.PI * 2 * i) / 6;

    spike.position.set(
      Math.cos(angle) * 0.88,
      0.42,
      Math.sin(angle) * 0.88
    );

    spike.rotation.z = Math.PI;
    spike.castShadow = true;

    spikeGroup.add(spike);
  }

  group.add(base, outerRing, verticalRing, innerCore, groundRing, spikeGroup);
  scene.add(group);

  portalGroup = group;
  portalOuterRing = outerRing;
  portalVerticalRing = verticalRing;
  portalInnerCore = innerCore;
  portalGroundRing = groundRing;

  portalLight = new THREE.PointLight(0xff6b00, 1.4, 5);
  portalLight.position.set(portalPosition.x, 1.1, portalPosition.z);
  scene.add(portalLight);

  return group;
}

export function updatePortalPosition() {
  const portalPosition = getActivePortalPosition();

  if (portalGroup) {
    portalGroup.position.set(portalPosition.x, 0, portalPosition.z);
  }

  if (portalLight) {
    portalLight.position.set(portalPosition.x, 1.1, portalPosition.z);
  }
}

export function animatePortal(time) {
  if (portalGroup) {
    portalGroup.rotation.y += 0.004;
  }

  if (portalOuterRing) {
    portalOuterRing.rotation.z += 0.025;
    portalOuterRing.rotation.y += 0.012;
  }

  if (portalVerticalRing) {
    portalVerticalRing.rotation.x += 0.015;
    portalVerticalRing.rotation.z -= 0.01;
  }

  if (portalInnerCore) {
    const pulse = 1 + Math.sin(time * 0.008) * 0.12;

    portalInnerCore.scale.setScalar(pulse);
    portalInnerCore.rotation.y += 0.035;
  }

  if (portalGroundRing) {
    portalGroundRing.rotation.z -= 0.018;
  }

  if (portalLight) {
    portalLight.intensity = 1.25 + Math.sin(time * 0.01) * 0.28;
  }
}

export function clearPortalRefs() {
  portalGroup = null;
  portalOuterRing = null;
  portalVerticalRing = null;
  portalInnerCore = null;
  portalGroundRing = null;
  portalLight = null;
}