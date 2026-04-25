import { state } from "./state.js";

export function updateBossHud() {
  const bossHud = document.querySelector("#bossHud");
  const bossName = document.querySelector("#bossName");
  const bossHpFill = document.querySelector("#bossHpFill");

  if (!bossHud || !bossName || !bossHpFill) return;

  const boss = state.enemies.find(
    (enemy) =>
      enemy.userData.type?.startsWith("boss") &&
      !enemy.userData.dead
  );

  if (!boss || state.gameOver || !state.started) {
    bossHud.classList.add("hidden");
    return;
  }

  bossHud.classList.remove("hidden");

  bossName.textContent = formatBossName(boss.userData.type);

  const hpRatio = Math.max(
    0,
    boss.userData.health / boss.userData.maxHealth
  );

  bossHpFill.style.width = `${hpRatio * 100}%`;
}

function formatBossName(type) {
  if (type === "boss_crusher") return "BOSS: Crusher";
  if (type === "boss_runner") return "BOSS: Runner";
  return "BOSS: Purple";
}