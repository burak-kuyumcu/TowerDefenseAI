import { state } from "../game/state.js";
import { removeHealthBar } from "../visuals/healthBars.js";
import { removeTowerLabel } from "../visuals/towerLabels.js";

import {
  analyzeAndLockAIPlan,
  prepareWaveStartAIPlan,
  recordWaveResult,
  getWaveEnemyCount
} from "../ai/aiDirector.js";

import { resetAchievementsRuntimeTracking } from "./achievements.js";

import {
  resetStageProgression,
  nextStage,
  getCurrentStage,
  getCurrentStageSpawnPressure
} from "../game/stages.js";

import { getActivePathPoints } from "../core/constants.js";
import { spawnEnemy, cleanupEnemies } from "../entities/enemies.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";

import {
  announceWaveStory,
  announceSectorCleared,
  showCurrentSectorIntro
} from "./storyDirector.js";

const SPAWN_INTERVAL = 48;
const BOSS_SPAWN_INTERVAL = 72;
const ADVANCE_STAGE_EACH_WAVE = true;

export function startGame() {
  state.started = true;
  state.paused = false;
  state.waitingForNextWave = true;
  state.waveActive = false;
  state.relocationTokens = state.relocationMaxTokens;

  state.controlMode = "camera";
  state.freeTransformEnabled = false;

  resetWaveRuntimeState();

  resetAchievementsRuntimeTracking();

  analyzeAndLockAIPlan();

  showCurrentSectorIntro({
    silentLog: false
  });
}

export function togglePause() {
  if (!state.started) return;
  if (state.gameOver) return;

  state.paused = !state.paused;
}

export function startNextWave() {
  if (state.gameOver) return;

  if (!state.started) {
    startGame();
  }

  if (state.waveActive) return;

  prepareWaveStartAIPlan();

  const target = calculateLockedWaveTarget();

  state.waveEnemyTarget = target;
  state.enemiesToSpawn = target;

  state.spawned = 0;
  state.spawnedThisWave = 0;
  state.spawnTimer = 0;
  state.waveFinishTimer = 0;
  state.waveSpawnCompleted = false;

  state.waveActive = true;
  state.waitingForNextWave = false;

  const stage = getCurrentStage();

  addEventLog(`Wave ${state.wave} started on ${stage.name}.`);
  showAnnouncement(`Wave ${state.wave} incoming!`);

  announceWaveStory();
}

export function updateWaveFlow(scene) {
  if (!state.started) return;
  if (state.paused) return;
  if (state.gameOver) return;

  cleanupEnemies(scene);
  cleanupOrphanEnemies(scene);

  if (!state.waveActive) return;

  spawnWaveEnemies(scene);
  checkWaveCompletion(scene);
}

export function finishCurrentWave(scene) {
  if (!state.waveActive) return;

  cleanupEnemies(scene);
  cleanupOrphanEnemies(scene);

  recordWaveResult();
  announceSectorCleared();

  state.waveActive = false;
  state.waitingForNextWave = true;

  state.spawned = 0;
  state.spawnedThisWave = 0;
  state.spawnTimer = 0;
  state.waveEnemyTarget = 0;
  state.enemiesToSpawn = 0;
  state.waveSpawnCompleted = false;
  state.waveFinishTimer = 0;

  state.relocationTokens = Math.min(
    state.relocationMaxTokens,
    state.relocationTokens + 1
  );

  state.wave++;

  state.enemiesPerWave = Math.min(
    28,
    state.enemiesPerWave + getEnemyGrowthAmount()
  );

  if (ADVANCE_STAGE_EACH_WAVE) {
    advanceStageRoute();
  }

  analyzeAndLockAIPlan();

  const stage = getCurrentStage();

  addEventLog(`Wave cleared. Next sector: ${stage.name}.`);
  showAnnouncement(`Sector changed: ${stage.name}`);

  showCurrentSectorIntro({
    silentLog: false
  });
}

export function forceFinishWave(scene) {
  for (const enemy of state.enemies) {
    removeHealthBar(scene, enemy);

    if (enemy?.parent) {
      enemy.parent.remove(enemy);
    } else if (enemy) {
      scene.remove(enemy);
    }
  }

  state.enemies.length = 0;

  finishCurrentWave(scene);
}

