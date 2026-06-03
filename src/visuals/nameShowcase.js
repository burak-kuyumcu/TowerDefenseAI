import * as THREE from "three";
import { createGameMaterial } from "./materials.js";

let showcaseGroup = null;

let showcaseActive = false;
let showcaseTransitioning = false;

let savedCameraPosition = null;
let savedCameraQuaternion = null;

let startPosition = null;
let startQuaternion = null;
let targetPosition = null;
let targetQuaternion = null;

let transitionStartTime = 0;
const TRANSITION_DURATION = 1450;

const NAME_TEXT = "AYDIN BURAK KUYUMCU";

export function initNameShowcase(scene) {
  if (showcaseGroup) {
    scene.remove(showcaseGroup);
  }

  showcaseGroup = new THREE.Group();
  showcaseGroup.position.set(0, 0.08, 16.5);
  showcaseGroup.rotation.y = 0;

  const platform = createPlatform();
  showcaseGroup.add(platform);

  const letters = createNameLetters(NAME_TEXT);
  showcaseGroup.add(letters);

  const towers = createDecorativeTowerRow();
  showcaseGroup.add(towers);

  const crystals = createEnergyCrystals();
  showcaseGroup.add(crystals);

  const titlePlate = createTitlePlate();
  showcaseGroup.add(titlePlate);

  scene.add(showcaseGroup);
}

export function toggleNameShowcaseCamera(camera) {
  if (!showcaseGroup || showcaseTransitioning) return;

  showcaseTransitioning = true;
  transitionStartTime = performance.now();

  startPosition = camera.position.clone();
  startQuaternion = camera.quaternion.clone();

  if (!showcaseActive) {
    savedCameraPosition = camera.position.clone();
    savedCameraQuaternion = camera.quaternion.clone();

    targetPosition = new THREE.Vector3(0, 18.5, 16.5);
    targetQuaternion = getLookAtQuaternion(targetPosition, showcaseGroup.position);

    showcaseActive = true;
  } else {
    targetPosition = savedCameraPosition.clone();
    targetQuaternion = savedCameraQuaternion.clone();

    showcaseActive = false;
  }
}

export function updateNameShowcaseCamera(camera) {
  animateShowcaseObjects();

  if (!showcaseTransitioning) {
    return showcaseActive;
  }

  const elapsed = performance.now() - transitionStartTime;
  const t = Math.min(elapsed / TRANSITION_DURATION, 1);
  const eased = easeInOutCubic(t);

  camera.position.lerpVectors(startPosition, targetPosition, eased);
  camera.quaternion.slerpQuaternions(startQuaternion, targetQuaternion, eased);

  if (t >= 1) {
    camera.position.copy(targetPosition);
    camera.quaternion.copy(targetQuaternion);

    showcaseTransitioning = false;
  }

  return true;
}

function createPlatform() {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(16.8, 0.22, 4.2),
    createGameMaterial(0x0f172a, "base")
  );

  base.position.y = 0.02;
  base.castShadow = true;
  base.receiveShadow = true;

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(17.2, 0.12, 4.55),
    createGameMaterial(0x38bdf8, "base")
  );

  trim.position.y = -0.08;
  trim.castShadow = true;
  trim.receiveShadow = true;

  const glow = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 1.65, 72),
    createGameMaterial(0x7dd3fc, "base")
  );

  glow.rotation.x = -Math.PI / 2;
  glow.position.set(0, 0.18, 0);

  if (glow.material) {
    glow.material.transparent = true;
    glow.material.opacity = 0.32;
    glow.material.depthWrite = false;
    glow.material.side = THREE.DoubleSide;
  }

  group.add(trim, base, glow);

  return group;
}

function createTitlePlate() {
  const group = new THREE.Group();

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 0.18, 0.6),
    createGameMaterial(0x1e293b, "base")
  );

  plate.position.set(0, 0.28, -1.78);
  plate.castShadow = true;
  plate.receiveShadow = true;

  const line = new THREE.Mesh(
    new THREE.BoxGeometry(5.7, 0.05, 0.08),
    createGameMaterial(0xfacc15, "base")
  );

  line.position.set(0, 0.42, -1.43);
  line.castShadow = true;

  group.add(plate, line);

  return group;
}

