let timer = 0;

export function showAnnouncement(text) {
  const el = document.querySelector("#announcer");
  if (!el) return;

  const isBattlefieldMessage =
    text.includes("NEW BATTLEFIELD") ||
    text.includes("New Battlefield");

  if (isBattlefieldMessage) {
    const [titlePart, effectPart] = text.split("|").map((part) => part.trim());

    el.innerHTML = `
      <div class="announcer-title">${titlePart}</div>
      <div class="announcer-effect">${effectPart ?? ""}</div>
    `;

    timer = 180;
  } else {
    el.textContent = text;
    timer = 120;
  }

  el.style.opacity = "1";
  el.style.transform = "translateX(-50%) scale(1)";
}

export function updateAnnouncer() {
  const el = document.querySelector("#announcer");
  if (!el) return;

  if (timer > 0) {
    timer--;
    return;
  }

  el.style.opacity = "0";
  el.style.transform = "translateX(-50%) scale(0.8)";
}