import { state } from "../game/state.js";
import { getCurrentStageTowerLimit } from "../game/stages.js";

const BOSS_TYPES = {
  swarm: ["boss_runner", "boss_splitter"],
  armored: ["boss_crusher", "boss_shield"],
  disrupt: ["boss_purple", "boss_disruptor"],
  balanced: ["boss_purple", "boss_runner", "boss_crusher"]
};

const COUNTER_STRATEGIES = {
  "Swarm Pressure": "Armored Response",
  "Heavy Push": "Fast Pressure",
  "Armored Response": "Swarm Pressure",
  "Tank Response": "Adaptive Mix",
  "Fast Pressure": "Heavy Push",
  "Late Wave Mix": "Swarm Pressure",
  Balanced: "Fast Pressure"
};

const NORMAL_STRATEGIES = [
  "Balanced",
  "Swarm Pressure",
  "Heavy Push",
  "Armored Response",
  "Tank Response",
  "Fast Pressure",
  "Adaptive Mix",
  "Late Wave Mix"
];

const BOSS_STRATEGIES = [
  "Boss Wave",
  "Swarm Boss",
  "Shielded Push",
  "Armored Boss",
  "Crusher Boss",
  "Disruption Boss"
];

export function analyzeAndLockAIPlan() {
  const strategy = calculateAIStrategyName();

  state.aiLockedStrategy = strategy;
  state.aiDisplayedStrategy = strategy;
  state.aiLockedPlanText = calculateAIPlanText(strategy);

  state.aiBluffActive = false;
  state.aiBluffFrom = null;
  state.aiBluffTo = null;

  state.aiMemory.previousBaseHp = state.baseHp;
  state.aiMemory.lastTransformProfile = getTowerProfile();
}

export function prepareWaveStartAIPlan() {
  const visibleStrategy = state.aiDisplayedStrategy || state.aiLockedStrategy;

  if (!shouldApplyBluff()) {
    state.aiLockedStrategy = visibleStrategy;
    state.aiLockedPlanText = calculateAIPlanText(visibleStrategy);
    state.aiBluffActive = false;
    state.aiBluffFrom = null;
    state.aiBluffTo = null;

    return {
      bluffApplied: false,
      strategy: visibleStrategy,
      displayedStrategy: visibleStrategy
    };
  }

  const actualStrategy = pickBluffStrategy(visibleStrategy);

  state.aiLockedStrategy = actualStrategy;
  state.aiDisplayedStrategy = actualStrategy;
  state.aiLockedPlanText =
    `AI bluff revealed. Displayed ${visibleStrategy}, executing ${actualStrategy}. ` +
    getTransformPlanText();

  state.aiBluffActive = true;
  state.aiBluffFrom = visibleStrategy;
  state.aiBluffTo = actualStrategy;

  return {
    bluffApplied: true,
    strategy: actualStrategy,
    displayedStrategy: visibleStrategy
  };
}

export function recordWaveResult() {
  const previousHp = state.aiMemory.previousBaseHp ?? state.baseMaxHp;
  const damage = Math.max(0, previousHp - state.baseHp);

  state.aiMemory.lastDamageDealt = damage;
  state.aiMemory.lastStrategy = state.aiLockedStrategy;
  state.aiMemory.lastTransformProfile = getTowerProfile();

  if (damage > 0) {
    state.aiMemory.successScore = Math.min(3, state.aiMemory.successScore + 1);
  } else {
    state.aiMemory.successScore = Math.max(-3, state.aiMemory.successScore - 1);
  }
}

export function getAIStrategyName() {
  return state.aiLockedStrategy || calculateAIStrategyName();
}

export function getAIPlanText() {
  return state.aiLockedPlanText || calculateAIPlanText(getAIStrategyName());
}

export function getWaveEnemyCount(baseCount) {
  const strategy = getAIStrategyName();
  const memory = state.aiMemory;
  const profile = getTowerProfile();

  let modifier = 0;

  if (strategy === "Swarm Pressure") modifier += 3;
  if (strategy === "Fast Pressure") modifier += 2;
  if (strategy === "Adaptive Mix") modifier += 1;
  if (strategy === "Late Wave Mix") modifier += 1;

  if (strategy === "Heavy Push") modifier -= 1;
  if (strategy === "Armored Response") modifier -= 1;
  if (strategy === "Tank Response") modifier -= 1;

  if (profile.relocationRatio >= 0.35 && state.wave >= 3) modifier += 1;
  if (profile.focusAlignedRatio >= 0.55 && state.wave >= 3) modifier += 1;
  if (profile.towerLimitReached && state.wave >= 3) modifier += 1;

  if (memory.successScore > 1) modifier += 1;
  if (memory.successScore < -1) modifier += 2;

  return Math.max(3, baseCount + modifier);
}

