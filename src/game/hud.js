import { state } from "./state.js";
import { getAIStrategyName, getWaveType } from "./aiDirector.js";
import { getShaderModeLabel } from "./materials.js";
import { getCurrentStage } from "./stages.js";
import { getStageEffectText } from "./stageInfo.js";

export function updateHud() {
  document.querySelector("#score").textContent = state.score;
  document.querySelector("#wave").textContent = state.wave;
  document.querySelector("#gold").textContent = state.gold;
  document.querySelector("#baseHp").textContent = state.baseHp;

  const stageNameEl = document.querySelector("#stageName");
  if (stageNameEl) {
    stageNameEl.textContent = getCurrentStage().name;
  }

  const stageEffectEl = document.querySelector("#stageEffect");
  if (stageEffectEl) {
    stageEffectEl.textContent = getStageEffectText();
  }

  const comboEl = document.querySelector("#combo");
  if (comboEl) {
    comboEl.textContent = state.combo > 1 ? `x${state.combo}` : "-";
  }

  const relocationEl = document.querySelector("#relocations");
  if (relocationEl) {
    relocationEl.textContent = state.waitingForNextWave
      ? state.relocationTokens
      : "-";
  }

  document.querySelector("#selectedTower").textContent =
    formatTowerType(state.selectedTowerType);

  const waveTypeEl = document.querySelector("#waveType");
  if (waveTypeEl) {
    waveTypeEl.textContent = getWaveType();
  }

  const aiStrategyEl = document.querySelector("#aiStrategy");
  if (aiStrategyEl) {
    aiStrategyEl.textContent = getAIStrategyName();
  }

  const shaderModeEl = document.querySelector("#shaderMode");
  if (shaderModeEl) {
    shaderModeEl.textContent = getShaderModeLabel();
  }

  const audioStatusEl = document.querySelector("#audioStatus");
  if (audioStatusEl) {
    audioStatusEl.textContent = state.muted ? "Muted" : "On";
  }

  document.querySelector("#gameState").textContent = !state.started
    ? "Waiting"
    : state.gameOver
      ? "GAME OVER"
      : state.paused
        ? "Paused"
        : state.waveActive
          ? "Wave Running"
          : "Preparing";
}

function formatTowerType(type) {
  if (type === "rapid") return "Rapid";
  if (type === "sniper") return "Sniper";
  if (type === "slow") return "Slow";
  if (type === "splash") return "Splash";

  return "Normal";
}