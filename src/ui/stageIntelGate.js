import {
  getCurrentStage,
  getCurrentStageEffect
} from "../game/stages.js";

const STYLE_ID = "stageIntelGateStyle";
const PANEL_ID = "stageIntelPanel";
const CLOSE_BUTTON_ID = "stageIntelGateCloseButton";
const STAGE_BUTTON_SELECTOR = "#quickStageButton";

const PANELS_BEHIND_STAGE_INTEL = [
  "#smartCoachToast",
  "#missionObjectivesPanel",
  "#optionalContractsPanel",
  "#campaignProgressPanel",
  "#waveReportPanel",
  "#battlefieldEventToast",
  "#commanderRankToast"
];

const PANELS_TO_CLOSE_WHEN_STAGE_OPENS = [
  "#help",
  "#achievementPanel",
  "#aiFeedback",
  "#settingsPanel",
  "#storyArchivePanel",
  "#missionArchivePanel",
  ".story-archive-panel"
];

let initialized = false;
let listenersInstalled = false;
let stageIntelOpen = false;

export function initStageIntelGate() {
  if (initialized) return;

  initialized = true;

  removeLegacyStageIntelPanel();
  injectStageIntelGateStyles();
  installStageIntelGateListeners();
  closeStageIntelGate();
}

export function updateStageIntelGate() {
  if (!initialized) {
    initStageIntelGate();
    return;
  }

  injectStageIntelGateStyles();

  if (stageIntelOpen) {
    renderStageIntelPanel();
    openStageIntelGate();
  } else {
    closeStageIntelGate();
  }
}

export function toggleStageIntelGate() {
  if (stageIntelOpen) {
    closeStageIntelGate();
  } else {
    renderStageIntelPanel();
    openStageIntelGate();
  }
}

export function openStageIntelGate() {
  closePanelsForStageIntel();

  const panel = ensureStageIntelPanel();

  stageIntelOpen = true;

  document.body.classList.add("stage-intel-open");
  document.body.classList.remove("archive-modal-open");
  document.body.classList.remove("settings-panel-open");

  panel.dataset.stageIntelGate = "managed-open";
  panel.classList.remove("hidden", "closed", "active", "visible");
  panel.classList.add("open");

  panel.style.removeProperty("display");
  panel.style.removeProperty("opacity");
  panel.style.removeProperty("visibility");
  panel.style.removeProperty("pointer-events");

  panel.style.setProperty("display", "block", "important");
  panel.style.setProperty("opacity", "1", "important");
  panel.style.setProperty("visibility", "visible", "important");
  panel.style.setProperty("pointer-events", "auto", "important");

  hidePanelsBehindStageIntel();
}

export function closeStageIntelGate() {
  stageIntelOpen = false;

  document.body.classList.remove("stage-intel-open");
  document.body.classList.remove("info-drawer-open");

  const panel = document.querySelector("#" + PANEL_ID);

  if (!panel) return;

  panel.dataset.stageIntelGate = "managed-closed";
  panel.classList.add("hidden");
  panel.classList.remove("open", "active", "visible");

  panel.style.setProperty("display", "none", "important");
  panel.style.setProperty("opacity", "0", "important");
  panel.style.setProperty("visibility", "hidden", "important");
  panel.style.setProperty("pointer-events", "none", "important");
}

export function isStageIntelGateOpen() {
  return stageIntelOpen;
}

function removeLegacyStageIntelPanel() {
  const oldPanel = document.querySelector("#" + PANEL_ID);

  if (!oldPanel) return;

  oldPanel.remove();
}

function ensureStageIntelPanel() {
  let panel = document.querySelector("#" + PANEL_ID);

  if (panel) return panel;

  panel = document.createElement("section");
  panel.id = PANEL_ID;
  panel.className = "stage-intel-gate-panel hidden";
  panel.dataset.stageIntelGate = "managed-closed";

  panel.addEventListener(
    "pointerdown",
    function (event) {
      handleStageIntelPanelPointer(event);
    },
    true
  );

  panel.addEventListener(
    "mousedown",
    function (event) {
      handleStageIntelPanelPointer(event);
    },
    true
  );

  panel.addEventListener(
    "click",
    function (event) {
      handleStageIntelPanelPointer(event);
      event.stopPropagation();
    },
    true
  );

  document.body.appendChild(panel);

  return panel;
}

function handleStageIntelPanelPointer(event) {
  const target = event.target;

  if (!target || !target.closest) return;

  const closeButton = target.closest("#" + CLOSE_BUTTON_ID);

  if (!closeButton) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  closeStageIntelGate();
}

