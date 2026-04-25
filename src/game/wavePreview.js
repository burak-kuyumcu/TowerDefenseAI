import { state } from "./state.js";
import { getAIStrategyName } from "./aiDirector.js";

export function updateWavePreview() {
  const content = document.querySelector("#wavePreviewContent");
  if (!content) return;

  if (!state.started) {
    content.innerHTML = "Press Enter to start.";
    return;
  }

  const isBossWave = state.wave % 5 === 0;
  const strategy = getAIStrategyName();

  content.innerHTML = `
    Wave: ${state.wave}<br>
    Status: ${getWaveStatus()}<br>
    Type: ${isBossWave ? "Boss" : "Normal"}<br>
    Enemies: ${isBossWave ? "1 Boss" : state.enemiesPerWave}<br>
    AI: ${strategy}<br>
    Threat: ${getThreatText(strategy, isBossWave)}
  `;
}

function getWaveStatus() {
  if (state.gameOver) return "Game Over";
  if (state.paused) return "Paused";
  if (state.waveActive) return "Running";
  if (state.waitingForNextWave) return "Preparing";

  return "Idle";
}

function getThreatText(strategy, isBossWave) {
  if (isBossWave) return "Random boss variant";

  if (strategy === "Swarm Pressure") return "More fast enemies";
  if (strategy === "Heavy Push") return "More tank enemies";
  if (strategy === "Armored Response") return "Heavy armor pressure";
  if (strategy === "Tank Response") return "Tank enemies likely";
  if (strategy === "Fast Pressure") return "Fast enemies likely";
  if (strategy === "Late Wave Mix") return "Mixed enemy pressure";

  return "Balanced enemies";
}