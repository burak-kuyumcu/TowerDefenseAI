import { state } from "./state.js";
import {
  upgradeSelectedTower,
  sellTower,
  getUpgradeCost,
  canUpgradeTower
} from "./upgrade.js";

let initialized = false;

export function initUIActions(scene) {
  if (initialized) return;
  initialized = true;

  const upgradeButton = document.querySelector("#upgradeButton");
  const sellButton = document.querySelector("#sellButton");

  if (upgradeButton) {
    upgradeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      upgradeSelectedTower();
    });
  }

  if (sellButton) {
    sellButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!state.selectedObject) return;
      if (!state.towers.includes(state.selectedObject)) return;

      sellTower(scene, state.selectedObject);
    });
  }
}

export function updateUIActions() {
  const upgradeButton = document.querySelector("#upgradeButton");
  const sellButton = document.querySelector("#sellButton");

  const selectedTower =
    state.selectedObject && state.towers.includes(state.selectedObject)
      ? state.selectedObject
      : null;

  const hasTower = Boolean(selectedTower);

  if (upgradeButton) {
    const level = selectedTower?.userData.level ?? 0;
    const cost = getUpgradeCost(selectedTower);

    upgradeButton.disabled =
      !hasTower ||
      !canUpgradeTower(selectedTower) ||
      state.paused ||
      state.gameOver ||
      !state.started;

    if (!hasTower) {
      upgradeButton.textContent = "Upgrade Tower";
    } else if (level >= 3) {
      upgradeButton.textContent = "Max Level";
    } else {
      upgradeButton.textContent = `Upgrade (${cost} Gold)`;
    }
  }

  if (sellButton) {
    sellButton.disabled =
      !hasTower ||
      state.paused ||
      state.gameOver ||
      !state.started;
  }
}