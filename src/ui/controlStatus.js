import { state } from "../game/state.js";
import { getControlModeLabel } from "../systems/controls.js";

export function updateControlStatus() {
  const modeElement = document.querySelector("#controlStatusMode");
  const helpElement = document.querySelector("#controlStatusHelp");

  if (!modeElement || !helpElement) return;

  modeElement.textContent = getControlModeLabel();
  helpElement.textContent = getControlHelpText();
}

function getControlHelpText() {
  if (state.controlMode === "camera") {
    return "W/A/S/D: Move XZ | Q/E: Move Y | Arrows: Pitch/Yaw | PageUp/PageDown: Roll";
  }

  if (state.controlMode === "object") {
    return "W/A/S/D: Move object XZ | Q/E: Move object Y | Arrows: Pitch/Yaw | PageUp/PageDown: Roll";
  }

  if (state.controlMode === "spotlight") {
    return "W/A/S/D: Move spotlight XZ | Q/E: Move spotlight Y | Arrows: Aim target | PageUp/PageDown: Target Y | O: On/Off | +/-: Intensity";
  }

  if (state.controlMode === "directional") {
    return "W/A/S/D: Move light XZ | Q/E: Move light Y | Arrows: Direction | PageUp/PageDown: Roll | P: On/Off | +/-: Intensity";
  }

  return "F3: Cycle control mode";
}