import { state } from "../game/state.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";
import { getCurrentStageEffect } from "../game/stages.js";

const achievements = {
  perfectDefense: {
    id: "perfectDefense",
    title: "Perfect Defense",
    description: "Clear a wave without taking base damage.",
    rewardGold: 25,
    rewardScore: 75,
    unlocked: false
  },

  comboHunter: {
    id: "comboHunter",
    title: "Combo Hunter",
    description: "Reach combo x5.",
    rewardGold: 15,
    rewardScore: 60,
    unlocked: false
  },

  economist: {
    id: "economist",
    title: "Economist",
    description: "Reach 200 gold.",
    rewardGold: 20,
    rewardScore: 50,
    unlocked: false
  },

  bossBreaker: {
    id: "bossBreaker",
    title: "Boss Breaker",
    description: "Clear a boss wave.",
    rewardGold: 45,
    rewardScore: 120,
    unlocked: false
  },

  tactician: {
    id: "tactician",
    title: "Tactician",
    description: "Build at least 2 towers recommended for the current stage.",
    rewardGold: 20,
    rewardScore: 70,
    unlocked: false
  },

  survivor: {
    id: "survivor",
    title: "Survivor",
    description: "Reach wave 10.",
    rewardGold: 40,
    rewardScore: 150,
    unlocked: false
  }
};

let waveStartBaseHp = null;

export function initAchievements() {
  renderAchievementPanel();
}

export function registerWaveStarted() {
  waveStartBaseHp = state.baseHp;
}

export function registerWaveCleared({ wasBossWave = false } = {}) {
  if (
    waveStartBaseHp !== null &&
    state.baseHp === waveStartBaseHp &&
    !achievements.perfectDefense.unlocked
  ) {
    unlockAchievement("perfectDefense");
  }

  if (wasBossWave && !achievements.bossBreaker.unlocked) {
    unlockAchievement("bossBreaker");
  }

  waveStartBaseHp = null;
}

export function registerComboMilestone(combo) {
  if (combo >= 5 && !achievements.comboHunter.unlocked) {
    unlockAchievement("comboHunter");
  }
}

export function updateAchievements() {
  if (!state.started) {
    renderAchievementPanel();
    return;
  }

  if (state.gold >= 200 && !achievements.economist.unlocked) {
    unlockAchievement("economist");
  }

  if (state.wave >= 10 && !achievements.survivor.unlocked) {
    unlockAchievement("survivor");
  }

  if (!achievements.tactician.unlocked && hasRecommendedTowerSetup()) {
    unlockAchievement("tactician");
  }

  renderAchievementPanel();
}

export function resetAchievementsRuntimeTracking() {
  waveStartBaseHp = null;
}

export function resetAllAchievements() {
  for (const achievement of Object.values(achievements)) {
    achievement.unlocked = false;
  }

  resetAchievementsRuntimeTracking();
  renderAchievementPanel();
}

function hasRecommendedTowerSetup() {
  const effect = getCurrentStageEffect();
  const recommendedTypes = getRecommendedTowerTypes(effect.id);

  const recommendedCount = state.towers.filter((tower) =>
    recommendedTypes.includes(tower.userData.type)
  ).length;

  return recommendedCount >= 2;
}

function unlockAchievement(id) {
  const achievement = achievements[id];

  if (!achievement || achievement.unlocked) return;

  achievement.unlocked = true;

  state.gold += achievement.rewardGold;
  state.score += achievement.rewardScore;

  addEventLog(
    `Achievement unlocked: ${achievement.title}. +${achievement.rewardGold}G +${achievement.rewardScore} score.`
  );

  showAnnouncement(
    `🏆 ${achievement.title} +${achievement.rewardGold}G`
  );

  renderAchievementPanel();
}

function renderAchievementPanel() {
  const content = document.querySelector("#achievementContent");
  if (!content) return;

  const list = Object.values(achievements);
  const unlockedCount = list.filter((achievement) => achievement.unlocked).length;
  const totalCount = list.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  content.innerHTML = `
    <div class="achievement-progress">
      <div class="achievement-progress-top">
        <span>Progress</span>
        <b>${unlockedCount}/${totalCount}</b>
      </div>

      <div class="achievement-progress-bar">
        <div style="width: ${progressPercent}%"></div>
      </div>
    </div>

    ${list
      .map((achievement) => {
        const status = achievement.unlocked ? "Unlocked" : "Locked";
        const className = achievement.unlocked ? "unlocked" : "locked";

        return `
          <div class="achievement-item ${className}">
            <div>
              <b>${achievement.title}</b>
              <span>${achievement.description}</span>
              <small>Reward: +${achievement.rewardGold}G / +${achievement.rewardScore} score</small>
            </div>
            <em>${status}</em>
          </div>
        `;
      })
      .join("")}
  `;
}

function getRecommendedTowerTypes(effectId) {
  if (effectId === "forest_balance") {
    return ["normal", "rapid"];
  }

  if (effectId === "canyon_wind") {
    return ["rapid", "sniper"];
  }

  if (effectId === "frozen_chill") {
    return ["slow", "sniper"];
  }

  if (effectId === "ancient_armor") {
    return ["sniper", "splash"];
  }

  if (effectId === "lava_pressure") {
    return ["sniper", "splash"];
  }

  if (effectId === "swamp_mud") {
    return ["splash", "slow"];
  }

  if (effectId === "crystal_resonance") {
    return ["sniper", "rapid"];
  }

  return ["normal", "rapid"];
}