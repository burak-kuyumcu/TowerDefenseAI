import * as THREE from "three";
import { createGameMaterial } from "./materials.js";

let showcaseGroup = null;

let showcaseActive = false;
let showcaseTransitioning = false;
let hideAfterReturn = false;

let savedCameraPosition = null;
let savedCameraQuaternion = null;

let startPosition = null;
let startQuaternion = null;
let targetPosition = null;
let targetQuaternion = null;

let transitionStartTime = 0;

const TRANSITION_DURATION = 1350;
const NAME_TEXT = "AYDIN BURAK KUYUMCU";

const SHOWCASE_POSITION = new THREE.Vector3(0, 0.35, 15.8);
const SHOWCASE_CAMERA_POSITION = new THREE.Vector3(0, 7.3, 20.4);
const SHOWCASE_CAMERA_TARGET = new THREE.Vector3(0, 0.85, 15.8);

export function initNameShowcase(scene) {
  if (showcaseGroup) {
    scene.remove(showcaseGroup);
  }

  showcaseGroup = new THREE.Group();
  showcaseGroup.name = "3D Name Showcase";
  showcaseGroup.position.copy(SHOWCASE_POSITION);
  showcaseGroup.visible = false;

  showcaseGroup.userData.preserveOnStageRebuild = true;
  showcaseGroup.userData.isNameShowcase = true;

  showcaseGroup.add(createPlatform());
  showcaseGroup.add(createNameLetters(NAME_TEXT));
  showcaseGroup.add(createDecorativeTowerRow());
  showcaseGroup.add(createEnergyCrystals());
  showcaseGroup.add(createTitlePlate());
  showcaseGroup.add(createLocalShowcaseLight());

  markPreservedTree(showcaseGroup);

  scene.add(showcaseGroup);
}

export function toggleNameShowcaseCamera(camera) {
  if (!showcaseGroup || showcaseTransitioning) return;

  showcaseTransitioning = true;
  transitionStartTime = performance.now();

  startPosition = camera.position.clone();
  startQuaternion = camera.quaternion.clone();

  if (!showcaseActive) {
    showcaseGroup.visible = true;
    hideAfterReturn = false;

    savedCameraPosition = camera.position.clone();
    savedCameraQuaternion = camera.quaternion.clone();

    targetPosition = SHOWCASE_CAMERA_POSITION.clone();
    targetQuaternion = null;

    showcaseActive = true;
  } else {
    showcaseGroup.visible = false;
    hideAfterReturn = false;

    targetPosition = savedCameraPosition.clone();
    targetQuaternion = savedCameraQuaternion.clone();

    showcaseActive = false;
  }
}

export function updateNameShowcaseCamera(camera) {
  animateShowcaseObjects(camera);

  if (!showcaseTransitioning) {
    if (showcaseActive) {
      camera.position.copy(SHOWCASE_CAMERA_POSITION);
      camera.lookAt(SHOWCASE_CAMERA_TARGET);
      return true;
    }

    return false;
  }

  const elapsed = performance.now() - transitionStartTime;
  const t = Math.min(elapsed / TRANSITION_DURATION, 1);
  const eased = easeInOutCubic(t);

  camera.position.lerpVectors(startPosition, targetPosition, eased);

  if (showcaseActive) {
    camera.lookAt(SHOWCASE_CAMERA_TARGET);
  } else if (targetQuaternion) {
    camera.quaternion.slerpQuaternions(
      startQuaternion,
      targetQuaternion,
      eased
    );
  }

  if (t >= 1) {
    camera.position.copy(targetPosition);

    if (showcaseActive) {
      camera.lookAt(SHOWCASE_CAMERA_TARGET);
    } else if (targetQuaternion) {
      camera.quaternion.copy(targetQuaternion);
    }

    showcaseTransitioning = false;

    if (hideAfterReturn && showcaseGroup) {
      showcaseGroup.visible = false;
      hideAfterReturn = false;
    }
  }

  return true;
}

function createPlatform() {
  const group = new THREE.Group();

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(11.6, 0.18, 3.6),
    createGameMaterial(0x38bdf8, "base")
  );
  trim.position.y = -0.08;
  trim.castShadow = true;
  trim.receiveShadow = true;

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(11.1, 0.32, 3.2),
    createGameMaterial(0x0f172a, "base")
  );
  base.position.y = 0.06;
  base.castShadow = true;
  base.receiveShadow = true;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10.45, 2.72),
    new THREE.MeshBasicMaterial({
      color: 0x10223f,
      transparent: true,
      opacity: 0.94,
      side: THREE.DoubleSide
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.26;
  floor.renderOrder = 3;

  const glow = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.16, 72),
    new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(0, 0.31, 0);
  glow.renderOrder = 4;

  group.add(trim, base, floor, glow);

  return group;
}

function createTitlePlate() {
  const group = new THREE.Group();

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.22, 0.6),
    createGameMaterial(0x1e293b, "base")
  );
  plate.position.set(0, 0.62, -1.24);
  plate.castShadow = true;
  plate.receiveShadow = true;

  const line = new THREE.Mesh(
    new THREE.BoxGeometry(4.35, 0.07, 0.08),
    new THREE.MeshBasicMaterial({
      color: 0xfacc15
    })
  );
  line.position.set(0, 0.78, -0.9);
  line.castShadow = true;

  const label = createTextSprite("3D Name Showcase");
  label.position.set(0, 1.12, -1.28);

  group.add(plate, line, label);

  return group;
}

