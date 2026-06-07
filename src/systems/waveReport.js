import { state } from "../game/state.js";
import { addEventLog } from "../ui/eventLog.js";

const PANEL_ID = "waveReportPanel";
const STYLE_ID = "waveReportStyle";

const REPORT_VISIBLE_FRAMES = 360;

let initialized = false;
let lastWaveActive = false;
let reportTimer = 0;
let currentReport = null;

let waveStart = {
  wave: 1,
  score: 0,
  gold: 0,
  baseHp: 0,
  towerCount: 0,
  relocationTokens: 0,
  combo: 0
};

let maxComboDuringWave = 0;

export function initWaveReport() {
  if (initialized) return;

  initialized = true;

  injectWaveReportStyles();
  ensurePanel();
  renderIdleReport();
}

export function updateWaveReport() {
  if (!initialized) return;

  if (!state.started) {
    lastWaveActive = false;
    currentReport = null;
    reportTimer = 0;
    renderIdleReport();
    return;
  }

  if (state.waveActive && !lastWaveActive) {
    captureWaveStart();
  }

  if (state.waveActive) {
    maxComboDuringWave = Math.max(maxComboDuringWave, state.combo || 0);
  }

  if (lastWaveActive && !state.waveActive) {
    createWaveReport();
  }

  if (reportTimer > 0) {
    reportTimer--;

    if (currentReport) {
      renderReport();
    }

    lastWaveActive = state.waveActive;
    return;
  }

  if (!state.waveActive && currentReport) {
    hidePanel();
  }

  lastWaveActive = state.waveActive;
}

export function resetWaveReport() {
  lastWaveActive = false;
  reportTimer = 0;
  currentReport = null;
  maxComboDuringWave = 0;

  const panel = document.querySelector("#" + PANEL_ID);

  if (panel) {
    panel.className = "wave-report-panel hidden";
    panel.innerHTML = "";
  }
}

function captureWaveStart() {
  waveStart = {
    wave: state.wave,
    score: state.score,
    gold: state.gold,
    baseHp: state.baseHp,
    towerCount: state.towers.length,
    relocationTokens: state.relocationTokens,
    combo: state.combo || 0
  };

  maxComboDuringWave = state.combo || 0;
  currentReport = null;
  reportTimer = 0;
}

function createWaveReport() {
  const scoreGained = Math.max(0, state.score - waveStart.score);
  const goldChange = state.gold - waveStart.gold;
  const baseDamage = Math.max(0, waveStart.baseHp - state.baseHp);
  const towersUsed = state.towers.length;
  const relocationsSpent = Math.max(
    0,
    waveStart.relocationTokens - state.relocationTokens
  );

  const grade = calculateGrade({
    scoreGained,
    goldChange,
    baseDamage,
    towersUsed,
    relocationsSpent,
    maxCombo: maxComboDuringWave
  });

  currentReport = {
    wave: waveStart.wave,
    scoreGained,
    goldChange,
    baseDamage,
    towersUsed,
    relocationsSpent,
    maxCombo: maxComboDuringWave,
    grade,
    message: getGradeMessage(grade)
  };

  reportTimer = REPORT_VISIBLE_FRAMES;

  addEventLog(
    "Wave Report: Wave " +
      currentReport.wave +
      " | Grade " +
      currentReport.grade +
      " | Score +" +
      currentReport.scoreGained +
      " | Base Damage " +
      currentReport.baseDamage +
      "."
  );

  renderReport();
}

function calculateGrade(report) {
  let points = 0;

  if (report.baseDamage === 0) points += 40;
  else if (report.baseDamage <= 1) points += 25;
  else if (report.baseDamage <= 2) points += 12;

  if (report.scoreGained >= 350) points += 25;
  else if (report.scoreGained >= 200) points += 18;
  else if (report.scoreGained >= 100) points += 10;

  if (report.maxCombo >= 5) points += 15;
  else if (report.maxCombo >= 3) points += 10;
  else if (report.maxCombo >= 1) points += 5;

  if (report.towersUsed <= 6) points += 10;
  else if (report.towersUsed <= 9) points += 6;

  if (report.relocationsSpent <= 1) points += 10;
  else if (report.relocationsSpent <= 2) points += 5;

  if (points >= 92) return "S";
  if (points >= 78) return "A";
  if (points >= 62) return "B";
  if (points >= 45) return "C";

  return "D";
}

function getGradeMessage(grade) {
  if (grade === "S") {
    return "Perfect sector control. The Base Core barely felt the pressure.";
  }

  if (grade === "A") {
    return "Strong command performance. Your defense line held cleanly.";
  }

  if (grade === "B") {
    return "Solid defense. A few weak points remain in the formation.";
  }

  if (grade === "C") {
    return "Sector survived, but the enemy found pressure windows.";
  }

  return "Emergency survival. Rebuild the defense plan before the next wave.";
}

function renderIdleReport() {
  const panel = ensurePanel();

  panel.className = "wave-report-panel hidden";
  panel.innerHTML = "";
}

function renderReport() {
  if (!currentReport) return;

  const panel = ensurePanel();

  panel.className = "wave-report-panel grade-" + currentReport.grade;

  panel.innerHTML =
    '<div class="wave-report-header">' +
      '<span class="wave-report-kicker">Wave Debrief</span>' +
      '<b class="wave-report-grade">Grade ' +
        escapeHtml(currentReport.grade) +
      "</b>" +
    "</div>" +

    '<div class="wave-report-title">' +
      "Wave " +
      escapeHtml(currentReport.wave) +
      " Report" +
    "</div>" +

    '<div class="wave-report-message">' +
      escapeHtml(currentReport.message) +
    "</div>" +

    '<div class="wave-report-grid">' +
      createStat("Score", "+" + currentReport.scoreGained) +
      createStat("Gold", formatSigned(currentReport.goldChange)) +
      createStat("Base Damage", String(currentReport.baseDamage)) +
      createStat("Max Combo", String(currentReport.maxCombo)) +
      createStat("Towers", String(currentReport.towersUsed)) +
      createStat("Relocations", String(currentReport.relocationsSpent)) +
    "</div>";
}

