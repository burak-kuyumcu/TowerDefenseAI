import { state } from "./state.js";
import { getTowerCost } from "./placement.js";

let initialized = false;

export function initBuildPanel() {
  if (initialized) return;
  initialized = true;

  const buttons = document.querySelectorAll(".build-button");

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const towerType = button.dataset.tower;
      if (!towerType) return;

      state.selectedTowerType = towerType;
    });
  });
}

export function updateBuildPanel() {
  const buttons = document.querySelectorAll(".build-button");

  buttons.forEach((button) => {
    const towerType = button.dataset.tower;
    const cost = getTowerCost(towerType);

    button.classList.toggle("active", state.selectedTowerType === towerType);

    button.disabled =
      !state.started ||
      state.gameOver ||
      state.paused ||
      state.gold < cost;
  });
}