function renderStageIntelPanel() {
  const panel = ensureStageIntelPanel();

  const stage = getCurrentStage();
  const effect = getCurrentStageEffect();

  if (!stage || !effect) {
    panel.innerHTML = createCloseButtonHtml();
    return;
  }

  const recommendedTowers = getRecommendedTowerTypes(effect.id);

  panel.innerHTML =
    createCloseButtonHtml() +
    '<div class="stage-gate-kicker">Stage Intel</div>' +
    '<div class="stage-gate-header">' +
      '<div>' +
        '<div class="stage-gate-title">' +
          escapeHtml(stage.name) +
        "</div>" +
        '<div class="stage-gate-subtitle">' +
          escapeHtml(stage.subtitle || "Current tactical sector") +
        "</div>" +
      "</div>" +
      '<div class="stage-gate-threat">' +
        escapeHtml(effect.threat || "Low") +
      "</div>" +
    "</div>" +

    '<div class="stage-gate-description">' +
      escapeHtml(
        effect.description ||
          "No harsh modifier. This stage is designed as the baseline."
      ) +
    "</div>" +

    '<div class="stage-gate-grid">' +
      createMetric("Enemy SPD", formatMultiplier(effect.enemySpeedMultiplier)) +
      createMetric("Enemy HP", formatMultiplier(effect.enemyHealthMultiplier)) +
      createMetric("Tower DMG", formatMultiplier(effect.towerDamageMultiplier)) +
      createMetric("Gold", formatMultiplier(effect.goldMultiplier)) +
      createMetric("Spawn", formatMultiplier(effect.spawnPressure)) +
      createMetric("Slow", formatMultiplier(effect.slowBonus)) +
    "</div>" +

    '<div class="stage-gate-recommendation">' +
      "<span>Recommended</span>" +
      "<b>" +
        escapeHtml(recommendedTowers.map(formatTowerType).join(" / ")) +
      "</b>" +
    "</div>";
}

function createCloseButtonHtml() {
  return (
    '<button id="' +
    CLOSE_BUTTON_ID +
    '" class="stage-gate-close-button" type="button" aria-label="Close stage intel panel">×</button>'
  );
}

function createMetric(label, value) {
  return (
    '<div class="stage-gate-metric">' +
      "<span>" +
        escapeHtml(label) +
      "</span>" +
      "<b>" +
        escapeHtml(value) +
      "</b>" +
    "</div>"
  );
}

function installStageIntelGateListeners() {
  if (listenersInstalled) return;

  listenersInstalled = true;

  document.addEventListener(
    "click",
    function (event) {
      const target = event.target;

      if (!target || !target.closest) return;

      const stageButton = target.closest(STAGE_BUTTON_SELECTOR);

      if (!stageButton) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      toggleStageIntelGate();
    },
    true
  );

  window.addEventListener(
    "keydown",
    function (event) {
      if (isTypingTarget(event.target)) return;

      if (event.code === "KeyI") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        toggleStageIntelGate();
        return;
      }

      if (event.key === "Escape" && stageIntelOpen) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        closeStageIntelGate();
      }
    },
    true
  );
}

function closePanelsForStageIntel() {
  for (const selector of PANELS_TO_CLOSE_WHEN_STAGE_OPENS) {
    const panel = document.querySelector(selector);

    if (!panel) continue;

    panel.classList.add("hidden");

    panel.style.removeProperty("display");
    panel.style.removeProperty("opacity");
    panel.style.removeProperty("visibility");
    panel.style.removeProperty("pointer-events");
  }

  document.body.classList.remove("archive-modal-open");
  document.body.classList.remove("settings-panel-open");
  document.body.classList.remove("help-modal-open");
}

function hidePanelsBehindStageIntel() {
  for (const selector of PANELS_BEHIND_STAGE_INTEL) {
    const panel = document.querySelector(selector);

    if (!panel) continue;

    panel.style.setProperty("display", "none", "important");
    panel.style.setProperty("opacity", "0", "important");
    panel.style.setProperty("visibility", "hidden", "important");
    panel.style.setProperty("pointer-events", "none", "important");
  }
}

