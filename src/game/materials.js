import * as THREE from "three";
import { state } from "./state.js";

import { toonVertexShader, toonFragmentShader } from "../shaders/toonShader.js";
import { neonVertexShader, neonFragmentShader } from "../shaders/neonShader.js";
import { xrayVertexShader, xrayFragmentShader } from "../shaders/xrayShader.js";

const SHADER_MODES = ["standard", "toon", "neon", "xray"];

export function createGameMaterial(color, shaderRole = "default") {
  if (state.shaderMode === "toon") {
    return createShaderMaterial(color, toonVertexShader, toonFragmentShader, {
      role: shaderRole,
      transparent: false,
      wireframe: false
    });
  }

  if (state.shaderMode === "neon") {
    return createShaderMaterial(color, neonVertexShader, neonFragmentShader, {
      role: shaderRole,
      transparent: false,
      wireframe: false
    });
  }

  if (state.shaderMode === "xray") {
    return createShaderMaterial(color, xrayVertexShader, xrayFragmentShader, {
      role: shaderRole,
      transparent: true,
      wireframe: shouldUseWireframe(shaderRole)
    });
  }

  return createStandardMaterial(color, shaderRole);
}

export function toggleShaderMode(scene) {
  const currentIndex = SHADER_MODES.indexOf(state.shaderMode);
  const nextIndex = (currentIndex + 1) % SHADER_MODES.length;

  state.shaderMode = SHADER_MODES[nextIndex];

  const meshes = [];

  scene.traverse((object) => {
    if (!object.isMesh) return;
    if (object.userData?.baseColor === undefined) return;
    meshes.push(object);
  });

  for (const mesh of meshes) {
    const oldMaterial = mesh.material;
    const color = mesh.userData.baseColor;
    const role = mesh.userData.shaderRole ?? "default";

    mesh.material = createGameMaterial(color, role);
    mesh.material.needsUpdate = true;

    oldMaterial?.dispose?.();
  }

  console.log("Shader mode changed:", state.shaderMode);
}

function createStandardMaterial(color, role) {
  const baseColor = new THREE.Color(color);

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    emissive: 0x000000,
    emissiveIntensity: role === "portal" || role === "base" ? 0.25 : 0,
    roughness: 0.65,
    metalness: role === "tower" || role === "base" ? 0.15 : 0.05
  });
}

function createShaderMaterial(color, vertexShader, fragmentShader, options) {
  const baseColor = getRoleAdjustedColor(color, options.role);
  const emissiveColor = new THREE.Color(0x000000);

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: options.transparent,
    wireframe: options.wireframe,
    depthWrite: !options.transparent,
    uniforms: {
      uColor: { value: baseColor },
      uEmissive: { value: emissiveColor },
      uEmissiveIntensity: { value: getRoleEmission(options.role) }
    }
  });

  material.emissive = material.uniforms.uEmissive.value;

  Object.defineProperty(material, "emissiveIntensity", {
    get() {
      return material.uniforms.uEmissiveIntensity.value;
    },
    set(value) {
      material.uniforms.uEmissiveIntensity.value = value;
    }
  });

  return material;
}

function getRoleAdjustedColor(color, role) {
  const c = new THREE.Color(color);

  if (state.shaderMode === "xray") {
    if (role === "path") return new THREE.Color(0xf59e0b);
    if (role === "ground") return new THREE.Color(0x14532d);
    if (role === "decor") return new THREE.Color(0x64748b);
    if (role === "base") return new THREE.Color(0x38bdf8);
    if (role === "portal") return new THREE.Color(0xfb923c);
    return new THREE.Color(0x67e8f9);
  }

  if (state.shaderMode === "neon") {
    if (role === "ground") return c.lerp(new THREE.Color(0x22c55e), 0.25);
    if (role === "path") return c.lerp(new THREE.Color(0xfacc15), 0.3);
    return c.lerp(new THREE.Color(0xffffff), 0.15);
  }

  return c;
}

function getRoleEmission(role) {
  if (state.shaderMode === "neon") {
    if (role === "tower" || role === "enemy") return 0.45;
    if (role === "base" || role === "portal") return 0.7;
    if (role === "path") return 0.25;
    return 0.08;
  }

  if (state.shaderMode === "xray") {
    if (role === "tower" || role === "enemy") return 0.65;
    if (role === "base" || role === "portal") return 0.8;
    if (role === "path") return 0.35;
    return 0.12;
  }

  return 0;
}

function shouldUseWireframe(role) {
  return role === "tower" || role === "enemy" || role === "boss";
}

export function getShaderModeLabel() {
  if (state.shaderMode === "toon") return "Toon";
  if (state.shaderMode === "neon") return "Neon";
  if (state.shaderMode === "xray") return "X-Ray";
  return "Standard";
}