export function chooseEnemyType() {
  const strategy = getAIStrategyName();
  const profile = getTowerProfile();

  if (state.wave % 5 === 0) {
    return chooseBossType(strategy);
  }

  if (state.wave >= 3 && Math.random() < getEliteChance()) {
    return "elite";
  }

  let fastChance = 0.35;
  let tankChance = 0;

  if (strategy === "Fast Pressure") fastChance = 0.68;

  if (strategy === "Tank Response") {
    tankChance = 0.42;
    fastChance = 0.18;
  }

  if (strategy === "Swarm Pressure") {
    fastChance = 0.78;
    tankChance = 0.04;
  }

  if (strategy === "Heavy Push") {
    tankChance = 0.55;
    fastChance = 0.12;
  }

  if (strategy === "Armored Response") {
    tankChance = 0.65;
    fastChance = 0.1;
  }

  if (strategy === "Adaptive Mix" || strategy === "Late Wave Mix") {
    tankChance = 0.26;
    fastChance = 0.45;
  }

  if (profile.relocationRatio >= 0.35) {
    fastChance += 0.08;
  }

  if (profile.focusAlignedRatio >= 0.55) {
    fastChance += 0.06;
    tankChance += 0.04;
  }

  if (profile.towerLimitReached) {
    tankChance += 0.06;
  }

  const pressure = getPressureMultiplier();

  fastChance = Math.min(0.85, fastChance * pressure);
  tankChance = Math.min(0.75, tankChance * pressure);

  const roll = Math.random();

  if (roll < tankChance) return "tank";
  if (roll < tankChance + fastChance) return "fast";

  return "normal";
}

export function getEnemyConfig(type) {
  if (type === "fast") {
    return {
      type: "fast",
      geometryType: "sphere",
      color: 0xf97316,
      speed: 0.045 + state.wave * 0.003,
      health: 2 + state.wave,
      score: 12,
      gold: 6,
      baseDamage: 1,
      scale: 1
    };
  }

  if (type === "tank") {
    return {
      type: "tank",
      geometryType: "cylinder",
      color: 0x7f1d1d,
      speed: 0.016 + state.wave * 0.001,
      health: 10 + state.wave * 3,
      score: 20,
      gold: 10,
      baseDamage: 3,
      scale: 1
    };
  }

  if (type === "elite") {
    return {
      type: "elite",
      geometryType: "cylinder",
      color: 0xec4899,
      speed: 0.026 + state.wave * 0.002,
      health: 12 + state.wave * 3,
      score: 35,
      gold: 18,
      baseDamage: 4,
      scale: 1.25
    };
  }

  if (type === "boss_purple") {
    return {
      type,
      geometryType: "box",
      color: 0x9333ea,
      speed: 0.012 + state.wave * 0.0005,
      health: 42 + state.wave * 6,
      score: 120,
      gold: 50,
      baseDamage: 5,
      scale: 2
    };
  }

  if (type === "boss_crusher") {
    return {
      type,
      geometryType: "cylinder",
      color: 0x7f1d1d,
      speed: 0.008 + state.wave * 0.0004,
      health: 85 + state.wave * 10,
      score: 150,
      gold: 60,
      baseDamage: 10,
      scale: 2.4
    };
  }

  if (type === "boss_runner") {
    return {
      type,
      geometryType: "sphere",
      color: 0xf97316,
      speed: 0.028 + state.wave * 0.001,
      health: 32 + state.wave * 4,
      score: 100,
      gold: 45,
      baseDamage: 4,
      scale: 1.8
    };
  }

  if (type === "boss_shield") {
    return {
      type,
      geometryType: "cylinder",
      color: 0x22c55e,
      speed: 0.011 + state.wave * 0.0005,
      health: 62 + state.wave * 8,
      score: 140,
      gold: 58,
      baseDamage: 6,
      scale: 2.1
    };
  }

  if (type === "boss_splitter") {
    return {
      type,
      geometryType: "sphere",
      color: 0xeab308,
      speed: 0.018 + state.wave * 0.0008,
      health: 50 + state.wave * 6,
      score: 130,
      gold: 55,
      baseDamage: 6,
      scale: 2
    };
  }

  if (type === "boss_disruptor") {
    return {
      type,
      geometryType: "box",
      color: 0x06b6d4,
      speed: 0.013 + state.wave * 0.0006,
      health: 55 + state.wave * 7,
      score: 135,
      gold: 56,
      baseDamage: 6,
      scale: 2
    };
  }

  return {
    type: "normal",
    geometryType: "box",
    color: 0xdc2626,
    speed: 0.025 + state.wave * 0.002,
    health: 4 + state.wave * 2,
    score: 10,
    gold: 5,
    baseDamage: 2,
    scale: 1
  };
}

