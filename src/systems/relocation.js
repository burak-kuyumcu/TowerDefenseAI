import { state } from "../game/state.js";
import { GRID_MIN, GRID_MAX, getActivePathSet } from "../core/constants.js";
import { addEventLog } from "../ui/eventLog.js";

export function canRelocateNow() {
  return (
    state.started &&
    !state.gameOver &&
    !state.paused &&
    state.waitingForNextWave &&
    !state.waveActive &&
    state.enemies.length === 0 &&
    state.relocationTokens > 0
  );
}

export function canRelocateTowerTo(tower, x, z) {
  if (!tower) return false;
  if (!state.towers.includes(tower)) return false;

  if (x < GRID_MIN || x > GRID_MAX || z < GRID_MIN || z > GRID_MAX) {
    return false;
  }

  const newKey = `${x},${z}`;
  const oldKey = tower.userData.occupiedKey;

  const activePathSet = getActivePathSet();
  if (activePathSet.has(newKey)) return false;
  if (state.towerSet.has(newKey) && newKey !== oldKey) return false;

  return true;
}

export function tryRelocateTower(tower, dx, dz) {
  if (!canRelocateNow()) return false;
  if (!tower || !state.towers.includes(tower)) return false;

  const nextX = Math.round(tower.position.x + dx);
  const nextZ = Math.round(tower.position.z + dz);

  if (!canRelocateTowerTo(tower, nextX, nextZ)) {
    addEventLog("Relocation blocked.");
    return false;
  }

  const oldKey = tower.userData.occupiedKey;
  const newKey = `${nextX},${nextZ}`;

  if (oldKey) {
    state.towerSet.delete(oldKey);
  }

  state.towerSet.add(newKey);
  tower.userData.occupiedKey = newKey;

  tower.position.x = nextX;
  tower.position.z = nextZ;

  state.relocationTokens--;

  addEventLog(
    `Tower relocated. ${state.relocationTokens} relocation left.`
  );

  return true;
}

export function resetRelocationsForPreparation() {
  state.relocationTokens = state.relocationMaxTokens;
}