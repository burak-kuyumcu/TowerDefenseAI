import { state } from "../game/state.js";
import { getCurrentStageEffect } from "../game/stages.js";
import { getAIStrategyName, getAIPlanText } from "../ai/aiDirector.js";
import { getCurrentStoryText } from "../systems/storyDirector.js";

const STORY_ARCHIVE_PANEL_ID = "storyArchivePanel";
const STORY_ARCHIVE_STYLE_ID = "storyArchiveStyle";

const OLD_ARCHIVE_SELECTORS = [
  "#storyArchive",
  "#loreArchive",
  "#loreArchivePanel",
  "#missionArchivePanel",
  ".mission-archive-panel"
];

const SECTOR_ARCHIVE = [
  {
    unlockWave: 1,
    code: "SECTOR-01",
    title: "Forest Route",
    subtitle: "Outer Grove Defense Line",
    status: "Baseline defense sector",
    briefing:
      "The outer forest grid protects the first Base Core calibration route. Portal residue is spreading through the roots, but the area is still tactically stable."
  },
  {
    unlockWave: 5,
    code: "SECTOR-02",
    title: "Canyon Wind",
    subtitle: "Crosswind Relay Pass",
    status: "Fast movement sector",
    briefing:
      "The canyon compresses portal energy into violent crosswinds. Enemy units can exploit the wind corridors to pressure long lanes."
  },
  {
    unlockWave: 9,
    code: "SECTOR-03",
    title: "Frozen Chill",
    subtitle: "Cryo-Locked Defense Grid",
    status: "Control sector",
    briefing:
      "Cryo mist slows movement and increases the value of control towers. The sector rewards careful positioning before enemies stack."
  },
  {
    unlockWave: 13,
    code: "SECTOR-04",
    title: "Ancient Armor",
    subtitle: "Ruined Sentinel Corridor",
    status: "Armored enemy sector",
    briefing:
      "Old sentinel ruins broadcast reinforcement patterns. Enemy shells become more durable near these structures."
  },
  {
    unlockWave: 17,
    code: "SECTOR-05",
    title: "Lava Pressure",
    subtitle: "Thermal Breach Zone",
    status: "High pressure sector",
    briefing:
      "Thermal vents increase portal aggression. Burst damage and ultimate timing become critical in this sector."
  },
  {
    unlockWave: 21,
    code: "SECTOR-06",
    title: "Swamp Mud",
    subtitle: "Sinking Bio-Grid",
    status: "Heavy body sector",
    briefing:
      "The swamp slows enemy movement, but corrupted mud allows heavier enemy bodies to survive longer."
  },
  {
    unlockWave: 25,
    code: "SECTOR-07",
    title: "Crystal Resonance",
    subtitle: "Resonant Core Approach",
    status: "Final resonance sector",
    briefing:
      "Crystal formations amplify both tower output and enemy durability. Placement quality decides survival."
  }
];

let initialized = false;
let lastRenderSignature = "";

export function initStoryArchive() {
  if (initialized) return;

  initialized = true;

  injectStoryArchiveStyles();
  ensureStoryArchivePanel();

  window.addEventListener(
    "keydown",
    function (event) {
      const panel = document.querySelector("#" + STORY_ARCHIVE_PANEL_ID);

      if (!panel) return;
      if (panel.classList.contains("hidden")) return;

      if (event.code === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        hideStoryArchive();
      }
    },
    true
  );
}

export function toggleStoryArchive() {
  const panel = ensureStoryArchivePanel();

  if (panel.classList.contains("hidden")) {
    closePanelsForStoryArchive();

    panel.classList.remove("hidden");
    panel.classList.add("open");

    panel.style.removeProperty("display");
    panel.style.removeProperty("opacity");
    panel.style.removeProperty("visibility");
    panel.style.removeProperty("pointer-events");

    document.body.classList.add("archive-modal-open");
    document.body.classList.remove("settings-panel-open");
    document.body.classList.remove("info-drawer-open");
    document.body.classList.remove("panel-hard-modal-open");

    lastRenderSignature = "";
    updateStoryArchive(true);

    window.setTimeout(function () {
      updateStoryArchive(true);
    }, 0);
  } else {
    hideStoryArchive();
  }
}

export function hideStoryArchive() {
  const panel = document.querySelector("#" + STORY_ARCHIVE_PANEL_ID);

  if (!panel) return;

  panel.classList.add("hidden");
  panel.classList.remove("open", "active", "visible");

  document.body.classList.remove("archive-modal-open");

  panel.style.removeProperty("display");
  panel.style.removeProperty("opacity");
  panel.style.removeProperty("visibility");
  panel.style.removeProperty("pointer-events");
}

