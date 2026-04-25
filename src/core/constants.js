import * as THREE from "three";

export const GRID_MIN = -8;
export const GRID_MAX = 8;

export const MAP_SIZE = 18;

export const BASE_POSITION = new THREE.Vector3(8, 0.6, 5);
export const PORTAL_POSITION = new THREE.Vector3(-8, 0.7, -6);

export const PATHS = [
  [
    new THREE.Vector3(-8, 0.15, -6),
    new THREE.Vector3(-5, 0.15, -6),
    new THREE.Vector3(-5, 0.15, -3),
    new THREE.Vector3(-1, 0.15, -3),
    new THREE.Vector3(-1, 0.15, 1),
    new THREE.Vector3(3, 0.15, 1),
    new THREE.Vector3(3, 0.15, 5),
    new THREE.Vector3(8, 0.15, 5)
  ],
  [
    new THREE.Vector3(-8, 0.15, -6),
    new THREE.Vector3(-8, 0.15, -1),
    new THREE.Vector3(-4, 0.15, -1),
    new THREE.Vector3(-4, 0.15, 4),
    new THREE.Vector3(1, 0.15, 4),
    new THREE.Vector3(1, 0.15, 7),
    new THREE.Vector3(5, 0.15, 7),
    new THREE.Vector3(5, 0.15, 5),
    new THREE.Vector3(8, 0.15, 5)
  ],
  [
    new THREE.Vector3(-8, 0.15, -6),
    new THREE.Vector3(-3, 0.15, -6),
    new THREE.Vector3(-3, 0.15, -8),
    new THREE.Vector3(2, 0.15, -8),
    new THREE.Vector3(2, 0.15, -2),
    new THREE.Vector3(6, 0.15, -2),
    new THREE.Vector3(6, 0.15, 5),
    new THREE.Vector3(8, 0.15, 5)
  ]
];

export const pathPoints = PATHS[0];

export const pathTiles = buildAllPathTiles(PATHS);

export const pathSet = new Set(
  pathTiles.map((tile) => `${tile.x},${tile.z}`)
);

function buildAllPathTiles(paths) {
  const allTiles = [];

  for (const path of paths) {
    allTiles.push(...buildPathTiles(path));
  }

  const unique = new Map();

  for (const tile of allTiles) {
    unique.set(`${tile.x},${tile.z}`, tile);
  }

  return [...unique.values()];
}

function buildPathTiles(points) {
  const tiles = [];

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];

    const dx = Math.sign(end.x - start.x);
    const dz = Math.sign(end.z - start.z);

    let x = start.x;
    let z = start.z;

    tiles.push({ x, z });

    while (x !== end.x || z !== end.z) {
      if (x !== end.x) x += dx;
      if (z !== end.z) z += dz;

      tiles.push({ x, z });
    }
  }

  return tiles;
}