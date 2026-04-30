import { state } from "./state.js";
import { spawnEnemy } from "./enemies.js";
import { showAnnouncement } from "./announcer.js";
import { addEventLog } from "./eventLog.js";
import {
  analyzeAndLockAIPlan,
  prepareWaveStartAIPlan,
  getAIStrategyName,
  getAIPlanText,
  getWaveEnemyCount,
  recordWaveResult
} from "./aiDirector.js";
import { resetRelocationsForPreparation } from "./relocation.js";
import { spawnTacticalSignal } from "./tacticalSignals.js";
import { PATHS } from "../core/constants.js";

let initialized = false;

export function initWaveControls(scene) {
  if (initialized) return;
  initialized = true;

  const button = document.querySelector("#startWaveButton");

  if (button) {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      startNextWave(scene);
    });
  }
}

export function updateWaveControls() {
  const button = document.querySelector("#startWaveButton");
  if (!button) return;

  const canStart =
    state.started &&
    !state.gameOver &&
    !state.paused &&
    state.waitingForNextWave &&
    state.enemies.length === 0;

  button.disabled = !canStart;

  if (!state.started) button.textContent = "Start Game First";
  else if (state.waveActive) button.textContent = "Wave Running";
  else if (state.paused) button.textContent = "Paused";
  else button.textContent = state.wave % 5 === 0 ? "Start Boss Wave" : "Start Next Wave";
}

export function startNextWave(scene) {
  if (!state.started) return;
  if (state.gameOver || state.paused) return;
  if (state.waveActive) return;
  if (state.enemies.length > 0) return;

  const aiStart = prepareWaveStartAIPlan();
  const strategy = getAIStrategyName();
  const feintApplied = maybeApplyPathFeint();

  spawnTacticalSignal(scene, strategy);

  state.spawned = 0;
  state.spawnTimer = 0;
  state.waveActive = true;
  state.waitingForNextWave = false;

  if (aiStart.bluffApplied) {
    showAnnouncement(`🎭 AI BLUFF REVEALED: ${aiStart.strategy}`);
    addEventLog(`AI bluff: showed ${aiStart.displayedStrategy}, executed ${aiStart.strategy}.`);
  } else if (feintApplied) {
    showAnnouncement("⚠ AI FEINT DETECTED! Route changed!");
    addEventLog(`AI feint detected. Route changed before Wave ${state.wave}.`);
  } else {
    showAnnouncement(`AI Locked: ${strategy}`);
    addEventLog(`Wave ${state.wave} started. AI: ${strategy}.`);
  }

  addEventLog(getAIPlanText());
}

export function updateWave(scene) {
  if (!state.waveActive) return;

  const isBossWave = state.wave % 5 === 0;
  const maxEnemies = isBossWave ? 1 : getWaveEnemyCount(state.enemiesPerWave);

  state.spawnTimer++;

  if (state.spawned < maxEnemies) {
    if (state.spawnTimer > 60) {
      spawnEnemy(scene);
      state.spawned++;
      state.spawnTimer = 0;
    }
  }

  if (state.spawned === maxEnemies && state.enemies.length === 0) {
    completeWave(isBossWave);
  }
}

function completeWave(completedWaveWasBoss) {
  const bonusGold = completedWaveWasBoss ? 60 : 20;

  recordWaveResult();

  state.gold += bonusGold;

  showAnnouncement(
    completedWaveWasBoss
      ? `Boss Defeated! +${bonusGold}G`
      : `Wave Cleared! +${bonusGold}G`
  );

  addEventLog(
    completedWaveWasBoss
      ? `Boss defeated. +${bonusGold} gold.`
      : `Wave ${state.wave} cleared. +${bonusGold} gold.`
  );

  if (state.aiMemory.lastDamageDealt > 0) {
    addEventLog(
      `AI memory: ${state.aiMemory.lastStrategy} dealt ${state.aiMemory.lastDamageDealt} base damage.`
    );
  } else {
    addEventLog(`AI memory: ${state.aiMemory.lastStrategy} failed to damage base.`);
  }

  state.wave++;

  selectPathForWave();
  analyzeAndLockAIPlan();

  state.spawned = 0;
  state.spawnTimer = 0;

  state.waveActive = false;
  state.waitingForNextWave = true;

  resetRelocationsForPreparation();

  if (!completedWaveWasBoss) {
    state.enemiesPerWave += 1;
  }

  addEventLog(
    `Preparation phase. ${state.relocationTokens} tower relocations available.`
  );

  addEventLog(getAIPlanText());
}

function selectPathForWave() {
  if (state.wave % 5 === 0) {
    state.currentPath = PATHS[2];
    return;
  }

  const randomIndex = Math.floor(Math.random() * PATHS.length);
  state.currentPath = PATHS[randomIndex];
}

function maybeApplyPathFeint() {
  const isBossWave = state.wave % 5 === 0;
  const earlyWave = state.wave <= 2;

  if (isBossWave || earlyWave) return false;

  const feintChance = state.aiMemory.successScore < -1 ? 0.35 : 0.25;

  if (Math.random() > feintChance) return false;

  const currentIndex = PATHS.indexOf(state.currentPath);
  const possiblePaths = PATHS.filter((_, index) => index !== currentIndex);

  if (possiblePaths.length === 0) return false;

  const randomIndex = Math.floor(Math.random() * possiblePaths.length);
  state.currentPath = possiblePaths[randomIndex];

  return true;
}
