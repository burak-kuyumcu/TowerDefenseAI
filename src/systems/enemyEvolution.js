import * as THREE from "three";
import { state } from "../game/state.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";

let initialized = false;
let activeWave = 0;
let activeMutation = null;
let announcedWave = 0;

const MUTATIONS = {
  none: {
    id: "none",
    name: "No Mutation",
    shortName: "Stable",
    description: "Enemy strain is stable.",
    hpMultiplier: 1,
    color: 0xe0f2fe,
    regen: false,
    shield: false
  },
  armored: {
    id: "armored",
    name: "Armored Swarm",
    shortName: "Armored",
    description: "Enemies gain extra durability.",
    hpMultiplier: 1.28,
    color: 0xfacc15,
    regen: false,
    shield: false
  },
  runners: {
    id: "runners",
    name: "Runner Pack",
    shortName: "Runners",
    description: "Enemies are lighter but not slowed by mutation.",
    hpMultiplier: 0.92,
    color: 0x22c55e,
    regen: false,
    shield: false
  },
  regenerative: {
    id: "regenerative",
    name: "Regenerative Cells",
    shortName: "Regen",
    description: "Enemies slowly regenerate health while alive.",
    hpMultiplier: 1.08,
    color: 0x84cc16,
    regen: true,
    shield: false
  },
  shielded: {
    id: "shielded",
    name: "Shielded Strain",
    shortName: "Shielded",
    description: "Enemies receive a protective health layer.",
    hpMultiplier: 1.14,
    color: 0x60a5fa,
    regen: false,
    shield: true
  },
  bossProtocol: {
    id: "bossProtocol",
    name: "Boss Protocol",
    shortName: "Boss Protocol",
    description: "Boss enemy receives extra durability and regeneration.",
    hpMultiplier: 1.36,
    color: 0xfb7185,
    regen: true,
    shield: true
  }
};

export function initEnemyEvolution() {
  initialized = true;
  activeWave = 0;
  activeMutation = MUTATIONS.none;
  announcedWave = 0;

  writeStateEvolution();
}

export function updateEnemyEvolution() {
  if (!initialized) {
    initEnemyEvolution();
  }

  if (!state.started) return;
  if (state.gameOver) return;
  if (state.paused) return;

  syncWaveMutation();
  applyMutationToNewEnemies();
  updateRegeneration();
}

export function resetEnemyEvolution() {
  activeWave = 0;
  activeMutation = MUTATIONS.none;
  announcedWave = 0;

  if (Array.isArray(state.enemies)) {
    for (const enemy of state.enemies) {
      if (!enemy || !enemy.userData) continue;

      enemy.userData.evolutionApplied = false;
      enemy.userData.evolutionWave = 0;
      enemy.userData.evolutionMutation = "none";
      enemy.userData.evolutionMutationName = "Stable";
      enemy.userData.evolutionRegenTimer = 0;
      enemy.userData.evolutionShield = 0;
    }
  }

  writeStateEvolution();
}

export function getEnemyEvolutionInfo() {
  if (!activeMutation) {
    return {
      name: "Stable",
      description: "Enemy strain is stable."
    };
  }

  return {
    name: activeMutation.shortName,
    description: activeMutation.description
  };
}

function syncWaveMutation() {
  const wave = Number(state.wave || 1);

  if (activeWave === wave && activeMutation) {
    return;
  }

  activeWave = wave;
  activeMutation = chooseMutationForWave(wave);

  writeStateEvolution();

  if (announcedWave !== wave && activeMutation.id !== "none") {
    announcedWave = wave;

    addEventLog(
      "Enemy evolution detected: " +
        activeMutation.name +
        ". " +
        activeMutation.description
    );

    if (wave >= 3) {
      showAnnouncement("Enemy Evolution: " + activeMutation.shortName);
    }
  }
}

function chooseMutationForWave(wave) {
  if (wave < 3) {
    return MUTATIONS.none;
  }

  if (wave % 5 === 0) {
    return MUTATIONS.bossProtocol;
  }

  const towerProfile = analyzeTowerProfile();

  if (towerProfile.sniper >= 2) return MUTATIONS.runners;
  if (towerProfile.rapid >= 2) return MUTATIONS.armored;
  if (towerProfile.slow >= 2) return MUTATIONS.shielded;
  if (towerProfile.splash >= 2) return MUTATIONS.regenerative;

  const rotation = wave % 4;

  if (rotation === 0) return MUTATIONS.armored;
  if (rotation === 1) return MUTATIONS.runners;
  if (rotation === 2) return MUTATIONS.regenerative;

  return MUTATIONS.shielded;
}

function analyzeTowerProfile() {
  const profile = {
    normal: 0,
    rapid: 0,
    sniper: 0,
    slow: 0,
    splash: 0,
    unknown: 0
  };

  if (!Array.isArray(state.towers)) {
    return profile;
  }

  for (const tower of state.towers) {
    if (!tower) continue;

    const type = getTowerType(tower);

    if (profile[type] === undefined) {
      profile.unknown++;
    } else {
      profile[type]++;
    }
  }

  return profile;
}

function applyMutationToNewEnemies() {
  if (!Array.isArray(state.enemies)) return;
  if (!activeMutation) return;

  for (const enemy of state.enemies) {
    if (!isValidEnemy(enemy)) continue;

    const data = enemy.userData || {};
    enemy.userData = data;

    if (data.evolutionApplied && data.evolutionWave === activeWave) {
      continue;
    }

    applyMutation(enemy, activeMutation);
  }
}

