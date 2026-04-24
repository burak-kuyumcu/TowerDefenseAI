import { state } from "./state.js";

export function updateHud() {
  document.querySelector("#score").textContent = state.score;
  document.querySelector("#wave").textContent = state.wave;
  document.querySelector("#gold").textContent = state.gold;
  document.querySelector("#baseHp").textContent = state.baseHp;

  document.querySelector("#selectedTower").textContent =
    state.selectedTowerType === "rapid" ? "Rapid" : "Normal";

  document.querySelector("#gameState").textContent =
    state.gameOver ? "GAME OVER" : "Running";
}