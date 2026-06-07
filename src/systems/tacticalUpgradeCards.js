import { state } from "../game/state.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";

let initialized = false;
let panel = null;
let cardsContainer = null;
let titleElement = null;
let subtitleElement = null;

let pendingChoice = false;
let offeredForWave = 1;
let currentCards = [];
let keyHandlerInstalled = false;

const CARD_COUNT = 3;

const CARD_POOL = [
  {
    id: "kinetic_tuning",
    title: "Kinetic Tuning",
    tag: "Damage",
    description: "All towers gain +12% damage.",
    apply: function () {
      const upgrades = ensureUpgradeState();
      upgrades.damageMultiplier *= 1.12;
      upgrades.picked.push("Kinetic Tuning");
    }
  },
  {
    id: "overclock_lattice",
    title: "Overclock Lattice",
    tag: "Fire Rate",
    description: "All towers prepare shots 12% faster.",
    apply: function () {
      const upgrades = ensureUpgradeState();
      upgrades.fireRateMultiplier *= 1.12;
      upgrades.picked.push("Overclock Lattice");
    }
  },
  {
    id: "rangefinder_mesh",
    title: "Rangefinder Mesh",
    tag: "Range",
    description: "All towers gain +10% range.",
    apply: function () {
      const upgrades = ensureUpgradeState();
      upgrades.rangeMultiplier *= 1.1;
      upgrades.picked.push("Rangefinder Mesh");
    }
  },
  {
    id: "emergency_funding",
    title: "Emergency Funding",
    tag: "Economy",
    description: "Gain +80 gold immediately.",
    apply: function () {
      const upgrades = ensureUpgradeState();
      state.gold += 80;
      upgrades.picked.push("Emergency Funding");
    }
  },
  {
    id: "core_reinforcement",
    title: "Core Reinforcement",
    tag: "Base",
    description: "Base Max HP +2 and heal +2.",
    apply: function () {
      const upgrades = ensureUpgradeState();

      state.baseMaxHp = Number(state.baseMaxHp || 10) + 2;
      state.baseHp = Math.min(
        Number(state.baseMaxHp || 10),
        Number(state.baseHp || 0) + 2
      );

      upgrades.picked.push("Core Reinforcement");
    }
  },
  {
    id: "relocation_permit",
    title: "Relocation Permit",
    tag: "Control",
    description: "Gain +1 relocation token.",
    apply: function () {
      const upgrades = ensureUpgradeState();

      state.relocationTokens = Number(state.relocationTokens || 0) + 1;
      state.relocationMaxTokens = Math.max(
        Number(state.relocationMaxTokens || 0),
        Number(state.relocationTokens || 0)
      );

      upgrades.picked.push("Relocation Permit");
    }
  },
  {
    id: "sniper_optics",
    title: "Sniper Optics",
    tag: "Sniper",
    description: "Sniper towers gain +22% damage and +8% range.",
    apply: function () {
      const upgrades = ensureUpgradeState();

      upgrades.sniperDamageMultiplier *= 1.22;
      upgrades.sniperRangeMultiplier *= 1.08;
      upgrades.picked.push("Sniper Optics");
    }
  },
  {
    id: "cryo_amplifier",
    title: "Cryo Amplifier",
    tag: "Slow",
    description: "Slow towers gain stronger slowing power.",
    apply: function () {
      const upgrades = ensureUpgradeState();

      upgrades.slowPowerMultiplier *= 1.25;
      upgrades.picked.push("Cryo Amplifier");
    }
  },
  {
    id: "splash_capacitors",
    title: "Splash Capacitors",
    tag: "Splash",
    description: "Splash towers gain +18% area radius and +8% damage.",
    apply: function () {
      const upgrades = ensureUpgradeState();

      upgrades.splashRadiusMultiplier *= 1.18;
      upgrades.splashDamageMultiplier *= 1.08;
      upgrades.picked.push("Splash Capacitors");
    }
  },
  {
    id: "rapid_feedline",
    title: "Rapid Feedline",
    tag: "Rapid",
    description: "Rapid towers prepare shots 18% faster.",
    apply: function () {
      const upgrades = ensureUpgradeState();

      upgrades.rapidFireRateMultiplier *= 1.18;
      upgrades.picked.push("Rapid Feedline");
    }
  }
];

