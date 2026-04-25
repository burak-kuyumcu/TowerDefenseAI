import { state } from "./state.js";
import { updateTowerLabelText, removeTowerLabel } from "./towerLabels.js";
import { addEventLog } from "./eventLog.js";

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

  if (!canUpgradeTower(tower)) return;

  const upgradeCost = getUpgradeCost(tower);

  state.gold -= upgradeCost;
  tower.userData.level++;

  tower.userData.damage += 1;
  tower.userData.range += 0.4;
  tower.userData.fireRate = Math.max(10, tower.userData.fireRate - 6);

  tower.scale.multiplyScalar(1.15);
  updateTowerLabelText(tower);

  addEventLog(
    `${formatTowerType(tower.userData.type)} upgraded to level ${tower.userData.level}.`
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

  if (state.selectedObject === tower) {
    state.selectedObject = null;
  }

  const refund = getSellRefund(tower);
  state.gold += refund;

  addEventLog(`${formatTowerType(tower.userData.type)} sold. +${refund} gold.`);
}

function formatTowerType(type) {
  if (type === "rapid") return "Rapid Tower";
  if (type === "sniper") return "Sniper Tower";
  if (type === "slow") return "Slow Tower";
  if (type === "splash") return "Splash Tower";
  return "Normal Tower";
}