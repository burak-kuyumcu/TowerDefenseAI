import { state } from "../game/state.js";
import { removeHealthBar } from "../visuals/healthBars.js";
import { removeTowerLabel } from "../visuals/towerLabels.js";
import { analyzeAndLockAIPlan } from "../ai/aiDirector.js";
import { resetAchievementsRuntimeTracking } from "./achievements.js";
import { resetStageProgression } from "../game/stages.js";
import { getActivePathPoints } from "../core/constants.js";

export function startGame() {
  state.started = true;
  state.paused = false;
  state.waitingForNextWave = true;
  state.waveActive = false;
  state.relocationTokens = state.relocationMaxTokens;

  resetAchievementsRuntimeTracking();

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

  resetStageProgression();

  state.selectedTile = { x: -4, z: -4 };
  state.selectedTowerType = "normal";

  state.selectedObject = null;
  state.hoveredObject = null;

  state.currentPath = getActivePathPoints();
  state.stageVersion++;

  state.aiLockedStrategy = "Balanced";
  state.aiDisplayedStrategy = "Balanced";
  state.aiLockedPlanText = "AI is waiting for analysis.";
  state.aiBluffActive = false;
  state.aiBluffFrom = null;
  state.aiBluffTo = null;

  state.aiMemory.lastStrategy = null;
  state.aiMemory.successScore = 0;
  state.aiMemory.previousBaseHp = 10;
  state.aiMemory.lastDamageDealt = 0;

  state.shaderMode = "standard";
  state.paused = false;
  state.muted = state.muted;
  state.started = true;

  state.waveActive = false;
  state.waitingForNextWave = true;

  state.relocationTokens = state.relocationMaxTokens;
  state.relocationMoveCooldown = 0;

  state.score = 0;
  state.gold = 100;
  state.wave = 1;
  state.baseHp = 10;
  state.baseMaxHp = 10;
  state.gameOver = false;

  state.combo = 0;
  state.comboTimer = 0;

  state.spawned = 0;
  state.spawnTimer = 0;
  state.enemiesPerWave = 5;

  state.enemies.length = 0;
  state.towers.length = 0;
  state.projectiles.length = 0;

  state.towerSet.clear();

  if (state.terrainBlockedSet) {
    state.terrainBlockedSet.clear();
  }

  resetAchievementsRuntimeTracking();

  analyzeAndLockAIPlan();
}