import { state } from "../game/state.js";
import { toggleMute } from "../game/audio.js";
import { togglePause, restartGame } from "../systems/gameFlow.js";
import { toggleShaderMode, getShaderModeLabel } from "../visuals/materials.js";

const SETTINGS_STYLE_ID = "settingsPanelRuntimeFixStyle";

let initialized = false;

export function initSettingsPanel(scene) {
  if (initialized) return;
  initialized = true;

  injectSettingsPanelRuntimeStyles();

  const panel = document.querySelector("#settingsPanel");
  const openButton = document.querySelector("#settingsButton");
  const closeButton = document.querySelector("#settingsCloseButton");

  const soundButton = document.querySelector("#settingsSoundButton");
  const shaderButton = document.querySelector("#settingsShaderButton");
  const pauseButton = document.querySelector("#settingsPauseButton");
  const restartButton = document.querySelector("#settingsRestartButton");

  panel?.classList.add("hidden");
  document.body.classList.remove("settings-panel-open");

  openButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    openSettingsPanel();
  });

  closeButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    closeSettingsPanel();
  });

  panel?.addEventListener("click", (event) => {
    if (event.target === panel) {
      event.preventDefault();
      event.stopPropagation();

      closeSettingsPanel();
    }
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
    closeSettingsPanel();
    updateSettingsPanel();
  });

  updateSettingsPanel();
}

export function openSettingsPanel() {
  const panel = document.querySelector("#settingsPanel");

  if (!panel) return;

  closeOtherPanelsForSettings();

  panel.classList.remove("hidden");
  document.body.classList.add("settings-panel-open");
  document.body.classList.remove("info-drawer-open");
  document.body.classList.remove("stage-intel-open");

  panel.style.removeProperty("display");
  panel.style.removeProperty("opacity");
  panel.style.removeProperty("visibility");
  panel.style.removeProperty("pointer-events");

  updateSettingsPanel();
}

export function closeSettingsPanel() {
  const panel = document.querySelector("#settingsPanel");

  if (!panel) return;

  panel.classList.add("hidden");
  document.body.classList.remove("settings-panel-open");

  panel.style.removeProperty("display");
  panel.style.removeProperty("opacity");
  panel.style.removeProperty("visibility");
  panel.style.removeProperty("pointer-events");
}

export function isSettingsPanelOpen() {
  const panel = document.querySelector("#settingsPanel");

  if (!panel) return false;
  if (panel.classList.contains("hidden")) return false;

  const style = window.getComputedStyle(panel);

  if (style.display === "none") return false;
  if (style.visibility === "hidden") return false;
  if (Number(style.opacity) === 0) return false;

  return true;
}

export function updateSettingsPanel() {
  injectSettingsPanelRuntimeStyles();

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

function closeOtherPanelsForSettings() {
  const selectors = [
    "#help",
    "#achievementPanel",
    "#aiFeedback",
    "#stageIntelPanel",
    "#storyArchivePanel",
    "#missionArchivePanel",
    ".story-archive-panel"
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);

    if (!element) continue;

    element.classList.add("hidden");
    element.style.removeProperty("display");
    element.style.removeProperty("opacity");
    element.style.removeProperty("visibility");
    element.style.removeProperty("pointer-events");
  }

  document.body.classList.remove("info-drawer-open");
  document.body.classList.remove("stage-intel-open");
  document.body.classList.remove("archive-modal-open");
}

function injectSettingsPanelRuntimeStyles() {
  let style = document.querySelector("#" + SETTINGS_STYLE_ID);

  if (!style) {
    style = document.createElement("style");
    style.id = SETTINGS_STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = `
    #settingsPanel {
      position: fixed !important;
      inset: 0 !important;
      left: 0 !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: none !important;
      max-height: none !important;
      transform: none !important;

      display: flex !important;
      align-items: center !important;
      justify-content: center !important;

      padding: 34px !important;
      box-sizing: border-box !important;

      z-index: 160 !important;

      background: rgba(0, 0, 0, 0.52) !important;
      backdrop-filter: blur(6px) !important;
    }

    #settingsPanel.hidden {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    #settingsPanel:not(.hidden) {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    #settingsPanel .settings-card {
      position: relative !important;
      left: auto !important;
      top: auto !important;
      right: auto !important;
      bottom: auto !important;
      transform: none !important;

      width: min(780px, calc(100vw - 96px)) !important;
      max-width: min(780px, calc(100vw - 96px)) !important;
      height: auto !important;
      max-height: calc(100vh - 96px) !important;

      overflow-y: auto !important;
      overflow-x: hidden !important;

      padding: 28px 30px !important;
      box-sizing: border-box !important;

      border-radius: 24px !important;
      border: 1px solid rgba(56, 189, 248, 0.68) !important;

      background:
        radial-gradient(circle at top, rgba(56, 189, 248, 0.12), transparent 32%),
        linear-gradient(180deg, rgba(8, 15, 32, 0.99), rgba(3, 8, 20, 0.98)) !important;

      box-shadow:
        0 30px 90px rgba(0, 0, 0, 0.6),
        0 0 34px rgba(56, 189, 248, 0.14) !important;

      text-align: center !important;
    }

    #settingsPanel .settings-title {
      margin-bottom: 22px !important;
      color: #38bdf8 !important;
      font-size: 38px !important;
      line-height: 1 !important;
      font-weight: 950 !important;
      text-align: center !important;
      text-shadow: 0 0 24px rgba(56, 189, 248, 0.24) !important;
    }

    #settingsPanel button {
      width: 100% !important;
      min-height: 46px !important;
      margin-bottom: 12px !important;

      border-radius: 13px !important;
      font-size: 15px !important;
      font-weight: 950 !important;
    }

    #settingsPanel .settings-about {
      margin-top: 14px !important;
      padding: 18px !important;

      border-radius: 18px !important;
      border: 1px solid rgba(56, 189, 248, 0.22) !important;
      background: rgba(15, 23, 42, 0.62) !important;
    }

    #settingsPanel .settings-about p {
      max-width: 620px !important;
      margin: 10px auto !important;

      color: #dbeafe !important;
      font-size: 13px !important;
      line-height: 1.45 !important;
      text-align: center !important;
    }

    #settingsPanel .requirement-proof {
      margin-top: 16px !important;
      padding: 14px !important;

      border-radius: 15px !important;
      border: 1px solid rgba(56, 189, 248, 0.26) !important;
      background: rgba(3, 7, 18, 0.5) !important;
    }

    #settingsPanel .requirement-proof div {
      display: grid !important;
      grid-template-columns: 150px 1fr !important;
      gap: 10px !important;

      padding: 7px 0 !important;
      border-bottom: 1px solid rgba(148, 163, 184, 0.13) !important;

      color: #dbeafe !important;
      font-size: 12px !important;
      line-height: 1.35 !important;
    }

    #settingsPanel .requirement-proof div:last-child {
      border-bottom: none !important;
    }

    #settingsPanel .requirement-proof b {
      color: #facc15 !important;
    }

    @media (max-width: 900px) {
      #settingsPanel {
        padding: 16px !important;
      }

      #settingsPanel .settings-card {
        width: calc(100vw - 32px) !important;
        max-width: calc(100vw - 32px) !important;
        max-height: calc(100vh - 32px) !important;
      }

      #settingsPanel .requirement-proof div {
        grid-template-columns: 1fr !important;
      }
    }
  `;
}