function createNameLetters(text) {
  const group = new THREE.Group();

  const characters = text.split("");
  const spacing = 0.54;
  const totalWidth = (characters.length - 1) * spacing;

  characters.forEach((char, index) => {
    if (char === " ") return;

    const letterGroup = createBlockLetter(char);

    letterGroup.position.set(index * spacing - totalWidth / 2, 0.28, 0.15);
    letterGroup.scale.setScalar(0.34);

    group.add(letterGroup);
  });

  return group;
}

function createBlockLetter(char) {
  const group = new THREE.Group();
  const pattern = getLetterPattern(char);

  const blockSize = 0.22;
  const depth = 0.16;
  const colorA = 0x38bdf8;
  const colorB = 0xfacc15;

  for (let row = 0; row < pattern.length; row++) {
    const line = pattern[row];

    for (let col = 0; col < line.length; col++) {
      if (line[col] !== "1") continue;

      const block = new THREE.Mesh(
        new THREE.BoxGeometry(blockSize, blockSize, depth),
        createGameMaterial((row + col) % 2 === 0 ? colorA : colorB, "base")
      );

      block.position.set(
        col * blockSize - 0.44,
        (pattern.length - row) * blockSize,
        0
      );

      block.castShadow = true;
      block.receiveShadow = true;

      group.add(block);
    }
  }

  return group;
}

function createDecorativeTowerRow() {
  const group = new THREE.Group();

  const positions = [
    [-7.6, 0.34, 1.45],
    [-6.7, 0.34, 1.45],
    [6.7, 0.34, 1.45],
    [7.6, 0.34, 1.45]
  ];

  positions.forEach((position, index) => {
    const tower = createMiniTower(index);

    tower.position.set(position[0], position[1], position[2]);
    tower.scale.setScalar(0.72);

    group.add(tower);
  });

  return group;
}

function createMiniTower(index) {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.34, 0.32, 18),
    createGameMaterial(0x1d4ed8, "base")
  );

  base.position.y = 0.16;
  base.castShadow = true;
  base.receiveShadow = true;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.55, 0.42),
    createGameMaterial(index % 2 === 0 ? 0x60a5fa : 0xc084fc, "base")
  );

  body.position.y = 0.58;
  body.castShadow = true;
  body.receiveShadow = true;

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.07, 0.62, 12),
    createGameMaterial(0xe5e7eb, "base")
  );

  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.63, 0.42);
  barrel.castShadow = true;

  group.add(base, body, barrel);

  return group;
}

function createEnergyCrystals() {
  const group = new THREE.Group();

  const positions = [
    [-5.8, 0.35, -1.35],
    [-4.9, 0.35, -1.35],
    [4.9, 0.35, -1.35],
    [5.8, 0.35, -1.35]
  ];

  positions.forEach((position, index) => {
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28),
      createGameMaterial(index % 2 === 0 ? 0x7dd3fc : 0xc084fc, "base")
    );

    crystal.position.set(position[0], position[1], position[2]);
    crystal.scale.y = 1.65;
    crystal.castShadow = true;
    crystal.receiveShadow = true;
    crystal.userData.spinSpeed = 0.012 + index * 0.003;

    group.add(crystal);
  });

  return group;
}

function animateShowcaseObjects() {
  if (!showcaseGroup) return;

  showcaseGroup.traverse((object) => {
    if (!object.userData.spinSpeed) return;

    object.rotation.y += object.userData.spinSpeed;
  });
}

function getLookAtQuaternion(position, target) {
  const dummy = new THREE.Object3D();

  dummy.position.copy(position);
  dummy.lookAt(target.x, target.y, target.z);

  return dummy.quaternion.clone();
}

function easeInOutCubic(t) {
  if (t < 0.5) {
    return 4 * t * t * t;
  }

  return 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getLetterPattern(char) {
  const patterns = {
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
    G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
    H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
    K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
    W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
    X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
    Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
    Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"]
  };

  return patterns[char] ?? patterns.A;
}