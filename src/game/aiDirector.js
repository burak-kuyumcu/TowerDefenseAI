import { state } from "./state.js";

const BOSS_TYPES = ["boss_purple", "boss_crusher", "boss_runner"];

export function getAIStrategyName() {
  if (state.wave % 5 === 0) return "Boss Wave";

  const profile = getTowerProfile();

  if (profile.total === 0) return "Balanced";

  if (profile.sniperRatio > 0.35) return "Swarm Pressure";
  if (profile.slowRatio > 0.35) return "Heavy Push";
  if (profile.splashRatio > 0.35) return "Armored Response";
  if (profile.rapidRatio > 0.55 && state.wave >= 2) return "Tank Response";
  if (profile.normalRatio > 0.65) return "Fast Pressure";
  if (state.wave >= 4) return "Late Wave Mix";

  return "Balanced";
}

export function chooseEnemyType() {
  if (state.wave % 5 === 0) {
    return BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
  }

  if (state.wave >= 3 && Math.random() < 0.12) {
    return "elite";
  }

  const strategy = getAIStrategyName();

  let fastChance = 0.35;
  let tankChance = 0;

  if (strategy === "Fast Pressure") {
    fastChance = 0.6;
  }

  if (strategy === "Tank Response") {
    tankChance = 0.3;
    fastChance = 0.25;
  }

  if (strategy === "Swarm Pressure") {
    fastChance = 0.7;
    tankChance = 0.05;
  }

  if (strategy === "Heavy Push") {
    tankChance = 0.45;
    fastChance = 0.18;
  }

  if (strategy === "Armored Response") {
    tankChance = 0.55;
    fastChance = 0.15;
  }

  if (strategy === "Late Wave Mix") {
    tankChance = 0.18;
    fastChance = 0.4;
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
      type: "boss_purple",
      geometryType: "box",
      color: 0x9333ea,
      speed: 0.012 + state.wave * 0.0005,
      health: 40 + state.wave * 6,
      score: 120,
      gold: 50,
      baseDamage: 5,
      scale: 2
    };
  }

  if (type === "boss_crusher") {
    return {
      type: "boss_crusher",
      geometryType: "cylinder",
      color: 0x7f1d1d,
      speed: 0.008 + state.wave * 0.0004,
      health: 80 + state.wave * 10,
      score: 150,
      gold: 60,
      baseDamage: 10,
      scale: 2.4
    };
  }

  if (type === "boss_runner") {
    return {
      type: "boss_runner",
      geometryType: "sphere",
      color: 0xf97316,
      speed: 0.028 + state.wave * 0.001,
      health: 30 + state.wave * 4,
      score: 100,
      gold: 45,
      baseDamage: 4,
      scale: 1.8
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

function getTowerProfile() {
  const total = state.towers.length;

  const normal = countTowerType("normal");
  const rapid = countTowerType("rapid");
  const sniper = countTowerType("sniper");
  const slow = countTowerType("slow");
  const splash = countTowerType("splash");

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
    splashRatio: total ? splash / total : 0
  };
}

function countTowerType(type) {
  return state.towers.filter((tower) => tower.userData.type === type).length;
}