function isTypingTarget(target) {
  if (!target) return false;

  const tagName = String(target.tagName || "").toLowerCase();

  if (tagName === "input") return true;
  if (tagName === "textarea") return true;
  if (tagName === "select") return true;

  return Boolean(target.isContentEditable);
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

function formatTowerType(type) {
  if (type === "rapid") return "Rapid";
  if (type === "sniper") return "Sniper";
  if (type === "slow") return "Slow";
  if (type === "splash") return "Splash";

  return "Normal";
}

function formatMultiplier(value = 1) {
  return `x${Number(value || 1).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function injectStageIntelGateStyles() {
  let style = document.querySelector("#" + STYLE_ID);

  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = `
    #stageIntelPanel.stage-intel-gate-panel {
      position: fixed !important;
      left: 50% !important;
      top: 78px !important;
      transform: translateX(-50%) !important;
      width: min(680px, calc(100vw - 520px)) !important;
      max-width: min(680px, calc(100vw - 520px)) !important;
      max-height: 360px !important;
      overflow: hidden !important;
      z-index: 9050 !important;
      box-sizing: border-box !important;
      padding: 18px 20px !important;
      padding-top: 28px !important;
      border-radius: 18px !important;
      border: 1px solid rgba(56, 189, 248, 0.72) !important;
      background:
        linear-gradient(
          180deg,
          rgba(8, 15, 32, 0.99),
          rgba(3, 8, 20, 0.985)
        ) !important;
      box-shadow:
        0 18px 44px rgba(0, 0, 0, 0.46),
        inset 0 0 26px rgba(56, 189, 248, 0.08) !important;
      color: #e5f6ff !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      backdrop-filter: none !important;
      isolation: isolate !important;
    }

    #stageIntelPanel.stage-intel-gate-panel.hidden,
    #stageIntelPanel[data-stage-intel-gate="managed-closed"] {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    #stageIntelPanel[data-stage-intel-gate="managed-open"] {
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    .stage-gate-close-button {
      position: absolute !important;
      top: 14px !important;
      right: 14px !important;

      width: 38px !important;
      height: 38px !important;

      display: flex !important;
      align-items: center !important;
      justify-content: center !important;

      border: 1px solid rgba(96, 165, 250, 0.72) !important;
      border-radius: 999px !important;

      background: rgba(15, 23, 42, 0.96) !important;
      color: #e5f6ff !important;

      font-size: 24px !important;
      font-weight: 900 !important;
      line-height: 1 !important;

      cursor: pointer !important;
      pointer-events: auto !important;
      z-index: 99999 !important;

      box-shadow:
        0 0 18px rgba(56, 189, 248, 0.18),
        inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
    }

    .stage-gate-close-button:hover {
      color: #facc15 !important;
      border-color: rgba(250, 204, 21, 0.86) !important;
      transform: scale(1.04) !important;
    }

    .stage-gate-kicker {
      color: #38bdf8 !important;
      font-size: 11px !important;
      font-weight: 950 !important;
      letter-spacing: 0.18em !important;
      text-transform: uppercase !important;
      margin-bottom: 8px !important;
    }

    .stage-gate-header {
      display: flex !important;
      align-items: flex-start !important;
      justify-content: space-between !important;
      gap: 16px !important;
      margin-bottom: 10px !important;
    }

    .stage-gate-title {
      color: #facc15 !important;
      font-size: 30px !important;
      line-height: 1 !important;
      font-weight: 950 !important;
      margin-bottom: 6px !important;
    }

    .stage-gate-subtitle {
      color: #7dd3fc !important;
      font-size: 13px !important;
      line-height: 1.25 !important;
      font-weight: 850 !important;
    }

    .stage-gate-threat {
      color: #facc15 !important;
      font-size: 12px !important;
      line-height: 1.2 !important;
      font-weight: 950 !important;
      text-transform: uppercase !important;
      white-space: nowrap !important;
      padding-right: 44px !important;
    }

    .stage-gate-description {
      color: #e5f6ff !important;
      font-size: 14px !important;
      line-height: 1.42 !important;
      margin-bottom: 14px !important;
    }

    .stage-gate-grid {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 9px !important;
      margin-bottom: 12px !important;
    }

    .stage-gate-metric {
      min-height: 48px !important;
      padding: 9px 10px !important;
      border-radius: 12px !important;
      border: 1px solid rgba(56, 189, 248, 0.24) !important;
      background: rgba(15, 23, 42, 0.66) !important;
      box-sizing: border-box !important;
    }

    .stage-gate-metric span {
      display: block !important;
      color: #94a3b8 !important;
      font-size: 10px !important;
      font-weight: 900 !important;
      letter-spacing: 0.08em !important;
      text-transform: uppercase !important;
      margin-bottom: 4px !important;
    }

    .stage-gate-metric b {
      color: #facc15 !important;
      font-size: 13px !important;
      font-weight: 950 !important;
    }

    .stage-gate-recommendation {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 12px !important;
      padding: 10px 12px !important;
      border-radius: 12px !important;
      border: 1px solid rgba(34, 197, 94, 0.28) !important;
      background: rgba(21, 128, 61, 0.12) !important;
    }

    .stage-gate-recommendation span {
      color: #94a3b8 !important;
      font-size: 10px !important;
      font-weight: 950 !important;
      letter-spacing: 0.08em !important;
      text-transform: uppercase !important;
    }

    .stage-gate-recommendation b {
      color: #facc15 !important;
      font-size: 13px !important;
      font-weight: 950 !important;
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

    @media (max-width: 1180px) {
      #stageIntelPanel.stage-intel-gate-panel {
        width: calc(100vw - 320px) !important;
        max-width: calc(100vw - 320px) !important;
      }
    }

    @media (max-width: 860px) {
      #stageIntelPanel.stage-intel-gate-panel {
        width: calc(100vw - 32px) !important;
        max-width: calc(100vw - 32px) !important;
      }

      .stage-gate-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }
  `;
}