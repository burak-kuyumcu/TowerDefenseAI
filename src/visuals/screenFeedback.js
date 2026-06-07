import { state } from "../game/state.js";

const STYLE_ID = "screenFeedbackStyle";
const OVERLAY_ID = "screenFeedbackOverlay";

let initialized = false;
let pulse = 0;

export function initScreenFeedback() {
  if (initialized) return;

  initialized = true;

  injectScreenFeedbackStyles();
  ensureOverlay();
}

export function updateScreenFeedback() {
  if (!initialized) return;

  const overlay = ensureOverlay();

  pulse += 0.035;

  const baseRatio = getBaseRatio();
  const dangerLevel = getDangerLevel(baseRatio);
  const waveLevel = state.waveActive ? 1 : 0;
  const bossLevel = isBossWave() && state.waveActive ? 1 : 0;
  const pausedLevel = state.paused ? 1 : 0;
  const gameOverLevel = state.gameOver ? 1 : 0;

  const wavePulse = state.waveActive ? 0.45 + Math.sin(pulse) * 0.12 : 0;
  const dangerPulse =
    dangerLevel > 0 ? dangerLevel * (0.55 + Math.sin(pulse * 1.7) * 0.18) : 0;
  const bossPulse = bossLevel > 0 ? 0.55 + Math.sin(pulse * 1.25) * 0.16 : 0;

  overlay.style.setProperty("--sf-danger", String(dangerPulse.toFixed(3)));
  overlay.style.setProperty("--sf-wave", String(wavePulse.toFixed(3)));
  overlay.style.setProperty("--sf-boss", String(bossPulse.toFixed(3)));
  overlay.style.setProperty("--sf-paused", String(pausedLevel));
  overlay.style.setProperty("--sf-gameover", String(gameOverLevel));

  overlay.classList.toggle("screen-feedback-active", state.started);
  overlay.classList.toggle("screen-feedback-wave", state.waveActive);
  overlay.classList.toggle("screen-feedback-danger", dangerLevel > 0);
  overlay.classList.toggle("screen-feedback-boss", bossLevel > 0);
  overlay.classList.toggle("screen-feedback-paused", state.paused);
  overlay.classList.toggle("screen-feedback-gameover", state.gameOver);
}

export function resetScreenFeedback() {
  pulse = 0;

  const overlay = document.querySelector("#" + OVERLAY_ID);

  if (!overlay) return;

  overlay.style.setProperty("--sf-danger", "0");
  overlay.style.setProperty("--sf-wave", "0");
  overlay.style.setProperty("--sf-boss", "0");
  overlay.style.setProperty("--sf-paused", "0");
  overlay.style.setProperty("--sf-gameover", "0");

  overlay.className = "screen-feedback-overlay";
}

function getBaseRatio() {
  const maxHp = Math.max(1, state.baseMaxHp || 10);
  return Math.max(0, Math.min(1, state.baseHp / maxHp));
}

function getDangerLevel(baseRatio) {
  if (!state.started) return 0;
  if (state.gameOver) return 1;

  if (baseRatio <= 0.25) return 1;
  if (baseRatio <= 0.45) return 0.55;

  return 0;
}

function isBossWave() {
  return state.wave % 5 === 0;
}

function ensureOverlay() {
  let overlay = document.querySelector("#" + OVERLAY_ID);

  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "screen-feedback-overlay";

  overlay.style.setProperty("--sf-danger", "0");
  overlay.style.setProperty("--sf-wave", "0");
  overlay.style.setProperty("--sf-boss", "0");
  overlay.style.setProperty("--sf-paused", "0");
  overlay.style.setProperty("--sf-gameover", "0");

  document.body.appendChild(overlay);

  return overlay;
}

function injectScreenFeedbackStyles() {
  const existing = document.querySelector("#" + STYLE_ID);

  if (existing) {
    existing.remove();
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;

  style.textContent = `
    .screen-feedback-overlay {
      position: fixed;
      inset: 0;
      z-index: 18;
      pointer-events: none;
      opacity: 1;
      mix-blend-mode: screen;
      background:
        radial-gradient(
          circle at 50% 50%,
          rgba(56, 189, 248, calc(var(--sf-wave) * 0.055)) 0%,
          rgba(56, 189, 248, 0) 48%
        ),
        radial-gradient(
          circle at 50% 50%,
          rgba(250, 204, 21, calc(var(--sf-boss) * 0.07)) 0%,
          rgba(248, 113, 113, calc(var(--sf-boss) * 0.04)) 42%,
          rgba(0, 0, 0, 0) 68%
        ),
        radial-gradient(
          circle at 50% 50%,
          rgba(0, 0, 0, 0) 42%,
          rgba(248, 113, 113, calc(var(--sf-danger) * 0.26)) 100%
        ),
        linear-gradient(
          rgba(15, 23, 42, calc(var(--sf-paused) * 0.18)),
          rgba(15, 23, 42, calc(var(--sf-paused) * 0.18))
        ),
        linear-gradient(
          rgba(127, 29, 29, calc(var(--sf-gameover) * 0.32)),
          rgba(15, 23, 42, calc(var(--sf-gameover) * 0.32))
        );
      transition:
        background 120ms ease,
        opacity 160ms ease;
    }

    .screen-feedback-overlay::before {
      content: "";
      position: absolute;
      inset: 0;
      opacity: calc((var(--sf-danger) * 0.28) + (var(--sf-boss) * 0.12));
      background:
        linear-gradient(
          90deg,
          rgba(248, 113, 113, 0.55),
          transparent 12%,
          transparent 88%,
          rgba(248, 113, 113, 0.55)
        ),
        linear-gradient(
          0deg,
          rgba(248, 113, 113, 0.45),
          transparent 14%,
          transparent 86%,
          rgba(248, 113, 113, 0.45)
        );
    }

    .screen-feedback-overlay::after {
      content: "";
      position: absolute;
      inset: 0;
      opacity: calc(var(--sf-wave) * 0.16);
      background:
        repeating-linear-gradient(
          0deg,
          rgba(125, 211, 252, 0.05) 0px,
          rgba(125, 211, 252, 0.05) 1px,
          transparent 1px,
          transparent 7px
        );
    }

    .screen-feedback-overlay:not(.screen-feedback-active) {
      opacity: 0;
    }

    .screen-feedback-overlay.screen-feedback-gameover {
      mix-blend-mode: normal;
    }
  `;

  document.head.appendChild(style);
}