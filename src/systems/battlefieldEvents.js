import { state } from "../game/state.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";
import { getCurrentStage } from "../game/stages.js";
import { getAIStrategyName } from "../ai/aiDirector.js";

const STYLE_ID = "battlefieldEventsStyle";
const TOAST_ID = "battlefieldEventToast";

const MIN_EVENT_INTERVAL = 760;
const MAX_EVENT_INTERVAL = 1280;
const TOAST_DURATION = 260;

let initialized = false;
let nextEventTimer = 0;
let toastTimer = 0;
let currentToast = null;
let lastTriggeredWave = 0;
let eventsThisWave = 0;

export function initBattlefieldEvents() {
  if (initialized) return;

  initialized = true;

  injectBattlefieldEventStyles();
  ensureToast();
  resetEventTimer();
}

export function updateBattlefieldEvents() {
  if (!initialized) return;

  updateToast();

  if (!state.started) return;
  if (state.paused) return;
  if (state.gameOver) return;

  if (!state.waveActive) {
    if (lastTriggeredWave !== state.wave) {
      lastTriggeredWave = state.wave;
      eventsThisWave = 0;
      resetEventTimer();
    }

    return;
  }

  if (lastTriggeredWave !== state.wave) {
    lastTriggeredWave = state.wave;
    eventsThisWave = 0;
    resetEventTimer();
  }

  if (eventsThisWave >= getMaxEventsForWave()) return;

  nextEventTimer--;

  if (nextEventTimer > 0) return;

  triggerBattlefieldEvent();

  eventsThisWave++;
  resetEventTimer();
}

export function resetBattlefieldEvents() {
  nextEventTimer = 0;
  toastTimer = 0;
  currentToast = null;
  lastTriggeredWave = 0;
  eventsThisWave = 0;

  const toast = document.querySelector("#" + TOAST_ID);

  if (toast) {
    toast.classList.add("hidden");
    toast.innerHTML = "";
  }

  resetEventTimer();
}

function triggerBattlefieldEvent() {
  const event = pickEvent();

  if (!event) return;

  event.apply();

  addEventLog("Battlefield Event: " + event.title + ". " + event.logText);

  showBattlefieldToast({
    title: event.title,
    subtitle: event.subtitle,
    body: event.body,
    tone: event.tone
  });

  if (event.announcement) {
    showAnnouncement(event.announcement);
  }
}

function pickEvent() {
  const stage = getCurrentStage();
  const strategy = getAIStrategyName();

  const lowCore = state.baseHp <= Math.ceil(state.baseMaxHp * 0.4);
  const lowGold = state.gold < 35;
  const noRelocations = state.relocationTokens <= 0;

  const pool = [
    {
      weight: lowGold ? 4 : 2,
      create: function () {
        const amount = lowGold ? 24 : 14;

        return {
          title: "Supply Drop",
          subtitle: "Field logistics recovered",
          body:
            "A small supply drone reached " +
            stage.name +
            ". +" +
            amount +
            " gold added.",
          logText: "Supply drone delivered +" + amount + " gold.",
          tone: "success",
          announcement: "Supply Drop +" + amount + "G",
          apply: function () {
            state.gold += amount;
          }
        };
      }
    },

    {
      weight: lowCore ? 5 : 1,
      create: function () {
        return {
          title: "Core Shield Pulse",
          subtitle: "Emergency shield restored",
          body:
            "Base Core stabilizers fired a short shield pulse. Base HP recovered by 1.",
          logText: "Base Core recovered +1 HP.",
          tone: "success",
          announcement: "Core Shield Pulse",
          apply: function () {
            state.baseHp = Math.min(state.baseMaxHp, state.baseHp + 1);
          }
        };
      }
    },

    {
      weight: noRelocations ? 4 : 2,
      create: function () {
        return {
          title: "Relocation Cache",
          subtitle: "Mobile tower route opened",
          body:
            "A tactical corridor opened for tower movement. Relocation token recovered.",
          logText: "Relocation token recovered.",
          tone: "objective",
          announcement: "Relocation Token +1",
          apply: function () {
            state.relocationTokens = Math.min(
              state.relocationMaxTokens,
              state.relocationTokens + 1
            );
          }
        };
      }
    },

    {
      weight:
        strategy === "Fast Pressure" || strategy === "Swarm Pressure" ? 3 : 2,
      create: function () {
        return {
          title: "Signal Jam",
          subtitle: "Enemy coordination disrupted",
          body:
            "The command relay jammed hostile routing signals. Enemy AI memory confidence reduced.",
          logText: "Enemy AI memory confidence reduced.",
          tone: "warning",
          announcement: "Enemy Signal Jammed",
          apply: function () {
            if (state.aiMemory) {
              state.aiMemory.successScore -= 1;
            }
          }
        };
      }
    },

    {
      weight: 3,
      create: function () {
        return {
          title: "Commander Warning",
          subtitle: "Live tactical recommendation",
          body: getCommanderWarningText(strategy, stage.name),
          logText: "Commander issued a tactical warning.",
          tone: "normal",
          announcement: null,
          apply: function () {}
        };
      }
    }
  ];

  return weightedPick(pool).create();
}

