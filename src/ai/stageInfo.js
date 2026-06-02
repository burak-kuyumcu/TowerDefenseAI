import {
  getCurrentStage,
  getCurrentStageEffect
} from "../game/stages.js";

export function getStageEffectText() {
  const effect = getCurrentStageEffect();

  if (!effect) {
    return "Balanced Terrain";
  }

  return effect.label;
}

export function getStageEffectDetailText() {
  const effect = getCurrentStageEffect();

  if (!effect) {
    return "No special terrain modifier.";
  }

  return effect.description ?? "No special terrain modifier.";
}

export function getStageFullText() {
  const stage = getCurrentStage();
  const effect = getCurrentStageEffect();

  return `${stage.name}: ${effect.label} - ${effect.description}`;
}

export function getStageStatText() {
  const effect = getCurrentStageEffect();

  return [
    `Enemy Speed ${formatMultiplier(effect.enemySpeedMultiplier)}`,
    `Enemy HP ${formatMultiplier(effect.enemyHealthMultiplier)}`,
    `Tower DMG ${formatMultiplier(effect.towerDamageMultiplier)}`,
    `Gold ${formatMultiplier(effect.goldMultiplier)}`,
    `Spawn ${formatMultiplier(effect.spawnPressure)}`,
    `Slow ${formatMultiplier(effect.slowBonus)}`
  ].join(" | ");
}

export function getStageHudText() {
  const stage = getCurrentStage();
  const effect = getCurrentStageEffect();

  return `${stage.name} | ${effect.label} | ${getStageStatText()}`;
}

function formatMultiplier(value = 1) {
  return `x${Number(value).toFixed(2)}`;
}