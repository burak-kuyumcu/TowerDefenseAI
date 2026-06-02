import * as THREE from "three";

export const STAGES = [
  {
    id: 1,
    name: "Forest Route",
    description: "Classic forest battlefield with balanced enemy pressure.",
    towerLimit: 8,
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
        [-8, 1],
        [-6, 1],
        [-6, 6],
        [-2, 6],
        [-2, 8],
        [8, 8],
        [8, 5]
      ]
    ],
    groundColor: 0x2f6b2f,
    roadColor: 0xc8841a,
    enemySpeedMultiplier: 1,
    enemyHealthMultiplier: 1,
    slowBonus: 1,
    stageEffect: {
      id: "forest_balance",
      label: "Forest Balance",
      description: "No harsh modifier. This stage is designed as the baseline.",
      enemySpeedMultiplier: 1,
      enemyHealthMultiplier: 1,
      towerDamageMultiplier: 1,
      goldMultiplier: 1,
      slowBonus: 1,
      spawnPressure: 1,
      visualHint: "Balanced forest route"
    }
  },

  {
    id: 2,
    name: "Canyon Split",
    description: "Dry canyon routes force wider tower coverage.",
    towerLimit: 7,
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
        [-8, 2],
        [-6, 2],
        [-6, 7],
        [-1, 7],
        [-1, 8],
        [8, 8],
        [8, 6]
      ]
    ],
    groundColor: 0x7a5535,
    roadColor: 0xb86d2a,
    enemySpeedMultiplier: 1.1,
    enemyHealthMultiplier: 1,
    slowBonus: 1,
    stageEffect: {
      id: "canyon_wind",
      label: "Canyon Wind",
      description: "Enemies move faster through dry canyon lanes.",
      enemySpeedMultiplier: 1.1,
      enemyHealthMultiplier: 1,
      towerDamageMultiplier: 1,
      goldMultiplier: 1,
      slowBonus: 1,
      spawnPressure: 1.05,
      visualHint: "Fast canyon pressure"
    }
  },

  {
    id: 3,
    name: "Frozen Pass",
    description: "Frozen roads slow the battlefield but enemies are tougher.",
    towerLimit: 6,
    spawn: { x: -8, z: -5 },
    base: { x: 8, z: 7 },
    paths: [
      [
        [-8, -5],
        [-8, -8],
        [-2, -8],
        [-2, -5],
        [3, -5],
        [3, -2],
        [8, -2],
        [8, 7]
      ],
      [
        [-8, -5],
        [-5, -5],
        [-5, -1],
        [0, -1],
        [0, 3],
        [4, 3],
        [4, 7],
        [8, 7]
      ],
      [
        [-8, -5],
        [-8, 2],
        [-6, 2],
        [-6, 7],
        [-1, 7],
        [-1, 8],
        [8, 8],
        [8, 7]
      ]
    ],
    groundColor: 0x6c91b0,
    roadColor: 0xd7edf7,
    enemySpeedMultiplier: 0.95,
    enemyHealthMultiplier: 1.08,
    slowBonus: 1.25,
    stageEffect: {
      id: "frozen_chill",
      label: "Frozen Chill",
      description: "Slow towers are stronger, but enemies gain extra durability.",
      enemySpeedMultiplier: 0.95,
      enemyHealthMultiplier: 1.08,
      towerDamageMultiplier: 1,
      goldMultiplier: 1,
      slowBonus: 1.25,
      spawnPressure: 1,
      visualHint: "Slow control is stronger"
    }
  },

  {
    id: 4,
    name: "Ancient Ruins",
    description: "Old ruins limit tower count and reward precise placement.",
    towerLimit: 5,
    spawn: { x: -8, z: -8 },
    base: { x: 8, z: 4 },
    paths: [
      [
        [-8, -8],
        [-4, -8],
        [-4, -6],
        [2, -6],
        [2, -3],
        [8, -3],
        [8, 4]
      ],
      [
        [-8, -8],
        [-8, -4],
        [-3, -4],
        [-3, 0],
        [3, 0],
        [3, 4],
        [8, 4]
      ],
      [
        [-8, -8],
        [-8, 1],
        [-6, 1],
        [-6, 7],
        [-1, 7],
        [-1, 8],
        [8, 8],
        [8, 4]
      ]
    ],
    groundColor: 0x5a4b3b,
    roadColor: 0xc7aa6b,
    enemySpeedMultiplier: 1,
    enemyHealthMultiplier: 1.2,
    slowBonus: 0.9,
    stageEffect: {
      id: "ancient_armor",
      label: "Ancient Armor",
      description: "Enemies are tougher and slow effects are slightly weaker.",
      enemySpeedMultiplier: 1,
      enemyHealthMultiplier: 1.2,
      towerDamageMultiplier: 1,
      goldMultiplier: 1.05,
      slowBonus: 0.9,
      spawnPressure: 1.05,
      visualHint: "Durable ruin enemies"
    }
  },

  {
    id: 5,
    name: "Volcanic Core",
    description: "Lava pressure makes enemies aggressive and weakens slow control.",
    towerLimit: 6,
    spawn: { x: -8, z: -6 },
    base: { x: 8, z: 6 },
    paths: [
      [
        [-8, -6],
        [-8, -8],
        [-3, -8],
        [-3, -5],
        [2, -5],
        [2, -2],
        [8, -2],
        [8, 6]
      ],
      [
        [-8, -6],
        [-6, -6],
        [-6, -1],
        [-1, -1],
        [-1, 3],
        [4, 3],
        [4, 6],
        [8, 6]
      ],
      [
        [-8, -6],
        [-8, 2],
        [-6, 2],
        [-6, 7],
        [-2, 7],
        [-2, 8],
        [8, 8],
        [8, 6]
      ]
    ],
    groundColor: 0x3b1210,
    roadColor: 0xf97316,
    enemySpeedMultiplier: 1.15,
    enemyHealthMultiplier: 1.12,
    slowBonus: 0.85,
    stageEffect: {
      id: "lava_pressure",
      label: "Lava Pressure",
      description: "Enemies are faster and slightly tougher. Slow towers lose some power.",
      enemySpeedMultiplier: 1.15,
      enemyHealthMultiplier: 1.12,
      towerDamageMultiplier: 1.03,
      goldMultiplier: 1.1,
      slowBonus: 0.85,
      spawnPressure: 1.18,
      visualHint: "Aggressive lava stage"
    }
  },

  {
    id: 6,
    name: "Swamp Maze",
    description: "Swamp mud slows movement but lets enemies soak more damage.",
    towerLimit: 7,
    spawn: { x: -8, z: -4 },
    base: { x: 8, z: 7 },
    paths: [
      [
        [-8, -4],
        [-8, -8],
        [-4, -8],
        [-4, -4],
        [1, -4],
        [1, 0],
        [8, 0],
        [8, 7]
      ],
      [
        [-8, -4],
        [-6, -4],
        [-6, 0],
        [-2, 0],
        [-2, 4],
        [3, 4],
        [3, 7],
        [8, 7]
      ],
      [
        [-8, -4],
        [-8, 3],
        [-6, 3],
        [-6, 8],
        [0, 8],
        [0, 6],
        [8, 6],
        [8, 7]
      ]
    ],
    groundColor: 0x1f3a2e,
    roadColor: 0x6b8e23,
    enemySpeedMultiplier: 0.9,
    enemyHealthMultiplier: 1.18,
    slowBonus: 1.15,
    stageEffect: {
      id: "swamp_mud",
      label: "Swamp Mud",
      description: "Enemies move slower but have more health. Slow effects are stronger.",
      enemySpeedMultiplier: 0.9,
      enemyHealthMultiplier: 1.18,
      towerDamageMultiplier: 0.98,
      goldMultiplier: 1.08,
      slowBonus: 1.15,
      spawnPressure: 0.95,
      visualHint: "Tanky swamp march"
    }
  },

  {
    id: 7,
    name: "Crystal Valley",
    description: "Crystal resonance empowers towers but gives enemies extra health.",
    towerLimit: 5,
    spawn: { x: -8, z: -7 },
    base: { x: 8, z: 5 },
    paths: [
      [
        [-8, -7],
        [-8, -5],
        [-3, -5],
        [-3, -8],
        [3, -8],
        [3, -3],
        [8, -3],
        [8, 5]
      ],
      [
        [-8, -7],
        [-5, -7],
        [-5, -2],
        [0, -2],
        [0, 2],
        [5, 2],
        [5, 5],
        [8, 5]
      ],
      [
        [-8, -7],
        [-8, 1],
        [-6, 1],
        [-6, 7],
        [0, 7],
        [0, 8],
        [8, 8],
        [8, 5]
      ]
    ],
    groundColor: 0x243b53,
    roadColor: 0x7dd3fc,
    enemySpeedMultiplier: 1.05,
    enemyHealthMultiplier: 1.15,
    slowBonus: 1,
    stageEffect: {
      id: "crystal_resonance",
      label: "Crystal Resonance",
      description: "Tower damage is slightly boosted, but enemies are healthier.",
      enemySpeedMultiplier: 1.05,
      enemyHealthMultiplier: 1.15,
      towerDamageMultiplier: 1.08,
      goldMultiplier: 1.12,
      slowBonus: 1,
      spawnPressure: 1.08,
      visualHint: "High reward crystal combat"
    }
  }
];