export function updateStoryArchive(forceRender = false) {
  injectStoryArchiveStyles();

  const panel = ensureStoryArchivePanel();

  if (panel.classList.contains("hidden") && !forceRender) {
    return;
  }

  const signature = getArchiveSignature();

  if (!forceRender && signature === lastRenderSignature) {
    return;
  }

  lastRenderSignature = signature;

  const shell = panel.querySelector(".story-archive-shell");
  const previousScrollTop = shell ? shell.scrollTop : 0;

  panel.innerHTML = buildArchiveHtml();

  const newShell = panel.querySelector(".story-archive-shell");

  if (newShell) {
    newShell.scrollTop = previousScrollTop;
  }
}

function buildArchiveHtml() {
  const story = getSafeStory();
  const effect = getCurrentStageEffect();
  const strategy = getAIStrategyName();

  const effectLabel = effect && effect.label ? effect.label : "Balanced Terrain";
  const effectDescription =
    effect && effect.description
      ? effect.description
      : "No special terrain modifier.";

  return `
    <div class="story-archive-shell">
      <div class="story-archive-header">
        <div>
          <span class="story-archive-kicker">Mission Archive</span>
          <h2>Base Core Defense Log</h2>
        </div>

        <button id="storyArchiveCloseButton" type="button">Close</button>
      </div>

      <div class="story-archive-current">
        <div class="story-archive-current-main">
          <span class="story-archive-kicker">${escapeHtml(story.code)}</span>
          <h3>${escapeHtml(story.title)}</h3>
          <p>${escapeHtml(story.subtitle)}</p>
        </div>

        <div class="story-archive-status-grid">
          ${createStatusItem("Wave", String(state.wave))}
          ${createStatusItem("Threat", story.threat)}
          ${createStatusItem("AI", strategy)}
          ${createStatusItem("Modifier", effectLabel)}
        </div>
      </div>

      <div class="story-archive-section">
        <h4>Current Objective</h4>
        <p>${escapeHtml(story.objective)}</p>
      </div>

      <div class="story-archive-section">
        <h4>Sector Briefing</h4>
        <p>${escapeHtml(story.intro)}</p>
      </div>

      <div class="story-archive-section">
        <h4>Tactical Notes</h4>
        <p>${escapeHtml(story.advice)}</p>
        <p class="story-archive-muted">${escapeHtml(effectDescription)}</p>
      </div>

      <div class="story-archive-section">
        <h4>AI Plan</h4>
        <p>${escapeHtml(getAIPlanText())}</p>
      </div>

      <div class="story-archive-section story-archive-sector-section">
        <h4>Discovered Sectors</h4>
        <div class="story-archive-sector-list">
          ${buildSectorList()}
        </div>
      </div>

      <div class="story-archive-footer">
        Press L to toggle this archive. Press Esc or Close to exit.
      </div>
    </div>
  `;
}

function createStatusItem(label, value) {
  return `
    <div class="story-archive-status-item">
      <span>${escapeHtml(label)}</span>
      <b>${escapeHtml(value)}</b>
    </div>
  `;
}

function buildSectorList() {
  return SECTOR_ARCHIVE.map(function (sector) {
    const unlocked = state.wave >= sector.unlockWave;

    const title = unlocked ? sector.title : "Unknown Sector";
    const subtitle = unlocked
      ? sector.subtitle
      : "Encrypted until Wave " + sector.unlockWave;

    const statusText = unlocked
      ? sector.status
      : "Locked until Wave " + sector.unlockWave;

    const briefingText = unlocked ? sector.briefing : statusText;

    return `
      <div class="story-archive-sector ${unlocked ? "unlocked" : "locked"}">
        <div class="story-archive-sector-top">
          <span>${escapeHtml(sector.code)}</span>
          <b>${escapeHtml(unlocked ? "Unlocked" : "Locked")}</b>
        </div>

        <h5>${escapeHtml(title)}</h5>
        <small>${escapeHtml(subtitle)}</small>
        <p>${escapeHtml(briefingText)}</p>
      </div>
    `;
  }).join("");
}

function getArchiveSignature() {
  const story = getSafeStory();
  const effect = getCurrentStageEffect();

  return [
    state.wave,
    state.baseHp,
    state.gold,
    state.score,
    state.stageVersion,
    state.aiLockedStrategy,
    state.aiDisplayedStrategy,
    story.code,
    story.title,
    story.threat,
    effect ? effect.id : "none",
    effect ? effect.label : "none",
    getAIStrategyName(),
    getAIPlanText()
  ].join("|");
}

function getSafeStory() {
  const story = getCurrentStoryText();

  return {
    code: story?.code || "SECTOR-01",
    title: story?.title || "Forest Route",
    subtitle: story?.subtitle || "Outer Grove Defense Line",
    threat: story?.threat || "Stable",
    objective:
      story?.objective ||
      "Hold the forest road and protect the Base Core calibration route.",
    intro:
      story?.intro ||
      "The outer forest grid is stable, but portal residue is spreading through the roots. This is our baseline sector.",
    advice:
      story?.advice ||
      "Balanced towers are enough here. Use this sector to prepare economy and upgrades."
  };
}

