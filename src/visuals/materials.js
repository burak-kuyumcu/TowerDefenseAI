import * as THREE from "three";
import { state } from "../game/state.js";

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
    if (object.userData?.isSelector) return;

    meshes.push(object);
  });

  for (const mesh of meshes) {
    const oldMaterial = mesh.material;
    const color = mesh.userData.baseColor;
    const role = mesh.userData.shaderRole ?? "default";

    mesh.material = createGameMaterial(color, role);
    mesh.material.needsUpdate = true;

    disposeMaterial(oldMaterial);
  }

  console.log(`Shader mode changed: ${getShaderModeLabel()}`);
}

export function getShaderModeLabel() {
  if (state.shaderMode === "toon") return "Toon";
  if (state.shaderMode === "neon") return "Neon";
  if (state.shaderMode === "xray") return "X-Ray / Scan";

  return "Standard";
}

export function getShaderModeDescription() {
  if (state.shaderMode === "toon") {
    return "Full-screen toon shader with posterized colors and outlines.";
  }

  if (state.shaderMode === "neon") {
    return "Full-screen neon shader with glow, scanlines and edge emphasis.";
  }

  if (state.shaderMode === "xray") {
    return "Full-screen scan shader with cyan x-ray style edge detection.";
  }

  return "Standard physically based material rendering.";
}

function createStandardMaterial(color, role) {
  const baseColor = new THREE.Color(color);

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    emissive: getStandardEmissive(role),
    emissiveIntensity: getStandardEmission(role),
    roughness: getRoughness(role),
    metalness: getMetalness(role)
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
    depthTest: true,
    uniforms: {
      uColor: {
        value: baseColor
      },
      uEmissive: {
        value: emissiveColor
      },
      uEmissiveIntensity: {
        value: getRoleEmission(options.role)
      }
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
    if (role === "tower") return new THREE.Color(0x67e8f9);
    if (role === "enemy") return new THREE.Color(0xef4444);
    if (role === "boss") return new THREE.Color(0xf97316);

    return new THREE.Color(0x67e8f9);
  }

  if (state.shaderMode === "neon") {
    if (role === "ground") return c.lerp(new THREE.Color(0x22c55e), 0.25);
    if (role === "path") return c.lerp(new THREE.Color(0xfacc15), 0.3);
    if (role === "portal") return c.lerp(new THREE.Color(0xfb923c), 0.3);
    if (role === "base") return c.lerp(new THREE.Color(0x38bdf8), 0.35);
    if (role === "enemy" || role === "boss") {
      return c.lerp(new THREE.Color(0xef4444), 0.2);
    }

    return c.lerp(new THREE.Color(0xffffff), 0.15);
  }

  if (state.shaderMode === "toon") {
    if (role === "path") return c.lerp(new THREE.Color(0xfacc15), 0.1);
    if (role === "ground") return c.lerp(new THREE.Color(0x22c55e), 0.08);

    return c;
  }

  return c;
}

function getRoleEmission(role) {
  if (state.shaderMode === "neon") {
    if (role === "tower" || role === "enemy") return 0.45;
    if (role === "boss") return 0.75;
    if (role === "base" || role === "portal") return 0.7;
    if (role === "path") return 0.25;

    return 0.08;
  }

  if (state.shaderMode === "xray") {
    if (role === "tower" || role === "enemy") return 0.65;
    if (role === "boss") return 0.85;
    if (role === "base" || role === "portal") return 0.8;
    if (role === "path") return 0.35;

    return 0.12;
  }

  if (state.shaderMode === "toon") {
    if (role === "portal" || role === "base") return 0.16;

    return 0;
  }

  return 0;
}

function getStandardEmissive(role) {
  if (role === "portal") return new THREE.Color(0x7c2d12);
  if (role === "base") return new THREE.Color(0x0f172a);

  return new THREE.Color(0x000000);
}

function getStandardEmission(role) {
  if (role === "portal" || role === "base") return 0.25;

  return 0;
}

function getRoughness(role) {
  if (role === "tower" || role === "base") return 0.48;
  if (role === "portal") return 0.42;
  if (role === "path") return 0.72;
  if (role === "ground") return 0.82;

  return 0.65;
}

function getMetalness(role) {
  if (role === "tower" || role === "base") return 0.18;
  if (role === "portal") return 0.12;

  return 0.05;
}

function shouldUseWireframe(role) {
  return role === "tower" || role === "enemy" || role === "boss";
}

function disposeMaterial(material) {
  if (!material) return;

  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose?.());
    return;
  }

  material.dispose?.();
}