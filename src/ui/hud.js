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
import { getControlModeLabel } from "../systems/controls.js";

export function updateHud() {
  setText("#score", state.score);
  setText("#wave", state.wave);
  setText("#gold", state.gold);
  setText("#baseHp", `${state.baseHp} / ${state.baseMaxHp}`);

  const currentStage = getCurrentStage();
  const stageEffect = getCurrentStageEffect();
  const recommendedTowers = getRecommendedTowerTypes(stageEffect.id);

  setText("#stageName", currentStage.name);
  setText("#towerLimit", `${getTowerCount()} / ${getTowerLimit()}`);

  setText("#stageEffect", getStageEffectText());
  setText("#stageEffectShort", getStageEffectText());

  updateStageIntel(currentStage, stageEffect, recommendedTowers);
  updateRecommendedBuildButtons(recommendedTowers);

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
  setText("#controlMode", getControlModeLabel());
  setText("#audioStatus", state.muted ? "Muted" : "On");

  setText("#gameState", getGameStateLabel());
}

function updateStageIntel(stage, effect, recommendedTowers) {
  if (!stage || !effect) return;

  setText("#stageIntelName", stage.name);
  setText("#stageIntelEffect", effect.label);
  setText("#stageIntelDescription", effect.description);

  setText("#stageEnemySpeed", formatMultiplier(effect.enemySpeedMultiplier));
  setText("#stageEnemyHealth", formatMultiplier(effect.enemyHealthMultiplier));
  setText("#stageTowerDamage", formatMultiplier(effect.towerDamageMultiplier));
  setText("#stageGoldBonus", formatMultiplier(effect.goldMultiplier));
  setText("#stageSpawnPressure", formatMultiplier(effect.spawnPressure));
  setText("#stageSlowBonus", formatMultiplier(effect.slowBonus));

  setText(
    "#stageRecommendedTowers",
    recommendedTowers.map(formatTowerType).join(" / ")
  );
}

function updateRecommendedBuildButtons(recommendedTowers) {
  const buttons = document.querySelectorAll(".build-button");

  buttons.forEach((button) => {
    const towerType = button.dataset.tower;

    button.classList.toggle(
      "recommended",
      recommendedTowers.includes(towerType)
    );
  });
}

function getRecommendedTowerTypes(effectId) {
  if (effectId === "forest_balance") {
    return ["normal", "rapid"];
  }

  if (effectId === "canyon_wind") {
    return ["rapid", "sniper"];
  }

  if (effectId === "frozen_chill") {
    return ["slow", "sniper"];
  }

  if (effectId === "ancient_armor") {
    return ["sniper", "splash"];
  }

  if (effectId === "lava_pressure") {
    return ["sniper", "splash"];
  }

  if (effectId === "swamp_mud") {
    return ["splash", "slow"];
  }

  if (effectId === "crystal_resonance") {
    return ["sniper", "rapid"];
  }

  return ["normal", "rapid"];
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