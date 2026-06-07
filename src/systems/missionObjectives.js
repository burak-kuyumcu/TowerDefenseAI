import { state } from "../game/state.js";
import { getCurrentStage, getCurrentStageEffect } from "../game/stages.js";
import { getAIStrategyName } from "../ai/aiDirector.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";

const PANEL_ID = "missionObjectivesPanel";
const STYLE_ID = "missionObjectivesStyle";

const OBJECTIVE_PANEL_VISIBLE_FRAMES_AFTER_WAVE = 240;

let initialized = false;
let lastWaveActive = false;
let objectiveWave = null;
let activeObjectives = [];
let lastSummary = null;
let summaryTimer = 0;

let waveStartBaseHp = 0;
let waveStartScore = 0;
let maxComboDuringWave = 0;

export function initMissionObjectives() {
  if (initialized) return;

  initialized = true;

  injectMissionObjectiveStyles();
  ensurePanel();

  renderPanel();
}

export function updateMissionObjectives() {
  if (!initialized) return;

  if (!state.started) {
    lastWaveActive = false;
    hidePanel();
    return;
  }

  if (state.waveActive && !lastWaveActive) {
    startObjectivesForCurrentWave();
  }

  if (state.waveActive) {
    maxComboDuringWave = Math.max(maxComboDuringWave, state.combo || 0);
    updateObjectiveProgress();
  }

  if (lastWaveActive && !state.waveActive && activeObjectives.length > 0) {
    completeObjectivesForWave();
  }

  if (summaryTimer > 0) {
    summaryTimer--;
  }

  lastWaveActive = state.waveActive;

  renderPanel();
}

function startObjectivesForCurrentWave() {
  const stage = getCurrentStage();
  const effect = getCurrentStageEffect();
  const strategy = getAIStrategyName();

  objectiveWave = state.wave;

  waveStartBaseHp = state.baseHp;
  waveStartScore = state.score;
  maxComboDuringWave = state.combo || 0;

  activeObjectives = buildObjectives({
    wave: state.wave,
    stage,
    effect,
    strategy
  });

  lastSummary = null;
  summaryTimer = 0;

  addEventLog(
    "Sector Orders: " +
      activeObjectives.map((objective) => objective.shortTitle).join(" | ")
  );
}

function completeObjectivesForWave() {
  updateObjectiveProgress();

  let completedCount = 0;
  let totalGoldReward = 0;
  let totalScoreReward = 0;

  for (const objective of activeObjectives) {
    if (!objective.completed) continue;

    completedCount++;
    totalGoldReward += objective.goldReward;
    totalScoreReward += objective.scoreReward;
  }

  if (totalGoldReward > 0) {
    state.gold += totalGoldReward;
  }

  if (totalScoreReward > 0) {
    state.score += totalScoreReward;
  }

  const totalCount = activeObjectives.length;

  lastSummary = {
    wave: objectiveWave,
    completedCount,
    totalCount,
    goldReward: totalGoldReward,
    scoreReward: totalScoreReward
  };

  summaryTimer = OBJECTIVE_PANEL_VISIBLE_FRAMES_AFTER_WAVE;

  if (completedCount > 0) {
    showAnnouncement(
      "Sector Orders Complete: " +
        completedCount +
        "/" +
        totalCount +
        " +" +
        totalGoldReward +
        "G"
    );

    addEventLog(
      "Sector Orders complete: " +
        completedCount +
        "/" +
        totalCount +
        ". Reward +" +
        totalGoldReward +
        " gold, +" +
        totalScoreReward +
        " score."
    );
  } else {
    addEventLog("Sector Orders failed: no optional objectives completed.");
  }

  activeObjectives = [];
  objectiveWave = null;
}

function buildObjectives(context) {
  const objectives = [];

  objectives.push(createCoreGuardObjective());

  if (context.wave % 5 === 0) {
    objectives.push(createBossPreparationObjective());
  } else if (context.effect && context.effect.id === "canyon_wind") {
    objectives.push(createFastResponseObjective());
  } else if (context.effect && context.effect.id === "ancient_armor") {
    objectives.push(createArmorBreakObjective());
  } else if (context.effect && context.effect.id === "lava_pressure") {
    objectives.push(createThermalControlObjective());
  } else if (context.effect && context.effect.id === "swamp_mud") {
    objectives.push(createSustainObjective());
  } else {
    objectives.push(createEconomyObjective());
  }

  objectives.push(createTacticalDisciplineObjective());

  return objectives;
}

function createCoreGuardObjective() {
  return {
    id: "core_guard",
    shortTitle: "Protect Core",
    title: "Protect the Base Core",
    description: "Finish this wave without losing Base HP.",
    goldReward: 20,
    scoreReward: 100,
    completed: false,
    progressText: "Base HP intact",
    evaluate() {
      return state.baseHp >= waveStartBaseHp;
    },
    getProgress() {
      const lost = Math.max(0, waveStartBaseHp - state.baseHp);

      if (lost === 0) return "No core damage";

      return "Core damage taken: -" + lost;
    }
  };
}

