import { PATHS } from "../core/constants.js";

export const state = {
  selectedTile: { x: -4, z: -4 },
  selectedTowerType: "normal",
  selectedObject: null,

  currentPath: PATHS[0],

  shaderMode: "standard",
  paused: false,
  muted: false,
  started: false,

  waveActive: false,
  waitingForNextWave: true,

  relocationTokens: 2,
  relocationMaxTokens: 2,
  relocationMoveCooldown: 0,

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

  towerSet: new Set()
};