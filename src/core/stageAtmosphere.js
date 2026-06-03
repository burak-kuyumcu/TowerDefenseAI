import * as THREE from "three";
import { getCurrentStage } from "../game/stages.js";

export function applyStageAtmosphere({
  scene,
  groundMesh,
  ambientLight,
  directionalLight
}) {
  const stage = getCurrentStage();

  let background = 0x1f2937;
  let fogColor = 0x1f2937;
  let fogNear = 18;
  let fogFar = 42;
  let ambientColor = 0xffffff;
  let ambientIntensity = 0.42;
  let directionalColor = 0xffffff;
  let directionalIntensity = 1.45;
  let groundColor = stage.groundColor ?? 0x256b2f;

  if (stage.id === 1) {
    background = 0x06140c;
    fogColor = 0x173821;
    groundColor = 0x245f2d;
    ambientColor = 0xe4ffe6;
    ambientIntensity = 0.48;
    directionalColor = 0xf3ffe9;
    directionalIntensity = 1.5;
  }

  if (stage.id === 2) {
    background = 0x2b160d;
    fogColor = 0x6a321a;
    groundColor = 0x7a3f1d;
    ambientColor = 0xffc28a;
    ambientIntensity = 0.36;
    directionalColor = 0xffa65c;
    directionalIntensity = 1.72;
  }

  if (stage.id === 3) {
    background = 0x102638;
    fogColor = 0x8ecae6;
    groundColor = 0x5f86a4;
    fogNear = 12;
    fogFar = 34;
    ambientColor = 0xd8f3ff;
    ambientIntensity = 0.5;
    directionalColor = 0xbdefff;
    directionalIntensity = 1.34;
  }

  if (stage.id === 4) {
    background = 0x241d17;
    fogColor = 0x6b5a42;
    groundColor = 0x574839;
    fogNear = 14;
    fogFar = 36;
    ambientColor = 0xffe0aa;
    ambientIntensity = 0.36;
    directionalColor = 0xffcc7a;
    directionalIntensity = 1.42;
  }

  if (stage.id === 5) {
    background = 0x120606;
    fogColor = 0x4a0f0b;
    groundColor = 0x3b1210;
    fogNear = 12;
    fogFar = 34;
    ambientColor = 0xffb077;
    ambientIntensity = 0.34;
    directionalColor = 0xff5a1f;
    directionalIntensity = 1.9;
  }

  if (stage.id === 6) {
    background = 0x07140e;
    fogColor = 0x123524;
    groundColor = 0x1f3a2e;
    fogNear = 10;
    fogFar = 32;
    ambientColor = 0xcfffdc;
    ambientIntensity = 0.43;
    directionalColor = 0xa7f3d0;
    directionalIntensity = 1.25;
  }

  if (stage.id === 7) {
    background = 0x10162f;
    fogColor = 0x4338ca;
    groundColor = 0x243b53;
    fogNear = 13;
    fogFar = 38;
    ambientColor = 0xdbeafe;
    ambientIntensity = 0.48;
    directionalColor = 0xc4b5fd;
    directionalIntensity = 1.55;
  }

  scene.background = new THREE.Color(background);
  scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

  if (groundMesh) {
    setMaterialColor(groundMesh.material, groundColor);
    groundMesh.userData.baseColor = groundColor;
  }

  if (ambientLight) {
    ambientLight.color.set(ambientColor);
    ambientLight.intensity = ambientIntensity;
  }

  if (directionalLight) {
    directionalLight.color.set(directionalColor);
    directionalLight.intensity = directionalIntensity;
  }
}

export function getStageRoadColor() {
  const stage = getCurrentStage();

  if (stage.id === 1) return 0xbfa01a;
  if (stage.id === 2) return 0xd97706;
  if (stage.id === 3) return 0xd7edf7;
  if (stage.id === 4) return 0xc7aa6b;
  if (stage.id === 5) return 0xf97316;
  if (stage.id === 6) return 0x6b8e23;
  if (stage.id === 7) return 0x7dd3fc;

  return stage.roadColor ?? 0x6b4423;
}

export function getStageBorderColor() {
  const stage = getCurrentStage();

  if (stage.id === 1) return 0x2f2412;
  if (stage.id === 2) return 0x78350f;
  if (stage.id === 3) return 0xe0f2fe;
  if (stage.id === 4) return 0x8a7354;
  if (stage.id === 5) return 0x7f1d1d;
  if (stage.id === 6) return 0x14532d;
  if (stage.id === 7) return 0x38bdf8;

  return 0x4b5563;
}

export function setMaterialColor(material, color) {
  if (material?.color?.set) {
    material.color.set(color);
  }

  if (material?.uniforms?.uColor?.value?.set) {
    material.uniforms.uColor.value.set(color);
  }
}