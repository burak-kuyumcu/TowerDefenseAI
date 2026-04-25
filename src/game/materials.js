import * as THREE from "three";
import { state } from "./state.js";

export function createGameMaterial(color) {
  if (state.shaderMode === "toon") {
    return new THREE.MeshToonMaterial({ color });
  }

  return new THREE.MeshStandardMaterial({ color });
}

export function toggleShaderMode(scene) {
  state.shaderMode = state.shaderMode === "standard" ? "toon" : "standard";

  scene.traverse((object) => {
    if (!object.isMesh) return;
    if (!object.userData.baseColor) return;

    object.material.dispose();
    object.material = createGameMaterial(object.userData.baseColor);
  });
}