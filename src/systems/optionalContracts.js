import { state } from "../game/state.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";

let initialized = false;
let panel = null;
let titleEl = null;
let bodyEl = null;
let rewardEl = null;
let statusEl = null;

let activeContract = null;
let offeredForWave = 0;
let tracking = null;
let resultTimer = 0;

const CONTRACTS = [
  {
    id: "clean_core",
    title: "Clean Core",
    description: "Finish the wave without taking Base Core damage.",
    rewardText: "+45G",
    goldReward: 45,
    relocationReward: 0,
    createGoal: function () {
      return {
        required: 0
      };
    },
    getProgressText: function (track) {
      const damageTaken = Math.max(0, track.startBaseHp - track.minBaseHp);
      return "Base damage taken: " + damageTaken;
    },
    isComplete: function (track) {
      return track.minBaseHp >= track.startBaseHp;
    }
  },
  {
    id: "combo_drill",
    title: "Combo Drill",
    description: "Reach a combo streak during this wave.",
    rewardText: "+35G",
    goldReward: 35,
    relocationReward: 0,
    createGoal: function (wave) {
      return {
        required: Math.min(8, 3 + Math.floor(wave / 3))
      };
    },
    getProgressText: function (track, contract) {
      return "Best combo: " + track.maxCombo + " / " + contract.goal.required;
    },
    isComplete: function (track, contract) {
      return track.maxCombo >= contract.goal.required;
    }
  },
  {
    id: "field_profit",
    title: "Field Profit",
    description: "Earn enough gold during the wave.",
    rewardText: "+40G",
    goldReward: 40,
    relocationReward: 0,
    createGoal: function (wave) {
      return {
        required: Math.min(140, 35 + wave * 8)
      };
    },
    getProgressText: function (track, contract) {
      const gained = Math.max(0, Number(state.gold || 0) - track.startGold);
      return "Gold gained: " + gained + " / " + contract.goal.required;
    },
    isComplete: function (track, contract) {
      const gained = Math.max(0, Number(state.gold || 0) - track.startGold);
      return gained >= contract.goal.required;
    }
  },
  {
    id: "no_new_towers",
    title: "Hold Formation",
    description: "Clear the wave without placing a new tower.",
    rewardText: "+1 Relocation",
    goldReward: 15,
    relocationReward: 1,
    createGoal: function () {
      return {
        allowedNewTowers: 0
      };
    },
    getProgressText: function (track) {
      const newTowers = Math.max(0, track.maxTowerCount - track.startTowerCount);
      return "New towers placed: " + newTowers + " / 0";
    },
    isComplete: function (track) {
      return track.maxTowerCount <= track.startTowerCount;
    }
  },
  {
    id: "score_surge",
    title: "Score Surge",
    description: "Gain enough score during the wave.",
    rewardText: "+50G",
    goldReward: 50,
    relocationReward: 0,
    createGoal: function (wave) {
      return {
        required: Math.min(600, 90 + wave * 18)
      };
    },
    getProgressText: function (track, contract) {
      const gained = Math.max(0, Number(state.score || 0) - track.startScore);
      return "Score gained: " + gained + " / " + contract.goal.required;
    },
    isComplete: function (track, contract) {
      const gained = Math.max(0, Number(state.score || 0) - track.startScore);
      return gained >= contract.goal.required;
    }
  }
];

export function initOptionalContracts() {
  initialized = true;
  activeContract = null;
  tracking = null;
  offeredForWave = Number(state.wave || 1);
  resultTimer = 0;

  ensurePanel();
  hidePanel();
}

export function updateOptionalContracts() {
  if (!initialized) {
    initOptionalContracts();
  }

  if (!state.started || state.gameOver) {
    return;
  }

  if (resultTimer > 0) {
    resultTimer--;
  }

  maybeOfferContract();
  maybeStartTracking();
  updateTracking();
  maybeFinishTracking();
  renderPanel();
}

export function resetOptionalContracts() {
  activeContract = null;
  tracking = null;
  offeredForWave = Number(state.wave || 1);
  resultTimer = 0;

  if (panel) {
    hidePanel();
  }
}

function maybeOfferContract() {
  if (state.waveActive) return;
  if (!state.waitingForNextWave) return;
  if (activeContract) return;

  const wave = Number(state.wave || 1);

  if (wave <= 1) return;
  if (offeredForWave === wave) return;

  offeredForWave = wave;
  activeContract = createContract(wave);
  tracking = null;

  addEventLog("Optional contract available: " + activeContract.title + ".");
  showAnnouncement("Optional Contract Available");
}