function createEconomyObjective() {
  return {
    id: "field_economy",
    shortTitle: "Save Gold",
    title: "Maintain Field Economy",
    description: "Finish the wave with at least 60 gold.",
    goldReward: 15,
    scoreReward: 75,
    completed: false,
    progressText: "Gold reserve",
    evaluate() {
      return state.gold >= 60;
    },
    getProgress() {
      return "Current gold: " + state.gold + " / 60";
    }
  };
}

function createTacticalDisciplineObjective() {
  return {
    id: "tactical_discipline",
    shortTitle: "Hold Formation",
    title: "Hold Formation",
    description: "Finish with no more than 8 towers.",
    goldReward: 15,
    scoreReward: 75,
    completed: false,
    progressText: "Tower count",
    evaluate() {
      return state.towers.length <= 8;
    },
    getProgress() {
      return "Towers: " + state.towers.length + " / 8";
    }
  };
}

function createFastResponseObjective() {
  return {
    id: "fast_response",
    shortTitle: "Fast Response",
    title: "Fast Response Drill",
    description: "Reach combo 3 during this wave.",
    goldReward: 25,
    scoreReward: 140,
    completed: false,
    progressText: "Combo drill",
    evaluate() {
      return maxComboDuringWave >= 3;
    },
    getProgress() {
      return "Max combo: " + maxComboDuringWave + " / 3";
    }
  };
}

function createArmorBreakObjective() {
  return {
    id: "armor_break",
    shortTitle: "Break Armor",
    title: "Break Armor Formation",
    description: "Score at least 150 points during the wave.",
    goldReward: 25,
    scoreReward: 130,
    completed: false,
    progressText: "Score gain",
    evaluate() {
      return state.score - waveStartScore >= 150;
    },
    getProgress() {
      const gained = Math.max(0, state.score - waveStartScore);

      return "Score gained: " + gained + " / 150";
    }
  };
}

function createThermalControlObjective() {
  return {
    id: "thermal_control",
    shortTitle: "Thermal Control",
    title: "Thermal Control",
    description: "Keep Base HP above 5.",
    goldReward: 30,
    scoreReward: 150,
    completed: false,
    progressText: "Core safety",
    evaluate() {
      return state.baseHp > 5;
    },
    getProgress() {
      return "Base HP: " + state.baseHp + " / 6+";
    }
  };
}

function createSustainObjective() {
  return {
    id: "sustain_line",
    shortTitle: "Sustain Line",
    title: "Sustain the Mud Line",
    description: "Finish with at least one relocation token saved.",
    goldReward: 20,
    scoreReward: 100,
    completed: false,
    progressText: "Relocation reserve",
    evaluate() {
      return state.relocationTokens >= 1;
    },
    getProgress() {
      return "Relocations: " + state.relocationTokens + " / 1";
    }
  };
}

function createBossPreparationObjective() {
  return {
    id: "boss_preparation",
    shortTitle: "Boss Prep",
    title: "Boss Preparation Protocol",
    description: "Enter the boss wave with at least 2 towers deployed.",
    goldReward: 25,
    scoreReward: 125,
    completed: false,
    progressText: "Tower deployment",
    evaluate() {
      return state.towers.length >= 2;
    },
    getProgress() {
      return "Towers deployed: " + state.towers.length + " / 2";
    }
  };
}

function updateObjectiveProgress() {
  for (const objective of activeObjectives) {
    objective.completed = objective.evaluate();
    objective.progressText = objective.getProgress();
  }
}

function renderPanel() {
  const panel = ensurePanel();

  if (!state.started) {
    hidePanel();
    return;
  }

  if (state.waveActive && activeObjectives.length > 0) {
    panel.innerHTML = renderActiveObjectives();
    panel.classList.remove("hidden");
    return;
  }

  if (summaryTimer > 0 && lastSummary) {
    panel.innerHTML = renderSummary();
    panel.classList.remove("hidden");
    return;
  }

  hidePanel();
}

function renderActiveObjectives() {
  const stage = getCurrentStage();
  const effect = getCurrentStageEffect();
  const effectLabel = effect && effect.label ? effect.label : "Balanced Terrain";

  return (
    '<div class="mission-objectives-header">' +
      "<span>Sector Orders</span>" +
      "<b>Wave " +
        escapeHtml(objectiveWave) +
      "</b>" +
    "</div>" +
    '<div class="mission-objectives-subtitle">' +
      escapeHtml(stage.name) +
      " | " +
      escapeHtml(effectLabel) +
    "</div>" +
    '<div class="mission-objectives-list">' +
      activeObjectives.map(renderObjectiveItem).join("") +
    "</div>"
  );
}

