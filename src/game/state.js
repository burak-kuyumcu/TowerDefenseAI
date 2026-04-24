export const state = {
  selectedTile: { x: -4, z: -4 },
  selectedTowerType: "normal",
  selectedObject: null,

  score: 0,
  gold: 100,
  wave: 1,
  baseHp: 10,
  gameOver: false,

  spawned: 0,
  spawnTimer: 0,
  enemiesPerWave: 5,

  enemies: [],
  towers: [],
  projectiles: [],

  towerSet: new Set()
};