import { state } from "../game/state.js";

import {
  getCurrentStage,
  getCurrentStageEffect
} from "../game/stages.js";

import { getAIStrategyName } from "../ai/aiDirector.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";

const STORY_PANEL_ID = "storyPanel";
const STORY_COMMS_ID = "storyCommsPanel";
const STORY_OBJECTIVE_ID = "storyObjectiveStrip";
const STORY_STYLE_ID = "storyDirectorStyle";

const STORY_PANEL_DURATION = 420;
const COMMS_DURATION = 240;
const BASE_WARNING_COOLDOWN_FRAMES = 180;

let initialized = false;
let lastStageVersion = -1;
let storyPanelTimer = 0;

let lastBaseHp = null;
let baseWarningCooldown = 0;
let lastBossWarningWave = -1;

let commsQueue = [];
let currentComms = null;
let commsTimer = 0;

const STORY_DATA = {
  forest_balance: {
    code: "SECTOR-01",
    title: "Forest Route",
    subtitle: "Outer Grove Defense Line",
    commander: "Command",
    threat: "Low",
    objective: "Hold the forest road and protect the Base Core calibration route.",
    intro:
      "The outer forest grid is stable, but portal residue is spreading through the roots. This is our baseline sector.",
    wave:
      "Enemy movement detected on the forest road. Keep the defense balanced and watch for route changes.",
    cleared:
      "Forest route stabilized. Core signal recovered from the outer grove.",
    advice:
      "Balanced towers are enough here. Use this sector to prepare economy and upgrades."
  },

  canyon_wind: {
    code: "SECTOR-02",
    title: "Canyon Wind",
    subtitle: "Crosswind Relay Pass",
    commander: "Command",
    threat: "Medium",
    objective: "Survive fast enemy pressure through the canyon relay.",
    intro:
      "The canyon funnels portal energy like a turbine. Enemy units move faster between the wind-cut walls.",
    wave:
      "Crosswind pressure rising. Fast units may slip past weak corners.",
    cleared:
      "Canyon relay secured. Wind distortion reduced to tactical levels.",
    advice:
      "Rapid and Sniper towers are valuable. Cover long lanes and corners."
  },

  frozen_chill: {
    code: "SECTOR-03",
    title: "Frozen Chill",
    subtitle: "Cryo-Locked Defense Grid",
    commander: "Command",
    threat: "Medium",
    objective: "Use the cold terrain to control enemy movement.",
    intro:
      "A cryo field has locked this sector in place. Slow effects are stronger, but visibility is unstable.",
    wave:
      "Cryo mist is interfering with enemy movement. Control towers can dominate this route.",
    cleared:
      "Frozen field stabilized. Slow-control grid is back under our command.",
    advice:
      "Slow and Sniper towers work well. Do not let enemies stack near the Base Core."
  },

  ancient_armor: {
    code: "SECTOR-04",
    title: "Ancient Armor",
    subtitle: "Ruined Sentinel Corridor",
    commander: "Archive AI",
    threat: "High",
    objective: "Break through armored enemy pressure near ancient defense ruins.",
    intro:
      "Old sentinel ruins still broadcast armor routines. The invasion is using them to reinforce enemy shells.",
    wave:
      "Armor signatures climbing. Expect durable units and longer engagements.",
    cleared:
      "Ancient armor signal disrupted. Ruin systems are silent for now.",
    advice:
      "Sniper and Splash towers matter here. Upgrade damage before the wave thickens."
  },

  lava_pressure: {
    code: "SECTOR-05",
    title: "Lava Pressure",
    subtitle: "Thermal Breach Zone",
    commander: "Command",
    threat: "Critical",
    objective: "Hold the thermal breach before portal aggression overloads.",
    intro:
      "The ground is venting heat from a portal breach. Enemy spawn pressure and speed may increase.",
    wave:
      "Thermal pressure rising. Burst damage is recommended before enemies reach the lower lane.",
    cleared:
      "Thermal breach contained. Lava pressure dropped below critical threshold.",
    advice:
      "Splash and Sniper towers are safer. Save ultimates for dense groups or bosses."
  },

  swamp_mud: {
    code: "SECTOR-06",
    title: "Swamp Mud",
    subtitle: "Sinking Bio-Grid",
    commander: "Field Scout",
    threat: "High",
    objective: "Control tankier enemies moving through the corrupted mud field.",
    intro:
      "The swamp slows movement, but enemy armor is adapting to the terrain. Expect heavier bodies.",
    wave:
      "Mud pressure confirmed. Enemies are slower, but they will take more punishment.",
    cleared:
      "Swamp bio-grid stabilized. Mud corruption is retreating from the route.",
    advice:
      "Splash and Slow towers help. Do not rely only on single-target damage."
  },

  crystal_resonance: {
    code: "SECTOR-07",
    title: "Crystal Resonance",
    subtitle: "Resonant Core Approach",
    commander: "Core System",
    threat: "Critical",
    objective: "Survive resonance amplification near the final approach.",
    intro:
      "Crystal structures are amplifying both tower output and enemy durability. Every placement matters.",
    wave:
      "Resonance spike detected. This sector rewards strong tower positioning and quick upgrades.",
    cleared:
      "Crystal resonance dampened. Base Core frequency restored.",
    advice:
      "Sniper and Rapid towers scale well here. Upgrade before enemy health overwhelms you."
  }
};

