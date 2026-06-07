import { state } from "../game/state.js";
import { spawnEnemy } from "../entities/enemies.js";
import { showAnnouncement } from "../ui/announcer.js";
import { addEventLog } from "../ui/eventLog.js";

import {
  analyzeAndLockAIPlan,
  prepareWaveStartAIPlan,
  getAIStrategyName,
  getAIPlanText,
  getWaveEnemyCount,
  recordWaveResult
} from "../ai/aiDirector.js";

import { resetRelocationsForPreparation } from "./relocation.js";
import { spawnTacticalSignal } from "../visuals/tacticalSignals.js";
import { getActivePaths } from "../core/constants.js";

import {
  nextStage,
  getCurrentStage,
  getCurrentStageEffect,
  getCurrentStageGoldMultiplier,
  getCurrentStageSpawnPressure
} from "../game/stages.js";

import { refundAndClearTowersForStageChange } from "./stageCleanup.js";
import { getStageEffectText } from "../ai/stageInfo.js";

import {
  registerWaveStarted,
  registerWaveCleared
} from "./achievements.js";

import {
  announceWaveStory,
  announceSectorCleared,
  showCurrentSectorIntro,
  announceAITrickStory
} from "./storyDirector.js";

let initialized = false;

const STAGE_CHANGE_WAVES = new Set([5, 9, 13, 17, 21, 25]);
const WAVE_COMPLETE_CONFIRM_FRAMES = 12;

export function initWaveControls(scene) {
  if (initialized) return;

  initialized = true;

  const button = document.querySelector("#startWaveButton");

  if (!button) return;

  button.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();

    startNextWave(scene);
  });
}

export function updateWaveControls() {
  const button = document.querySelector("#startWaveButton");

  if (!button) return;

  const canStart =
    state.started === true &&
    state.gameOver !== true &&
    state.paused !== true &&
    state.waitingForNextWave === true &&
    state.waveActive !== true &&
    state.enemies.length === 0;

  button.disabled = !canStart;

  if (!state.started) {
    button.textContent = "Start Game First";
    return;
  }

  if (state.waveActive) {
    button.textContent = "Wave Running";
    return;
  }

  if (state.paused) {
    button.textContent = "Paused";
    return;
  }

  if (state.gameOver) {
    button.textContent = "Game Over";
    return;
  }

  if (state.wave % 5 === 0) {
    button.textContent = "Start Boss Wave";
  } else {
    button.textContent = "Start Next Wave";
  }
}

export function startNextWave(scene) {
  if (!state.started) return;
  if (state.gameOver) return;
  if (state.paused) return;
  if (state.waveActive) return;
  if (state.enemies.length > 0) return;

  const aiStart = prepareWaveStartAIPlan();
  const strategy = getAIStrategyName();
  const feintApplied = maybeApplyPathFeint();
  const stage = getCurrentStage();
  const stageEffect = getCurrentStageEffect();

  const isBossWave = state.wave % 5 === 0;
  const lockedEnemyTarget = calculateWaveEnemyTarget(isBossWave);

  spawnTacticalSignal(scene, strategy);

  state.spawned = 0;
  state.spawnedThisWave = 0;
  state.spawnTimer = 0;

  state.waveEnemyTarget = lockedEnemyTarget;
  state.enemiesToSpawn = lockedEnemyTarget;
  state.waveSpawnCompleted = false;
  state.waveFinishTimer = 0;

  state.waveActive = true;
  state.waitingForNextWave = false;

  registerWaveStarted();

  if (aiStart.bluffApplied) {
    showAnnouncement("AI BLUFF REVEALED: " + aiStart.strategy);

    addEventLog(
      "AI bluff: showed " +
        aiStart.displayedStrategy +
        ", executed " +
        aiStart.strategy +
        "."
    );

    announceAITrickStory("bluff");
  } else if (feintApplied) {
    showAnnouncement("AI FEINT DETECTED! Route changed!");

    addEventLog(
      "AI feint detected. Route changed before Wave " + state.wave + "."
    );

    announceAITrickStory("feint");
  } else {
    showAnnouncement("AI Locked: " + strategy);

    addEventLog(
      "Wave " +
        state.wave +
        " started on " +
        stage.name +
        ". AI: " +
        strategy +
        "."
    );
  }

  addEventLog(
    "Stage effect: " + stageEffect.label + " - " + stageEffect.description
  );

  addEventLog("Enemy target locked: " + lockedEnemyTarget + ".");
  addEventLog(getAIPlanText());

  announceWaveStory();
}

export function updateWave(scene) {
  if (!state.started) return;
  if (state.paused) return;
  if (state.gameOver) return;
  if (!state.waveActive) return;

  const isBossWave = state.wave % 5 === 0;
  const maxEnemies = getLockedWaveEnemyTarget(isBossWave);
  const spawnInterval = getCurrentSpawnInterval();

  updateEnemySpawning(scene, maxEnemies, spawnInterval);
  updateWaveCompletion(scene, isBossWave, maxEnemies);
}

function updateEnemySpawning(scene, maxEnemies, spawnInterval) {
  if (state.waveSpawnCompleted) return;

  if (state.spawned >= maxEnemies) {
    state.waveSpawnCompleted = true;
    return;
  }

  state.spawnTimer++;

  if (state.spawnTimer <= spawnInterval) return;

  spawnEnemy(scene);

  state.spawned++;
  state.spawnedThisWave = state.spawned;
  state.spawnTimer = 0;

  if (state.spawned >= maxEnemies) {
    state.waveSpawnCompleted = true;
  }
}

