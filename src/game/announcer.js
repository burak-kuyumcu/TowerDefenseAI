let timer = 0;

export function showAnnouncement(text) {
  const el = document.querySelector("#announcer");
  if (!el) return;

  el.textContent = text;
  el.style.opacity = "1";
  el.style.transform = "translateX(-50%) scale(1)";

  timer = 120;
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