export function restartGame(scene) {
  for (const enemy of state.enemies) {
    removeHealthBar(scene, enemy);

    if (enemy?.parent) {
      enemy.parent.remove(enemy);
    } else if (enemy) {
      scene.remove(enemy);
    }
  }

  for (const tower of state.towers) {
    removeTowerLabel(scene, tower);

    if (tower?.parent) {
      tower.parent.remove(tower);
    } else if (tower) {
      scene.remove(tower);
    }
  }

  for (const projectile of state.projectiles) {
    if (projectile?.parent) {
      projectile.parent.remove(projectile);
    } else if (projectile) {
      scene.remove(projectile);
    }
  }

  resetStageProgression();

  state.selectedTile = { x: -4, z: -4 };
  state.selectedTowerType = "normal";

  state.selectedObject = null;
  state.hoveredObject = null;

  state.controlMode = "camera";
  state.freeTransformEnabled = false;

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

  if ("lastTransformProfile" in state.aiMemory) {
    state.aiMemory.lastTransformProfile = null;
  }

  state.shaderMode = "standard";
  state.paused = false;
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
  state.spawnedThisWave = 0;
  state.spawnTimer = 0;
  state.enemiesPerWave = 5;

  state.waveEnemyTarget = 0;
  state.enemiesToSpawn = 0;
  state.waveSpawnCompleted = false;
  state.waveFinishTimer = 0;

  state.enemies.length = 0;
  state.towers.length = 0;
  state.projectiles.length = 0;

  state.towerSet.clear();

  if (state.terrainBlockedSet) {
    state.terrainBlockedSet.clear();
  }

  resetAchievementsRuntimeTracking();

  analyzeAndLockAIPlan();

  showCurrentSectorIntro({
    silentLog: false
  });
}

function spawnWaveEnemies(scene) {
  if (state.waveSpawnCompleted) return;

  const target = getLockedWaveTarget();

  if (state.spawned >= target) {
    state.waveSpawnCompleted = true;
    return;
  }

  state.spawnTimer++;

  const interval = isBossWave() ? BOSS_SPAWN_INTERVAL : SPAWN_INTERVAL;

  if (state.spawnTimer < interval) return;

  state.spawnTimer = 0;

  spawnEnemy(scene);

  state.spawned++;
  state.spawnedThisWave = state.spawned;

  if (state.spawned >= target) {
    state.waveSpawnCompleted = true;
  }
}

function checkWaveCompletion(scene) {
  cleanupEnemies(scene);
  cleanupOrphanEnemies(scene);

  const target = getLockedWaveTarget();

  const allSpawned =
    state.waveSpawnCompleted ||
    state.spawned >= target ||
    state.spawnedThisWave >= target;

  const noEnemiesLeft = state.enemies.length === 0;

  if (!allSpawned || !noEnemiesLeft) {
    state.waveFinishTimer = 0;
    return;
  }

  state.waveFinishTimer++;

  if (state.waveFinishTimer < 12) return;

  finishCurrentWave(scene);
}

function cleanupOrphanEnemies(scene) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];

    const invalid =
      !enemy ||
      enemy.userData?.dead === true ||
      enemy.userData?.reachedGoal === true ||
      enemy.userData?.reachedBase === true ||
      enemy.userData?.finished === true ||
      enemy.userData?.escaped === true ||
      enemy.userData?.removed === true ||
      enemy.health <= 0 ||
      enemy.userData?.health <= 0 ||
      enemy.parent === null;

    if (!invalid) continue;

    if (enemy) {
      enemy.userData.removed = true;

      removeHealthBar(scene, enemy);

      if (state.selectedObject === enemy) {
        state.selectedObject = null;
      }

      if (state.hoveredObject === enemy) {
        state.hoveredObject = null;
      }

      if (enemy.parent) {
        enemy.parent.remove(enemy);
      } else {
        scene.remove(enemy);
      }
    }

    state.enemies.splice(i, 1);
  }
}

function calculateLockedWaveTarget() {
  if (isBossWave()) {
    return 1;
  }

  const aiCount = getWaveEnemyCount(state.enemiesPerWave);
  const pressure = getCurrentStageSpawnPressure();

  return Math.max(1, Math.ceil(aiCount * pressure));
}

function getLockedWaveTarget() {
  const target =
    state.waveEnemyTarget ||
    state.enemiesToSpawn ||
    calculateLockedWaveTarget();

  return Math.max(1, target);
}

function resetWaveRuntimeState() {
  state.spawned = 0;
  state.spawnedThisWave = 0;
  state.spawnTimer = 0;

  state.waveEnemyTarget = 0;
  state.enemiesToSpawn = 0;
  state.waveSpawnCompleted = false;
  state.waveFinishTimer = 0;
}

function advanceStageRoute() {
  nextStage();

  state.currentPath = getActivePathPoints();
  state.stageVersion++;
}

function getEnemyGrowthAmount() {
  if (state.wave % 5 === 0) return 1;
  if (state.wave >= 8) return 2;

  return 1;
}

function isBossWave() {
  return state.wave % 5 === 0;
}