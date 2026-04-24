import { state } from "./state.js";

export function chooseEnemyType() {
  const normalTowerCount = state.towers.filter(
    (tower) => tower.userData.type === "normal"
  ).length;

  const rapidTowerCount = state.towers.filter(
    (tower) => tower.userData.type === "rapid"
  ).length;

  const totalTowers = state.towers.length;

  if (totalTowers === 0) {
    return Math.random() < 0.35 ? "fast" : "normal";
  }

  const rapidRatio = rapidTowerCount / totalTowers;
  const normalRatio = normalTowerCount / totalTowers;

  let fastChance = 0.35;
  let tankChance = 0.0;

  // Oyuncu çok yavaş ama güçlü normal tower koyarsa hızlı düşman artar.
  if (normalRatio > 0.65) {
    fastChance += 0.25;
  }

  // Oyuncu çok rapid tower koyarsa tank düşman gelmeye başlar.
  if (rapidRatio > 0.55 && state.wave >= 2) {
    tankChance += 0.25;
  }

  // Wave ilerledikçe tank ihtimali artsın.
  if (state.wave >= 4) {
    tankChance += 0.15;
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
      baseDamage: 1
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
      baseDamage: 3
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
    baseDamage: 2
  };
}