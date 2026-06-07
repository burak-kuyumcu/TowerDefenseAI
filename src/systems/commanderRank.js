import { state } from "../game/state.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";

const STYLE_ID = "commanderRankStyle";
const TOAST_ID = "commanderRankToast";

const TOAST_DURATION = 300;

const RANKS = [
  {
    id: 0,
    score: 0,
    title: "Cadet",
    subtitle: "Initial field clearance",
    rewardText: "No bonus",
    applyReward: function () {}
  },
  {
    id: 1,
    score: 300,
    title: "Field Operator",
    subtitle: "Basic defense routines stabilized",
    rewardText: "+25 Gold",
    applyReward: function () {
      state.gold += 25;
    }
  },
  {
    id: 2,
    score: 800,
    title: "Grid Commander",
    subtitle: "Tower coordination improved",
    rewardText: "+1 Relocation Token",
    applyReward: function () {
      state.relocationTokens = Math.min(
        state.relocationMaxTokens,
        state.relocationTokens + 1
      );
    }
  },
  {
    id: 3,
    score: 1500,
    title: "Core Guardian",
    subtitle: "Base Core emergency authority unlocked",
    rewardText: "+1 Base HP",
    applyReward: function () {
      state.baseHp = Math.min(state.baseMaxHp, state.baseHp + 1);
    }
  },
  {
    id: 4,
    score: 2600,
    title: "Sector Captain",
    subtitle: "Advanced field logistics approved",
    rewardText: "+45 Gold",
    applyReward: function () {
      state.gold += 45;
    }
  },
  {
    id: 5,
    score: 4200,
    title: "Defense Architect",
    subtitle: "High-level grid command recognized",
    rewardText: "+1 Relocation Token, +25 Gold",
    applyReward: function () {
      state.gold += 25;
      state.relocationTokens = Math.min(
        state.relocationMaxTokens,
        state.relocationTokens + 1
      );
    }
  },
  {
    id: 6,
    score: 6500,
    title: "Resonance Marshal",
    subtitle: "Final campaign command authority granted",
    rewardText: "+1 Base HP, +50 Gold",
    applyReward: function () {
      state.gold += 50;
      state.baseHp = Math.min(state.baseMaxHp, state.baseHp + 1);
    }
  }
];

let initialized = false;
let currentRankId = 0;
let toastTimer = 0;
let currentToast = null;

export function initCommanderRank() {
  if (initialized) return;

  initialized = true;

  injectCommanderRankStyles();
  ensureToast();

  currentRankId = getRankForScore(state.score).id;
}

export function updateCommanderRank() {
  if (!initialized) return;

  updateToast();

  if (!state.started) return;
  if (state.gameOver) return;

  const newRank = getRankForScore(state.score);

  if (newRank.id <= currentRankId) return;

  currentRankId = newRank.id;

  newRank.applyReward();

  showRankToast(newRank);

  showAnnouncement("Rank Up: " + newRank.title);

  addEventLog(
    "Commander Rank Up: " +
      newRank.title +
      ". " +
      newRank.rewardText +
      " awarded."
  );
}

export function resetCommanderRank() {
  currentRankId = 0;
  toastTimer = 0;
  currentToast = null;

  const toast = document.querySelector("#" + TOAST_ID);

  if (toast) {
    toast.classList.add("hidden");
    toast.innerHTML = "";
  }
}

export function getCommanderRankText() {
  const rank = getRankForScore(state.score);
  const nextRank = getNextRank(rank.id);

  if (!nextRank) {
    return {
      title: rank.title,
      progress: "MAX",
      next: "Max Rank"
    };
  }

  const scoreIntoRank = Math.max(0, state.score - rank.score);
  const scoreNeeded = Math.max(1, nextRank.score - rank.score);
  const progress = Math.min(100, Math.floor((scoreIntoRank / scoreNeeded) * 100));

  return {
    title: rank.title,
    progress: progress + "%",
    next: nextRank.title
  };
}

function getRankForScore(score) {
  let selectedRank = RANKS[0];

  for (const rank of RANKS) {
    if (score >= rank.score) {
      selectedRank = rank;
    }
  }

  return selectedRank;
}

function getNextRank(rankId) {
  return RANKS.find(function (rank) {
    return rank.id === rankId + 1;
  });
}

function showRankToast(rank) {
  const toast = ensureToast();

  currentToast = rank;
  toastTimer = TOAST_DURATION;

  toast.className = "commander-rank-toast";

  toast.innerHTML =
    '<div class="commander-rank-kicker">Commander Promotion</div>' +
    '<div class="commander-rank-title">' +
      escapeHtml(rank.title) +
    "</div>" +
    '<div class="commander-rank-subtitle">' +
      escapeHtml(rank.subtitle) +
    "</div>" +
    '<div class="commander-rank-reward">' +
      escapeHtml(rank.rewardText) +
    "</div>";
}

function updateToast() {
  const toast = ensureToast();

  if (!currentToast) {
    toast.classList.add("hidden");
    return;
  }

  toastTimer--;

  if (toastTimer > 0) return;

  currentToast = null;
  toast.classList.add("hidden");
}

function ensureToast() {
  let toast = document.querySelector("#" + TOAST_ID);

  if (toast) return toast;

  toast = document.createElement("section");
  toast.id = TOAST_ID;
  toast.className = "commander-rank-toast hidden";

  document.body.appendChild(toast);

  return toast;
}

function injectCommanderRankStyles() {
  const existing = document.querySelector("#" + STYLE_ID);

  if (existing) {
    existing.remove();
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;

  style.textContent = `
    .commander-rank-toast {
      position: fixed;
      left: 50%;
      top: 132px;
      z-index: 132;
      transform: translateX(-50%);
      width: 440px;
      padding: 18px 20px;
      border-radius: 18px;
      border: 1px solid rgba(250, 204, 21, 0.72);
      background:
        linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(3, 10, 24, 0.93)),
        radial-gradient(circle at top left, rgba(250, 204, 21, 0.14), transparent 45%);
      box-shadow:
        0 18px 40px rgba(0, 0, 0, 0.38),
        0 0 26px rgba(250, 204, 21, 0.16);
      color: #dbeafe;
      pointer-events: none;
      opacity: 1;
      transition:
        opacity 180ms ease,
        transform 180ms ease;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-sizing: border-box;
    }

    .commander-rank-toast.hidden {
      opacity: 0;
      transform: translateX(-50%) translateY(-10px) scale(0.98);
    }

    .commander-rank-kicker {
      margin-bottom: 5px;
      color: #38bdf8;
      font-size: 11px;
      font-weight: 950;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .commander-rank-title {
      color: #facc15;
      font-size: 28px;
      line-height: 1;
      font-weight: 950;
      text-shadow: 0 0 18px rgba(250, 204, 21, 0.2);
      margin-bottom: 6px;
    }

    .commander-rank-subtitle {
      color: #dbeafe;
      font-size: 13px;
      line-height: 1.35;
      margin-bottom: 10px;
    }

    .commander-rank-reward {
      display: inline-block;
      padding: 7px 10px;
      border-radius: 10px;
      border: 1px solid rgba(34, 197, 94, 0.38);
      background: rgba(21, 128, 61, 0.14);
      color: #86efac;
      font-size: 12px;
      font-weight: 900;
    }

    @media (max-width: 900px) {
      .commander-rank-toast {
        width: calc(100vw - 32px);
        top: 112px;
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