import { state } from "./state.js";
import { updateTowerLabelText, removeTowerLabel } from "../visuals/towerLabels.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";
import { applyTowerUpgradeVisual } from "../entities/towers.js";

export function getUpgradeCost(tower) {
  if (!tower) return null;

  const level = tower.userData.level ?? 1;

  if (level >= 3) return null;

  return level === 1 ? 35 : 55;
}

export function getSellRefund(tower) {
  if (!tower) return 0;

  const level = tower.userData.level ?? 1;

  if (level === 1) return 15;
  if (level === 2) return 30;

  return 45;
}

export function canUpgradeTower(tower) {
  if (!tower) return false;
  if (!state.towers.includes(tower)) return false;

  const cost = getUpgradeCost(tower);

  if (cost === null) return false;

  return state.gold >= cost;
}

export function upgradeSelectedTower() {
  if (!state.selectedObject) return;
  if (!state.towers.includes(state.selectedObject)) return;

  const tower = state.selectedObject;

  if (!canUpgradeTower(tower)) {
    const cost = getUpgradeCost(tower);

    if (cost === null) {
      showAnnouncement("Tower already at max level");
      addEventLog(`${formatTowerType(tower.userData.type)} is already max level.`);
      return;
    }

    showAnnouncement("Not enough gold for upgrade");
    addEventLog(`Upgrade failed. Need ${cost} gold.`);
    return;
  }

  const upgradeCost = getUpgradeCost(tower);

  state.gold -= upgradeCost;
  tower.userData.level++;

  tower.userData.damage += getDamageUpgradeBonus(tower);
  tower.userData.range += getRangeUpgradeBonus(tower);
  tower.userData.fireRate = Math.max(
    10,
    tower.userData.fireRate - getFireRateUpgradeBonus(tower)
  );

  boostUltimateOnUpgrade(tower);
  applyTowerUpgradeVisual(tower);
  updateTowerLabelText(tower);

  const level = tower.userData.level;

  showAnnouncement(`${formatTowerType(tower.userData.type)} upgraded to LVL ${level}`);

  addEventLog(
    `${formatTowerType(tower.userData.type)} upgraded to level ${level}. Visual modules installed.`
  );
}

export function sellTower(scene, tower) {
  if (!tower) return;

  const key =
    tower.userData.occupiedKey ??
    `${Math.round(tower.position.x)},${Math.round(tower.position.z)}`;

  state.towerSet.delete(key);

  const index = state.towers.indexOf(tower);
  if (index !== -1) {
    state.towers.splice(index, 1);
  }

  removeTowerLabel(scene, tower);
  scene.remove(tower);
  disposeTower(tower);

  if (state.selectedObject === tower) {
    state.selectedObject = null;
  }

  const refund = getSellRefund(tower);
  state.gold += refund;

  addEventLog(`${formatTowerType(tower.userData.type)} sold. +${refund} gold.`);
}

function getDamageUpgradeBonus(tower) {
  const type = tower.userData.type;

  if (type === "sniper") return tower.userData.level >= 3 ? 3 : 2;
  if (type === "splash") return tower.userData.level >= 3 ? 2 : 1;
  if (type === "rapid") return 1;
  if (type === "slow") return 1;

  return tower.userData.level >= 3 ? 2 : 1;
}

function getRangeUpgradeBonus(tower) {
  const type = tower.userData.type;

  if (type === "sniper") return 0.55;
  if (type === "slow") return 0.45;
  if (type === "splash") return 0.42;

  return 0.35;
}

function getFireRateUpgradeBonus(tower) {
  const type = tower.userData.type;

  if (type === "rapid") return 8;
  if (type === "sniper") return 7;
  if (type === "splash") return 6;
  if (type === "slow") return 5;

  return 6;
}

function boostUltimateOnUpgrade(tower) {
  const currentCharge = tower.userData.ultimateCharge ?? 0;
  const bonus = tower.userData.level >= 3 ? 35 : 20;

  tower.userData.ultimateCharge = Math.min(100, currentCharge + bonus);

  if (tower.userData.ultimateCooldown > 0) {
    tower.userData.ultimateCooldown = Math.max(
      0,
      tower.userData.ultimateCooldown - 90
    );
  }
}

function disposeTower(tower) {
  tower.traverse?.((child) => {
    if (!child.isMesh && !child.isSprite) return;

    child.geometry?.dispose?.();

    if (Array.isArray(child.material)) {
      child.material.forEach(disposeMaterial);
    } else {
      disposeMaterial(child.material);
    }
  });
}

function disposeMaterial(material) {
  if (!material) return;

  material.map?.dispose?.();
  material.dispose?.();
}

function formatTowerType(type) {
  if (type === "rapid") return "Rapid Tower";
  if (type === "sniper") return "Sniper Tower";
  if (type === "slow") return "Slow Tower";
  if (type === "splash") return "Splash Tower";

  return "Normal Tower";
}