import * as THREE from "three";
import { createGameMaterial } from "./materials.js";
import { state } from "../game/state.js";

let showcaseGroup = null;
let showcaseObjects = [];
let labelSprite = null;

export function initTransformShowcase(scene) {
  clearTransformShowcase(scene);

  showcaseGroup = new THREE.Group();
  showcaseGroup.name = "Transform Showcase Zone";
  showcaseGroup.userData.isTransformShowcase = true;
  showcaseGroup.userData.preserveOnStageRebuild = true;

  // Separate 3D object lab placed outside the main battlefield.
  showcaseGroup.position.set(-9.4, 0.18, 15.4);

  const platform = createShowcasePlatform();
  showcaseGroup.add(platform);

  const drone = createTrainingDrone();
  drone.position.set(-1.7, 0.42, 0);
  drone.userData.baseY = drone.position.y;
  showcaseGroup.add(drone);

  const crystal = createTrainingCrystal();
  crystal.position.set(0, 0.62, 0);
  crystal.userData.baseY = crystal.position.y;
  showcaseGroup.add(crystal);

  const crate = createCommandCrate();
  crate.position.set(1.7, 0.44, 0);
  crate.userData.baseY = crate.position.y;
  showcaseGroup.add(crate);

  const beacon = createBeacon();
  beacon.position.set(0, 0.08, -1.15);
  showcaseGroup.add(beacon);

  const rails = createShowcaseRails();
  showcaseGroup.add(rails);

  labelSprite = createTextSprite("6DOF Transform Test");
  labelSprite.position.set(0, 1.95, -1.25);
  showcaseGroup.add(labelSprite);

  markPreservedTree(showcaseGroup);

  scene.add(showcaseGroup);

  showcaseObjects = [drone, crystal, crate];

  return showcaseObjects;
}

export function getTransformShowcaseObjects() {
  return showcaseObjects;
}

export function updateTransformShowcase(camera) {
  if (!showcaseGroup) return;

  for (const object of showcaseObjects) {
    if (!object.userData.floatOffset) continue;

    const isSelected = state.selectedObject === object;
    const isObjectMode = state.controlMode === "object";

    /*
      Object 6DOF modunda seçili objenin Y pozisyonunu bobbing animasyonu
      ezmesin. Q/E ile yukarı-aşağı taşıdığımız değeri yeni baseY olarak
      kaydediyoruz. Böylece objeyi bırakınca eski yüksekliğe zıplamıyor.
    */
    if (isSelected && isObjectMode) {
      object.userData.baseY = object.position.y;
      object.userData.floatTime = 0;
      continue;
    }

    object.userData.floatTime += 0.018;

    const bob =
      Math.sin(object.userData.floatTime + object.userData.floatOffset) * 0.035;

    object.position.y = object.userData.baseY + bob;
  }

  if (labelSprite && camera) {
    labelSprite.quaternion.copy(camera.quaternion);
  }
}

function clearTransformShowcase(scene) {
  if (showcaseGroup) {
    scene.remove(showcaseGroup);
  }

  showcaseGroup = null;
  showcaseObjects = [];
  labelSprite = null;
}

function createShowcasePlatform() {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 0.2, 2.8),
    createGameMaterial(0x0f172a, "base")
  );

  base.position.y = 0.02;
  base.castShadow = true;
  base.receiveShadow = true;

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(6.05, 0.09, 3.05),
    createGameMaterial(0x38bdf8, "base")
  );

  trim.position.y = -0.08;
  trim.castShadow = true;
  trim.receiveShadow = true;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 2.3),
    createGameMaterial(0x12203a, "ground")
  );

  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.145;
  floor.receiveShadow = true;

  const markerA = createMarkerRing(0x22c55e);
  markerA.position.set(-1.7, 0.19, 0);

  const markerB = createMarkerRing(0xc084fc);
  markerB.position.set(0, 0.19, 0);

  const markerC = createMarkerRing(0xfacc15);
  markerC.position.set(1.7, 0.19, 0);

  group.add(trim, base, floor, markerA, markerB, markerC);

  return group;
}

