import * as THREE from "three";
import { createGameMaterial } from "./materials.js";

let showcaseObjects = [];

export function initTransformShowcase(scene) {
  clearTransformShowcase(scene);

  const group = new THREE.Group();
  group.name = "Transform Showcase Zone";
  group.position.set(-13.5, 0, 12.5);

  const platform = createShowcasePlatform();
  group.add(platform);

  const drone = createTrainingDrone();
  drone.position.set(-1.6, 0.25, 0);
  group.add(drone);

  const crystal = createTrainingCrystal();
  crystal.position.set(0, 0.45, 0);
  group.add(crystal);

  const crate = createCommandCrate();
  crate.position.set(1.6, 0.28, 0);
  group.add(crate);

  const beacon = createBeacon();
  beacon.position.set(0, 0.08, -1.15);
  group.add(beacon);

  group.userData.isStageDecoration = false;

  scene.add(group);

  showcaseObjects = [drone, crystal, crate];

  return showcaseObjects;
}

export function getTransformShowcaseObjects() {
  return showcaseObjects;
}

function clearTransformShowcase(scene) {
  if (showcaseObjects.length === 0) return;

  const parent = showcaseObjects[0].parent;

  if (parent) {
    scene.remove(parent);
  }

  showcaseObjects = [];
}

function createShowcasePlatform() {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(5.4, 0.18, 2.6),
    createGameMaterial(0x0f172a, "base")
  );

  base.position.y = 0.02;
  base.castShadow = true;
  base.receiveShadow = true;

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(5.7, 0.08, 2.9),
    createGameMaterial(0x38bdf8, "base")
  );

  trim.position.y = -0.07;
  trim.castShadow = true;
  trim.receiveShadow = true;

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 0.86, 48),
    createGameMaterial(0xfacc15, "base")
  );

  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.13;

  if (marker.material) {
    marker.material.transparent = true;
    marker.material.opacity = 0.38;
    marker.material.depthWrite = false;
    marker.material.side = THREE.DoubleSide;
  }

  group.add(trim, base, marker);

  return group;
}

function createTrainingDrone() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 18, 14),
    createGameMaterial(0x60a5fa, "tower")
  );

  body.scale.set(1.1, 0.65, 1.1);
  body.castShadow = true;
  body.receiveShadow = true;

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 14, 10),
    createGameMaterial(0xfacc15, "portal")
  );

  core.position.y = 0.04;
  core.castShadow = true;

  const wingLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.08, 0.18),
    createGameMaterial(0x1d4ed8, "tower")
  );

  wingLeft.position.set(-0.42, 0.02, 0);
  wingLeft.castShadow = true;

  const wingRight = wingLeft.clone();
  wingRight.position.x = 0.42;

  group.add(body, core, wingLeft, wingRight);

  prepareTransformableObject(group, {
    name: "Training Drone",
    type: "showcase-drone"
  });

  return group;
}

function createTrainingCrystal() {
  const group = new THREE.Group();

  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42),
    createGameMaterial(0xc084fc, "portal")
  );

  crystal.scale.y = 1.65;
  crystal.position.y = 0.28;
  crystal.castShadow = true;
  crystal.receiveShadow = true;

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.48, 0.18, 18),
    createGameMaterial(0x312e81, "base")
  );

  base.position.y = -0.28;
  base.castShadow = true;
  base.receiveShadow = true;

  group.add(crystal, base);

  prepareTransformableObject(group, {
    name: "Energy Crystal",
    type: "showcase-crystal"
  });

  return group;
}

function createCommandCrate() {
  const group = new THREE.Group();

  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.56, 0.72),
    createGameMaterial(0x92400e, "base")
  );

  crate.position.y = 0.02;
  crate.castShadow = true;
  crate.receiveShadow = true;

  const bandA = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.08, 0.12),
    createGameMaterial(0xfacc15, "base")
  );

  bandA.position.set(0, 0.12, 0.37);
  bandA.castShadow = true;

  const bandB = bandA.clone();
  bandB.position.z = -0.37;

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.56, 8),
    createGameMaterial(0xe5e7eb, "base")
  );

  antenna.position.set(0.26, 0.45, 0.18);
  antenna.castShadow = true;

  group.add(crate, bandA, bandB, antenna);

  prepareTransformableObject(group, {
    name: "Command Crate",
    type: "showcase-crate"
  });

  return group;
}

function createBeacon() {
  const group = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.7, 10),
    createGameMaterial(0xe5e7eb, "base")
  );

  pole.position.y = 0.35;
  pole.castShadow = true;

  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 8),
    createGameMaterial(0x22c55e, "portal")
  );

  light.position.y = 0.76;
  light.castShadow = true;

  group.add(pole, light);

  return group;
}

function prepareTransformableObject(object, data) {
  object.userData.isTransformable = true;
  object.userData.name = data.name;
  object.userData.type = data.type;
  object.userData.baseColor = 0x38bdf8;
  object.userData.shaderRole = "tower";

  object.traverse((child) => {
    if (!child.isMesh) return;

    child.userData.parentTransformObject = object;
    child.userData.baseColor =
      child.material?.color?.getHex?.() ?? object.userData.baseColor;
    child.userData.shaderRole = child.userData.shaderRole ?? "tower";
  });
}