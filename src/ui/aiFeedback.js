import { state } from "../game/state.js";
import {
  getAIStrategyName,
  getAIPlanText,
  getWaveType
} from "../ai/aiDirector.js";
import { getCurrentStage, getCurrentStageEffect } from "../game/stages.js";
import { getStageEffectText } from "../ai/stageInfo.js";

export function updateAIFeedback() {
  const content = document.querySelector("#aiFeedbackContent");
  if (!content) return;

  if (!state.started) {
    content.innerHTML = `
      <div class="ai-report">
        <div class="ai-report-row">
          <span class="ai-report-label">Core Status:</span>
          <span class="ai-report-value stable">Standby</span>
        </div>

        <div class="ai-report-message">
          Start the game to activate the enemy AI director.
        </div>

        <div class="ai-report-transmission">
          Transmission: Defense grid is waiting for deployment authorization.
        </div>
      </div>
    `;
    return;
  }

  const strategy = getAIStrategyName();
  const stage = getCurrentStage();
  const effect = getCurrentStageEffect();
  const threat = getThreatProfile(strategy);
  const planText = getAIPlanText();

  content.innerHTML = `
    <div class="ai-report">
      <div class="ai-report-row">
        <span class="ai-report-label">Sector:</span>
        <span class="ai-report-value">${escapeHtml(stage?.name ?? "Unknown Sector")}</span>
      </div>

      <div class="ai-report-row">
        <span class="ai-report-label">Core Modifier:</span>
        <span class="ai-report-value">${escapeHtml(getStageEffectText())}</span>
      </div>

      <div class="ai-report-row">
        <span class="ai-report-label">Wave Type:</span>
        <span class="ai-report-value">${escapeHtml(getWaveType())}</span>
      </div>

      <div class="ai-report-row">
        <span class="ai-report-label">Locked Strategy:</span>
        <span class="ai-report-value warning">${escapeHtml(strategy)}</span>
      </div>

      <div class="ai-report-row">
        <span class="ai-report-label">Threat Level:</span>
        <span class="ai-report-value ${threat.tone}">${escapeHtml(threat.label)}</span>
      </div>

      <div class="ai-report-row">
        <span class="ai-report-label">Planning Status:</span>
        <span class="ai-report-value ${state.waveActive ? "critical" : "stable"}">
          ${state.waveActive ? "Executing portal assault" : "Planning complete"}
        </span>
      </div>

      <div class="ai-report-section">
        <div class="ai-report-section-title">AI Plan</div>
        <div class="ai-report-message">
          ${escapeHtml(planText)}
        </div>
      </div>

      <div class="ai-report-section">
        <div class="ai-report-section-title">Transmission</div>
        <div class="ai-report-transmission">
          ${escapeHtml(getTransmissionText(strategy, threat, effect))}
        </div>
      </div>

      <div class="ai-report-section">
        <div class="ai-report-section-title">Counter Suggestion</div>
        <div class="ai-report-message">
          ${escapeHtml(getSuggestionText(strategy))}
        </div>
      </div>

      <div class="ai-report-footer">
        ${escapeHtml(getBluffText())}
      </div>
    </div>
  `;
}

function getThreatProfile(strategy) {
  if (state.gameOver) {
    return {
      label: "Core Breached",
      tone: "critical"
    };
  }

  if (state.baseHp <= 3) {
    return {
      label: "Critical",
      tone: "critical"
    };
  }

  if (state.wave % 5 === 0 || strategy.includes("Boss")) {
    return {
      label: "Boss-Class",
      tone: "critical"
    };
  }

  if (
    strategy === "Heavy Push" ||
    strategy === "Armored Response" ||
    strategy === "Tank Response" ||
    strategy === "Fast Pressure"
  ) {
    return {
      label: "High",
      tone: "warning"
    };
  }

  if (
    strategy === "Adaptive Mix" ||
    strategy === "Late Wave Mix" ||
    strategy === "Swarm Pressure"
  ) {
    return {
      label: "Elevated",
      tone: "warning"
    };
  }

  return {
    label: "Low",
    tone: "stable"
  };
}

function getTransmissionText(strategy, threat, effect) {
  if (state.gameOver) {
    return "CORE BREACH CONFIRMED. The Last Core Protocol has failed.";
  }

  if (state.waveActive) {
    return `PORTAL BREACH ACTIVE. Enemy AI is executing ${strategy} under ${effect?.label ?? "unknown"} conditions.`;
  }

  if (state.baseHp <= 3) {
    return "Core integrity is unstable. Emergency defensive adaptation is recommended.";
  }

  if (state.wave % 5 === 0 || strategy.includes("Boss")) {
    return "Boss-class signature detected. The enemy AI is committing a high-value breach attempt.";
  }

  if (state.aiBluffActive) {
    return `Deception pattern detected. Displayed plan ${state.aiBluffFrom}, actual execution ${state.aiBluffTo}.`;
  }

  if (threat.label === "High") {
    return "Enemy pressure is rising. The AI has identified a defensive weakness in the current grid.";
  }

  if (strategy === "Adaptive Mix" || strategy === "Late Wave Mix") {
    return "The AI is mixing unit types after reading the tower layout and stage conditions.";
  }

  return "Defense grid stable. The enemy AI is preparing a baseline portal pressure pattern.";
}

function getBluffText() {
  if (!state.aiBluffActive) {
    return "Enemy Bluff: none detected";
  }

  return `Enemy Bluff: ${state.aiBluffFrom} -> ${state.aiBluffTo}`;
}

function getSuggestionText(strategy) {
  if (strategy === "Swarm Pressure" || strategy === "Swarm Boss") {
    return "Use rapid or splash towers near the active path. Swarm patterns punish slow single-target coverage.";
  }

  if (strategy === "Heavy Push" || strategy === "Shielded Push") {
    return "Add sniper towers and focus strongest enemies. Durable units require concentrated damage.";
  }

  if (strategy === "Armored Response" || strategy === "Armored Boss") {
    return "Use sniper support and spread towers across corners. Armor-heavy waves resist splash-only defenses.";
  }

  if (strategy === "Tank Response" || strategy === "Crusher Boss") {
    return "Upgrade damage and focus strongest targets. Tank pressure can break the Core quickly.";
  }

  if (strategy === "Fast Pressure") {
    return "Relocate slow towers near path corners. Fast units exploit blind spots and long reaction distances.";
  }

  if (strategy === "Adaptive Mix" || strategy === "Disruption Boss") {
    return "Balance damage, slow, and splash coverage. Mixed waves punish one-dimensional defenses.";
  }

  if (strategy === "Late Wave Mix") {
    return "Maintain mixed coverage and reserve gold for emergency upgrades.";
  }

  if (strategy === "Boss Wave") {
    return "Relocate high-damage towers near the boss path and save ultimates for burst windows.";
  }

  return "Prepare a balanced defense and keep enough gold for upgrades after the next wave scan.";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}