import { state } from "../game/state.js";
import {
  upgradeSelectedTower,
  sellTower,
  getUpgradeCost,
  canUpgradeTower
} from "../game/upgrade.js";
import { activateSelectedTowerUltimate } from "../entities/towerUltimates.js";

let initialized = false;

export function initUIActions(scene) {
  if (initialized) return;
  initialized = true;

  const upgradeButton = document.querySelector("#upgradeButton");
  const sellButton = document.querySelector("#sellButton");
  const ultimateButton = document.querySelector("#ultimateButton");

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

  if (ultimateButton) {
    ultimateButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      activateSelectedTowerUltimate(scene);
    });
  }
}

export function updateUIActions() {
  const upgradeButton = document.querySelector("#upgradeButton");
  const sellButton = document.querySelector("#sellButton");
  const ultimateButton = document.querySelector("#ultimateButton");

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

  if (ultimateButton) {
    ultimateButton.disabled =
      !hasTower ||
      state.paused ||
      state.gameOver ||
      !state.started ||
      !canUseUltimate(selectedTower);

    if (!hasTower) {
      ultimateButton.textContent = "Use Ultimate";
    } else {
      ultimateButton.textContent = getUltimateButtonText(selectedTower);
    }
  }
}

function canUseUltimate(tower) {
  if (!tower) return false;
  if (tower.userData.ultimateActiveTimer > 0) return false;
  if (tower.userData.ultimateCooldown > 0) return false;

  return (tower.userData.ultimateCharge ?? 0) >= 100;
}

function getUltimateButtonText(tower) {
  const name = tower.userData.ultimateName ?? "Ultimate";

  if (tower.userData.ultimateActiveTimer > 0) {
    return `${name}: Active`;
  }

  if (tower.userData.ultimateCooldown > 0) {
    return `${name}: Cooldown`;
  }

  const charge = Math.floor(tower.userData.ultimateCharge ?? 0);

  if (charge >= 100) {
    return `${name} Ready`;
  }

  return `${name} ${charge}%`;
}