export function getWaveType() {
  return state.wave % 5 === 0 ? "Boss" : "Normal";
}

export function formatEnemyType(type) {
  if (type === "elite") return "Elite Enemy";
  if (type === "fast") return "Fast Enemy";
  if (type === "tank") return "Tank Enemy";
  if (type === "boss_purple") return "Purple Boss";
  if (type === "boss_crusher") return "Crusher Boss";
  if (type === "boss_runner") return "Runner Boss";
  if (type === "boss_shield") return "Shield Boss";
  if (type === "boss_splitter") return "Splitter Boss";
  if (type === "boss_disruptor") return "Disruptor Boss";
  return "Normal Enemy";
}

function calculateAIStrategyName() {
  const memory = state.aiMemory;

  if (memory?.lastStrategy && memory.successScore < -1 && state.wave >= 3) {
    return COUNTER_STRATEGIES[memory.lastStrategy] ?? "Adaptive Mix";
  }

  if (memory?.lastStrategy && memory.successScore > 1) {
    if (Math.random() < 0.6) return memory.lastStrategy;
  }

  if (state.wave % 5 === 0) return calculateBossStrategyName();

  const profile = getTowerProfile();

  if (profile.total === 0) return "Balanced";

  if (profile.towerLimitReached && profile.mixedRatio > 0.55 && state.wave >= 3) {
    return "Late Wave Mix";
  }

  if (profile.relocationRatio >= 0.4 && state.wave >= 3) {
    return "Adaptive Mix";
  }

  if (
    profile.focusManualRatio >= 0.55 &&
    profile.focusClusterRatio >= 0.55 &&
    state.wave >= 3
  ) {
    return "Fast Pressure";
  }

  if (profile.focusAlignedRatio >= 0.58 && state.wave >= 3) {
    if (profile.sniperRatio > 0.25) return "Swarm Pressure";
    if (profile.slowRatio > 0.25) return "Heavy Push";
    if (profile.splashRatio > 0.25) return "Armored Response";
    if (profile.rapidRatio > 0.35) return "Tank Response";
  }

  if (profile.sniperRatio > 0.35) return "Swarm Pressure";
  if (profile.slowRatio > 0.35) return "Heavy Push";
  if (profile.splashRatio > 0.35) return "Armored Response";
  if (profile.rapidRatio > 0.5 && state.wave >= 2) return "Tank Response";
  if (profile.normalRatio > 0.6) return "Fast Pressure";
  if (profile.mixedRatio > 0.55 && state.wave >= 4) return "Adaptive Mix";
  if (state.wave >= 4) return "Late Wave Mix";

  return "Balanced";
}

function calculateAIPlanText(strategy) {
  const memoryText = getMemoryText();
  const transformText = getTransformPlanText();
  const prefix = `${memoryText}${transformText}`;

  if (strategy === "Swarm Pressure") {
    return `${prefix}AI increases fast unit pressure to punish long-range or focused defenses.`;
  }

  if (strategy === "Heavy Push") {
    return `${prefix}AI reduces unit count but sends durable enemies against slow/focus control.`;
  }

  if (strategy === "Armored Response") {
    return `${prefix}AI shifts toward armored tank units to resist splash-heavy defense.`;
  }

  if (strategy === "Tank Response") {
    return `${prefix}AI counters rapid fire with heavy units.`;
  }

  if (strategy === "Fast Pressure") {
    return `${prefix}AI increases speed and unit count to exploit directional blind spots.`;
  }

  if (strategy === "Adaptive Mix") {
    return `${prefix}AI reacts to tower translation and locks a mixed attack pattern.`;
  }

  if (strategy === "Late Wave Mix") {
    return `${prefix}AI locks mixed late-wave pressure after reading the fixed defense layout.`;
  }

  if (
    strategy === "Swarm Boss" ||
    strategy === "Shielded Push" ||
    strategy === "Armored Boss" ||
    strategy === "Crusher Boss" ||
    strategy === "Disruption Boss" ||
    strategy === "Boss Wave"
  ) {
    return `${prefix}Boss plan locked: ${strategy}.`;
  }

  return `${prefix}AI locked balanced enemy composition.`;
}

