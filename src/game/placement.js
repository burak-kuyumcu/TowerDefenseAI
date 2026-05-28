import { state } from "./state.js";
import { getActivePathSet } from "../core/constants.js";

export function getTowerCost(type = state.selectedTowerType) {
  if (type === "rapid") return 30;
  if (type === "sniper") return 45;
  if (type === "slow") return 35;
  if (type === "splash") return 50;

  return 25;
}

export function getPlacementState() {
  const key = `${state.selectedTile.x},${state.selectedTile.z}`;
  const activePathSet = getActivePathSet();

  if (activePathSet.has(key)) return "blocked-path";
  if (state.towerSet.has(key)) return "blocked-tower";

  const cost = getTowerCost();

  if (state.gold < cost) return "no-gold";

  return "valid";
}

export function updatePlacementVisual(selector) {
  const stateType = getPlacementState();

  if (stateType === "valid") {
    selector.material.color.set(0x22c55e);
  } else if (stateType === "no-gold") {
    selector.material.color.set(0xf59e0b);
  } else {
    selector.material.color.set(0xef4444);
  }
}