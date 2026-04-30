import { state } from "./state.js";
import { removeHealthBar } from "./healthBars.js";
import { removeTowerLabel } from "./towerLabels.js";
import { analyzeAndLockAIPlan } from "./aiDirector.js";

export function startGame() {
  state.started = true;
  state.paused = false;
  state.waitingForNextWave = true;
  state.waveActive = false;
  state.relocationTokens = state.relocationMaxTokens;

  analyzeAndLockAIPlan();
}

export function togglePause() {
  if (!state.started) return;
  if (state.gameOver) return;

  state.paused = !state.paused;
}

export function restartGame(scene) {
  for (const enemy of state.enemies) {
    removeHealthBar(scene, enemy);
    scene.remove(enemy);
  }

  for (const tower of state.towers) {
    removeTowerLabel(scene, tower);
    scene.remove(tower);
  }

  for (const projectile of state.projectiles) {
    scene.remove(projectile);
  }

  state.selectedTile = { x: -4, z: -4 };
  state.selectedTowerType = "normal";
  state.selectedObject = null;
  state.shaderMode = "standard";

  state.started = true;
  state.paused = false;
  state.waveActive = false;
  state.waitingForNextWave = true;

  state.relocationTokens = state.relocationMaxTokens;

  state.score = 0;
  state.gold = 100;
  state.wave = 1;
  state.baseHp = 10;
  state.baseMaxHp = 10;
  state.gameOver = false;

  state.aiMemory.lastStrategy = null;
  state.aiMemory.successScore = 0;
  state.aiMemory.previousBaseHp = state.baseHp;
  state.aiMemory.lastDamageDealt = 0;

  state.aiLockedStrategy = "Balanced";
  state.aiDisplayedStrategy = "Balanced";
  state.aiLockedPlanText = "AI is waiting for analysis.";
  state.aiBluffActive = false;
  state.aiBluffFrom = null;
  state.aiBluffTo = null;

  state.combo = 0;
  state.comboTimer = 0;

  state.spawned = 0;
  state.spawnTimer = 0;
  state.enemiesPerWave = 5;

  state.enemies.length = 0;
  state.towers.length = 0;
  state.projectiles.length = 0;

  state.towerSet.clear();

  analyzeAndLockAIPlan();
}
