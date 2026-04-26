import { state } from "./state.js";

const BOSS_TYPES = {
  swarm: ["boss_runner", "boss_splitter"],
  armored: ["boss_crusher", "boss_shield"],
  disrupt: ["boss_purple", "boss_disruptor"],
  balanced: ["boss_purple", "boss_runner", "boss_crusher"]
};

export function getAIStrategyName() {
  if (state.wave % 5 === 0) return getBossStrategyName();

  const profile = getTowerProfile();

  if (profile.total === 0) return "Balanced";

  if (profile.sniperRatio > 0.35) return "Swarm Pressure";
  if (profile.slowRatio > 0.35) return "Heavy Push";
  if (profile.splashRatio > 0.35) return "Armored Response";
  if (profile.rapidRatio > 0.5 && state.wave >= 2) return "Tank Response";
  if (profile.normalRatio > 0.6) return "Fast Pressure";
  if (profile.mixedRatio > 0.55 && state.wave >= 4) return "Adaptive Mix";
  if (state.wave >= 4) return "Late Wave Mix";

  return "Balanced";
}

export function chooseEnemyType() {
  if (state.wave % 5 === 0) {
    return chooseBossType();
  }

  if (state.wave >= 3 && Math.random() < 0.12) {
    return "elite";
  }

  const strategy = getAIStrategyName();

  let fastChance = 0.35;
  let tankChance = 0;

  if (strategy === "Fast Pressure") {
    fastChance = 0.62;
  }

  if (strategy === "Tank Response") {
    tankChance = 0.35;
    fastChance = 0.22;
  }

  if (strategy === "Swarm Pressure") {
    fastChance = 0.72;
    tankChance = 0.05;
  }

  if (strategy === "Heavy Push") {
    tankChance = 0.48;
    fastChance = 0.16;
  }

  if (strategy === "Armored Response") {
    tankChance = 0.58;
    fastChance = 0.12;
  }

  if (strategy === "Adaptive Mix" || strategy === "Late Wave Mix") {
    tankChance = 0.22;
    fastChance = 0.42;
  }

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

export function getAIPlanText() {
  const strategy = getAIStrategyName();

  if (strategy === "Swarm Pressure") {
    return "Sniper pattern detected. AI prepares fast units.";
  }

  if (strategy === "Heavy Push") {
    return "Slow tower pattern detected. AI prepares durable enemies.";
  }

  if (strategy === "Armored Response") {
    return "Splash tower concentration detected. AI prepares armored push.";
  }

  if (strategy === "Tank Response") {
    return "Rapid fire detected. AI prepares tank response.";
  }

  if (strategy === "Fast Pressure") {
    return "Normal tower pattern detected. AI prepares fast pressure.";
  }

  if (strategy === "Adaptive Mix") {
    return "Balanced defense detected. AI prepares mixed attack.";
  }

  if (strategy === "Boss Wave") {
    return `Boss selected: ${formatBossType(chooseBossTypePreview())}.`;
  }

  return "AI prepares balanced enemy composition.";
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

function chooseBossType() {
  const pool = getBossPoolForCurrentProfile();
  return pool[Math.floor(Math.random() * pool.length)];
}

function chooseBossTypePreview() {
  const pool = getBossPoolForCurrentProfile();
  return pool[0] ?? "boss_purple";
}

function getBossStrategyName() {
  const profile = getTowerProfile();

  if (profile.sniperRatio > 0.35) return "Swarm Boss";
  if (profile.slowRatio > 0.35) return "Shielded Push";
  if (profile.splashRatio > 0.35) return "Armored Boss";
  if (profile.rapidRatio > 0.5) return "Crusher Boss";
  if (profile.mixedRatio > 0.55) return "Disruption Boss";

  return "Boss Wave";
}

function getBossPoolForCurrentProfile() {
  const profile = getTowerProfile();

  if (profile.sniperRatio > 0.35) return BOSS_TYPES.swarm;
  if (profile.slowRatio > 0.35) return BOSS_TYPES.armored;
  if (profile.splashRatio > 0.35) return BOSS_TYPES.armored;
  if (profile.rapidRatio > 0.5) return ["boss_crusher"];
  if (profile.mixedRatio > 0.55) return BOSS_TYPES.disrupt;

  return BOSS_TYPES.balanced;
}

function formatBossType(type) {
  if (type === "boss_crusher") return "Crusher Boss";
  if (type === "boss_runner") return "Runner Boss";
  if (type === "boss_shield") return "Shield Boss";
  if (type === "boss_splitter") return "Splitter Boss";
  if (type === "boss_disruptor") return "Disruptor Boss";
  return "Purple Boss";
}

function getTowerProfile() {
  const total = state.towers.length;

  const normal = countTowerType("normal");
  const rapid = countTowerType("rapid");
  const sniper = countTowerType("sniper");
  const slow = countTowerType("slow");
  const splash = countTowerType("splash");

  const usedTypes = [normal, rapid, sniper, slow, splash].filter((x) => x > 0).length;

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
    mixedRatio: total ? usedTypes / 5 : 0
  };
}

function countTowerType(type) {
  return state.towers.filter((tower) => tower.userData.type === type).length;
}