function shouldApplyBluff() {
  if (state.wave <= 3) return false;

  const isBossWave = state.wave % 5 === 0;
  const memoryScore = state.aiMemory?.successScore ?? 0;
  const profile = getTowerProfile();

  let chance = isBossWave ? 0.08 : 0.18;

  if (profile.relocationRatio >= 0.35) chance += 0.12;
  if (profile.focusManualRatio >= 0.45) chance += 0.08;
  if (profile.focusClusterRatio >= 0.6) chance += 0.06;
  if (profile.towerLimitReached) chance += 0.04;

  if (memoryScore < -1) chance += 0.15;
  if (memoryScore > 1) chance -= 0.08;

  chance = Math.min(0.42, Math.max(0.02, chance));

  return Math.random() < chance;
}

function pickBluffStrategy(visibleStrategy) {
  const pool = state.wave % 5 === 0 ? BOSS_STRATEGIES : NORMAL_STRATEGIES;
  const candidates = pool.filter((strategy) => strategy !== visibleStrategy);

  if (visibleStrategy === "Swarm Pressure") return "Armored Response";
  if (visibleStrategy === "Armored Response") return "Swarm Pressure";
  if (visibleStrategy === "Heavy Push") return "Fast Pressure";
  if (visibleStrategy === "Fast Pressure") return "Heavy Push";
  if (visibleStrategy === "Tank Response") return "Adaptive Mix";

  return candidates[Math.floor(Math.random() * candidates.length)] ?? "Adaptive Mix";
}

function getMemoryText() {
  const memory = state.aiMemory;

  if (!memory?.lastStrategy) return "";

  if (memory.successScore > 1) {
    return `Previous ${memory.lastStrategy} worked. Reinforcing tactic. `;
  }

  if (memory.successScore < -1) {
    const counter = COUNTER_STRATEGIES[memory.lastStrategy] ?? "Adaptive Mix";
    return `Previous ${memory.lastStrategy} failed. Switching to ${counter}. `;
  }

  return "";
}

function getTransformPlanText() {
  const profile = getTowerProfile();

  if (profile.total === 0) return "";

  const notes = [];

  if (profile.relocationRatio >= 0.35) {
    notes.push("tower translations detected");
  }

  if (profile.focusManualRatio >= 0.35) {
    notes.push("manual focus rotations detected");
  }

  if (profile.focusAlignedRatio >= 0.5) {
    notes.push("focus cones cover the active path");
  }

  if (profile.focusClusterRatio >= 0.6) {
    notes.push("many towers face the same direction");
  }

  if (profile.towerLimitReached) {
    notes.push("tower limit reached");
  }

  if (notes.length === 0) return "";

  return `Transform scan: ${notes.join(", ")}. `;
}

function getPressureMultiplier() {
  const score = state.aiMemory?.successScore ?? 0;
  const profile = getTowerProfile();

  let multiplier = 1;

  if (score > 1) multiplier += 0.1;
  if (score < -1) multiplier += 0.18;

  if (profile.relocationRatio >= 0.35) multiplier += 0.06;
  if (profile.focusAlignedRatio >= 0.55) multiplier += 0.05;
  if (profile.towerLimitReached) multiplier += 0.04;

  return multiplier;
}

function getEliteChance() {
  const score = state.aiMemory?.successScore ?? 0;
  const profile = getTowerProfile();

  let chance = 0.12;

  if (score < -1) chance += 0.06;
  if (score > 1) chance += 0.03;

  if (profile.towerLimitReached) chance += 0.03;
  if (profile.focusAlignedRatio >= 0.55) chance += 0.02;

  return Math.min(0.24, chance);
}

function chooseBossType(strategy) {
  const pool = getBossPoolForStrategy(strategy);
  return pool[Math.floor(Math.random() * pool.length)];
}

function calculateBossStrategyName() {
  const profile = getTowerProfile();

  if (profile.relocationRatio >= 0.35 && profile.mixedRatio > 0.45) {
    return "Disruption Boss";
  }

  if (profile.focusAlignedRatio >= 0.55 && profile.sniperRatio > 0.25) {
    return "Swarm Boss";
  }

  if (profile.focusAlignedRatio >= 0.55 && profile.slowRatio > 0.25) {
    return "Shielded Push";
  }

  if (profile.towerLimitReached && profile.rapidRatio > 0.35) {
    return "Crusher Boss";
  }

  if (profile.sniperRatio > 0.35) return "Swarm Boss";
  if (profile.slowRatio > 0.35) return "Shielded Push";
  if (profile.splashRatio > 0.35) return "Armored Boss";
  if (profile.rapidRatio > 0.5) return "Crusher Boss";
  if (profile.mixedRatio > 0.55) return "Disruption Boss";

  return "Boss Wave";
}

