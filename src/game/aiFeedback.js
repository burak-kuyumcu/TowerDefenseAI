import { state } from "./state.js";
import { getAIStrategyName, getAIPlanText } from "./aiDirector.js";

export function updateAIFeedback() {
  const content = document.querySelector("#aiFeedbackContent");
  if (!content) return;

  if (!state.started) {
    content.innerHTML = "Start the game to activate enemy AI.";
    return;
  }

  const strategy = getAIStrategyName();

  content.innerHTML = `
    ${getAIPlanText()}<br>
    Counter: ${strategy}<br>
    Suggestion: ${getSuggestionText(strategy)}
  `;
}

function getSuggestionText(strategy) {
  if (strategy === "Swarm Pressure" || strategy === "Swarm Boss") {
    return "Use rapid or splash towers near the active path.";
  }

  if (strategy === "Heavy Push" || strategy === "Shielded Push") {
    return "Add sniper towers and target strongest enemies.";
  }

  if (strategy === "Armored Response" || strategy === "Armored Boss") {
    return "Use sniper support and spread towers across corners.";
  }

  if (strategy === "Tank Response" || strategy === "Crusher Boss") {
    return "Upgrade damage and focus strongest targets.";
  }

  if (strategy === "Fast Pressure") {
    return "Relocate slow towers near path corners.";
  }

  if (strategy === "Adaptive Mix" || strategy === "Disruption Boss") {
    return "Balance damage, slow, and splash coverage.";
  }

  if (strategy === "Boss Wave") {
    return "Relocate high damage towers near the boss path.";
  }

  return "Prepare a balanced defense.";
}