export function initTacticalUpgradeCards() {
  initialized = true;
  pendingChoice = false;
  offeredForWave = Number(state.wave || 1);
  currentCards = [];

  ensureUpgradeState();
  ensurePanel();
  hidePanel();

  if (!keyHandlerInstalled) {
    window.addEventListener("keydown", handleCardHotkeys);
    keyHandlerInstalled = true;
  }
}

export function updateTacticalUpgradeCards() {
  if (!initialized) {
    initTacticalUpgradeCards();
  }

  applyUpgradesToTowers();

  if (shouldOfferCards()) {
    offerCards();
  }

  if (pendingChoice && state.waveActive) {
    closeChoiceWithoutReward();
  }
}

export function resetTacticalUpgradeCards() {
  state.tacticalUpgrades = createDefaultUpgradeState();

  pendingChoice = false;
  offeredForWave = Number(state.wave || 1);
  currentCards = [];

  if (panel) {
    hidePanel();
  }
}

function shouldOfferCards() {
  if (!state.started) return false;
  if (state.gameOver) return false;
  if (state.waveActive) return false;
  if (!state.waitingForNextWave) return false;
  if (pendingChoice) return false;

  const wave = Number(state.wave || 1);

  if (wave <= 1) return false;
  if (offeredForWave === wave) return false;

  if (wave % 2 === 0) return true;
  if (wave % 5 === 1) return true;

  return false;
}

function offerCards() {
  const wave = Number(state.wave || 1);

  pendingChoice = true;
  offeredForWave = wave;
  currentCards = pickCards();

  renderCards();

  addEventLog("Field upgrades available before Wave " + wave + ".");
  showAnnouncement("Field Upgrade Available");
}

function pickCards() {
  const pool = CARD_POOL.slice();
  const picked = [];

  while (picked.length < CARD_COUNT && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    const card = pool.splice(index, 1)[0];

    picked.push(card);
  }

  return picked;
}

function chooseCard(index) {
  if (!pendingChoice) return;
  if (index < 0 || index >= currentCards.length) return;

  const card = currentCards[index];

  if (!card) return;

  card.apply();

  pendingChoice = false;
  currentCards = [];

  applyUpgradesToTowers();
  hidePanel();

  addEventLog("Upgrade selected: " + card.title + ".");
  showAnnouncement("Upgrade Installed: " + card.title);
}

function closeChoiceWithoutReward() {
  pendingChoice = false;
  currentCards = [];
  hidePanel();
}

function ensureUpgradeState() {
  if (!state.tacticalUpgrades) {
    state.tacticalUpgrades = createDefaultUpgradeState();
  }

  const upgrades = state.tacticalUpgrades;

  ensureNumber(upgrades, "damageMultiplier", 1);
  ensureNumber(upgrades, "fireRateMultiplier", 1);
  ensureNumber(upgrades, "rangeMultiplier", 1);

  ensureNumber(upgrades, "sniperDamageMultiplier", 1);
  ensureNumber(upgrades, "sniperRangeMultiplier", 1);

  ensureNumber(upgrades, "slowPowerMultiplier", 1);
  ensureNumber(upgrades, "splashRadiusMultiplier", 1);
  ensureNumber(upgrades, "splashDamageMultiplier", 1);
  ensureNumber(upgrades, "rapidFireRateMultiplier", 1);

  if (!Array.isArray(upgrades.picked)) {
    upgrades.picked = [];
  }

  return upgrades;
}

