import * as THREE from "three";
import { state } from "../game/state.js";

let directionalArrow = null;
let directionalTargetMarker = null;
let spotlightTargetMarker = null;

export function initLightControlVisuals(scene, directionalLight, spotLight) {
  createDirectionalArrow(scene);
  createDirectionalTargetMarker(scene);
  createSpotlightTargetMarker(scene);

  updateLightControlVisuals(directionalLight, spotLight);
}

export function updateLightControlVisuals(directionalLight, spotLight) {
  updateDirectionalArrow(directionalLight);
  updateDirectionalTargetMarker();
  updateSpotlightTargetMarker(spotLight);
}

function createDirectionalArrow(scene) {
  if (directionalArrow) {
    scene.remove(directionalArrow);
  }

  directionalArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 8, 0),
    3.2,
    0xfacc15,
    0.55,
    0.32
  );

  directionalArrow.visible = false;
  scene.add(directionalArrow);
}

function createDirectionalTargetMarker(scene) {
  if (directionalTargetMarker) {
    scene.remove(directionalTargetMarker);
  }

  directionalTargetMarker = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.42, 32),
    new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );

  directionalTargetMarker.rotation.x = -Math.PI / 2;
  directionalTargetMarker.position.set(0, 0.16, 0);
  directionalTargetMarker.renderOrder = 60;
  directionalTargetMarker.visible = false;

  scene.add(directionalTargetMarker);
}

function createSpotlightTargetMarker(scene) {
  if (spotlightTargetMarker) {
    scene.remove(spotlightTargetMarker);
  }

  spotlightTargetMarker = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.27, 32),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );

  spotlightTargetMarker.rotation.x = -Math.PI / 2;
  spotlightTargetMarker.renderOrder = 61;
  spotlightTargetMarker.visible = false;

  scene.add(spotlightTargetMarker);
}

function updateDirectionalArrow(directionalLight) {
  if (!directionalArrow || !directionalLight) return;

  const shouldShow =
    state.controlMode === "directional" && directionalLight.visible;

  directionalArrow.visible = shouldShow;

  if (!shouldShow) return;

  const origin = directionalLight.position.clone();

  const direction = new THREE.Vector3(0, 0, 0)
    .sub(origin)
    .normalize();

  directionalArrow.position.copy(origin);
  directionalArrow.setDirection(direction);
  directionalArrow.setLength(3.2, 0.55, 0.32);
}

function updateDirectionalTargetMarker() {
  if (!directionalTargetMarker) return;

  const shouldShow = state.controlMode === "directional";

  directionalTargetMarker.visible = shouldShow;

  if (!shouldShow) return;

  directionalTargetMarker.position.set(0, 0.16, 0);
  directionalTargetMarker.rotation.z += 0.01;
}

function updateSpotlightTargetMarker(spotLight) {
  if (!spotlightTargetMarker || !spotLight?.target) return;

  const shouldShow =
    state.controlMode === "spotlight" && spotLight.visible;

  spotlightTargetMarker.visible = shouldShow;

  if (!shouldShow) return;

  spotlightTargetMarker.position.copy(spotLight.target.position);
  spotlightTargetMarker.position.y = Math.max(
    0.16,
    spotLight.target.position.y + 0.08
  );

  spotlightTargetMarker.rotation.z -= 0.014;
}