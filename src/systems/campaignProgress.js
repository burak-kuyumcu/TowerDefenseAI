import { state } from "../game/state.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";

const CAMPAIGN_PANEL_ID = "campaignProgressPanel";
const CAMPAIGN_STYLE_ID = "campaignProgressStyle";

const FINAL_WAVE = 25;

const CHAPTERS = [
  {
    wave: 1,
    title: "Chapter I",
    subtitle: "Outer Grove Contact",
    text: "The first portal residue has reached the forest road."
  },
  {
    wave: 5,
    title: "Chapter II",
    subtitle: "Crosswind Relay",
    text: "The enemy has learned to use terrain pressure against the Base Core."
  },
  {
    wave: 9,
    title: "Chapter III",
    subtitle: "Cryo Lock",
    text: "Control effects and timing become more important as the route freezes."
  },
  {
    wave: 13,
    title: "Chapter IV",
    subtitle: "Sentinel Ruins",
    text: "Ancient armor routines are now reinforcing enemy formations."
  },
  {
    wave: 17,
    title: "Chapter V",
    subtitle: "Thermal Breach",
    text: "PortalAncient armor routines are now reinforcing enemy formations."
  },
  {
    wave: 17,
    title: "Chapter V",
    subtitle: "Thermal heat is rising. Burst damage and ultimate timing are critical."
  },
  {
    wave: 21,
    title: "Chapter VI",
    subtitle: "Sinking Bio-Grid",
    text: "Heavy bodies are emerging from the mud. Sustain the defense line."
  },
  {
    wave: 25,
    title: "Final Chapter",
    subtitle: "Crystal Resonance",
    text: "The Base Core is close to full calibration. Survive the final resonance."
  }
];

let initialized = false;
let restartCallback = null;
let continueCallback = null;

let shownChapterWaves = new Set();
let victoryShown = false;

export function initCampaignProgress(options = {}) {
  if (initialized) return;

  initialized = true;

  restartCallback = options.onRestart || null;
  continueCallback = options.onContinue || null;

  injectCampaignProgressStyles();
  ensurePanel();

  shownChapterWaves.clear();
  victoryShown = false;
}

export function updateCampaignProgress() {
  if (!initialized) return;
  if (!state.started) return;

  updateChapterMilestones();
  updateVictoryCheck();
}

export function resetCampaignProgress() {
  shownChapterWaves.clear();
  victoryShown = false;

  const panel = document.querySelector("#" + CAMPAIGN_PANEL_ID);

  if (panel) {
    panel.className = "campaign-progress-panel hidden";
    panel.innerHTML = "";
  }
}

function updateChapterMilestones() {
  if (state.gameOver) return;

  const chapter = CHAPTERS.find(function (item) {
    return item.wave === state.wave;
  });

  if (!chapter) return;
  if (shownChapterWaves.has(chapter.wave)) return;

  shownChapterWaves.add(chapter.wave);

  showAnnouncement(chapter.title + ": " + chapter.subtitle);

  addEventLog(
    chapter.title +
      " unlocked: " +
      chapter.subtitle +
      ". " +
      chapter.text
  );
}

function updateVictoryCheck() {
  if (victoryShown) return;
  if (state.gameOver) return;
  if (state.waveActive) return;
  if (!state.waitingForNextWave) return;
  if (state.wave <= FINAL_WAVE) return;

  victoryShown = true;
  state.paused = true;
  state.campaignComplete = true;

  showAnnouncement("Campaign Complete");
  addEventLog("Campaign complete. Base Core calibration survived.");

  renderVictoryPanel();
}

function renderVictoryPanel() {
  const panel = ensurePanel();

  panel.className = "campaign-progress-panel victory-panel";

  panel.innerHTML =
    '<div class="victory-shell">' +
      '<div class="victory-kicker">Campaign Complete</div>' +
      '<div class="victory-title">Base Core Stabilized</div>' +
      '<div class="victory-subtitle">' +
        "The final resonance has been contained. The defense grid is operational." +
      "</div>" +

      '<div class="victory-grid">' +
        createVictoryStat("Final Wave", String(state.wave - 1)) +
        createVictoryStat("Score", String(state.score)) +
        createVictoryStat("Gold", String(state.gold)) +
        createVictoryStat("Base HP", state.baseHp + " / " + state.baseMaxHp) +
      "</div>" +

      '<div class="victory-message">' +
        "Commander Log: The invasion signal has fractured. Enemy pressure may continue in patrol mode, but the campaign objective is complete." +
      "</div>" +

      '<div class="victory-actions">' +
        '<button id="continueCampaignButton" type="button">Continue Patrol</button>' +
        '<button id="restartCampaignButton" type="button">Restart Campaign</button>' +
      "</div>" +
    "</div>";

  bindVictoryButtons(panel);
}

