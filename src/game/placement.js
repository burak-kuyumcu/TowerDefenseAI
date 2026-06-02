import { state } from "./state.js";
import { getActivePathSet } from "../core/constants.js";
import { getCurrentStageTowerLimit } from "./stages.js";

export function getTowerCost(type = state.selectedTowerType) {
  if (type === "rapid") return 30;
  if (type === "sniper") return 45;
  if (type === "slow") return 35;
  if (type === "splash") return 50;

  return 25;
}

export function getTowerLimit() {
  return getCurrentStageTowerLimit();
}

export function getTowerCount() {
  return state.towers.length;
}

export function isTowerLimitReached() {
  return getTowerCount() >= getTowerLimit();
}

export function getPlacementState() {
  const key = `${state.selectedTile.x},${state.selectedTile.z}`;
  const activePathSet = getActivePathSet();

  if (activePathSet.has(key)) return "blocked-path";
  if (state.towerSet.has(key)) return "blocked-tower";

  if (state.terrainBlockedSet?.has(key)) {
    return "blocked-terrain";
  }

  if (isTowerLimitReached()) return "tower-limit";

  const cost = getTowerCost();

  if (state.gold < cost) return "no-gold";

  return "valid";
}

export function getPlacementMessage() {
  const placementState = getPlacementState();

  if (placementState === "valid") return "Valid placement";
  if (placementState === "blocked-path") return "Cannot build on active path";
  if (placementState === "blocked-tower") return "Tile already has a tower";
  if (placementState === "blocked-terrain") return "Cannot build on terrain obstacle";
  if (placementState === "tower-limit") return "Tower limit reached";
  if (placementState === "no-gold") return "Not enough gold";

  return "Invalid placement";
}

export function updatePlacementVisual(selector) {
  const stateType = getPlacementState();

  if (stateType === "valid") {
    selector.material.color.set(0x22c55e);
  } else if (stateType === "no-gold") {
    selector.material.color.set(0xf59e0b);
  } else if (stateType === "tower-limit") {
    selector.material.color.set(0xdc2626);
  } else if (stateType === "blocked-terrain") {
    selector.material.color.set(0x7c2d12);
  } else {
    selector.material.color.set(0xef4444);
  }
}