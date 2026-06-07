import { state } from "../game/state.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";
import { getAIStrategyName } from "../ai/aiDirector.js";
import { getCurrentStage, getCurrentStageEffect } from "../game/stages.js";

const STYLE_ID = "smartCoachStyle";
const TOAST_ID = "smartCoachToast";

const COACH_CHECK_INTERVAL = 180;
const COACH_TOAST_DURATION = 260;
const COACH_COOLDOWN = 520;

let initialized = false;
let checkTimer = 0;
let cooldownTimer = 0;
let toastTimer = 0;
let currentToast = null;

let lastAdviceKey = "";
let lastAdviceWave = 0;

export function initSmartCoach() {
  if (initialized) return;

  initialized = true;

  injectSmartCoachStyles();
  ensureToast();

  checkTimer = 90;
  cooldownTimer = 0;
  toastTimer = 0;
  currentToast = null;
  lastAdviceKey = "";
  lastAdviceWave = 0;
}

export function updateSmartCoach() {
  if (!initialized) return;

  updateToast();

  if (!state.started) return;
  if (state.paused) return;
  if (state.gameOver) return;

  if (cooldownTimer > 0) {
    cooldownTimer--;
  }

  checkTimer--;

  if (checkTimer > 0) return;

  checkTimer = COACH_CHECK_INTERVAL;

  if (cooldownTimer > 0) return;

  const advice = getBestAdvice();

  if (!advice) return;

  const sameAdviceSameWave =
    lastAdviceKey === advice.key && lastAdviceWave === state.wave;

  if (sameAdviceSameWave) return;

  lastAdviceKey = advice.key;
  lastAdviceWave = state.wave;
  cooldownTimer = COACH_COOLDOWN;

  showCoachToast(advice);

  if (advice.announcement) {
    showAnnouncement(advice.announcement);
  }

  addEventLog("Commander Coach: " + advice.logText);
}

export function resetSmartCoach() {
  checkTimer = 90;
  cooldownTimer = 0;
  toastTimer = 0;
  currentToast = null;
  lastAdviceKey = "";
  lastAdviceWave = 0;

  const toast = document.querySelector("#" + TOAST_ID);

  if (toast) {
    toast.classList.add("hidden");
    toast.innerHTML = "";
  }
}

function getBestAdvice() {
  const strategy = getAIStrategyName();
  const stage = getCurrentStage();
  const effect = getCurrentStageEffect();

  const towerCount = state.towers.length;
  const gold = state.gold;
  const baseHp = state.baseHp;
  const baseMaxHp = state.baseMaxHp || 10;

  const towerStats = getTowerStats();

  if (!state.waveActive && state.waitingForNextWave && towerCount === 0) {
    return {
      key: "no_towers_prepare",
      title: "Build Before Contact",
      subtitle: "Defense line is empty",
      body:
        "No towers are deployed. Place at least one Normal or Rapid tower before starting the next wave.",
      logText: "No towers deployed. Build a basic defense before the next wave.",
      tone: "danger",
      announcement: "Build towers before wave"
    };
  }

  if (!state.waveActive && state.waitingForNextWave && state.wave % 5 === 0) {
    return {
      key: "boss_prepare",
      title: "Boss Preparation",
      subtitle: "Heavy signature detected",
      body:
        "This is a boss wave. Upgrade your strongest tower and keep damage focused near the final lane.",
      logText: "Boss wave preparation recommended. Upgrade damage and hold final lane.",
      tone: "danger",
      announcement: "Boss preparation advised"
    };
  }

  if (baseHp <= Math.ceil(baseMaxHp * 0.35)) {
    return {
      key: "critical_base_hp",
      title: "Core Integrity Critical",
      subtitle: "Base Core is close to failure",
      body:
        "Base HP is low. Prioritize upgrades over risky new placements and strengthen the final path segment.",
      logText: "Base Core is critical. Reinforce final lane and upgrade key towers.",
      tone: "danger",
      announcement: "Core integrity critical"
    };
  }

  if (!state.waveActive && gold >= 120 && towerCount < 4) {
    return {
      key: "too_much_gold_low_towers",
      title: "Unspent Economy",
      subtitle: "Gold reserve is high",
      body:
        "You have enough gold to expand. Add more coverage before the enemy AI increases pressure.",
      logText: "High gold reserve detected. Expand tower coverage.",
      tone: "objective",
      announcement: null
    };
  }

  if (!state.waveActive && gold >= 85 && towerCount >= 3) {
    return {
      key: "upgrade_window",
      title: "Upgrade Window",
      subtitle: "Preparation phase opportunity",
      body:
        "You have enough gold for upgrades. Strengthening existing towers may be safer than adding new ones.",
      logText: "Upgrade window detected. Improve existing towers before next wave.",
      tone: "normal",
      announcement: null
    };
  }

  if (strategy === "Swarm Pressure" && towerStats.splash === 0 && towerCount >= 3) {
    return {
      key: "need_splash_swarm",
      title: "Swarm Counter Needed",
      subtitle: "AI favors enemy density",
      body:
        "The AI is applying swarm pressure. Add a Splash tower near a corner to stop enemy clusters.",
      logText: "Swarm pressure detected. Splash coverage recommended.",
      tone: "warning",
      announcement: null
    };
  }

  if (
    (strategy === "Fast Pressure" || effect?.id === "canyon_wind") &&
    towerStats.slow === 0 &&
    towerCount >= 3
  ) {
    return {
      key: "need_slow_fast",
      title: "Speed Control Missing",
      subtitle: "Fast enemies may leak through",
      body:
        "Fast units are likely. Add a Slow tower near a bend to buy more firing time.",
      logText: "Fast pressure detected. Slow tower recommended near path corners.",
      tone: "warning",
      announcement: null
    };
  }

  if (
    (strategy === "Heavy Push" ||
      strategy === "Tank Response" ||
      strategy === "Armored Response" ||
      effect?.id === "ancient_armor") &&
    towerStats.sniper === 0 &&
    towerCount >= 3
  ) {
    return {
      key: "need_sniper_heavy",
      title: "Precision Damage Missing",
      subtitle: "Durable enemies expected",
      body:
        "Enemy durability is rising. Add a Sniper tower or upgrade high-damage towers.",
      logText: "Heavy enemy pressure detected. Sniper support recommended.",
      tone: "warning",
      announcement: null
    };
  }

  if (state.waveActive && state.enemies.length >= 8 && towerStats.splash === 0) {
    return {
      key: "enemy_stack_no_splash",
      title: "Enemy Stack Forming",
      subtitle: "Area damage would help",
      body:
        "Enemies are stacking on the path. Splash damage can prevent the lane from flooding.",
      logText: "Enemy stack detected. Splash damage recommended.",
      tone: "danger",
      announcement: "Enemy stack detected"
    };
  }

  if (state.waveActive && state.enemies.length >= 5 && state.relocationTokens > 0) {
    return {
      key: "relocation_available",
      title: "Relocation Available",
      subtitle: "Tower movement can save the lane",
      body:
        "You still have relocation tokens. Move a strong tower closer to the active pressure point if enemies slip through.",
      logText: "Relocation token available. Consider repositioning a key tower.",
      tone: "normal",
      announcement: null
    };
  }

  if (!state.waveActive && state.waitingForNextWave && state.wave >= 6) {
    return {
      key: "midgame_balance",
      title: "Balanced Defense Check",
      subtitle: stage.name,
      body:
        "Before the next wave, check that you have damage, control, and at least one answer to enemy groups.",
      logText: "Midgame balance check: damage, control, and group coverage recommended.",
      tone: "normal",
      announcement: null
    };
  }

  return null;
}