function createNameLetters(text) {
  const group = new THREE.Group();

  const characters = text.split("");
  const spacing = 0.32;
  const totalWidth = (characters.length - 1) * spacing;

  characters.forEach((char, index) => {
    if (char === " ") return;

    const letterGroup = createBlockLetter(char);

    letterGroup.position.set(
      index * spacing - totalWidth / 2,
      0.56,
      0.12
    );

    letterGroup.scale.setScalar(0.235);

    group.add(letterGroup);
  });

  return group;
}

function createBlockLetter(char) {
  const group = new THREE.Group();
  const pattern = getLetterPattern(char);

  const blockSize = 0.24;
  const height = 0.56;

  for (let row = 0; row < pattern.length; row++) {
    const line = pattern[row];

    for (let col = 0; col < line.length; col++) {
      if (line[col] !== "1") continue;

      const isPrimary = (row + col) % 2 === 0;

      const block = new THREE.Mesh(
        new THREE.BoxGeometry(blockSize, height, blockSize),
        createLetterMaterial(isPrimary)
      );

      block.position.set(
        col * blockSize - 0.48,
        0,
        row * blockSize - 0.78
      );

      block.castShadow = true;
      block.receiveShadow = true;

      const topCap = new THREE.Mesh(
        new THREE.BoxGeometry(blockSize * 0.82, 0.055, blockSize * 0.82),
        new THREE.MeshBasicMaterial({
          color: isPrimary ? 0x7dd3fc : 0xfacc15,
          transparent: true,
          opacity: 0.92
        })
      );

      topCap.position.set(
        block.position.x,
        height / 2 + 0.04,
        block.position.z
      );

      topCap.renderOrder = 8;

      const sideShade = new THREE.Mesh(
        new THREE.BoxGeometry(blockSize * 0.9, height * 0.82, 0.035),
        new THREE.MeshBasicMaterial({
          color: 0x020617,
          transparent: true,
          opacity: 0.28
        })
      );

      sideShade.position.set(
        block.position.x + 0.025,
        block.position.y,
        block.position.z - blockSize / 2 - 0.025
      );

      group.add(block, topCap, sideShade);
    }
  }

  return group;
}

function createLetterMaterial(isPrimary) {
  return new THREE.MeshStandardMaterial({
    color: isPrimary ? 0x38bdf8 : 0xfacc15,
    emissive: isPrimary ? 0x075985 : 0x713f12,
    emissiveIntensity: 0.23,
    roughness: 0.34,
    metalness: 0.22
  });
}

function createDecorativeTowerRow() {
  const group = new THREE.Group();

  const positions = [
    [-4.9, 0.52, 1.08],
    [-4.2, 0.52, 1.08],
    [4.2, 0.52, 1.08],
    [4.9, 0.52, 1.08]
  ];

  positions.forEach((position, index) => {
    const tower = createMiniTower(index);

    tower.position.set(position[0], position[1], position[2]);
    tower.scale.setScalar(0.58);

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
    [-3.8, 0.58, -0.86],
    [-3.2, 0.58, -0.86],
    [3.2, 0.58, -0.86],
    [3.8, 0.58, -0.86]
  ];

  positions.forEach((position, index) => {
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.26),
      createGameMaterial(index % 2 === 0 ? 0x7dd3fc : 0xc084fc, "base")
    );

    crystal.position.set(position[0], position[1], position[2]);
    crystal.scale.y = 1.55;
    crystal.castShadow = true;
    crystal.receiveShadow = true;
    crystal.userData.spinSpeed = 0.012 + index * 0.003;

    group.add(crystal);
  });

  return group;
}

function createLocalShowcaseLight() {
  const group = new THREE.Group();

  const point = new THREE.PointLight(0x7dd3fc, 3.0, 11);
  point.position.set(0, 3.5, 1.8);

  const warm = new THREE.PointLight(0xfacc15, 1.8, 8.5);
  warm.position.set(0, 2.5, -1.8);

  group.add(point, warm);

  return group;
}

function animateShowcaseObjects(camera) {
  if (!showcaseGroup) return;

  showcaseGroup.traverse((object) => {
    if (object.userData.spinSpeed) {
      object.rotation.y += object.userData.spinSpeed;
    }

    if (object.userData.isNameLabel && camera) {
      object.quaternion.copy(camera.quaternion);
    }
  });
}

function createTextSprite(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;

  const context = canvas.getContext("2d");

  context.clearRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(8, 15, 30, 0.84)";
  roundRect(context, 18, 14, 476, 66, 16);
  context.fill();

  context.strokeStyle = "rgba(56, 189, 248, 0.92)";
  context.lineWidth = 4;
  roundRect(context, 18, 14, 476, 66, 16);
  context.stroke();

  context.font = "bold 30px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#facc15";
  context.fillText(text, 256, 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.2, 0.6, 1);
  sprite.userData.isNameLabel = true;
  sprite.userData.preserveOnStageRebuild = true;

  return sprite;
}

function markPreservedTree(root) {
  root.userData.preserveOnStageRebuild = true;

  root.traverse((child) => {
    child.userData.preserveOnStageRebuild = true;
  });
}

function easeInOutCubic(t) {
  if (t < 0.5) {
    return 4 * t * t * t;
  }

  return 1 - Math.pow(-2 * t + 2, 3) / 2;
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