function renderObjectiveItem(objective) {
  const statusClass = objective.completed ? "completed" : "active";
  const statusText = objective.completed ? "DONE" : "OPEN";

  return (
    '<div class="mission-objective-item ' +
      statusClass +
    '">' +
      '<div class="mission-objective-top">' +
        "<strong>" +
          escapeHtml(objective.title) +
        "</strong>" +
        "<span>" +
          statusText +
        "</span>" +
      "</div>" +
      "<p>" +
        escapeHtml(objective.description) +
      "</p>" +
      "<small>" +
        escapeHtml(objective.progressText) +
        " | +" +
        objective.goldReward +
        "G" +
      "</small>" +
    "</div>"
  );
}

function renderSummary() {
  return (
    '<div class="mission-objectives-header">' +
      "<span>Sector Orders</span>" +
      "<b>Report</b>" +
    "</div>" +
    '<div class="mission-objectives-summary">' +
      "<strong>Wave " +
        escapeHtml(lastSummary.wave) +
        ": " +
        lastSummary.completedCount +
        "/" +
        lastSummary.totalCount +
        " complete</strong>" +
      "<p>Reward +" +
        lastSummary.goldReward +
        "G, +" +
        lastSummary.scoreReward +
        " score.</p>" +
    "</div>"
  );
}

function ensurePanel() {
  let panel = document.querySelector("#" + PANEL_ID);

  if (panel) return panel;

  panel = document.createElement("section");
  panel.id = PANEL_ID;
  panel.className = "mission-objectives-panel hidden";

  document.body.appendChild(panel);

  return panel;
}

function hidePanel() {
  const panel = ensurePanel();

  panel.classList.add("hidden");
}

function injectMissionObjectiveStyles() {
  const existing = document.querySelector("#" + STYLE_ID);

  if (existing) {
    existing.remove();
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;

  style.textContent = `
    .mission-objectives-panel {
      position: fixed;
      left: 50%;
      bottom: 92px;
      z-index: 36;
      transform: translateX(-50%);
      width: 500px;
      max-width: calc(100vw - 560px);
      min-height: 76px;
      padding: 12px 14px;
      border-radius: 16px;
      border: 1px solid rgba(56, 189, 248, 0.42);
      background:
        linear-gradient(135deg, rgba(5, 12, 26, 0.92), rgba(15, 23, 42, 0.82));
      box-shadow:
        0 14px 30px rgba(0, 0, 0, 0.28),
        0 0 18px rgba(56, 189, 248, 0.11);
      color: #dbeafe;
      pointer-events: none;
      box-sizing: border-box;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .mission-objectives-panel.hidden {
      display: none;
    }

    .mission-objectives-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .mission-objectives-header span {
      color: #38bdf8;
      font-size: 11px;
      font-weight: 950;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .mission-objectives-header b {
      color: #facc15;
      font-size: 12px;
      font-weight: 950;
    }

    .mission-objectives-subtitle {
      margin-bottom: 8px;
      color: #94a3b8;
      font-size: 11px;
      font-weight: 800;
    }

    .mission-objectives-list {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .mission-objective-item {
      min-height: 72px;
      padding: 8px 9px;
      border-radius: 12px;
      border: 1px solid rgba(56, 189, 248, 0.22);
      background: rgba(15, 23, 42, 0.62);
      box-sizing: border-box;
    }

    .mission-objective-item.completed {
      border-color: rgba(34, 197, 94, 0.55);
      background:
        linear-gradient(135deg, rgba(21, 128, 61, 0.18), rgba(15, 23, 42, 0.62));
    }

    .mission-objective-top {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 5px;
    }

    .mission-objective-top strong {
      color: #e0f2fe;
      font-size: 11px;
      line-height: 1.15;
      font-weight: 950;
    }

    .mission-objective-top span {
      color: #facc15;
      font-size: 9px;
      font-weight: 950;
    }

    .mission-objective-item.completed .mission-objective-top span {
      color: #22c55e;
    }

    .mission-objective-item p {
      margin: 0 0 5px;
      color: #cbd5e1;
      font-size: 10px;
      line-height: 1.25;
    }

    .mission-objective-item small {
      color: #94a3b8;
      font-size: 9px;
      line-height: 1.2;
    }

    .mission-objectives-summary strong {
      display: block;
      margin-bottom: 4px;
      color: #facc15;
      font-size: 13px;
      font-weight: 950;
    }

    .mission-objectives-summary p {
      margin: 0;
      color: #dbeafe;
      font-size: 12px;
    }

    @media (max-width: 1300px) {
      .mission-objectives-panel {
        width: 430px;
        max-width: calc(100vw - 500px);
      }

      .mission-objectives-list {
        grid-template-columns: 1fr;
      }

      .mission-objective-item {
        min-height: 0;
      }
    }

    @media (max-width: 1000px) {
      .mission-objectives-panel {
        left: 50%;
        bottom: 88px;
        width: calc(100vw - 420px);
        max-width: calc(100vw - 420px);
      }
    }
  `;

  document.head.appendChild(style);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}