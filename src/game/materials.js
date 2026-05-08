import * as THREE from "three";
import { state } from "./state.js";

const SHADER_MODES = ["standard", "toon", "neon", "xray"];

export function createGameMaterial(color) {
  const baseColor = new THREE.Color(color);

  if (state.shaderMode === "toon") {
    return new THREE.MeshToonMaterial({
      color: baseColor,
      emissive: baseColor.clone().multiplyScalar(0.08)
    });
  }

  if (state.shaderMode === "neon") {
    return new THREE.MeshBasicMaterial({
      color: baseColor.clone().lerp(new THREE.Color(0xffffff), 0.35)
    });
  }

  if (state.shaderMode === "xray") {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x67e8f9),
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      wireframe: true
    });
  }

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    emissive: 0x000000,
    emissiveIntensity: 0,
    roughness: 0.65,
    metalness: 0.05
  });
}
export function toggleShaderMode(scene) {
  const currentIndex = SHADER_MODES.indexOf(state.shaderMode);
  const nextIndex = (currentIndex + 1) % SHADER_MODES.length;

  state.shaderMode = SHADER_MODES[nextIndex];

  const meshes = [];

  scene.traverse((object) => {
    if (!object.isMesh) return;
    if (object.userData?.baseColor === undefined) return;
    if (object.isSprite) return;

    meshes.push(object);
  });

  for (const mesh of meshes) {
    const oldMaterial = mesh.material;

    try {
      mesh.material = createGameMaterial(mesh.userData.baseColor);

      if (oldMaterial?.dispose) {
        oldMaterial.dispose();
      }
    } catch (error) {
      console.error("Shader material switch failed:", error);
      mesh.material = new THREE.MeshStandardMaterial({
        color: mesh.userData.baseColor
      });
    }
  }

  console.log("Shader mode:", state.shaderMode);
}

export function getShaderModeLabel() {
  if (state.shaderMode === "toon") return "Toon";
  if (state.shaderMode === "neon") return "Neon";
  if (state.shaderMode === "xray") return "X-Ray";

  return "Standard";
}