export function initStoryDirector() {
  if (initialized) return;

  initialized = true;

  injectStoryStyles();
  ensureStoryPanel();
  ensureCommsPanel();
  ensureObjectiveStrip();

  lastStageVersion = state.stageVersion;
  lastBaseHp = state.baseHp;
  baseWarningCooldown = 0;
  lastBossWarningWave = -1;

  showCurrentSectorIntro({
    silentLog: true
  });

  updateObjectiveStrip();

  queueCommsMessage({
    speaker: "Command",
    text: "Defense link established. Awaiting first wave authorization.",
    tone: "normal"
  });
}

export function updateStoryDirector() {
  if (!initialized) return;

  if (state.stageVersion !== lastStageVersion) {
    lastStageVersion = state.stageVersion;

    showCurrentSectorIntro({
      silentLog: false
    });
  }

  if (storyPanelTimer > 0) {
    storyPanelTimer--;

    if (storyPanelTimer <= 0) {
      hideStoryPanel();
    }
  }

  updateCommsPanel();
  updateObjectiveStrip();
  updateBaseCoreStory();
  updateBossWaveStory();
}

export function announceWaveStory() {
  const story = getCurrentStory();
  const strategy = getAIStrategyName();

  addEventLog(story.commander + ": " + story.wave);
  addEventLog("AI Pattern: " + strategy + ". " + story.advice);

  queueCommsMessage({
    speaker: story.commander,
    text: story.wave,
    tone: "warning"
  });

  queueCommsMessage({
    speaker: "Tactical AI",
    text: "Pattern locked: " + strategy + ". " + story.advice,
    tone: "normal"
  });
}

export function announceSectorCleared() {
  const story = getCurrentStory();

  addEventLog(story.commander + ": " + story.cleared);

  queueCommsMessage({
    speaker: story.commander,
    text: story.cleared,
    tone: "success"
  });
}

export function announceAITrickStory(type, detail = "") {
  const story = getCurrentStory();

  if (type === "bluff") {
    const text =
      "Enemy signal is lying. The displayed strategy is not the real attack pattern.";

    addEventLog(story.commander + ": " + text);
    showAnnouncement("AI signal deception detected");

    queueCommsMessage({
      speaker: story.commander,
      text,
      tone: "danger"
    });

    return;
  }

  if (type === "feint") {
    const text =
      "Route instability confirmed. Enemy path changed before contact.";

    addEventLog(story.commander + ": " + text);
    showAnnouncement("Route feint detected");

    queueCommsMessage({
      speaker: story.commander,
      text,
      tone: "danger"
    });

    return;
  }

  if (detail) {
    addEventLog(story.commander + ": " + detail);

    queueCommsMessage({
      speaker: story.commander,
      text: detail,
      tone: "normal"
    });
  }
}