function getTowerStats() {
  const stats = {
    normal: 0,
    rapid: 0,
    sniper: 0,
    slow: 0,
    splash: 0,
    unknown: 0
  };

  for (const tower of state.towers) {
    const type =
      tower?.userData?.type ||
      tower?.userData?.towerType ||
      tower?.userData?.kind ||
      "unknown";

    if (type in stats) {
      stats[type]++;
    } else {
      stats.unknown++;
    }
  }

  return stats;
}

function showCoachToast(advice) {
  const toast = ensureToast();

  currentToast = advice;
  toastTimer = COACH_TOAST_DURATION;

  toast.className = "smart-coach-toast tone-" + advice.tone;

  toast.innerHTML =
    '<div class="smart-coach-kicker">Commander Coach</div>' +
    '<div class="smart-coach-title">' +
    escapeHtml(advice.title) +
    "</div>" +
    '<div class="smart-coach-subtitle">' +
    escapeHtml(advice.subtitle) +
    "</div>" +
    '<div class="smart-coach-body">' +
    escapeHtml(advice.body) +
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
  toast.className = "smart-coach-toast hidden";

  document.body.appendChild(toast);

  return toast;
}

function injectSmartCoachStyles() {
  const existing = document.querySelector("#" + STYLE_ID);

  if (existing) {
    existing.remove();
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;

  style.textContent = `
    .smart-coach-toast {
      position: fixed;
      left: 250px;
      top: 360px;
      z-index: 43;
      width: 390px;
      padding: 13px 16px;
      border-radius: 16px;
      border: 1px solid rgba(56, 189, 248, 0.55);
      background:
        linear-gradient(135deg, rgba(5, 12, 26, 0.94), rgba(15, 23, 42, 0.86));
      box-shadow:
        0 14px 32px rgba(0, 0, 0, 0.34),
        0 0 20px rgba(56, 189, 248, 0.14);
      color: #dbeafe;
      pointer-events: none;
      opacity: 1;
      transform: translateY(0);
      transition:
        opacity 180ms ease,
        transform 180ms ease;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-sizing: border-box;
    }

    .smart-coach-toast.hidden {
      opacity: 0;
      transform: translateY(-8px);
    }

    .smart-coach-kicker {
      margin-bottom: 4px;
      color: #38bdf8;
      font-size: 10px;
      font-weight: 950;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .smart-coach-title {
      color: #facc15;
      font-size: 18px;
      line-height: 1.1;
      font-weight: 950;
      margin-bottom: 3px;
    }

    .smart-coach-subtitle {
      color: #7dd3fc;
      font-size: 12px;
      font-weight: 850;
      margin-bottom: 6px;
    }

    .smart-coach-body {
      color: #dbeafe;
      font-size: 12px;
      line-height: 1.35;
    }

    .smart-coach-toast.tone-success {
      border-color: rgba(34, 197, 94, 0.62);
    }

    .smart-coach-toast.tone-warning,
    .smart-coach-toast.tone-objective {
      border-color: rgba(250, 204, 21, 0.62);
    }

    .smart-coach-toast.tone-warning .smart-coach-kicker,
    .smart-coach-toast.tone-objective .smart-coach-kicker {
      color: #facc15;
    }

    .smart-coach-toast.tone-danger {
      border-color: rgba(248, 113, 113, 0.68);
      box-shadow:
        0 14px 32px rgba(0, 0, 0, 0.34),
        0 0 20px rgba(248, 113, 113, 0.14);
    }

    .smart-coach-toast.tone-danger .smart-coach-kicker {
      color: #f87171;
    }

    @media (max-width: 1250px) {
      .smart-coach-toast {
        left: 235px;
        top: 345px;
        width: 340px;
      }
    }

    @media (max-width: 1000px) {
      .smart-coach-toast {
        left: 214px;
        top: 328px;
        width: 310px;
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