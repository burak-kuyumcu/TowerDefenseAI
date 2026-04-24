import { state } from "./state.js";

export function upgradeSelectedTower() {
  if (!state.selectedObject) return;
  if (!state.towers.includes(state.selectedObject)) return;

  const tower = state.selectedObject;

  if (!tower.userData.level) tower.userData.level = 1;
  if (tower.userData.level >= 3) return;

  const upgradeCost = tower.userData.level === 1 ? 35 : 55;
  if (state.gold < upgradeCost) return;

  state.gold -= upgradeCost;
  tower.userData.level++;

  tower.userData.damage += 1;
  tower.userData.range += 0.4;
  tower.userData.fireRate = Math.max(10, tower.userData.fireRate - 6);

  tower.scale.multiplyScalar(1.15);
}

export function sellTower(scene, tower) {
  const key =
    tower.userData.occupiedKey ??
    `${Math.round(tower.position.x)},${Math.round(tower.position.z)}`;

  state.towerSet.delete(key);

  const index = state.towers.indexOf(tower);
  if (index !== -1) {
    state.towers.splice(index, 1);
  }

  scene.remove(tower);

  if (state.selectedObject === tower) {
    state.selectedObject = null;
  }

  const level = tower.userData.level ?? 1;
  const refund = level === 1 ? 15 : level === 2 ? 30 : 45;

  state.gold += refund;
}