export function showCurrentSectorIntro(options = {}) {
  const story = getCurrentStory();
  const effect = getCurrentStageEffect();
  const stage = getCurrentStage();

  const effectLabel = effect && effect.label ? effect.label : "Balanced Terrain";

  const panel = ensureStoryPanel();

  panel.innerHTML =
    '<div class="story-panel-topline">' +
    "<span>" +
    story.code +
    "</span>" +
    "<b>" +
    story.threat +
    "</b>" +
    "</div>" +
    '<div class="story-panel-title">' +
    story.title +
    "</div>" +
    '<div class="story-panel-subtitle">' +
    story.subtitle +
    "</div>" +
    '<div class="story-panel-body">' +
    story.intro +
    "</div>" +
    '<div class="story-panel-grid">' +
    "<div>" +
    "<span>Stage</span>" +
    "<b>" +
    stage.name +
    "</b>" +
    "</div>" +
    "<div>" +
    "<span>Modifier</span>" +
    "<b>" +
    effectLabel +
    "</b>" +
    "</div>" +
    "</div>" +
    '<div class="story-panel-objective">' +
    "<span>Objective</span>" +
    "<b>" +
    story.objective +
    "</b>" +
    "</div>";

  panel.classList.remove("hidden");
  storyPanelTimer = STORY_PANEL_DURATION;

  updateObjectiveStrip();

  if (!options.silentLog) {
    addEventLog(
      story.commander +
        ": Entering " +
        story.title +
        ". " +
        story.objective
    );
  }

  queueCommsMessage({
    speaker: story.commander,
    text: "Entering " + story.title + ". " + story.intro,
    tone: getToneForThreat(story.threat)
  });

  queueCommsMessage({
    speaker: "Mission",
    text: story.objective,
    tone: "objective"
  });
}

export function getCurrentStoryText() {
  const story = getCurrentStory();

  return {
    code: story.code,
    title: story.title,
    subtitle: story.subtitle,
    threat: story.threat,
    objective: story.objective,
    intro: story.intro,
    advice: story.advice
  };
}

function updateBaseCoreStory() {
  if (!state.started) return;
  if (state.gameOver) return;

  if (lastBaseHp === null) {
    lastBaseHp = state.baseHp;
    return;
  }

  if (baseWarningCooldown > 0) {
    baseWarningCooldown--;
  }

  const tookDamage = state.baseHp < lastBaseHp;

  if (!tookDamage) {
    lastBaseHp = state.baseHp;
    return;
  }

  const damage = lastBaseHp - state.baseHp;
  const story = getCurrentStory();

  if (baseWarningCooldown <= 0) {
    addEventLog(
      story.commander +
        ": Base Core breach detected. Integrity -" +
        damage +
        "."
    );

    if (state.baseHp <= 3) {
      showAnnouncement("BASE CORE CRITICAL");

      addEventLog(
        "Core System: Emergency threshold reached. Upgrade or reposition immediately."
      );

      queueCommsMessage({
        speaker: "Core System",
        text: "Emergency threshold reached. Upgrade or reposition immediately.",
        tone: "danger"
      });
    } else {
      showAnnouncement("Base Core damaged");

      queueCommsMessage({
        speaker: story.commander,
        text: "Base Core breach detected. Integrity -" + damage + ".",
        tone: "danger"
      });
    }

    baseWarningCooldown = BASE_WARNING_COOLDOWN_FRAMES;
  }

  lastBaseHp = state.baseHp;
}

function updateBossWaveStory() {
  if (!state.started) return;
  if (state.gameOver) return;
  if (state.waveActive) return;
  if (!state.waitingForNextWave) return;
  if (state.wave % 5 !== 0) return;
  if (lastBossWarningWave === state.wave) return;

  const story = getCurrentStory();

  lastBossWarningWave = state.wave;

  addEventLog(
    story.commander +
      ": Boss-class portal signature detected near " +
      story.title +
      "."
  );

  addEventLog(
    "Core System: Save tower ultimates and reinforce the final lane."
  );

  showAnnouncement("Boss signature detected");

  queueCommsMessage({
    speaker: story.commander,
    text:
      "Boss-class portal signature detected near " +
      story.title +
      ". Save ultimates.",
    tone: "danger"
  });
}

function updateObjectiveStrip() {
  const strip = ensureObjectiveStrip();
  const story = getCurrentStory();
  const effect = getCurrentStageEffect();
  const stage = getCurrentStage();

  const effectLabel = effect && effect.label ? effect.label : "Balanced Terrain";

  strip.innerHTML =
    '<div class="story-objective-left">' +
    "<b>" +
    story.code +
    "</b>" +
    "<span>" +
    stage.name +
    "</span>" +
    "</div>" +
    '<div class="story-objective-main">' +
    story.objective +
    "</div>" +
    '<div class="story-objective-right">' +
    "<span>" +
    effectLabel +
    "</span>" +
    "<b>" +
    story.threat +
    "</b>" +
    "</div>";
}

function queueCommsMessage(message) {
  if (!message) return;
  if (!message.text) return;

  commsQueue.push({
    speaker: message.speaker || "Command",
    text: message.text,
    tone: message.tone || "normal",
    duration: message.duration || COMMS_DURATION
  });

  if (commsQueue.length > 4) {
    commsQueue.shift();
  }
}