function createStat(label, value) {
  return (
    '<div class="wave-report-stat">' +
      '<span class="wave-report-stat-label">' +
        escapeHtml(label) +
      "</span>" +
      '<b class="wave-report-stat-value">' +
        escapeHtml(value) +
      "</b>" +
    "</div>"
  );
}

function formatSigned(value) {
  if (value > 0) return "+" + value;
  return String(value);
}

function hidePanel() {
  const panel = document.querySelector("#" + PANEL_ID);

  if (!panel) return;

  panel.classList.add("hidden");
}

function ensurePanel() {
  let panel = document.querySelector("#" + PANEL_ID);

  if (panel) return panel;

  panel = document.createElement("section");
  panel.id = PANEL_ID;
  panel.className = "wave-report-panel hidden";

  document.body.appendChild(panel);

  return panel;
}

function injectWaveReportStyles() {
  const existing = document.querySelector("#" + STYLE_ID);

  if (existing) {
    existing.remove();
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;

  style.textContent = `
    #waveReportPanel.wave-report-panel {
      position: fixed !important;
      left: 50% !important;
      top: 112px !important;
      z-index: 124 !important;
      transform: translateX(-50%) !important;
      width: 460px !important;
      min-height: 0 !important;
      padding: 16px 18px !important;
      border-radius: 18px !important;
      border: 1px solid rgba(56, 189, 248, 0.68) !important;
      background:
        linear-gradient(135deg, rgba(5, 12, 26, 0.96), rgba(15, 23, 42, 0.90)),
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 44%) !important;
      box-shadow:
        0 18px 40px rgba(0, 0, 0, 0.38),
        0 0 22px rgba(56, 189, 248, 0.15) !important;
      color: #dbeafe !important;
      pointer-events: none !important;
      opacity: 1 !important;
      visibility: visible !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      box-sizing: border-box !important;
    }

    #waveReportPanel.wave-report-panel.hidden {
      opacity: 0 !important;
      visibility: hidden !important;
      transform: translateX(-50%) translateY(-8px) scale(0.98) !important;
    }

    #waveReportPanel .wave-report-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 14px !important;
      margin-bottom: 8px !important;
    }

    #waveReportPanel .wave-report-kicker {
      display: block !important;
      color: #38bdf8 !important;
      font-size: 11px !important;
      line-height: 1.1 !important;
      font-weight: 950 !important;
      letter-spacing: 0.14em !important;
      text-transform: uppercase !important;
    }

    #waveReportPanel .wave-report-grade {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 78px !important;
      min-height: 26px !important;
      padding: 0 10px !important;
      border-radius: 999px !important;
      border: 1px solid rgba(250, 204, 21, 0.6) !important;
      background: rgba(250, 204, 21, 0.12) !important;
      color: #facc15 !important;
      font-size: 12px !important;
      line-height: 1 !important;
      font-weight: 950 !important;
      white-space: nowrap !important;
    }

    #waveReportPanel .wave-report-title {
      display: block !important;
      margin: 0 0 7px !important;
      color: #facc15 !important;
      font-size: 24px !important;
      line-height: 1.05 !important;
      font-weight: 950 !important;
      text-shadow: 0 0 18px rgba(250, 204, 21, 0.16) !important;
    }

    #waveReportPanel .wave-report-message {
      display: block !important;
      margin: 0 0 13px !important;
      color: #dbeafe !important;
      font-size: 12px !important;
      line-height: 1.45 !important;
      font-weight: 650 !important;
    }

    #waveReportPanel .wave-report-grid {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 9px !important;
    }

    #waveReportPanel .wave-report-stat {
      display: block !important;
      min-height: 58px !important;
      padding: 10px !important;
      border-radius: 12px !important;
      border: 1px solid rgba(56, 189, 248, 0.24) !important;
      background: rgba(15, 23, 42, 0.70) !important;
      box-sizing: border-box !important;
    }

    #waveReportPanel .wave-report-stat-label {
      display: block !important;
      margin-bottom: 5px !important;
      color: #94a3b8 !important;
      font-size: 9px !important;
      line-height: 1 !important;
      font-weight: 950 !important;
      letter-spacing: 0.08em !important;
      text-transform: uppercase !important;
    }

    #waveReportPanel .wave-report-stat-value {
      display: block !important;
      color: #e0f2fe !important;
      font-size: 14px !important;
      line-height: 1.15 !important;
      font-weight: 950 !important;
    }

    #waveReportPanel.grade-S {
      border-color: rgba(250, 204, 21, 0.78) !important;
      box-shadow:
        0 18px 40px rgba(0, 0, 0, 0.38),
        0 0 28px rgba(250, 204, 21, 0.18) !important;
    }

    #waveReportPanel.grade-A {
      border-color: rgba(34, 197, 94, 0.72) !important;
    }

    #waveReportPanel.grade-C,
    #waveReportPanel.grade-D {
      border-color: rgba(248, 113, 113, 0.70) !important;
    }

    @media (max-width: 900px) {
      #waveReportPanel.wave-report-panel {
        width: calc(100vw - 32px) !important;
        top: 104px !important;
      }

      #waveReportPanel .wave-report-grid {
        grid-template-columns: 1fr 1fr !important;
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