function getBossPoolForStrategy(strategy) {
  if (strategy === "Swarm Boss") return BOSS_TYPES.swarm;
  if (strategy === "Shielded Push") return BOSS_TYPES.armored;
  if (strategy === "Armored Boss") return BOSS_TYPES.armored;
  if (strategy === "Crusher Boss") return ["boss_crusher"];
  if (strategy === "Disruption Boss") return BOSS_TYPES.disrupt;

  return BOSS_TYPES.balanced;
}

function getTowerProfile() {
  const total = state.towers.length;

  const normal = countTowerType("normal");
  const rapid = countTowerType("rapid");
  const sniper = countTowerType("sniper");
  const slow = countTowerType("slow");
  const splash = countTowerType("splash");

  const usedTypes = [normal, rapid, sniper, slow, splash].filter((x) => x > 0).length;

  const relocated = countRelocatedTowers();
  const manuallyFocused = countManuallyFocusedTowers();
  const pathFocused = countPathFocusedTowers();
  const focusClusterRatio = getFocusClusterRatio();

  const towerLimit = getCurrentStageTowerLimit();

  return {
    total,
    normal,
    rapid,
    sniper,
    slow,
    splash,

    normalRatio: total ? normal / total : 0,
    rapidRatio: total ? rapid / total : 0,
    sniperRatio: total ? sniper / total : 0,
    slowRatio: total ? slow / total : 0,
    splashRatio: total ? splash / total : 0,
    mixedRatio: total ? usedTypes / 5 : 0,

    relocated,
    manuallyFocused,
    pathFocused,
    towerLimit,
    towerLimitReached: total >= towerLimit,

    relocationRatio: total ? relocated / total : 0,
    focusManualRatio: total ? manuallyFocused / total : 0,
    focusAlignedRatio: total ? pathFocused / total : 0,
    focusClusterRatio
  };
}

function countTowerType(type) {
  return state.towers.filter((tower) => tower.userData.type === type).length;
}

function countRelocatedTowers() {
  return state.towers.filter((tower) => {
    return Boolean(tower.userData.lastRelocationFrom && tower.userData.lastRelocationTo);
  }).length;
}

function countManuallyFocusedTowers() {
  return state.towers.filter((tower) => tower.userData.focusWasManuallyRotated).length;
}

function countPathFocusedTowers() {
  const activeTiles = buildCurrentPathTileList();

  if (activeTiles.length === 0) return 0;

  return state.towers.filter((tower) => isTowerFocusCoveringPath(tower, activeTiles)).length;
}

function getFocusClusterRatio() {
  const focused = state.towers.filter((tower) => tower.userData.focusWasManuallyRotated);

  if (focused.length === 0) return 0;

  const bins = new Map();

  for (const tower of focused) {
    const angle = tower.userData.focusAngle ?? 0;
    const normalized = normalizeAngle(angle);
    const bin = Math.round(((normalized + Math.PI) / (Math.PI * 2)) * 8) % 8;

    bins.set(bin, (bins.get(bin) ?? 0) + 1);
  }

  let max = 0;

  for (const count of bins.values()) {
    max = Math.max(max, count);
  }

  return max / focused.length;
}

function isTowerFocusCoveringPath(tower, activeTiles) {
  const range = tower.userData.range ?? 0;
  const focusAngle = tower.userData.focusAngle ?? 0;
  const focusArc = tower.userData.focusArc ?? Math.PI / 2.35;

  for (const tile of activeTiles) {
    const dx = tile.x - tower.position.x;
    const dz = tile.z - tower.position.z;
    const distance = Math.hypot(dx, dz);

    if (distance <= 0.2 || distance > range) continue;

    const angleToTile = Math.atan2(dx, dz);
    const diff = Math.abs(normalizeAngle(angleToTile - focusAngle));

    if (diff <= focusArc / 2) {
      return true;
    }
  }

  return false;
}

function buildCurrentPathTileList() {
  const path = state.currentPath ?? [];
  const unique = new Map();

  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];

    let x = Math.round(start.x);
    let z = Math.round(start.z);

    const endX = Math.round(end.x);
    const endZ = Math.round(end.z);

    unique.set(`${x},${z}`, { x, z });

    while (x !== endX) {
      x += Math.sign(endX - x);
      unique.set(`${x},${z}`, { x, z });
    }

    while (z !== endZ) {
      z += Math.sign(endZ - z);
      unique.set(`${x},${z}`, { x, z });
    }
  }

  return [...unique.values()];
}

function normalizeAngle(angle) {
  let normalized = angle;

  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;

  return normalized;
}