function getCommanderWarningText(strategy, stageName) {
  if (strategy === "Heavy Push" || strategy === "Tank Response") {
    return (
      "Heavy signatures crossing " +
      stageName +
      ". Focus strongest targets before they reach the final lane."
    );
  }

  if (strategy === "Fast Pressure") {
    return (
      "Fast units are exploiting path openings in " +
      stageName +
      ". Slow coverage near corners is recommended."
    );
  }

  if (strategy === "Swarm Pressure") {
    return (
      "Swarm density rising in " +
      stageName +
      ". Splash towers can prevent the route from flooding."
    );
  }

  if (strategy === "Armored Response") {
    return (
      "Armor readings are increasing. Sniper support should be upgraded before the next cluster."
    );
  }

  return (
    "Battlefield conditions are shifting. Keep damage, control, and economy balanced."
  );
}

function weightedPick(items) {
  const totalWeight = items.reduce(function (sum, item) {
    return sum + item.weight;
  }, 0);

  let roll = Math.random() * totalWeight;

  for (const item of items) {
    roll -= item.weight;

    if (roll <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

function getMaxEventsForWave() {
  if (state.wave % 5 === 0) return 2;
  if (state.wave >= 12) return 2;

  return 1;
}

function resetEventTimer() {
  const randomDelay = Math.floor(
    Math.random() * (MAX_EVENT_INTERVAL - MIN_EVENT_INTERVAL)
  );

  nextEventTimer = MIN_EVENT_INTERVAL + randomDelay;
}

function showBattlefieldToast(data) {
  const toast = ensureToast();

  currentToast = data;
  toastTimer = TOAST_DURATION;

  toast.className = "battlefield-event-toast tone-" + data.tone;

  toast.innerHTML =
    '<div class="battlefield-event-kicker">Battlefield Event</div>' +
    '<div class="battlefield-event-title">' +
    escapeHtml(data.title) +
    "</div>" +
    '<div class="battlefield-event-subtitle">' +
    escapeHtml(data.subtitle) +
    "</div>" +
    '<div class="battlefield-event-body">' +
    escapeHtml(data.body) +
    "</div>";
}

function updateToast() {
  const toast = ensureToast();

  if (!currentToast) {
    toast.classList.add("hidden");
    return;
  }

  toastTimer--;

  if (toastTimer <= 0) {
    currentToast = null;
    toast.classList.add("hidden");
  }
}

function ensureToast() {
  let toast = document.querySelector("#" + TOAST_ID);

  if (toast) return toast;

  toast = document.createElement("section");
  toast.id = TOAST_ID;
  toast.className = "battlefield-event-toast hidden";

  document.body.appendChild(toast);

  return toast;
}

function injectBattlefieldEventStyles() {
  const existing = document.querySelector("#" + STYLE_ID);

  if (existing) {
    existing.remove();
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;

  style.textContent = `
    .battlefield-event-toast {
      position: fixed;
      left: 250px;
      top: 238px;
      z-index: 42;
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

    .battlefield-event-toast.hidden {
      opacity: 0;
      transform: translateY(-8px);
    }

    .battlefield-event-kicker {
      margin-bottom: 4px;
      color: #38bdf8;
      font-size: 10px;
      font-weight: 950;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .battlefield-event-title {
      color: #facc15;
      font-size: 18px;
      line-height: 1.1;
      font-weight: 950;
      margin-bottom: 3px;
    }

    .battlefield-event-subtitle {
      color: #7dd3fc;
      font-size: 12px;
      font-weight: 850;
      margin-bottom: 6px;
    }

    .battlefield-event-body {
      color: #dbeafe;
      font-size: 12px;
      line-height: 1.35;
    }

    .battlefield-event-toast.tone-success {
      border-color: rgba(34, 197, 94, 0.62);
      box-shadow:
        0 14px 32px rgba(0, 0, 0, 0.34),
        0 0 20px rgba(34, 197, 94, 0.14);
    }

    .battlefield-event-toast.tone-success .battlefield-event-kicker {
      color: #22c55e;
    }

    .battlefield-event-toast.tone-warning,
    .battlefield-event-toast.tone-objective {
      border-color: rgba(250, 204, 21, 0.62);
      box-shadow:
        0 14px 32px rgba(0, 0, 0, 0.34),
        0 0 20px rgba(250, 204, 21, 0.13);
    }

    .battlefield-event-toast.tone-warning .battlefield-event-kicker,
    .battlefield-event-toast.tone-objective .battlefield-event-kicker {
      color: #facc15;
    }

    @media (max-width: 1250px) {
      .battlefield-event-toast {
        left: 235px;
        top: 230px;
        width: 340px;
      }
    }

    @media (max-width: 1000px) {
      .battlefield-event-toast {
        left: 214px;
        top: 220px;
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