function createDefaultUpgradeState() {
  return {
    damageMultiplier: 1,
    fireRateMultiplier: 1,
    rangeMultiplier: 1,

    sniperDamageMultiplier: 1,
    sniperRangeMultiplier: 1,

    slowPowerMultiplier: 1,
    splashRadiusMultiplier: 1,
    splashDamageMultiplier: 1,
    rapidFireRateMultiplier: 1,

    picked: []
  };
}

function ensureNumber(object, key, fallback) {
  const value = Number(object[key]);

  if (!Number.isFinite(value) || value <= 0) {
    object[key] = fallback;
  }
}

function applyUpgradesToTowers() {
  const upgrades = ensureUpgradeState();

  if (!Array.isArray(state.towers)) return;

  for (const tower of state.towers) {
    if (!isValidTower(tower)) continue;

    applyUpgradeToTower(tower, upgrades);
  }
}

function applyUpgradeToTower(tower, upgrades) {
  const data = tower.userData || {};
  tower.userData = data;

  const type = getTowerType(tower);

  if (!data.tacticalBaseStats) {
    data.tacticalBaseStats = captureBaseStats(data);
  }

  const base = data.tacticalBaseStats;

  const damageMultiplier = getDamageMultiplierForType(type, upgrades);
  const rangeMultiplier = getRangeMultiplierForType(type, upgrades);
  const fireRateMultiplier = getFireRateMultiplierForType(type, upgrades);

  data.tacticalDamageMultiplier = damageMultiplier;
  data.tacticalRangeMultiplier = rangeMultiplier;
  data.tacticalFireRateMultiplier = fireRateMultiplier;
  data.tacticalSlowPowerMultiplier = upgrades.slowPowerMultiplier;
  data.tacticalSplashRadiusMultiplier = upgrades.splashRadiusMultiplier;

  writeNumberIfBaseExists(data, base, "damage", damageMultiplier);
  writeNumberIfBaseExists(data, base, "power", damageMultiplier);
  writeNumberIfBaseExists(data, base, "attackDamage", damageMultiplier);

  writeNumberIfBaseExists(data, base, "range", rangeMultiplier);
  writeNumberIfBaseExists(data, base, "attackRange", rangeMultiplier);
  writeNumberIfBaseExists(data, base, "radius", rangeMultiplier);

  if (type === "slow") {
    writeNumberIfBaseExists(data, base, "slowAmount", upgrades.slowPowerMultiplier);
    writeNumberIfBaseExists(data, base, "slowPower", upgrades.slowPowerMultiplier);
  }

  if (type === "splash") {
    writeNumberIfBaseExists(
      data,
      base,
      "splashRadius",
      upgrades.splashRadiusMultiplier
    );

    writeNumberIfBaseExists(
      data,
      base,
      "areaRadius",
      upgrades.splashRadiusMultiplier
    );
  }
}

function captureBaseStats(data) {
  return {
    damage: numberOrNull(data.damage),
    power: numberOrNull(data.power),
    attackDamage: numberOrNull(data.attackDamage),

    range: numberOrNull(data.range),
    attackRange: numberOrNull(data.attackRange),
    radius: numberOrNull(data.radius),

    slowAmount: numberOrNull(data.slowAmount),
    slowPower: numberOrNull(data.slowPower),

    splashRadius: numberOrNull(data.splashRadius),
    areaRadius: numberOrNull(data.areaRadius)
  };
}

function numberOrNull(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return numberValue;
}

function writeNumberIfBaseExists(data, base, key, multiplier) {
  if (base[key] === null) return;

  data[key] = base[key] * multiplier;
}

function getDamageMultiplierForType(type, upgrades) {
  let multiplier = upgrades.damageMultiplier;

  if (type === "sniper") {
    multiplier *= upgrades.sniperDamageMultiplier;
  }

  if (type === "splash") {
    multiplier *= upgrades.splashDamageMultiplier;
  }

  return multiplier;
}

function getRangeMultiplierForType(type, upgrades) {
  let multiplier = upgrades.rangeMultiplier;

  if (type === "sniper") {
    multiplier *= upgrades.sniperRangeMultiplier;
  }

  return multiplier;
}