function ensureStoryArchivePanel() {
  let panel = document.querySelector("#" + STORY_ARCHIVE_PANEL_ID);

  if (!panel) {
    panel = document.createElement("section");
    panel.id = STORY_ARCHIVE_PANEL_ID;
    document.body.appendChild(panel);
  }

  panel.classList.add("story-archive-panel");

  if (!panel.classList.contains("open") && !panel.classList.contains("hidden")) {
    panel.classList.add("hidden");
  }

  panel.onclick = function (event) {
    if (event.target === panel) {
      hideStoryArchive();
      return;
    }

    const closeButton = event.target.closest("#storyArchiveCloseButton");

    if (closeButton) {
      event.preventDefault();
      event.stopPropagation();
      hideStoryArchive();
    }
  };

  return panel;
}

function closePanelsForStoryArchive() {
  const selectors = [
    "#stageIntelPanel",
    "#help",
    "#achievementPanel",
    "#aiFeedback",
    "#settingsPanel",
    ...OLD_ARCHIVE_SELECTORS
  ];

  selectors.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (panel) {
      if (!panel) return;

      if (panel.id === STORY_ARCHIVE_PANEL_ID) return;

      panel.classList.add("hidden");
      panel.classList.remove("open", "active", "visible");

      panel.style.removeProperty("display");
      panel.style.removeProperty("opacity");
      panel.style.removeProperty("visibility");
      panel.style.removeProperty("pointer-events");
    });
  });

  const stagePanel = document.querySelector("#stageIntelPanel");

  if (stagePanel) {
    stagePanel.dataset.stageIntelGate = "managed-closed";
  }

  document.body.classList.remove("stage-intel-open");
  document.body.classList.remove("info-drawer-open");
  document.body.classList.remove("settings-panel-open");
  document.body.classList.remove("panel-hard-modal-open");
}

