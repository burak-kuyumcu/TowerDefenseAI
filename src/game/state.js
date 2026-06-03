import { PATHS } from "../core/constants.js";

export const state = {
  selectedTile: { x: -4, z: -4 },
  selectedTowerType: "normal",

  selectedObject: null,
  hoveredObject: null,

  currentPath: PATHS[0],
  stageVersion: 0,

  controlMode: "camera",
  freeTransformEnabled: false,

  aiLockedStrategy: "Balanced",
  aiDisplayedStrategy: "Balanced",
  aiLockedPlanText: "AI is waiting for analysis.",
  aiBluffActive: false,
  aiBluffFrom: null,
  aiBluffTo: null,

  aiMemory: {
    lastStrategy: null,
    successScore: 0,
    previousBaseHp: 10,
    lastDamageDealt: 0
  },

  shaderMode: "standard",
  paused: false,
  muted: false,
  started: false,

  waveActive: false,
  waitingForNextWave: true,

  relocationTokens: 2,
  relocationMaxTokens: 2,
  relocationMoveCooldown: 0,

  focusRotationSpeed: 0.045,

  score: 0,
  gold: 100,
  wave: 1,
  baseHp: 10,
  baseMaxHp: 10,
  gameOver: false,

  combo: 0,
  comboTimer: 0,
  comboMaxTimer: 180,

  spawned: 0,
  spawnTimer: 0,
  enemiesPerWave: 5,

  enemies: [],
  towers: [],
  projectiles: [],

  towerSet: new Set(),
  terrainBlockedSet: new Set()
};