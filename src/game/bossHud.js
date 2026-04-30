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
  bossHpFill.style.background = getBossGradient(boss.userData.type);
}

function formatBossName(type) {
  if (type === "boss_crusher") return "BOSS: Crusher";
  if (type === "boss_runner") return "BOSS: Runner";
  if (type === "boss_shield") return "BOSS: Shield";
  if (type === "boss_splitter") return "BOSS: Splitter";
  if (type === "boss_disruptor") return "BOSS: Disruptor";
  if (type === "boss_purple") return "BOSS: Purple";

  return "BOSS";
}

function getBossGradient(type) {
  if (type === "boss_crusher") return "linear-gradient(90deg, #7f1d1d, #ef4444)";
  if (type === "boss_runner") return "linear-gradient(90deg, #f97316, #facc15)";
  if (type === "boss_shield") return "linear-gradient(90deg, #16a34a, #86efac)";
  if (type === "boss_splitter") return "linear-gradient(90deg, #ca8a04, #fde047)";
  if (type === "boss_disruptor") return "linear-gradient(90deg, #0891b2, #67e8f9)";

  return "linear-gradient(90deg, #a855f7, #facc15)";
}