function injectStoryArchiveStyles() {
  let style = document.querySelector("#" + STORY_ARCHIVE_STYLE_ID);

  if (!style) {
    style = document.createElement("style");
    style.id = STORY_ARCHIVE_STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = `
    .story-archive-panel {
      position: fixed !important;
      inset: 0 !important;
      z-index: 155 !important;

      display: flex !important;
      align-items: center !important;
      justify-content: center !important;

      padding: 32px !important;
      box-sizing: border-box !important;

      background: rgba(0, 0, 0, 0.48) !important;
      backdrop-filter: blur(5px) !important;

      color: #dbeafe !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
    }

    .story-archive-panel.hidden {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    .story-archive-panel:not(.hidden) {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    .story-archive-shell {
      width: min(980px, calc(100vw - 96px)) !important;
      max-width: min(980px, calc(100vw - 96px)) !important;
      max-height: calc(100vh - 76px) !important;

      overflow-y: auto !important;
      overflow-x: hidden !important;

      padding: 24px !important;
      border-radius: 22px !important;
      border: 1px solid rgba(56, 189, 248, 0.62) !important;

      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 42%),
        linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(3, 10, 24, 0.96)) !important;

      box-shadow:
        0 24px 60px rgba(0, 0, 0, 0.48),
        0 0 26px rgba(56, 189, 248, 0.16) !important;

      box-sizing: border-box !important;
      overscroll-behavior: contain !important;
    }

    .story-archive-shell::-webkit-scrollbar {
      width: 10px !important;
    }

    .story-archive-shell::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.65) !important;
      border-radius: 999px !important;
    }

    .story-archive-shell::-webkit-scrollbar-thumb {
      background: rgba(125, 211, 252, 0.48) !important;
      border-radius: 999px !important;
    }

    .story-archive-header {
      display: flex !important;
      align-items: flex-start !important;
      justify-content: space-between !important;
      gap: 18px !important;
      margin-bottom: 20px !important;
    }

    .story-archive-kicker {
      display: block !important;
      margin-bottom: 5px !important;
      color: #38bdf8 !important;
      font-size: 11px !important;
      font-weight: 900 !important;
      letter-spacing: 0.14em !important;
      text-transform: uppercase !important;
    }

    .story-archive-header h2 {
      margin: 0 !important;
      color: #facc15 !important;
      font-size: 30px !important;
      line-height: 1 !important;
      font-weight: 950 !important;
      text-shadow: 0 0 18px rgba(250, 204, 21, 0.18) !important;
    }

    #storyArchiveCloseButton {
      min-width: 96px !important;
      min-height: 36px !important;
      border-radius: 11px !important;
      border: 1px solid rgba(96, 165, 250, 0.62) !important;
      background: rgba(15, 23, 42, 0.96) !important;
      color: #dbeafe !important;
      font-size: 12px !important;
      font-weight: 900 !important;
      cursor: pointer !important;
      position: sticky !important;
      top: 0 !important;
      z-index: 2 !important;
    }

    #storyArchiveCloseButton:hover {
      border-color: rgba(250, 204, 21, 0.86) !important;
      color: #facc15 !important;
      box-shadow: 0 0 14px rgba(250, 204, 21, 0.16) !important;
    }

    .story-archive-current {
      display: grid !important;
      grid-template-columns: 1.1fr 1fr !important;
      gap: 14px !important;
      margin-bottom: 14px !important;
    }

    .story-archive-current-main,
    .story-archive-section,
    .story-archive-status-item,
    .story-archive-sector {
      border: 1px solid rgba(56, 189, 248, 0.24) !important;
      border-radius: 16px !important;
      background: rgba(15, 23, 42, 0.62) !important;
      box-sizing: border-box !important;
    }

    .story-archive-current-main {
      padding: 18px !important;
      min-height: 150px !important;
    }

    .story-archive-current-main h3 {
      margin: 0 0 5px !important;
      color: #facc15 !important;
      font-size: 25px !important;
      font-weight: 950 !important;
      line-height: 1 !important;
    }

    .story-archive-current-main p {
      margin: 0 !important;
      color: #7dd3fc !important;
      font-size: 13px !important;
      font-weight: 800 !important;
    }

    .story-archive-status-grid {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 10px !important;
    }

    .story-archive-status-item {
      padding: 13px !important;
      min-height: 70px !important;
    }

    .story-archive-status-item span {
      display: block !important;
      margin-bottom: 5px !important;
      color: #94a3b8 !important;
      font-size: 10px !important;
      font-weight: 900 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.08em !important;
    }

    .story-archive-status-item b {
      color: #facc15 !important;
      font-size: 13px !important;
      line-height: 1.2 !important;
    }

    .story-archive-section {
      margin-top: 13px !important;
      padding: 15px 17px !important;
    }

    .story-archive-section h4 {
      margin: 0 0 9px !important;
      color: #38bdf8 !important;
      font-size: 14px !important;
      font-weight: 950 !important;
      letter-spacing: 0.05em !important;
      text-transform: uppercase !important;
    }

    .story-archive-section p {
      margin: 0 !important;
      color: #dbeafe !important;
      font-size: 13px !important;
      line-height: 1.5 !important;
    }

    .story-archive-muted {
      margin-top: 9px !important;
      color: #94a3b8 !important;
    }

    .story-archive-sector-section {
      margin-bottom: 4px !important;
    }

    .story-archive-sector-list {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 11px !important;
    }

    .story-archive-sector {
      padding: 13px !important;
      min-height: 145px !important;
    }

    .story-archive-sector.locked {
      opacity: 0.58 !important;
      filter: grayscale(0.25) !important;
    }

    .story-archive-sector-top {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin-bottom: 7px !important;
    }

    .story-archive-sector-top span {
      color: #38bdf8 !important;
      font-size: 10px !important;
      font-weight: 950 !important;
      letter-spacing: 0.10em !important;
    }

    .story-archive-sector-top b {
      color: #22c55e !important;
      font-size: 10px !important;
      font-weight: 950 !important;
      text-transform: uppercase !important;
    }

    .story-archive-sector.locked .story-archive-sector-top b {
      color: #f87171 !important;
    }

    .story-archive-sector h5 {
      margin: 0 0 4px !important;
      color: #facc15 !important;
      font-size: 15px !important;
      font-weight: 950 !important;
    }

    .story-archive-sector small {
      display: block !important;
      margin-bottom: 7px !important;
      color: #7dd3fc !important;
      font-size: 11px !important;
      font-weight: 800 !important;
    }

    .story-archive-sector p {
      margin: 0 !important;
      color: #cbd5e1 !important;
      font-size: 12px !important;
      line-height: 1.38 !important;
    }

    .story-archive-footer {
      margin-top: 16px !important;
      color: #94a3b8 !important;
      font-size: 12px !important;
      text-align: center !important;
    }

    @media (max-width: 900px) {
      .story-archive-panel {
        padding: 16px !important;
        align-items: stretch !important;
      }

      .story-archive-shell {
        width: calc(100vw - 32px) !important;
        max-width: calc(100vw - 32px) !important;
        max-height: calc(100vh - 32px) !important;
        padding: 18px !important;
      }

      .story-archive-current,
      .story-archive-sector-list {
        grid-template-columns: 1fr !important;
      }

      .story-archive-header h2 {
        font-size: 24px !important;
      }
    }
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}