function createMarkerRing(color) {
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.48, 0.6, 48),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );

  marker.rotation.x = -Math.PI / 2;
  marker.renderOrder = 55;

  return marker;
}

function createShowcaseRails() {
  const group = new THREE.Group();

  const railMaterial = createGameMaterial(0x38bdf8, "base");

  const front = new THREE.Mesh(
    new THREE.BoxGeometry(5.65, 0.08, 0.08),
    railMaterial
  );

  front.position.set(0, 0.22, 1.24);
  front.castShadow = true;

  const back = front.clone();
  back.position.z = -1.24;

  const left = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 2.55),
    railMaterial
  );

  left.position.set(-2.85, 0.22, 0);
  left.castShadow = true;

  const right = left.clone();
  right.position.x = 2.85;

  group.add(front, back, left, right);

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

  const rotor = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.025, 8, 32),
    createGameMaterial(0x38bdf8, "portal")
  );

  rotor.rotation.x = Math.PI / 2;
  rotor.position.y = 0.16;
  rotor.castShadow = true;

  group.add(body, core, wingLeft, wingRight, rotor);

  prepareTransformableObject(group, {
    name: "Training Drone",
    type: "showcase-drone",
    baseColor: 0x60a5fa,
    baseY: 0.42,
    floatOffset: 0.1
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

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.025, 8, 40),
    createGameMaterial(0x7dd3fc, "portal")
  );

  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.24;
  halo.castShadow = true;

  group.add(crystal, base, halo);

  prepareTransformableObject(group, {
    name: "Energy Crystal",
    type: "showcase-crystal",
    baseColor: 0xc084fc,
    baseY: 0.62,
    floatOffset: 1.3
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

  const dish = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.18, 16),
    createGameMaterial(0x38bdf8, "base")
  );

  dish.rotation.x = Math.PI / 2;
  dish.position.set(0.26, 0.76, 0.18);
  dish.castShadow = true;

  group.add(crate, bandA, bandB, antenna, dish);

  prepareTransformableObject(group, {
    name: "Command Crate",
    type: "showcase-crate",
    baseColor: 0x92400e,
    baseY: 0.44,
    floatOffset: 2.4
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
  object.userData.baseColor = data.baseColor;
  object.userData.shaderRole = "tower";
  object.userData.baseY = data.baseY;
  object.userData.floatOffset = data.floatOffset;
  object.userData.floatTime = 0;
  object.userData.preserveOnStageRebuild = true;

  object.traverse((child) => {
    if (!child.isMesh) return;

    child.userData.parentTransformObject = object;
    child.userData.baseColor =
      child.material?.color?.getHex?.() ?? object.userData.baseColor;
    child.userData.shaderRole = child.userData.shaderRole ?? "tower";
    child.userData.preserveOnStageRebuild = true;
  });
}

function createTextSprite(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;

  const context = canvas.getContext("2d");

  context.clearRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(8, 15, 30, 0.86)";
  roundRect(context, 16, 18, 480, 84, 18);
  context.fill();

  context.strokeStyle = "rgba(56, 189, 248, 0.95)";
  context.lineWidth = 4;
  roundRect(context, 16, 18, 480, 84, 18);
  context.stroke();

  context.font = "bold 34px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#facc15";
  context.fillText(text, 256, 60);

  context.font = "bold 18px Arial";
  context.fillStyle = "#bae6fd";
  context.fillText("Select objects and press F3 for Object 6DOF", 256, 92);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.2, 1.05, 1);
  sprite.userData.preserveOnStageRebuild = true;

  return sprite;
}

function markPreservedTree(root) {
  root.userData.preserveOnStageRebuild = true;

  root.traverse((child) => {
    child.userData.preserveOnStageRebuild = true;
  });
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}