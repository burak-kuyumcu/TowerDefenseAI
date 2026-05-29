import { state } from "../game/state.js";
import { toggleMute } from "../game/audio.js";
import { togglePause, restartGame } from "../systems/gameFlow.js";
import { toggleShaderMode, getShaderModeLabel } from "../visuals/materials.js";

let initialized = false;

export function initSettingsPanel(scene) {
  if (initialized) return;
  initialized = true;

  const panel = document.querySelector("#settingsPanel");
  const openButton = document.querySelector("#settingsButton");
  const closeButton = document.querySelector("#settingsCloseButton");

  const soundButton = document.querySelector("#settingsSoundButton");
  const shaderButton = document.querySelector("#settingsShaderButton");
  const pauseButton = document.querySelector("#settingsPauseButton");
  const restartButton = document.querySelector("#settingsRestartButton");

  openButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    panel?.classList.remove("hidden");
  });

  closeButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    panel?.classList.add("hidden");
  });

  soundButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    toggleMute();
    updateSettingsPanel();
  });

  shaderButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    toggleShaderMode(scene);
    updateSettingsPanel();
  });

  pauseButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    togglePause();
    updateSettingsPanel();
  });

  restartButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    restartGame(scene);
    panel?.classList.add("hidden");
    updateSettingsPanel();
  });

  updateSettingsPanel();
}

export function updateSettingsPanel() {
  const soundButton = document.querySelector("#settingsSoundButton");
  const shaderButton = document.querySelector("#settingsShaderButton");
  const pauseButton = document.querySelector("#settingsPauseButton");

  if (soundButton) {
    soundButton.textContent = state.muted ? "Sound: Off" : "Sound: On";
  }

  if (shaderButton) {
    shaderButton.textContent = `Shader: ${getShaderModeLabel()}`;
  }

  if (pauseButton) {
    pauseButton.textContent = state.paused ? "Resume" : "Pause";
    pauseButton.disabled = !state.started || state.gameOver;
  }
}