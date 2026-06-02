import { state } from "../game/state.js";
import { getAIStrategyName, getWaveType } from "../ai/aiDirector.js";
import { getShaderModeLabel } from "../visuals/materials.js";
import {
  getCurrentStage,
  getCurrentStageEffect
} from "../game/stages.js";
import { getStageEffectText } from "../ai/stageInfo.js";
import { getSelectedTowerUltimateText } from "../entities/towerUltimates.js";
import { getTowerCount, getTowerLimit } from "../game/placement.js";

export function updateHud() {
  setText("#score", state.score);
  setText("#wave", state.wave);
  setText("#gold", state.gold);
  setText("#baseHp", `${state.baseHp} / ${state.baseMaxHp}`);

  const currentStage = getCurrentStage();
  const stageEffect = getCurrentStageEffect();

  setText("#stageName", currentStage.name);
  setText("#towerLimit", `${getTowerCount()} / ${getTowerLimit()}`);
  setText("#stageEffect", formatStageEffect(stageEffect));
  setText("#stageEffectShort", getStageEffectText());

  setText("#ultimateStatus", getSelectedTowerUltimateText());

  setText("#combo", state.combo > 1 ? `x${state.combo}` : "-");

  setText(
    "#relocations",
    state.waitingForNextWave ? state.relocationTokens : "-"
  );

  setText("#selectedTower", formatTowerType(state.selectedTowerType));
  setText("#waveType", getWaveType());
  setText("#aiStrategy", getAIStrategyName());
  setText("#shaderMode", getShaderModeLabel());
  setText("#audioStatus", state.muted ? "Muted" : "On");

  setText("#gameState", getGameStateLabel());
}

function setText(selector, value) {
  const element = document.querySelector(selector);

  if (!element) return;

  element.textContent = value;
}

function getGameStateLabel() {
  if (!state.started) return "Waiting";
  if (state.gameOver) return "GAME OVER";
  if (state.paused) return "Paused";
  if (state.waveActive) return "Wave Running";

  return "Preparing";
}

function formatStageEffect(effect) {
  if (!effect) return "No Stage Effect";

  const speed = formatMultiplier(effect.enemySpeedMultiplier);
  const health = formatMultiplier(effect.enemyHealthMultiplier);
  const damage = formatMultiplier(effect.towerDamageMultiplier);
  const gold = formatMultiplier(effect.goldMultiplier);
  const spawn = formatMultiplier(effect.spawnPressure);
  const slow = formatMultiplier(effect.slowBonus);

  return `${effect.label} | Enemy SPD ${speed} | Enemy HP ${health} | Tower DMG ${damage} | Gold ${gold} | Spawn ${spawn} | Slow ${slow}`;
}

function formatMultiplier(value = 1) {
  return `x${Number(value).toFixed(2)}`;
}

function formatTowerType(type) {
  if (type === "rapid") return "Rapid";
  if (type === "sniper") return "Sniper";
  if (type === "slow") return "Slow";
  if (type === "splash") return "Splash";

  return "Normal";
}