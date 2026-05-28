import * as THREE from "three";

export const STAGES = [
  {
    id: 1,
    name: "Forest Route",
    spawn: { x: -8, z: -6 },
    base: { x: 8, z: 5 },
    paths: [
      [
        [-8, -6],
        [-8, -8],
        [-1, -8],
        [-1, -5],
        [4, -5],
        [4, 0],
        [8, 0],
        [8, 5]
      ],
      [
        [-8, -6],
        [-5, -6],
        [-5, -2],
        [0, -2],
        [0, 2],
        [5, 2],
        [5, 5],
        [8, 5]
      ],
      [
        [-8, -6],
        [-8, 0],
        [-4, 0],
        [-4, 6],
        [2, 6],
        [2, 8],
        [8, 8],
        [8, 5]
      ]
    ],
    groundColor: 0x2f6b2f,
    roadColor: 0xc8841a,
    enemySpeedMultiplier: 1,
    enemyHealthMultiplier: 1,
    slowBonus: 1
  },

  {
    id: 2,
    name: "Canyon Split",
    spawn: { x: -8, z: -7 },
    base: { x: 8, z: 6 },
    paths: [
      [
        [-8, -7],
        [-8, -4],
        [-2, -4],
        [-2, -7],
        [5, -7],
        [5, -1],
        [8, -1],
        [8, 6]
      ],
      [
        [-8, -7],
        [-5, -7],
        [-5, -1],
        [0, -1],
        [0, 3],
        [4, 3],
        [4, 6],
        [8, 6]
      ],
      [
        [-8, -7],
        [-8, 1],
        [-3, 1],
        [-3, 7],
        [3, 7],
        [3, 4],
        [8, 4],
        [8, 6]
      ]
    ],
    groundColor: 0x7a5535,
    roadColor: 0xb86d2a,
    enemySpeedMultiplier: 1.1,
    enemyHealthMultiplier: 1,
    slowBonus: 1
  },

  {
    id: 3,
    name: "Frozen Pass",
    spawn: { x: -8, z: -5 },
    base: { x: 8, z: 7 },
    paths: [
      [
        [-8, -5],
        [-8, -8],
        [-2, -8],
        [-2, -3],
        [3, -3],
        [3, 1],
        [8, 1],
        [8, 7]
      ],
      [
        [-8, -5],
        [-4, -5],
        [-4, 0],
        [1, 0],
        [1, 4],
        [5, 4],
        [5, 7],
        [8, 7]
      ],
      [
        [-8, -5],
        [-8, 2],
        [-5, 2],
        [-5, 8],
        [2, 8],
        [2, 5],
        [8, 5],
        [8, 7]
      ]
    ],
    groundColor: 0x6c91b0,
    roadColor: 0xd7edf7,
    enemySpeedMultiplier: 0.95,
    enemyHealthMultiplier: 1.08,
    slowBonus: 1.25
  },

  {
    id: 4,
    name: "Ancient Ruins",
    spawn: { x: -8, z: -8 },
    base: { x: 8, z: 4 },
    paths: [
      [
        [-8, -8],
        [-4, -8],
        [-4, -5],
        [2, -5],
        [2, -2],
        [8, -2],
        [8, 4]
      ],
      [
        [-8, -8],
        [-8, -3],
        [-2, -3],
        [-2, 1],
        [3, 1],
        [3, 4],
        [8, 4]
      ],
      [
        [-8, -8],
        [-8, 2],
        [-5, 2],
        [-5, 7],
        [1, 7],
        [1, 5],
        [8, 5],
        [8, 4]
      ]
    ],
    groundColor: 0x5a4b3b,
    roadColor: 0xc7aa6b,
    enemySpeedMultiplier: 1,
    enemyHealthMultiplier: 1.2,
    slowBonus: 0.9
  }
];

export let currentStage = 0;

export function getCurrentStage() {
  return STAGES[currentStage];
}

export function nextStage() {
  currentStage++;

  if (currentStage >= STAGES.length) {
    currentStage = 0;
  }

  return STAGES[currentStage];
}

export function getCurrentStagePaths() {
  return getCurrentStage().paths.map((path) =>
    path.map(([x, z]) => new THREE.Vector3(x, 0.15, z))
  );
}

export function getCurrentStagePath() {
  return getCurrentStagePaths()[0];
}

export function getCurrentStagePathTiles() {
  const unique = new Map();

  for (const path of getCurrentStagePaths()) {
    for (const tile of buildPathTiles(path)) {
      unique.set(`${tile.x},${tile.z}`, tile);
    }
  }

  return [...unique.values()];
}

export function getCurrentStagePathSet() {
  return new Set(
    getCurrentStagePathTiles().map((tile) => `${tile.x},${tile.z}`)
  );
}

export function getCurrentBasePosition() {
  const base = getCurrentStage().base;
  return new THREE.Vector3(base.x, 0.6, base.z);
}

export function getCurrentPortalPosition() {
  const spawn = getCurrentStage().spawn;
  return new THREE.Vector3(spawn.x, 0.7, spawn.z);
}

export function buildPathTiles(points) {
  const unique = new Map();

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];

    let x = start.x;
    let z = start.z;

    unique.set(`${x},${z}`, { x, z });

    while (x !== end.x) {
      x += Math.sign(end.x - x);
      unique.set(`${x},${z}`, { x, z });
    }

    while (z !== end.z) {
      z += Math.sign(end.z - z);
      unique.set(`${x},${z}`, { x, z });
    }
  }

  return [...unique.values()];
}