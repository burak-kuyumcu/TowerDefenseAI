import { getCurrentStage } from "../game/stages.js";

export function getStageEffectText() {
  const stage = getCurrentStage();

  if (stage.id === 2) {
    return "Enemy Speed +10%";
  }

  if (stage.id === 3) {
    return "Slow Towers +25%";
  }

  if (stage.id === 4) {
    return "Enemy HP +20%, Slow weaker";
  }

  return "Balanced Terrain";
}

export function getStageFullText() {
  const stage = getCurrentStage();

  return `${stage.name}: ${getStageEffectText()}`;
}