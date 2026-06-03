import { state } from "../game/state.js";
import { getAIStrategyName, getWaveEnemyCount } from "../ai/aiDirector.js";
import {
  getCurrentStage,
  getCurrentStageEffect,
  getCurrentStageSpawnPressure
} from "../game/stages.js";
import { getStageEffectText } from "../ai/stageInfo.js";

export function updateWavePreview() {
  const content = document.querySelector("#wavePreviewContent");
  if (!content) return;

  if (!state.started) {
    content.innerHTML = `
      <div class="wave-preview-empty">
        Press Enter to start.
      </div>
    `;
    return;
  }

  const isBossWave = state.wave % 5 === 0;
  const strategy = getAIStrategyName();
  const stage = getCurrentStage();
  const stageEffect = getCurrentStageEffect();

  const expectedEnemies = getExpectedEnemyText(isBossWave);
  const recommendedTowers = getRecommendedTowers(stageEffect.id);
  const threatLevel = getThreatLevel(strategy, isBossWave, stageEffect);
  const threatText = getThreatText(strategy, isBossWave, stageEffect);

  content.innerHTML = `
    <div class="wave-preview-row">
      <span>Stage</span>
      <b>${stage.name}</b>
    </div>

    <div class="wave-preview-row">
      <span>Effect</span>
      <b>${getStageEffectText()}</b>
    </div>

    <div class="wave-preview-row">
      <span>Wave</span>
      <b>${state.wave}</b>
    </div>

    <div class="wave-preview-row">
      <span>Status</span>
      <b>${getWaveStatus()}</b>
    </div>

    <div class="wave-preview-row">
      <span>Type</span>
      <b>${isBossWave ? "Boss" : "Normal"}</b>
    </div>

    <div class="wave-preview-row">
      <span>Enemies</span>
      <b>${expectedEnemies}</b>
    </div>

    <div class="wave-preview-row">
      <span>AI</span>
      <b>${strategy}</b>
    </div>

    <div class="wave-preview-threat ${getThreatClass(threatLevel)}">
      <span>Threat</span>
      <b>${threatLevel}</b>
      <small>${threatText}</small>
    </div>

    <div class="wave-preview-recommendation">
      <span>Recommended</span>
      <b>${recommendedTowers}</b>
    </div>

    <div class="wave-preview-note">
      ${stageEffect.description}
    </div>
  `;
}

function getExpectedEnemyText(isBossWave) {
  if (isBossWave) return "1 Boss";

  const baseCount = getWaveEnemyCount(state.enemiesPerWave);
  const spawnPressure = getCurrentStageSpawnPressure();
  const finalCount = Math.max(1, Math.ceil(baseCount * spawnPressure));

  if (spawnPressure === 1) {
    return `${finalCount}`;
  }

  return `${finalCount} (${formatMultiplier(spawnPressure)} pressure)`;
}

function getWaveStatus() {
  if (state.gameOver) return "Game Over";
  if (state.paused) return "Paused";
  if (state.waveActive) return "Running";
  if (state.waitingForNextWave) return "Preparing";

  return "Idle";
}

function getThreatLevel(strategy, isBossWave, stageEffect) {
  if (isBossWave) return "Critical";

  let score = 0;

  if (stageEffect.enemySpeedMultiplier > 1.08) score += 1;
  if (stageEffect.enemyHealthMultiplier > 1.1) score += 1;
  if (stageEffect.spawnPressure > 1.08) score += 1;
  if (stageEffect.slowBonus < 0.95) score += 1;

  if (strategy === "Swarm Pressure") score += 1;
  if (strategy === "Heavy Push") score += 1;
  if (strategy === "Armored Response") score += 1;
  if (strategy === "Tank Response") score += 1;
  if (strategy === "Fast Pressure") score += 1;
  if (strategy === "Late Wave Mix") score += 1;

  if (score >= 4) return "High";
  if (score >= 2) return "Medium";

  return "Low";
}

function getThreatClass(threatLevel) {
  if (threatLevel === "Critical") return "critical";
  if (threatLevel === "High") return "high";
  if (threatLevel === "Medium") return "medium";

  return "low";
}

function getThreatText(strategy, isBossWave, stageEffect) {
  if (isBossWave) {
    return "Boss variant incoming. Save ultimates and prepare burst damage.";
  }

  if (stageEffect.id === "lava_pressure") {
    return "Lava pressure increases speed and spawn tempo. Burst towers are safer.";
  }

  if (stageEffect.id === "swamp_mud") {
    return "Swamp enemies are slower but tankier. Area damage helps.";
  }

  if (stageEffect.id === "crystal_resonance") {
    return "Tower damage is boosted, but enemies have more health.";
  }

  if (stageEffect.id === "frozen_chill") {
    return "Slow towers gain value. Control the path before enemies stack.";
  }

  if (stageEffect.id === "ancient_armor") {
    return "Enemies are durable. Precision damage matters.";
  }

  if (stageEffect.id === "canyon_wind") {
    return "Canyon wind favors faster enemies. Cover long lanes.";
  }

  if (strategy === "Swarm Pressure") return "More fast enemies and higher count expected.";
  if (strategy === "Heavy Push") return "Fewer but tougher enemies expected.";
  if (strategy === "Armored Response") return "More armored enemies expected.";
  if (strategy === "Tank Response") return "Tank enemies likely.";
  if (strategy === "Fast Pressure") return "Fast enemies likely.";
  if (strategy === "Adaptive Mix") return "AI changed plan after previous results.";
  if (strategy === "Late Wave Mix") return "Mixed pressure expected.";

  return "Balanced enemy composition expected.";
}

function getRecommendedTowers(effectId) {
  if (effectId === "forest_balance") {
    return "Normal / Rapid";
  }

  if (effectId === "canyon_wind") {
    return "Rapid / Sniper";
  }

  if (effectId === "frozen_chill") {
    return "Slow / Sniper";
  }

  if (effectId === "ancient_armor") {
    return "Sniper / Splash";
  }

  if (effectId === "lava_pressure") {
    return "Sniper / Splash";
  }

  if (effectId === "swamp_mud") {
    return "Splash / Slow";
  }

  if (effectId === "crystal_resonance") {
    return "Sniper / Rapid";
  }

  return "Normal / Rapid";
}

function formatMultiplier(value = 1) {
  return `x${Number(value).toFixed(2)}`;
}