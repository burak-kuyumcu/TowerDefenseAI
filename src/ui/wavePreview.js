import { state } from "../game/state.js";
import { getAIStrategyName, getWaveEnemyCount } from "../ai/aiDirector.js";
import {
  getCurrentStage,
  getCurrentStageEffect,
  getCurrentStageSpawnPressure
} from "../game/stages.js";

import {
  getStageEffectText,
  getStageSectorStatus,
  getRecommendedTowersForStage,
  formatMultiplier
} from "../ai/stageInfo.js";

export function updateWavePreview() {
  const content = document.querySelector("#wavePreviewContent");
  if (!content) return;

  if (!state.started) {
    content.innerHTML = `
      <div class="wave-preview-empty">
        <b>Mission Standby</b>
        <span>Press Enter to deploy.</span>
      </div>
    `;
    return;
  }

  const isBossWave = state.wave % 5 === 0;
  const strategy = getAIStrategyName();
  const stage = getCurrentStage();
  const stageEffect = getCurrentStageEffect();

  const expectedEnemies = getExpectedEnemyText(isBossWave);
  const recommendedTowers = getRecommendedTowersForStage(stageEffect.id);
  const threatLevel = getThreatLevel(strategy, isBossWave, stageEffect);
  const threatText = getThreatText(strategy, isBossWave, stageEffect);
  const sectorStatus = getStageSectorStatus();

  content.innerHTML = `
    <div class="wave-card-status ${getSectorClass(sectorStatus)}">
      <span>Sector</span>
      <b>${escapeHtml(sectorStatus)}</b>
    </div>

    <div class="wave-compact-grid">
      <div>
        <span>Route</span>
        <b>${escapeHtml(stage.name)}</b>
      </div>

      <div>
        <span>Modifier</span>
        <b>${escapeHtml(getStageEffectText())}</b>
      </div>

      <div>
        <span>Wave</span>
        <b>${state.wave}</b>
      </div>

      <div>
        <span>Status</span>
        <b>${escapeHtml(getWaveStatus())}</b>
      </div>

      <div>
        <span>Type</span>
        <b>${isBossWave ? "Boss" : "Normal"}</b>
      </div>

      <div>
        <span>Enemies</span>
        <b>${escapeHtml(expectedEnemies)}</b>
      </div>
    </div>

    <div class="wave-ai-plan">
      <span>AI Plan</span>
      <b>${escapeHtml(strategy)}</b>
    </div>

    <div class="wave-threat-box ${getThreatClass(threatLevel)}">
      <div>
        <span>Threat</span>
        <b>${escapeHtml(threatLevel)}</b>
      </div>
      <small>${escapeHtml(threatText)}</small>
    </div>

    <div class="wave-loadout-box">
      <span>Recommended</span>
      <b>${escapeHtml(recommendedTowers)}</b>
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

  return `${finalCount} / ${formatMultiplier(spawnPressure)}`;
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

function getSectorClass(sectorStatus) {
  if (sectorStatus === "Critical") return "critical";
  if (sectorStatus === "Unstable") return "high";
  if (sectorStatus === "Alert") return "medium";

  return "low";
}

function getThreatText(strategy, isBossWave, stageEffect) {
  if (isBossWave) return "Boss signature. Save ultimates.";

  if (stageEffect.id === "lava_pressure") return "High tempo. Burst damage advised.";
  if (stageEffect.id === "swamp_mud") return "Tanky enemies. Area damage helps.";
  if (stageEffect.id === "crystal_resonance") return "Boosted towers, tougher enemies.";
  if (stageEffect.id === "frozen_chill") return "Slow control is stronger.";
  if (stageEffect.id === "ancient_armor") return "Precision damage matters.";
  if (stageEffect.id === "canyon_wind") return "Fast lanes. Cover long routes.";

  if (strategy === "Swarm Pressure") return "Fast enemy pressure expected.";
  if (strategy === "Heavy Push") return "Durable enemies expected.";
  if (strategy === "Armored Response") return "Armored enemies expected.";
  if (strategy === "Tank Response") return "Tank enemies likely.";
  if (strategy === "Fast Pressure") return "Fast enemies likely.";
  if (strategy === "Adaptive Mix") return "AI changed plan after scan.";
  if (strategy === "Late Wave Mix") return "Mixed pressure expected.";

  return "Balanced enemy composition.";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}