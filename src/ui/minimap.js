import { state } from "../game/state.js";
import {
  PATHS,
  getActiveBasePosition,
  getActivePortalPosition
} from "../core/constants.js";

const MAP_MIN = -9;
const MAP_MAX = 9;
const MAP_SIZE = MAP_MAX - MAP_MIN;

function worldToMiniMap(x, z, canvas) {
  return {
    x: ((x - MAP_MIN) / MAP_SIZE) * canvas.width,
    y: ((z - MAP_MIN) / MAP_SIZE) * canvas.height
  };
}

export function updateMinimap() {
  const canvas = document.querySelector("#minimap");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(15, 23, 42, 0.96)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid(ctx, canvas);
  drawAllPaths(ctx, canvas);
  drawCurrentPath(ctx, canvas);
  drawPortal(ctx, canvas);
  drawBase(ctx, canvas);
  drawTowers(ctx, canvas);
  drawEnemies(ctx, canvas);
}

function drawGrid(ctx, canvas) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;

  for (let i = MAP_MIN; i <= MAP_MAX; i++) {
    const a = worldToMiniMap(i, MAP_MIN, canvas);
    const b = worldToMiniMap(i, MAP_MAX, canvas);

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    const c = worldToMiniMap(MAP_MIN, i, canvas);
    const d = worldToMiniMap(MAP_MAX, i, canvas);

    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();
  }
}

function drawAllPaths(ctx, canvas) {
  for (const path of PATHS) {
    drawPath(ctx, canvas, path, "rgba(154, 107, 50, 0.25)", 3);
  }
}

function drawCurrentPath(ctx, canvas) {
  if (!state.currentPath) return;

  drawPath(ctx, canvas, state.currentPath, "#f59e0b", 5);
}

function drawPath(ctx, canvas, path, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();

  path.forEach((point, index) => {
    const p = worldToMiniMap(point.x, point.z, canvas);

    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });

  ctx.stroke();
}

function drawBase(ctx, canvas) {
  const base = getActiveBasePosition();
  const p = worldToMiniMap(base.x, base.z, canvas);

  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawPortal(ctx, canvas) {
  const portal = getActivePortalPosition();
  const p = worldToMiniMap(portal.x, portal.z, canvas);

  ctx.fillStyle = "#fb923c";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawTowers(ctx, canvas) {
  for (const tower of state.towers) {
    const p = worldToMiniMap(tower.position.x, tower.position.z, canvas);

    ctx.fillStyle =
      tower.userData.type === "splash"
        ? "#fb923c"
        : tower.userData.type === "slow"
          ? "#14b8a6"
          : tower.userData.type === "sniper"
            ? "#a855f7"
            : tower.userData.type === "rapid"
              ? "#38bdf8"
              : "#2563eb";

    ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
  }
}

function drawEnemies(ctx, canvas) {
  for (const enemy of state.enemies) {
    const p = worldToMiniMap(enemy.position.x, enemy.position.z, canvas);

    ctx.fillStyle =
      enemy.userData.type === "elite"
        ? "#ec4899"
        : enemy.userData.type?.startsWith("boss")
          ? "#a855f7"
          : enemy.userData.type === "tank"
            ? "#7f1d1d"
            : enemy.userData.type === "fast"
              ? "#f97316"
              : "#dc2626";

    ctx.beginPath();
    ctx.arc(
      p.x,
      p.y,
      enemy.userData.type?.startsWith("boss") ? 6 : 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}