function applyMutation(enemy, mutation) {
  const data = enemy.userData || {};
  enemy.userData = data;

  const healthInfo = getHealthInfo(data);

  const newMaxHp = Math.max(
    1,
    Math.ceil(healthInfo.maxHp * mutation.hpMultiplier)
  );

  const currentRatio =
    healthInfo.maxHp > 0 ? healthInfo.hp / healthInfo.maxHp : 1;

  let newHp = Math.max(1, Math.ceil(newMaxHp * currentRatio));
  let finalMaxHp = newMaxHp;

  if (mutation.shield) {
    const shieldBonus = Math.ceil(newMaxHp * 0.12);
    newHp += shieldBonus;
    finalMaxHp += shieldBonus;
    data.evolutionShield = shieldBonus;
  } else {
    data.evolutionShield = 0;
  }

  writeHealth(data, newHp, finalMaxHp);

  data.evolutionApplied = true;
  data.evolutionWave = activeWave;
  data.evolutionMutation = mutation.id;
  data.evolutionMutationName = mutation.shortName;
  data.evolutionRegenTimer = 0;

  if (mutation.id === "bossProtocol") {
    data.isBoss = data.isBoss || data.boss || activeWave % 5 === 0;
    data.evolutionBossProtocol = true;
  }

  tintEnemy(enemy, mutation.color);
  scaleEnemy(enemy, mutation);
}

function updateRegeneration() {
  if (!Array.isArray(state.enemies)) return;

  for (const enemy of state.enemies) {
    if (!isValidEnemy(enemy)) continue;

    const data = enemy.userData || {};

    const canRegen =
      data.evolutionMutation === "regenerative" ||
      data.evolutionMutation === "bossProtocol";

    if (!canRegen) continue;

    data.evolutionRegenTimer = Number(data.evolutionRegenTimer || 0) + 1;

    if (data.evolutionRegenTimer < 70) {
      continue;
    }

    data.evolutionRegenTimer = 0;

    const healthInfo = getHealthInfo(data);

    if (healthInfo.hp >= healthInfo.maxHp) {
      continue;
    }

    const regenAmount = Math.max(1, Math.ceil(healthInfo.maxHp * 0.015));
    const newHp = Math.min(healthInfo.maxHp, healthInfo.hp + regenAmount);

    writeHealth(data, newHp, healthInfo.maxHp);
  }
}

function writeStateEvolution() {
  if (!state.enemyEvolution) {
    state.enemyEvolution = {};
  }

  state.enemyEvolution.wave = activeWave;
  state.enemyEvolution.id = activeMutation ? activeMutation.id : "none";
  state.enemyEvolution.name = activeMutation
    ? activeMutation.shortName
    : "Stable";
  state.enemyEvolution.description = activeMutation
    ? activeMutation.description
    : "Enemy strain is stable.";
}

function getHealthInfo(data) {
  const hp = firstValidNumber(
    data.hp,
    data.health,
    data.currentHp,
    data.currentHealth,
    data.life,
    20
  );

  const maxHp = firstValidNumber(
    data.maxHp,
    data.maxHealth,
    data.totalHp,
    data.totalHealth,
    data.maxLife,
    hp,
    20
  );

  return {
    hp: hp,
    maxHp: maxHp
  };
}

function writeHealth(data, hp, maxHp) {
  data.hp = hp;
  data.health = hp;
  data.currentHp = hp;
  data.currentHealth = hp;

  data.maxHp = maxHp;
  data.maxHealth = maxHp;
  data.totalHp = maxHp;
  data.totalHealth = maxHp;
}

function tintEnemy(enemy, colorValue) {
  const tintColor = new THREE.Color(colorValue);

  enemy.traverse(function (child) {
    if (!child || !child.material) return;

    if (!child.userData) {
      child.userData = {};
    }

    if (!child.userData.evolutionMaterialCloned) {
      if (Array.isArray(child.material)) {
        const clonedMaterials = [];

        for (const material of child.material) {
          clonedMaterials.push(material.clone());
        }

        child.material = clonedMaterials;
      } else {
        child.material = child.material.clone();
      }

      child.userData.evolutionMaterialCloned = true;
    }

    if (Array.isArray(child.material)) {
      for (const material of child.material) {
        tintMaterial(material, tintColor);
      }
    } else {
      tintMaterial(child.material, tintColor);
    }
  });
}

function tintMaterial(material, tintColor) {
  if (!material) return;

  if (material.color) {
    material.color.lerp(tintColor, 0.18);
  }

  if (material.emissive) {
    material.emissive.copy(tintColor);
    material.emissiveIntensity = 0.06;
  }
}

function scaleEnemy(enemy, mutation) {
  if (!enemy || !enemy.scale) return;

  if (enemy.userData.evolutionScaleApplied) {
    return;
  }

  let scale = 1;

  if (mutation.id === "armored") scale = 1.04;
  if (mutation.id === "shielded") scale = 1.035;
  if (mutation.id === "runners") scale = 0.97;
  if (mutation.id === "regenerative") scale = 1.02;
  if (mutation.id === "bossProtocol") scale = 1.08;

  enemy.scale.multiplyScalar(scale);
  enemy.userData.evolutionScaleApplied = true;
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

function isValidEnemy(enemy) {
  if (!enemy) return false;
  if (!enemy.parent) return false;
  if (!enemy.position) return false;

  const data = enemy.userData || {};

  if (data.dead) return false;
  if (data.removed) return false;
  if (data.reachedGoal) return false;

  return true;
}

function firstValidNumber() {
  for (let i = 0; i < arguments.length; i++) {
    const value = Number(arguments[i]);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return 1;
}