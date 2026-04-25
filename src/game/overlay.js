import { state } from "./state.js";

export function updateOverlay() {
  const overlay = document.querySelector("#overlay");
  const title = document.querySelector("#overlayTitle");
  const text = document.querySelector("#overlayText");

  if (!overlay || !title || !text) return;

  if (!state.started) {
    overlay.style.display = "flex";
    title.textContent = "Tower Defense AI";
    text.textContent = "Press Enter to Start";
    return;
  }

  if (state.gameOver) {
    overlay.style.display = "flex";
    title.textContent = "GAME OVER";
    text.textContent = "Press R to Restart";
    return;
  }

  if (state.paused) {
    overlay.style.display = "flex";
    title.textContent = "Paused";
    text.textContent = "Press Space to Resume";
    return;
  }

  overlay.style.display = "none";
}