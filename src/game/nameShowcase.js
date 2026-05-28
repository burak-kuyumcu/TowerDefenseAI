import * as THREE from "three";
import { createGameMaterial } from "./materials.js";

let nameGroup = null;
let active = false;
let savedCameraPosition = null;
let savedCameraQuaternion = null;

const targetPosition = new THREE.Vector3(0, 18, 18);
const targetLookAt = new THREE.Vector3(0, 0, 13);

const LETTERS = {
  B: ["1110", "1001", "1110", "1001", "1110"],
  U: ["1001", "1001", "1001", "1001", "1111"],
  R: ["1110", "1001", "1110", "1010", "1001"],
  A: ["0110", "1001", "1111", "1001", "1001"],
  K: ["1001", "1010", "1100", "1010", "1001"],
  Y: ["1001", "1001", "0110", "0010", "0010"],
  M: ["1001", "1111", "1111", "1001", "1001"],
  C: ["1111", "1000", "1000", "1000", "1111"]
};

export function initNameShowcase(scene) {
  nameGroup = new THREE.Group();
  nameGroup.position.set(-4.8, 0.08, 12.5);

  createWord("BURAK", 0, 0, 0x38bdf8);
  createWord("KUYUMCU", 0, 2.1, 0xfacc15);

  createNameBase();
  createDecorPillars();

  scene.add(nameGroup);
}

export function toggleNameShowcaseCamera(camera) {
  active = !active;

  if (active) {
    savedCameraPosition = camera.position.clone();
    savedCameraQuaternion = camera.quaternion.clone();
  }
}

export function updateNameShowcaseCamera(camera) {
  if (!active) {
    if (!savedCameraPosition || !savedCameraQuaternion) return false;

    camera.position.lerp(savedCameraPosition, 0.045);
    camera.quaternion.slerp(savedCameraQuaternion, 0.045);

    if (camera.position.distanceTo(savedCameraPosition) < 0.08) {
      camera.position.copy(savedCameraPosition);
      camera.quaternion.copy(savedCameraQuaternion);
      savedCameraPosition = null;
      savedCameraQuaternion = null;
    }

    return true;
  }

  const tempCamera = camera.clone();
  tempCamera.position.copy(targetPosition);
  tempCamera.lookAt(targetLookAt);

  camera.position.lerp(targetPosition, 0.045);
  camera.quaternion.slerp(tempCamera.quaternion, 0.045);

  return true;
}

function createWord(word, startX, startZ, color) {
  let cursorX = startX;

  for (const char of word) {
    createLetter(char, cursorX, startZ, color);
    cursorX += 1.35;
  }
}

function createLetter(char, offsetX, offsetZ, color) {
  const pattern = LETTERS[char];
  if (!pattern) return;

  const blockSize = 0.26;

  for (let row = 0; row < pattern.length; row++) {
    for (let col = 0; col < pattern[row].length; col++) {
      if (pattern[row][col] !== "1") continue;

      const block = new THREE.Mesh(
        new THREE.BoxGeometry(blockSize, 0.22, blockSize),
        createGameMaterial(color, "base")
      );

      block.position.set(
        offsetX + col * blockSize,
        0.14,
        offsetZ + row * blockSize
      );

      block.castShadow = true;
      block.receiveShadow = true;
      block.userData.baseColor = color;
      block.userData.shaderRole = "base";

      nameGroup.add(block);
    }
  }
}

function createNameBase() {
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(10.8, 0.08, 3.3),
    createGameMaterial(0x0f172a, "base")
  );

  plate.position.set(4.6, 0, 0.82);
  plate.receiveShadow = true;
  plate.userData.baseColor = 0x0f172a;
  plate.userData.shaderRole = "base";

  nameGroup.add(plate);
}

function createDecorPillars() {
  const positions = [
    [-0.45, -0.35],
    [9.6, -0.35],
    [-0.45, 2.05],
    [9.6, 2.05]
  ];

  for (const [x, z] of positions) {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 0.65, 12),
      createGameMaterial(0x22c55e, "base")
    );

    pillar.position.set(x, 0.32, z);
    pillar.castShadow = true;
    pillar.userData.baseColor = 0x22c55e;
    pillar.userData.shaderRole = "base";

    nameGroup.add(pillar);
  }
}