function createContract(wave) {
  const pool = CONTRACTS.slice();
  const index = Math.floor(Math.random() * pool.length);
  const template = pool[index];

  return {
    id: template.id,
    title: template.title,
    description: template.description,
    rewardText: template.rewardText,
    goldReward: template.goldReward,
    relocationReward: template.relocationReward,
    goal: template.createGoal(wave),
    getProgressText: template.getProgressText,
    isComplete: template.isComplete,
    state: "offered"
  };
}

function maybeStartTracking() {
  if (!activeContract) return;
  if (!state.waveActive) return;

  const wave = Number(state.wave || 1);

  if (tracking && tracking.wave === wave) return;

  tracking = {
    wave: wave,
    startScore: Number(state.score || 0),
    startGold: Number(state.gold || 0),
    startBaseHp: Number(state.baseHp || 0),
    minBaseHp: Number(state.baseHp || 0),
    startTowerCount: getTowerCount(),
    maxTowerCount: getTowerCount(),
    maxCombo: Number(state.combo || 0),
    maxEnemiesAlive: getEnemyCount()
  };

  activeContract.state = "active";

  addEventLog("Contract started: " + activeContract.title + ".");
}

function updateTracking() {
  if (!tracking) return;
  if (!activeContract) return;
  if (!state.waveActive) return;

  tracking.minBaseHp = Math.min(
    tracking.minBaseHp,
    Number(state.baseHp || 0)
  );

  tracking.maxTowerCount = Math.max(
    tracking.maxTowerCount,
    getTowerCount()
  );

  tracking.maxCombo = Math.max(
    tracking.maxCombo,
    Number(state.combo || 0)
  );

  tracking.maxEnemiesAlive = Math.max(
    tracking.maxEnemiesAlive,
    getEnemyCount()
  );
}

function maybeFinishTracking() {
  if (!tracking) return;
  if (!activeContract) return;
  if (state.waveActive) return;
  if (!state.waitingForNextWave) return;

  const currentWave = Number(state.wave || 1);

  if (currentWave <= tracking.wave) return;

  const completed = activeContract.isComplete(tracking, activeContract);

  if (completed) {
    rewardContract(activeContract);
  } else {
    failContract(activeContract);
  }

  activeContract = null;
  tracking = null;
  resultTimer = 210;
}

function rewardContract(contract) {
  const goldReward = Number(contract.goldReward || 0);
  const relocationReward = Number(contract.relocationReward || 0);

  if (goldReward > 0) {
    state.gold = Number(state.gold || 0) + goldReward;
  }

  if (relocationReward > 0) {
    state.relocationTokens = Number(state.relocationTokens || 0) + relocationReward;
    state.relocationMaxTokens = Math.max(
      Number(state.relocationMaxTokens || 0),
      Number(state.relocationTokens || 0)
    );
  }

  addEventLog(
    "Contract complete: " +
      contract.title +
      ". Reward: " +
      contract.rewardText +
      "."
  );

  showAnnouncement("Contract Complete: " + contract.rewardText);

  showResult(
    "CONTRACT COMPLETE",
    contract.title,
    "Reward received: " + contract.rewardText,
    "complete"
  );
}

function failContract(contract) {
  addEventLog("Contract failed: " + contract.title + ".");
  showAnnouncement("Contract Failed");

  showResult(
    "CONTRACT FAILED",
    contract.title,
    "No bonus reward this wave.",
    "failed"
  );
}

function showResult(topline, title, body, type) {
  ensurePanel();

  panel.classList.remove("hidden");
  panel.classList.remove("contract-complete");
  panel.classList.remove("contract-failed");

  if (type === "complete") {
    panel.classList.add("contract-complete");
  }

  if (type === "failed") {
    panel.classList.add("contract-failed");
  }

  if (titleEl) {
    titleEl.textContent = topline + " • " + title;
  }

  if (bodyEl) {
    bodyEl.textContent = body;
  }

  if (rewardEl) {
    rewardEl.textContent = "";
  }

  if (statusEl) {
    statusEl.textContent = "";
  }
}

