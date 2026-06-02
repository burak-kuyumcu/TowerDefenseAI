import { state } from "../game/state.js";
import { GRID_MIN, GRID_MAX, getActivePathSet } from "../core/constants.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";
import {
  spawnTowerTranslateEffect,
  spawnRelocationPulse,
  spawnRelocationBlockedEffect
} from "../visuals/effects.js";

const RELOCATION_ANIMATION_FRAMES = 14;

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

  if (tower.userData.relocationTween?.active) {
    return false;
  }

  if (x < GRID_MIN || x > GRID_MAX || z < GRID_MIN || z > GRID_MAX) {
    return false;
  }

  const newKey = `${x},${z}`;
  const oldKey = tower.userData.occupiedKey;

  const activePathSet = getActivePathSet();

  if (activePathSet.has(newKey)) return false;
  if (state.towerSet.has(newKey) && newKey !== oldKey) return false;

  if (state.terrainBlockedSet?.has(newKey) && newKey !== oldKey) {
    return false;
  }

  return true;
}

export function tryRelocateTower(tower, dx, dz) {
  if (!canRelocateNow()) return false;
  if (!tower || !state.towers.includes(tower)) return false;

  if (tower.userData.relocationTween?.active) {
    return false;
  }

  const fromX = Math.round(tower.position.x);
  const fromZ = Math.round(tower.position.z);

  const nextX = fromX + dx;
  const nextZ = fromZ + dz;

  const scene = tower.parent;

  if (!canRelocateTowerTo(tower, nextX, nextZ)) {
    addEventLog("Relocation blocked.");

    if (scene) {
      spawnRelocationBlockedEffect(scene, {
        x: nextX,
        y: 0,
        z: nextZ
      });
    }

    showAnnouncement("Relocation blocked");
    return false;
  }

  const oldKey = tower.userData.occupiedKey;
  const newKey = `${nextX},${nextZ}`;

  if (oldKey) {
    state.towerSet.delete(oldKey);
  }

  state.towerSet.add(newKey);
  tower.userData.occupiedKey = newKey;

  const from = {
    x: tower.position.x,
    y: tower.position.y,
    z: tower.position.z
  };

  const to = {
    x: nextX,
    y: tower.position.y,
    z: nextZ
  };

  startRelocationTween(tower, from, to);

  state.relocationTokens--;

  tower.userData.lastRelocationFrom = `${fromX},${fromZ}`;
  tower.userData.lastRelocationTo = newKey;

  if (scene) {
    spawnTowerTranslateEffect(scene, from, to, getTowerColor(tower.userData.type));
    spawnRelocationPulse(scene, from, getTowerColor(tower.userData.type));
    spawnRelocationPulse(scene, to, getTowerColor(tower.userData.type));
  }

  state.aiLockedPlanText =
    `AI noticed tower translation. ${state.aiLockedStrategy || "Balanced"} plan remains under review.`;

  addEventLog(
    `Tower translated from (${fromX}, ${fromZ}) to (${nextX}, ${nextZ}). ${state.relocationTokens} relocation left.`
  );

  showAnnouncement("Tower translated");

  return true;
}

export function resetRelocationsForPreparation() {
  state.relocationTokens = state.relocationMaxTokens;
}

function startRelocationTween(tower, from, to) {
  tower.userData.relocationTween = {
    active: true,
    frame: 0,
    frames: RELOCATION_ANIMATION_FRAMES,
    from,
    to
  };

  const interval = setInterval(() => {
    const tween = tower.userData.relocationTween;

    if (!tween?.active) {
      clearInterval(interval);
      return;
    }

    tween.frame++;

    const t = Math.min(1, tween.frame / tween.frames);
    const eased = easeOutBack(t);

    tower.position.x = lerp(tween.from.x, tween.to.x, eased);
    tower.position.z = lerp(tween.from.z, tween.to.z, eased);

    const hop = Math.sin(t * Math.PI) * 0.16;
    tower.position.y = tween.to.y + hop;

    if (t >= 1) {
      tower.position.x = tween.to.x;
      tower.position.y = tween.to.y;
      tower.position.z = tween.to.z;

      tower.userData.relocationTween.active = false;
      clearInterval(interval);
    }
  }, 16);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutBack(t) {
  const c1 = 1.35;
  const c3 = c1 + 1;

  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function getTowerColor(type) {
  if (type === "rapid") return 0x38bdf8;
  if (type === "sniper") return 0xc084fc;
  if (type === "slow") return 0x5eead4;
  if (type === "splash") return 0xfb923c;

  return 0x60a5fa;
}