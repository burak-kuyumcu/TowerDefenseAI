import { state } from "../game/state.js";
import { getAIStrategyName, getWaveEnemyCount } from "../ai/aiDirector.js";
import { getCurrentStage } from "../game/stages.js";
import { getStageEffectText } from "../ai/stageInfo.js";

export function updateWavePreview() {
  const content = document.querySelector("#wavePreviewContent");
  if (!content) return;

  if (!state.started) {
    content.innerHTML = "Press Enter to start.";
    return;
  }

  const isBossWave = state.wave % 5 === 0;
  const strategy = getAIStrategyName();
  const stage = getCurrentStage();

  const expectedEnemies = isBossWave
    ? "1 Boss"
    : getWaveEnemyCount(state.enemiesPerWave);

  content.innerHTML = `
    Stage: ${stage.name}<br>
    Effect: ${getStageEffectText()}<br>
    Wave: ${state.wave}<br>
    Status: ${getWaveStatus()}<br>
    Type: ${isBossWave ? "Boss" : "Normal"}<br>
    Enemies: ${expectedEnemies}<br>
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
  if (isBossWave) return "Tactical boss variant";

  if (strategy === "Swarm Pressure") return "More fast enemies, higher count";
  if (strategy === "Heavy Push") return "Fewer but tougher enemies";
  if (strategy === "Armored Response") return "More tank enemies";
  if (strategy === "Tank Response") return "Tank enemies likely";
  if (strategy === "Fast Pressure") return "Fast enemies likely";
  if (strategy === "Adaptive Mix") return "Failed plan replaced";
  if (strategy === "Late Wave Mix") return "Mixed pressure";

  return "Balanced enemies";
}