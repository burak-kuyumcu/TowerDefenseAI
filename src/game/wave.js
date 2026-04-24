import { state } from "./state.js";
import { spawnEnemy } from "./enemies.js";

export function updateWave(scene) {
  if (state.spawned < state.enemiesPerWave) {
    state.spawnTimer--;

    if (state.spawnTimer <= 0) {
      spawnEnemy(scene);
      state.spawned++;
      state.spawnTimer = Math.max(35, 90 - state.wave * 5);
    }

    return;
  }

  if (state.enemies.length === 0) {
    state.wave++;
    state.spawned = 0;
    state.enemiesPerWave = 4 + state.wave * 2;
    state.spawnTimer = 120;
  }
}