function updateCommsPanel() {
  const panel = ensureCommsPanel();

  if (currentComms) {
    commsTimer--;

    if (commsTimer <= 0) {
      panel.classList.add("hidden");
      currentComms = null;
    }

    return;
  }

  if (commsQueue.length === 0) return;

  currentComms = commsQueue.shift();
  commsTimer = currentComms.duration;

  panel.className = "story-comms-panel tone-" + currentComms.tone;

  panel.innerHTML =
    '<div class="story-comms-speaker">' +
    currentComms.speaker +
    "</div>" +
    '<div class="story-comms-text">' +
    currentComms.text +
    "</div>";

  panel.classList.remove("hidden");
}

function getToneForThreat(threat) {
  if (threat === "Critical") return "danger";
  if (threat === "High") return "warning";
  if (threat === "Medium") return "objective";

  return "normal";
}

function getCurrentStory() {
  const effect = getCurrentStageEffect();
  const id = effect && effect.id ? effect.id : "forest_balance";

  return STORY_DATA[id] || STORY_DATA.forest_balance;
}

function ensureStoryPanel() {
  let panel = document.querySelector("#" + STORY_PANEL_ID);

  if (panel) return panel;

  panel = document.createElement("section");
  panel.id = STORY_PANEL_ID;
  panel.className = "story-panel hidden";

  document.body.appendChild(panel);

  return panel;
}

function ensureCommsPanel() {
  let panel = document.querySelector("#" + STORY_COMMS_ID);

  if (panel) return panel;

  panel = document.createElement("section");
  panel.id = STORY_COMMS_ID;
  panel.className = "story-comms-panel hidden";

  document.body.appendChild(panel);

  return panel;
}

function ensureObjectiveStrip() {
  let strip = document.querySelector("#" + STORY_OBJECTIVE_ID);

  if (strip) return strip;

  strip = document.createElement("section");
  strip.id = STORY_OBJECTIVE_ID;
  strip.className = "story-objective-strip";

  document.body.appendChild(strip);

  return strip;
}

function hideStoryPanel() {
  const panel = document.querySelector("#" + STORY_PANEL_ID);

  if (!panel) return;

  panel.classList.add("hidden");
}