export let currentStage = 0;

export function getCurrentStage() {
  return STAGES[currentStage];
}

export function getCurrentStageTowerLimit() {
  return getCurrentStage().towerLimit ?? 8;
}

export function getCurrentStageEffect() {
  return getCurrentStage().stageEffect ?? {
    id: "none",
    label: "No Stage Effect",
    description: "No special stage modifier.",
    enemySpeedMultiplier: getCurrentStage().enemySpeedMultiplier ?? 1,
    enemyHealthMultiplier: getCurrentStage().enemyHealthMultiplier ?? 1,
    towerDamageMultiplier: 1,
    goldMultiplier: 1,
    slowBonus: getCurrentStage().slowBonus ?? 1,
    spawnPressure: 1,
    visualHint: "Default stage"
  };
}

export function getCurrentStageEnemySpeedMultiplier() {
  return getCurrentStageEffect().enemySpeedMultiplier ?? 1;
}

export function getCurrentStageEnemyHealthMultiplier() {
  return getCurrentStageEffect().enemyHealthMultiplier ?? 1;
}

export function getCurrentStageTowerDamageMultiplier() {
  return getCurrentStageEffect().towerDamageMultiplier ?? 1;
}

export function getCurrentStageGoldMultiplier() {
  return getCurrentStageEffect().goldMultiplier ?? 1;
}

export function getCurrentStageSlowBonus() {
  return getCurrentStageEffect().slowBonus ?? 1;
}

export function getCurrentStageSpawnPressure() {
  return getCurrentStageEffect().spawnPressure ?? 1;
}

export function nextStage() {
  currentStage++;

  if (currentStage >= STAGES.length) {
    currentStage = 0;
  }

  return STAGES[currentStage];
}

export function setCurrentStage(index) {
  if (!Number.isInteger(index)) return getCurrentStage();

  if (index < 0) {
    currentStage = 0;
  } else if (index >= STAGES.length) {
    currentStage = STAGES.length - 1;
  } else {
    currentStage = index;
  }

  return STAGES[currentStage];
}

export function resetStageProgression() {
  currentStage = 0;
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

    let x = Math.round(start.x);
    let z = Math.round(start.z);

    unique.set(`${x},${z}`, { x, z });

    while (x !== Math.round(end.x)) {
      x += Math.sign(Math.round(end.x) - x);
      unique.set(`${x},${z}`, { x, z });
    }

    while (z !== Math.round(end.z)) {
      z += Math.sign(Math.round(end.z) - z);
      unique.set(`${x},${z}`, { x, z });
    }
  }

  return [...unique.values()];
}