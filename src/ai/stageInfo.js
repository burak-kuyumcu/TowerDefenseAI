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

export function getStageLoreText() {
  const stage = getCurrentStage();
  const effect = getCurrentStageEffect();

  if (!stage || !effect) {
    return "Unknown sector. Core grid data is incomplete.";
  }

  if (effect.id === "forest_balance") {
    return "A stable outer-grid route used for baseline defense calibration.";
  }

  if (effect.id === "canyon_wind") {
    return "Dry canyon pressure accelerates portal-born units through exposed lanes.";
  }

  if (effect.id === "frozen_chill") {
    return "Cryo interference slows the battlefield, but enemy armor signatures harden.";
  }

  if (effect.id === "ancient_armor") {
    return "Old defense ruins amplify hostile armor and limit tower deployment space.";
  }

  if (effect.id === "lava_pressure") {
    return "Thermal instability increases enemy aggression and weakens slow control.";
  }

  if (effect.id === "swamp_mud") {
    return "Swamp sectors reduce movement speed but let enemies absorb more damage.";
  }

  if (effect.id === "crystal_resonance") {
    return "Crystal resonance boosts tower output, while enemy cores gain extra durability.";
  }

  return `${stage.name} is an unstable sector with active combat modifiers.`;
}

export function getStageTacticalAdvice() {
  const effect = getCurrentStageEffect();

  if (!effect) {
    return "Build balanced coverage and preserve gold for emergency upgrades.";
  }

  if (effect.id === "forest_balance") {
    return "Use Normal and Rapid towers to create a stable baseline defense.";
  }

  if (effect.id === "canyon_wind") {
    return "Cover long lanes with Rapid and Sniper towers before fast enemies slip through.";
  }

  if (effect.id === "frozen_chill") {
    return "Use Slow towers near corners and add Snipers for durable enemies.";
  }

  if (effect.id === "ancient_armor") {
    return "Prioritize Sniper damage and avoid wasting tower slots on weak coverage.";
  }

  if (effect.id === "lava_pressure") {
    return "Use burst damage, Splash pressure, and Snipers before the tempo overwhelms the Core.";
  }

  if (effect.id === "swamp_mud") {
    return "Use Splash and Slow towers to exploit enemy stacking in muddy lanes.";
  }

  if (effect.id === "crystal_resonance") {
    return "Use Rapid and Sniper towers to benefit from boosted tower damage.";
  }

  return "Build mixed coverage and monitor the AI wave plan.";
}

export function getStageSectorStatus() {
  const effect = getCurrentStageEffect();

  if (!effect) return "Unknown";

  let score = 0;

  if (effect.enemySpeedMultiplier > 1.08) score++;
  if (effect.enemyHealthMultiplier > 1.1) score++;
  if (effect.spawnPressure > 1.08) score++;
  if (effect.slowBonus < 0.95) score++;
  if (effect.towerDamageMultiplier < 1) score++;

  if (score >= 4) return "Critical";
  if (score >= 2) return "Unstable";
  if (score >= 1) return "Alert";

  return "Stable";
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

export function getRecommendedTowersForStage(effectId = null) {
  const effect = getCurrentStageEffect();
  const id = effectId ?? effect?.id;

  if (id === "forest_balance") return "Normal / Rapid";
  if (id === "canyon_wind") return "Rapid / Sniper";
  if (id === "frozen_chill") return "Slow / Sniper";
  if (id === "ancient_armor") return "Sniper / Splash";
  if (id === "lava_pressure") return "Sniper / Splash";
  if (id === "swamp_mud") return "Splash / Slow";
  if (id === "crystal_resonance") return "Sniper / Rapid";

  return "Normal / Rapid";
}

export function formatMultiplier(value = 1) {
  return `x${Number(value).toFixed(2)}`;
}