function injectStoryStyles() {
  if (document.querySelector("#" + STORY_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STORY_STYLE_ID;

  style.textContent = `
    .story-objective-strip {
      position: fixed;
      left: 50%;
      top: 46px;
      z-index: 29;
      transform: translateX(-50%);
      width: min(560px, calc(100vw - 620px));
      min-width: 420px;
      display: grid;
      grid-template-columns: 110px 1fr 120px;
      gap: 8px;
      align-items: center;
      padding: 6px 10px;
      border: 1px solid rgba(56, 189, 248, 0.42);
      border-radius: 12px;
      background: rgba(2, 6, 23, 0.74);
      box-shadow: 0 0 18px rgba(56, 189, 248, 0.12);
      color: #dbeafe;
      pointer-events: none;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .story-objective-left,
    .story-objective-right {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }

    .story-objective-left b,
    .story-objective-right b {
      font-size: 10px;
      color: #facc15;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .story-objective-left span,
    .story-objective-right span {
      font-size: 9px;
      color: #7dd3fc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .story-objective-main {
      font-size: 10px;
      line-height: 1.25;
      color: #e0f2fe;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .story-panel {
      position: fixed;
      left: 50%;
      top: 82px;
      width: min(440px, calc(100vw - 760px));
      min-width: 360px;
      z-index: 34;
      transform: translateX(-50%);
      padding: 12px 14px 13px;
      border: 1px solid rgba(56, 189, 248, 0.72);
      border-radius: 16px;
      background:
        linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.88)),
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 42%);
      box-shadow:
        0 0 22px rgba(56, 189, 248, 0.2),
        inset 0 0 18px rgba(15, 23, 42, 0.72);
      color: #dbeafe;
      pointer-events: none;
      opacity: 1;
      transition:
        opacity 220ms ease,
        transform 220ms ease;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .story-panel.hidden {
      opacity: 0;
      transform: translateX(-50%) translateY(-10px) scale(0.98);
    }

    .story-panel-topline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #38bdf8;
    }

    .story-panel-topline b {
      color: #facc15;
      font-size: 10px;
    }

    .story-panel-title {
      font-size: 20px;
      line-height: 1;
      font-weight: 900;
      color: #facc15;
      text-shadow: 0 0 14px rgba(250, 204, 21, 0.25);
      margin-bottom: 4px;
    }

    .story-panel-subtitle {
      font-size: 11px;
      font-weight: 800;
      color: #7dd3fc;
      margin-bottom: 8px;
    }

    .story-panel-body {
      font-size: 10px;
      line-height: 1.45;
      color: #cbd5e1;
      margin-bottom: 8px;
    }

    .story-panel-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
      margin-bottom: 8px;
    }

    .story-panel-grid div,
    .story-panel-objective {
      border: 1px solid rgba(59, 130, 246, 0.28);
      border-radius: 9px;
      background: rgba(15, 23, 42, 0.62);
      padding: 6px 7px;
    }

    .story-panel-grid span,
    .story-panel-objective span {
      display: block;
      font-size: 9px;
      color: #94a3b8;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .story-panel-grid b,
    .story-panel-objective b {
      display: block;
      font-size: 10px;
      color: #facc15;
    }

    .story-panel-objective b {
      color: #e0f2fe;
      line-height: 1.35;
    }

    .story-comms-panel {
      position: fixed;
      left: 240px;
      top: 96px;
      z-index: 35;
      transform: none;
      width: 420px;
      max-width: 420px;
      padding: 9px 12px;
      border: 1px solid rgba(125, 211, 252, 0.55);
      border-radius: 14px;
      background:
        linear-gradient(135deg, rgba(2, 6, 23, 0.93), rgba(15, 23, 42, 0.88));
      box-shadow: 0 0 18px rgba(56, 189, 248, 0.18);
      color: #e0f2fe;
      pointer-events: none;
      opacity: 1;
      transition:
        opacity 180ms ease,
        transform 180ms ease;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .story-comms-panel.hidden {
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
    }

    .story-comms-speaker {
      margin-bottom: 4px;
      font-size: 10px;
      font-weight: 900;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .story-comms-text {
      font-size: 11px;
      line-height: 1.35;
      color: #e0f2fe;
      text-align: left;
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .story-comms-panel.tone-success {
      border-color: rgba(34, 197, 94, 0.62);
      box-shadow: 0 0 18px rgba(34, 197, 94, 0.16);
    }

    .story-comms-panel.tone-warning,
    .story-comms-panel.tone-objective {
      border-color: rgba(250, 204, 21, 0.62);
      box-shadow: 0 0 18px rgba(250, 204, 21, 0.14);
    }

    .story-comms-panel.tone-danger {
      border-color: rgba(248, 113, 113, 0.72);
      box-shadow: 0 0 22px rgba(248, 113, 113, 0.18);
    }

    .story-comms-panel.tone-danger .story-comms-speaker {
      color: #f87171;
    }

    .story-comms-panel.tone-success .story-comms-speaker {
      color: #22c55e;
    }

    .story-comms-panel.tone-warning .story-comms-speaker,
    .story-comms-panel.tone-objective .story-comms-speaker {
      color: #facc15;
    }

    @media (max-width: 1400px) {
      .story-comms-panel {
        left: 230px;
        width: 360px;
        max-width: 360px;
      }

      .story-panel {
        width: min(420px, calc(100vw - 720px));
      }

      .story-objective-strip {
        width: min(520px, calc(100vw - 560px));
      }
    }

    @media (max-width: 1200px) {
      .story-objective-strip {
        width: min(500px, calc(100vw - 360px));
        min-width: 320px;
        grid-template-columns: 95px 1fr 100px;
      }

      .story-panel {
        top: 82px;
        width: min(400px, calc(100vw - 360px));
        min-width: 310px;
      }

      .story-panel-title {
        font-size: 18px;
      }

      .story-comms-panel {
        left: 210px;
        top: 94px;
        width: 330px;
        max-width: 330px;
      }
    }

    @media (max-width: 900px) {
      .story-objective-strip {
        left: 50%;
        top: 48px;
        width: calc(100vw - 24px);
        min-width: 0;
        grid-template-columns: 80px 1fr 80px;
      }

      .story-panel {
        left: 50%;
        top: 92px;
        width: calc(100vw - 24px);
        min-width: 0;
      }

      .story-panel-grid {
        grid-template-columns: 1fr;
      }

      .story-comms-panel {
        left: 12px;
        top: 122px;
        width: calc(100vw - 24px);
        max-width: none;
        min-width: 0;
      }
    }
  `;

  document.head.appendChild(style);
}