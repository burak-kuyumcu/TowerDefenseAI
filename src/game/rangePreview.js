import * as THREE from "three";
import { state } from "./state.js";

let rangePreview = null;

export function createRangePreview(scene) {
  const geometry = new THREE.RingGeometry(0.95, 1, 96);
  const material = new THREE.MeshBasicMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  rangePreview = new THREE.Mesh(geometry, material);
  rangePreview.rotation.x = -Math.PI / 2;
  rangePreview.position.y = 0.07;
  rangePreview.visible = false;

  scene.add(rangePreview);
}

export function updateRangePreview() {
  if (!rangePreview) return;

  const selected = state.selectedObject;

  if (!selected || !state.towers.includes(selected)) {
    rangePreview.visible = false;
    return;
  }

  const range = selected.userData.range ?? 1;

  rangePreview.visible = true;
  rangePreview.position.x = selected.position.x;
  rangePreview.position.z = selected.position.z;

  rangePreview.scale.set(range, range, range);
}