function renderPanel() {
  if (!panel) return;

  if (!activeContract) {
    if (resultTimer <= 0) {
      hidePanel();
    }

    return;
  }

  panel.classList.remove("hidden");
  panel.classList.remove("contract-complete");
  panel.classList.remove("contract-failed");

  if (titleEl) {
    titleEl.textContent = "OPTIONAL CONTRACT • " + activeContract.title;
  }

  if (bodyEl) {
    bodyEl.textContent = activeContract.description;
  }

  if (rewardEl) {
    rewardEl.textContent = "Reward: " + activeContract.rewardText;
  }

  if (statusEl) {
    if (tracking) {
      statusEl.textContent =
        activeContract.getProgressText(tracking, activeContract);
    } else {
      statusEl.textContent = "Starts when the next wave begins.";
    }
  }
}

function ensurePanel() {
  panel = document.querySelector("#optionalContractsPanel");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "optionalContractsPanel";
    panel.innerHTML =
      '<div class="optional-contract-topline" id="optionalContractTitle"></div>' +
      '<div class="optional-contract-body" id="optionalContractBody"></div>' +
      '<div class="optional-contract-footer">' +
      '<span id="optionalContractReward"></span>' +
      '<span id="optionalContractStatus"></span>' +
      "</div>";

    document.body.appendChild(panel);
  }

  titleEl = document.querySelector("#optionalContractTitle");
  bodyEl = document.querySelector("#optionalContractBody");
  rewardEl = document.querySelector("#optionalContractReward");
  statusEl = document.querySelector("#optionalContractStatus");

  injectStyles();
}

function hidePanel() {
  if (panel) {
    panel.classList.add("hidden");
  }
}

function getTowerCount() {
  if (!Array.isArray(state.towers)) return 0;

  let count = 0;

  for (const tower of state.towers) {
    if (tower && tower.parent) {
      count++;
    }
  }

  return count;
}

function getEnemyCount() {
  if (!Array.isArray(state.enemies)) return 0;

  let count = 0;

  for (const enemy of state.enemies) {
    if (enemy && enemy.parent) {
      count++;
    }
  }

  return count;
}

function injectStyles() {
  if (document.querySelector("#optionalContractsStyles")) return;

  const style = document.createElement("style");
  style.id = "optionalContractsStyles";
  style.textContent =
    "#optionalContractsPanel{" +
    "position:fixed;" +
    "left:50%;" +
    "top:74px;" +
    "transform:translateX(-50%);" +
    "width:min(560px,calc(100vw - 360px));" +
    "min-width:360px;" +
    "z-index:42;" +
    "padding:12px 14px;" +
    "border-radius:14px;" +
    "background:linear-gradient(180deg,rgba(8,15,32,.88),rgba(3,8,20,.84));" +
    "border:1px solid rgba(56,189,248,.42);" +
    "box-shadow:0 12px 30px rgba(0,0,0,.28),inset 0 0 18px rgba(56,189,248,.08);" +
    "font-family:Arial,Helvetica,sans-serif;" +
    "color:#e5f6ff;" +
    "pointer-events:none;" +
    "}" +
    "#optionalContractsPanel.hidden{display:none;}" +
    ".optional-contract-topline{" +
    "font-size:12px;" +
    "letter-spacing:2px;" +
    "font-weight:900;" +
    "color:#38bdf8;" +
    "text-transform:uppercase;" +
    "white-space:nowrap;" +
    "overflow:hidden;" +
    "text-overflow:ellipsis;" +
    "}" +
    ".optional-contract-body{" +
    "font-size:13px;" +
    "line-height:1.35;" +
    "margin-top:5px;" +
    "color:#dbeafe;" +
    "}" +
    ".optional-contract-footer{" +
    "display:flex;" +
    "justify-content:space-between;" +
    "gap:16px;" +
    "font-size:12px;" +
    "font-weight:800;" +
    "margin-top:8px;" +
    "color:#facc15;" +
    "}" +
    "#optionalContractStatus{" +
    "color:#cbd5e1;" +
    "text-align:right;" +
    "}" +
    "#optionalContractsPanel.contract-complete{" +
    "border-color:rgba(34,197,94,.82);" +
    "box-shadow:0 12px 30px rgba(0,0,0,.28),inset 0 0 24px rgba(34,197,94,.18);" +
    "}" +
    "#optionalContractsPanel.contract-failed{" +
    "border-color:rgba(248,113,113,.72);" +
    "box-shadow:0 12px 30px rgba(0,0,0,.28),inset 0 0 24px rgba(248,113,113,.14);" +
    "}" +
    "@media(max-width:980px){" +
    "#optionalContractsPanel{" +
    "top:112px;" +
    "width:calc(100vw - 32px);" +
    "min-width:0;" +
    "}" +
    "}";

  document.head.appendChild(style);
}