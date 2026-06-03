import { state } from "../game/state.js";
import { addEventLog } from "../ui/eventLog.js";
import { registerComboMilestone } from "./achievements.js";

export function registerKill(baseScore = 10) {
  state.combo++;
  state.comboTimer = state.comboMaxTimer;

  const comboBonus = Math.max(0, state.combo - 1) * 2;
  const totalScore = baseScore + comboBonus;

  state.score += totalScore;

  registerComboMilestone(state.combo);

  if (state.combo === 3) {
    addEventLog("Combo x3!");
  }

  if (state.combo === 5) {
    addEventLog("Combo x5! Great defense.");
  }

  if (state.combo >= 8) {
    addEventLog(`Combo x${state.combo}!`);
  }

  return totalScore;
}

export function updateCombo() {
  if (state.combo <= 0) return;

  state.comboTimer--;

  if (state.comboTimer <= 0) {
    state.combo = 0;
    state.comboTimer = 0;
  }
}