function createVictoryStat(label, value) {
  return (
    '<div class="victory-stat">' +
      "<span>" +
        escapeHtml(label) +
      "</span>" +
      "<b>" +
        escapeHtml(value) +
      "</b>" +
    "</div>"
  );
}

function bindVictoryButtons(panel) {
  const continueButton = panel.querySelector("#continueCampaignButton");
  const restartButton = panel.querySelector("#restartCampaignButton");

  if (continueButton) {
    continueButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      state.paused = false;

      const currentPanel = document.querySelector("#" + CAMPAIGN_PANEL_ID);

      if (currentPanel) {
        currentPanel.className = "campaign-progress-panel hidden";
      }

      if (continueCallback) {
        continueCallback();
      }

      addEventLog("Patrol mode continued after campaign completion.");
    });
  }

  if (restartButton) {
    restartButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      resetCampaignProgress();

      if (restartCallback) {
        restartCallback();
      }
    });
  }
}

function ensurePanel() {
  let panel = document.querySelector("#" + CAMPAIGN_PANEL_ID);

  if (panel) return panel;

  panel = document.createElement("section");
  panel.id = CAMPAIGN_PANEL_ID;
  panel.className = "campaign-progress-panel hidden";

  panel.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  document.body.appendChild(panel);

  return panel;
}

function injectCampaignProgressStyles() {
  const existing = document.querySelector("#" + CAMPAIGN_STYLE_ID);

  if (existing) {
    existing.remove();
  }

  const style = document.createElement("style");
  style.id = CAMPAIGN_STYLE_ID;

  style.textContent = `
    .campaign-progress-panel.hidden {
      display: none;
    }

    .campaign-progress-panel {
      position: fixed;
      z-index: 130;
      color: #dbeafe;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-sizing: border-box;
    }

    .campaign-progress-panel.victory-panel {
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
      background: rgba(0, 0, 0, 0.46);
      backdrop-filter: blur(5px);
      pointer-events: auto;
    }

    .victory-shell {
      width: min(720px, calc(100vw - 64px));
      padding: 28px;
      border-radius: 24px;
      border: 1px solid rgba(56, 189, 248, 0.68);
      background:
        linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(3, 10, 24, 0.96)),
        radial-gradient(circle at top left, rgba(34, 197, 94, 0.14), transparent 42%),
        radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.13), transparent 42%);
      box-shadow:
        0 28px 70px rgba(0, 0, 0, 0.55),
        0 0 32px rgba(56, 189, 248, 0.18);
      box-sizing: border-box;
    }

    .victory-kicker {
      color: #38bdf8;
      font-size: 12px;
      font-weight: 950;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .victory-title {
      color: #facc15;
      font-size: 42px;
      line-height: 1;
      font-weight: 950;
      text-shadow: 0 0 22px rgba(250, 204, 21, 0.18);
      margin-bottom: 8px;
    }

    .victory-subtitle {
      color: #dbeafe;
      font-size: 15px;
      line-height: 1.45;
      margin-bottom: 18px;
    }

    .victory-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .victory-stat {
      padding: 13px;
      border-radius: 15px;
      border: 1px solid rgba(56, 189, 248, 0.24);
      background: rgba(15, 23, 42, 0.64);
    }

    .victory-stat span {
      display: block;
      margin-bottom: 5px;
      color: #94a3b8;
      font-size: 10px;
      font-weight: 950;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .victory-stat b {
      color: #facc15;
      font-size: 15px;
      line-height: 1.2;
    }

    .victory-message {
      padding: 15px;
      border-radius: 15px;
      border: 1px solid rgba(34, 197, 94, 0.28);
      background: rgba(21, 128, 61, 0.12);
      color: #dbeafe;
      font-size: 13px;
      line-height: 1.45;
      margin-bottom: 18px;
    }

    .victory-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .victory-actions button {
      min-width: 150px;
      min-height: 38px;
      border-radius: 12px;
      border: 1px solid rgba(96, 165, 250, 0.62);
      background: rgba(15, 23, 42, 0.94);
      color: #dbeafe;
      font-size: 13px;
      font-weight: 950;
      cursor: pointer;
    }

    .victory-actions button:hover {
      border-color: rgba(250, 204, 21, 0.86);
      color: #facc15;
      box-shadow: 0 0 14px rgba(250, 204, 21, 0.14);
    }

    #continueCampaignButton {
      background: linear-gradient(180deg, #2563eb, #1d4ed8);
      color: #eff6ff;
    }

    @media (max-width: 900px) {
      .victory-grid {
        grid-template-columns: 1fr 1fr;
      }

      .victory-title {
        font-size: 32px;
      }

      .victory-actions {
        flex-direction: column;
      }

      .victory-actions button {
        width: 100%;
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