function getFireRateMultiplierForType(type, upgrades) {
  let multiplier = upgrades.fireRateMultiplier;

  if (type === "rapid") {
    multiplier *= upgrades.rapidFireRateMultiplier;
  }

  return multiplier;
}

function getTowerType(tower) {
  const data = tower.userData || {};
  const rawType = data.type || data.towerType || data.kind || tower.name || "";
  const text = String(rawType).toLowerCase();

  if (text.indexOf("rapid") !== -1) return "rapid";
  if (text.indexOf("sniper") !== -1) return "sniper";
  if (text.indexOf("slow") !== -1) return "slow";
  if (text.indexOf("splash") !== -1) return "splash";
  if (text.indexOf("normal") !== -1) return "normal";

  return "unknown";
}

function isValidTower(tower) {
  if (!tower) return false;
  if (!tower.parent) return false;
  if (!tower.position) return false;

  return true;
}

function ensurePanel() {
  panel = document.querySelector("#tacticalUpgradeCardsPanel");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "tacticalUpgradeCardsPanel";
    panel.innerHTML =
      '<div class="upgrade-card-shell">' +
      '<div class="upgrade-card-topline">FIELD UPGRADE</div>' +
      '<div id="tacticalUpgradeTitle" class="upgrade-card-title">Choose Upgrade</div>' +
      '<div id="tacticalUpgradeSubtitle" class="upgrade-card-subtitle">Pick one tactical improvement before the next wave.</div>' +
      '<div id="tacticalUpgradeCards" class="upgrade-card-grid"></div>' +
      '<div class="upgrade-card-hint">Press 1, 2 or 3 to choose.</div>' +
      "</div>";

    document.body.appendChild(panel);
  }

  titleElement = document.querySelector("#tacticalUpgradeTitle");
  subtitleElement = document.querySelector("#tacticalUpgradeSubtitle");
  cardsContainer = document.querySelector("#tacticalUpgradeCards");

  injectStyles();
}

function renderCards() {
  ensurePanel();

  if (titleElement) {
    titleElement.textContent = "Choose Field Upgrade";
  }

  if (subtitleElement) {
    subtitleElement.textContent =
      "Wave " + Number(state.wave || 1) + " preparation reward.";
  }

  if (!cardsContainer) return;

  cardsContainer.innerHTML = "";

  for (let i = 0; i < currentCards.length; i++) {
    const card = currentCards[i];

    const button = document.createElement("button");
    button.className = "upgrade-card-option";
    button.type = "button";
    button.dataset.index = String(i);

    button.innerHTML =
      '<span class="upgrade-card-number">' +
      String(i + 1) +
      "</span>" +
      '<span class="upgrade-card-tag">' +
      escapeHtml(card.tag) +
      "</span>" +
      '<strong class="upgrade-card-name">' +
      escapeHtml(card.title) +
      "</strong>" +
      '<span class="upgrade-card-desc">' +
      escapeHtml(card.description) +
      "</span>";

    button.addEventListener("click", function () {
      chooseCard(i);
    });

    cardsContainer.appendChild(button);
  }

  showPanel();
}

function showPanel() {
  ensurePanel();

  if (panel) {
    panel.classList.remove("hidden");
  }
}

function hidePanel() {
  if (panel) {
    panel.classList.add("hidden");
  }
}

function handleCardHotkeys(event) {
  if (!pendingChoice) return;

  if (event.key === "1") {
    event.preventDefault();
    event.stopPropagation();
    chooseCard(0);
  }

  if (event.key === "2") {
    event.preventDefault();
    event.stopPropagation();
    chooseCard(1);
  }

  if (event.key === "3") {
    event.preventDefault();
    event.stopPropagation();
    chooseCard(2);
  }
}

