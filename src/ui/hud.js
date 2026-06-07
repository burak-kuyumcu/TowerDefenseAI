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

const STAGE_INTEL_STYLE_ID = "stageIntelHudFixStyle";

export function updateHud() {
  injectStageIntelHudFixStyles();

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

  enforceStageIntelPanelState();
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

  removeDuplicateSectorTextFromStageIntel();
}

function enforceStageIntelPanelState() {
  const panel = document.querySelector("#stageIntelPanel");

  if (!panel) return;

  const shouldBeOpen = document.body.classList.contains("stage-intel-open");

  if (shouldBeOpen) {
    panel.classList.remove("hidden");

    panel.style.setProperty("display", "block", "important");
    panel.style.setProperty("opacity", "1", "important");
    panel.style.setProperty("visibility", "visible", "important");
    panel.style.setProperty("pointer-events", "auto", "important");

    removeDuplicateSectorTextFromStageIntel();
    return;
  }

  panel.classList.add("hidden");

  panel.style.setProperty("display", "none", "important");
  panel.style.setProperty("opacity", "0", "important");
  panel.style.setProperty("visibility", "hidden", "important");
  panel.style.setProperty("pointer-events", "none", "important");
}

function removeDuplicateSectorTextFromStageIntel() {
  const panel = document.querySelector("#stageIntelPanel");

  if (!panel) return;

  const elements = panel.querySelectorAll("*");

  for (const element of elements) {
    const text = String(element.textContent || "").trim();

    if (/^SECTOR[-\s]*0?\d+$/i.test(text)) {
      hideDuplicateElement(element);
    }

    if (/^STAGE\s*INTEL$/i.test(text)) {
      hideDuplicateElement(element);
    }
  }
}

function hideDuplicateElement(element) {
  element.dataset.stageIntelDuplicate = "hidden";

  element.style.setProperty("display", "none", "important");
  element.style.setProperty("opacity", "0", "important");
  element.style.setProperty("visibility", "hidden", "important");
  element.style.setProperty("height", "0", "important");
  element.style.setProperty("margin", "0", "important");
  element.style.setProperty("padding", "0", "important");
  element.style.setProperty("overflow", "hidden", "important");
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

function injectStageIntelHudFixStyles() {
  let style = document.querySelector("#" + STAGE_INTEL_STYLE_ID);

  if (!style) {
    style = document.createElement("style");
    style.id = STAGE_INTEL_STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = `
    #stageIntelPanel.hidden,
    body:not(.stage-intel-open) #stageIntelPanel {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    body.stage-intel-open #stageIntelPanel {
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      z-index: 88 !important;
      background:
        linear-gradient(
          180deg,
          rgba(8, 15, 32, 0.99),
          rgba(3, 8, 20, 0.985)
        ) !important;
      box-shadow:
        0 18px 44px rgba(0, 0, 0, 0.46),
        inset 0 0 26px rgba(56, 189, 248, 0.08) !important;
      backdrop-filter: none !important;
      isolation: isolate !important;
    }

    body.stage-intel-open #stageIntelPanel::before,
    body.stage-intel-open #stageIntelPanel::after {
      content: none !important;
      display: none !important;
    }

    #stageIntelPanel .stage-intel-title,
    #stageIntelPanel [data-stage-intel-duplicate="hidden"] {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }

    body.stage-intel-open #stageIntelPanel * {
      text-shadow: none !important;
    }

    body.stage-intel-open #smartCoachToast,
    body.stage-intel-open #missionObjectivesPanel,
    body.stage-intel-open #optionalContractsPanel,
    body.stage-intel-open #campaignProgressPanel,
    body.stage-intel-open #waveReportPanel,
    body.stage-intel-open #battlefieldEventToast,
    body.stage-intel-open #commanderRankToast {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  `;
}