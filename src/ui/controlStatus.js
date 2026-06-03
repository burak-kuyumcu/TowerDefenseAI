import { state } from "../game/state.js";
import { getControlModeLabel } from "../systems/controls.js";

export function updateControlStatus() {
  const modeEl = document.querySelector("#controlStatusMode");
  const helpEl = document.querySelector("#controlStatusHelp");

  if (!modeEl || !helpEl) return;

  modeEl.textContent = getControlModeLabel();
  helpEl.innerHTML = getControlHelpText();
}

function getControlHelpText() {
  if (state.controlMode === "camera") {
    return `
      W/A/S/D: Move X/Z<br>
      Q/E: Move Y<br>
      Arrows: Pitch/Yaw<br>
      PageUp/PageDown: Roll
    `;
  }

  if (state.controlMode === "object") {
    return `
      Select tower/enemy first<br>
      W/A/S/D/Q/E: Translate object in 3D<br>
      Arrows + PageUp/PageDown: Rotate object in 3D
    `;
  }

  if (state.controlMode === "spotlight") {
    return `
      W/A/S/D/Q/E: Translate spotlight<br>
      Arrows + PageUp/PageDown: Aim target in 3D<br>
      O: On/Off | +/-: Intensity
    `;
  }

  if (state.controlMode === "directional") {
    return `
      Arrows + PageUp/PageDown: Rotate direction<br>
      Alt + W/A/S/D/Q/E: Translate light<br>
      P: On/Off | +/-: Intensity
    `;
  }

  return "F3: Cycle control mode";
}