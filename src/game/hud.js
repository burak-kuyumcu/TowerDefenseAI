import { state } from "./state.js";
import { getAIStrategyName, getWaveType } from "./aiDirector.js";

export function updateHud() {
  document.querySelector("#score").textContent = state.score;
  document.querySelector("#wave").textContent = state.wave;
  document.querySelector("#gold").textContent = state.gold;
  document.querySelector("#baseHp").textContent = state.baseHp;

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
    shaderModeEl.textContent =
      state.shaderMode === "toon" ? "Toon" : "Standard";
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
        : "Running";
}

function formatTowerType(type) {
  if (type === "rapid") return "Rapid";
  if (type === "sniper") return "Sniper";
  if (type === "slow") return "Slow";
  if (type === "splash") return "Splash";

  return "Normal";
}