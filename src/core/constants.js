import * as THREE from "three";

export const GRID_MIN = -5;
export const GRID_MAX = 5;

export const pathPoints = [
  new THREE.Vector3(-5, 0.15, -5),
  new THREE.Vector3(-3, 0.15, -5),
  new THREE.Vector3(-1, 0.15, -5),
  new THREE.Vector3(-1, 0.15, -3),
  new THREE.Vector3(-1, 0.15, -1),
  new THREE.Vector3(1, 0.15, -1),
  new THREE.Vector3(3, 0.15, -1),
  new THREE.Vector3(3, 0.15, 1),
  new THREE.Vector3(3, 0.15, 3),
  new THREE.Vector3(5, 0.15, 3)
];

export const pathSet = new Set(pathPoints.map((p) => `${p.x},${p.z}`));