import { state } from "../game/state.js";
import { getUpgradeCost, getSellRefund } from "../game/upgrade.js";
import { canRelocateNow } from "../systems/relocation.js";
import { getDirectionalFocusText } from "../systems/directionalFocus.js";

export function updateSelectedInfo() {
  const content = document.querySelector("#selectedInfoContent");
  if (!content) return;

  const selected = state.selectedObject;

  if (!selected) {
    content.innerHTML = "None";
    return;
  }

  if (state.towers.includes(selected)) {
    const level = selected.userData.level ?? 1;
    const upgradeCost = getUpgradeCost(selected);
    const refund = getSellRefund(selected);
    const targetMode = formatTargetMode(selected.userData.targetMode ?? "nearest");
    const critChance = Math.round((selected.userData.critChance ?? 0) * 100);

    const ultimateName =
      selected.userData.ultimateName ?? getUltimateName(selected.userData.type);

    const ultimateCharge = Math.floor(selected.userData.ultimateCharge ?? 0);
    const ultimateStatus = getUltimateStatus(selected);

    const relocationText = getRelocationText(selected);

    const upgradeInfo =
      level >= 3
        ? "Max Level"
        : `
          Upgrade Cost: ${upgradeCost} Gold<br>
          Next Level: ${level + 1}<br>
          Damage: ${selected.userData.damage} → ${selected.userData.damage + 1}<br>
          Range: ${selected.userData.range.toFixed(1)} → ${(selected.userData.range + 0.4).toFixed(1)}<br>
          Fire Rate: ${selected.userData.fireRate} → ${Math.max(10, selected.userData.fireRate - 6)}
        `;

    content.innerHTML = `
      Type: ${formatTowerType(selected.userData.type)}<br>
      Level: ${level}<br>
      Target Mode: ${targetMode}<br>
      Damage: ${selected.userData.damage}<br>
      Crit Chance: ${critChance}%<br>
      Range: ${selected.userData.range.toFixed(1)}<br>
      Fire Rate: ${selected.userData.fireRate}<br>
      Status: ${selected.userData.slowTimer > 0 ? "Slowed" : "Normal"}<br>
      Sell Refund: ${refund} Gold<br>
      <hr>
      <b>Directional Focus</b><br>
      ${getDirectionalFocusText(selected)}<br>
      Rotate: Q / E<br>
      <hr>
      <b>Translation</b><br>
      ${relocationText}<br>
      <hr>
      Ultimate: ${ultimateName}<br>
      Charge: ${ultimateCharge}%<br>
      Ultimate Status: ${ultimateStatus}<br>
      Key: F<br>
      <hr>
      ${upgradeInfo}
    `;
    return;
  }

  if (state.enemies.includes(selected)) {
    content.innerHTML = `
      Type: ${formatEnemyType(selected.userData.type)}<br>
      HP: ${Math.max(0, Math.ceil(selected.userData.health))} / ${selected.userData.maxHealth}<br>
      Speed: ${selected.userData.speed.toFixed(3)}<br>
      Base Damage: ${selected.userData.baseDamage}<br>
      Reward: ${selected.userData.gold} Gold / ${selected.userData.score} Score
    `;
    return;
  }

  content.innerHTML = "Unknown";
}

function getRelocationText(tower) {
  if (tower.userData.relocationTween?.active) {
    return "Translate Status: Moving";
  }

  const lastFrom = tower.userData.lastRelocationFrom;
  const lastTo = tower.userData.lastRelocationTo;

  const lastMove =
    lastFrom && lastTo
      ? `<br>Last Translate: ${lastFrom} → ${lastTo}`
      : "";

  if (canRelocateNow()) {
    return `
      Translate: Available (${state.relocationTokens})<br>
      Move: Arrow Keys${lastMove}
    `;
  }

  return `Translate: Only between waves${lastMove}`;
}

function getUltimateStatus(tower) {
  if (tower.userData.ultimateActiveTimer > 0) return "Active";
  if (tower.userData.ultimateCooldown > 0) return "Cooldown";
  if ((tower.userData.ultimateCharge ?? 0) >= 100) return "Ready";

  return "Charging";
}

function getUltimateName(type) {
  if (type === "rapid") return "Overdrive";
  if (type === "sniper") return "Piercing Shot";
  if (type === "slow") return "Freeze Field";
  if (type === "splash") return "Meteor Blast";

  return "Focus Burst";
}

function formatTargetMode(mode) {
  if (mode === "first") return "First";
  if (mode === "strongest") return "Strongest";
  if (mode === "weakest") return "Weakest";
  return "Nearest";
}

function formatTowerType(type) {
  if (type === "rapid") return "Rapid Tower";
  if (type === "sniper") return "Sniper Tower";
  if (type === "slow") return "Slow Tower";
  if (type === "splash") return "Splash Tower";
  return "Normal Tower";
}

function formatEnemyType(type) {
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