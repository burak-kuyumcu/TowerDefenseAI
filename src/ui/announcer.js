let timer = 0;
let screenFlashTimer = 0;

export function showAnnouncement(text) {
  const el = document.querySelector("#announcer");
  if (!el) return;

  const isBattlefieldMessage =
    text.includes("NEW BATTLEFIELD") ||
    text.includes("New Battlefield");

  const isBossMessage =
    text.includes("BOSS") ||
    text.includes("Boss");

  if (isBattlefieldMessage) {
    const [titlePart, effectPart] = text.split("|").map((part) => part.trim());

    el.innerHTML = `
      <div class="announcer-title">${titlePart}</div>
      <div class="announcer-effect">${effectPart ?? ""}</div>
    `;

    timer = 180;
  } else if (isBossMessage) {
    el.innerHTML = `
      <div class="announcer-title danger">${text}</div>
      <div class="announcer-effect">Incoming high threat target</div>
    `;

    timer = 150;
  } else {
    el.textContent = text;
    timer = 120;
  }

  el.style.opacity = "1";
  el.style.transform = "translateX(-50%) scale(1)";
}

export function showScreenFlash(
  color = "rgba(239, 68, 68, 0.28)",
  duration = 16
) {
  const el = getOrCreateScreenFlash();

  el.style.background = color;
  el.style.opacity = "1";

  screenFlashTimer = duration;
}

export function updateAnnouncer() {
  const el = document.querySelector("#announcer");
  if (!el) return;

  if (timer > 0) {
    timer--;
  } else {
    el.style.opacity = "0";
    el.style.transform = "translateX(-50%) scale(0.8)";
  }

  updateScreenFlash();
}

function updateScreenFlash() {
  const el = document.querySelector("#screenFlash");
  if (!el) return;

  if (screenFlashTimer > 0) {
    screenFlashTimer--;

    const opacity = Math.min(1, screenFlashTimer / 8);
    el.style.opacity = `${opacity}`;

    return;
  }

  el.style.opacity = "0";
}

function getOrCreateScreenFlash() {
  let el = document.querySelector("#screenFlash");

  if (el) return el;

  el = document.createElement("div");
  el.id = "screenFlash";

  document.body.appendChild(el);

  return el;
}