function injectStyles() {
  if (document.querySelector("#tacticalUpgradeCardsStyles")) return;

  const style = document.createElement("style");
  style.id = "tacticalUpgradeCardsStyles";
  style.textContent =
    "#tacticalUpgradeCardsPanel{" +
    "position:fixed;" +
    "left:50%;" +
    "bottom:34px;" +
    "transform:translateX(-50%);" +
    "z-index:80;" +
    "width:min(760px,calc(100vw - 40px));" +
    "pointer-events:auto;" +
    "}" +
    "#tacticalUpgradeCardsPanel.hidden{display:none;}" +
    ".upgrade-card-shell{" +
    "background:linear-gradient(180deg,rgba(8,15,32,.94),rgba(3,8,20,.94));" +
    "border:1px solid rgba(56,189,248,.48);" +
    "box-shadow:0 16px 45px rgba(0,0,0,.42), inset 0 0 24px rgba(56,189,248,.08);" +
    "border-radius:18px;" +
    "padding:18px;" +
    "font-family:Arial,Helvetica,sans-serif;" +
    "color:#e5f6ff;" +
    "}" +
    ".upgrade-card-topline{" +
    "font-size:12px;" +
    "letter-spacing:3px;" +
    "font-weight:900;" +
    "color:#38bdf8;" +
    "}" +
    ".upgrade-card-title{" +
    "font-size:26px;" +
    "font-weight:900;" +
    "color:#facc15;" +
    "margin-top:4px;" +
    "}" +
    ".upgrade-card-subtitle{" +
    "font-size:13px;" +
    "color:#cbd5e1;" +
    "margin-top:4px;" +
    "}" +
    ".upgrade-card-grid{" +
    "display:grid;" +
    "grid-template-columns:repeat(3,1fr);" +
    "gap:12px;" +
    "margin-top:16px;" +
    "}" +
    ".upgrade-card-option{" +
    "position:relative;" +
    "min-height:142px;" +
    "border:1px solid rgba(96,165,250,.38);" +
    "border-radius:14px;" +
    "background:rgba(15,23,42,.78);" +
    "color:#e5f6ff;" +
    "padding:14px;" +
    "text-align:left;" +
    "cursor:pointer;" +
    "box-shadow:inset 0 0 18px rgba(56,189,248,.06);" +
    "transition:transform .16s ease,border-color .16s ease,background .16s ease;" +
    "}" +
    ".upgrade-card-option:hover{" +
    "transform:translateY(-3px);" +
    "border-color:rgba(250,204,21,.82);" +
    "background:rgba(20,31,56,.92);" +
    "}" +
    ".upgrade-card-number{" +
    "position:absolute;" +
    "right:12px;" +
    "top:10px;" +
    "width:24px;" +
    "height:24px;" +
    "border-radius:999px;" +
    "background:#facc15;" +
    "color:#020617;" +
    "display:grid;" +
    "place-items:center;" +
    "font-weight:900;" +
    "}" +
    ".upgrade-card-tag{" +
    "display:inline-block;" +
    "font-size:11px;" +
    "font-weight:900;" +
    "letter-spacing:1.5px;" +
    "color:#38bdf8;" +
    "text-transform:uppercase;" +
    "margin-bottom:10px;" +
    "}" +
    ".upgrade-card-name{" +
    "display:block;" +
    "font-size:17px;" +
    "color:#facc15;" +
    "margin-bottom:8px;" +
    "}" +
    ".upgrade-card-desc{" +
    "display:block;" +
    "font-size:13px;" +
    "line-height:1.35;" +
    "color:#dbeafe;" +
    "}" +
    ".upgrade-card-hint{" +
    "margin-top:12px;" +
    "font-size:12px;" +
    "color:#94a3b8;" +
    "text-align:center;" +
    "}" +
    "@media(max-width:760px){" +
    ".upgrade-card-grid{grid-template-columns:1fr;}" +
    "#tacticalUpgradeCardsPanel{bottom:18px;}" +
    "}";

  document.head.appendChild(style);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}