function updateWaveCompletion(scene, isBossWave, maxEnemies) {
  const allSpawned =
    state.waveSpawnCompleted === true ||
    state.spawned >= maxEnemies ||
    state.spawnedThisWave >= maxEnemies;

  const noEnemiesLeft = state.enemies.length === 0;

  if (!allSpawned || !noEnemiesLeft) {
    state.waveFinishTimer = 0;
    return;
  }

  state.waveFinishTimer++;

  if (state.waveFinishTimer < WAVE_COMPLETE_CONFIRM_FRAMES) return;

  completeWave(scene, isBossWave);
}

function completeWave(scene, completedWaveWasBoss) {
  const completedWaveNumber = state.wave;
  const baseBonusGold = completedWaveWasBoss ? 60 : 20;
  const bonusGold = getStageBonusGold(baseBonusGold);

  registerWaveCleared({
    wasBossWave: completedWaveWasBoss
  });

  recordWaveResult();
  announceSectorCleared();

  state.gold += bonusGold;

  if (completedWaveWasBoss) {
    showAnnouncement("Boss Defeated! +" + bonusGold + "G");

    addEventLog(
      "Boss defeated on Wave " +
        completedWaveNumber +
        ". +" +
        bonusGold +
        " gold."
    );
  } else {
    showAnnouncement("Wave Cleared! +" + bonusGold + "G");

    addEventLog(
      "Wave " +
        completedWaveNumber +
        " cleared. +" +
        bonusGold +
        " gold."
    );
  }

  if (state.aiMemory.lastDamageDealt > 0) {
    addEventLog(
      "AI memory: " +
        state.aiMemory.lastStrategy +
        " dealt " +
        state.aiMemory.lastDamageDealt +
        " base damage."
    );
  } else {
    addEventLog(
      "AI memory: " +
        state.aiMemory.lastStrategy +
        " failed to damage base."
    );
  }

  state.wave++;

  updateStageProgression(scene);

  selectPathForWave();
  analyzeAndLockAIPlan();

  resetWaveRuntimeState();

  state.waveActive = false;
  state.waitingForNextWave = true;

  resetRelocationsForPreparation();

  if (!completedWaveWasBoss) {
    state.enemiesPerWave += 1;
  }

  addEventLog(
    "Preparation phase. " +
      state.relocationTokens +
      " tower relocations available."
  );

  addEventLog(getAIPlanText());
}

function updateStageProgression(scene) {
  if (!STAGE_CHANGE_WAVES.has(state.wave)) return;

  const stage = nextStage();
  const refund = refundAndClearTowersForStageChange(scene);
  const effectText = getStageEffectText();

  state.stageVersion++;

  showAnnouncement(
    "NEW BATTLEFIELD: " +
      stage.name +
      " | " +
      effectText +
      " | Towers refunded +" +
      refund +
      "G"
  );

  addEventLog(
    "Stage changed to " +
      stage.name +
      ". Effect: " +
      effectText +
      ". Towers refunded: +" +
      refund +
      "G."
  );

  showCurrentSectorIntro({
    silentLog: true
  });
}

function selectPathForWave() {
  const activePaths = getActivePaths();

  if (!activePaths) return;
  if (activePaths.length === 0) return;

  const selectedPathIndex = Math.floor(Math.random() * activePaths.length);

  state.currentPath = activePaths[selectedPathIndex];
}


function maybeApplyPathFeint() {
  const isBossWave = state.wave % 5 === 0;
  const earlyWave = state.wave <= 2;

  if (isBossWave) return false;
  if (earlyWave) return false;

  const feintChance = state.aiMemory.successScore < -1 ? 0.35 : 0.25;

  if (Math.random() > feintChance) return false;

  const activePaths = getActivePaths();

  if (!activePaths) return false;
  if (activePaths.length <= 1) return false;

  const possiblePaths = activePaths.filter(function (path) {
    return path !== state.currentPath;
  });

  if (possiblePaths.length === 0) return false;

  const feintPathIndex = Math.floor(Math.random() * possiblePaths.length);

  state.currentPath = possiblePaths[feintPathIndex];

  return true;
}

function calculateWaveEnemyTarget(isBossWave) {
  if (isBossWave) return 1;

  const baseCount = getWaveEnemyCount(state.enemiesPerWave);
  const spawnPressure = getCurrentStageSpawnPressure();

  return Math.max(1, Math.ceil(baseCount * spawnPressure));
}

function getLockedWaveEnemyTarget(isBossWave) {
  if (isBossWave) return 1;

  const lockedTarget =
    state.waveEnemyTarget ||
    state.enemiesToSpawn ||
    calculateWaveEnemyTarget(false);

  return Math.max(1, lockedTarget);
}

function getCurrentSpawnInterval() {
  const spawnPressure = getCurrentStageSpawnPressure();

  return Math.max(28, Math.floor(60 / spawnPressure));
}

function getStageBonusGold(baseGold) {
  const goldMultiplier = getCurrentStageGoldMultiplier();

  return Math.max(1, Math.floor(baseGold * goldMultiplier));
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