export const keys = {};

function clearKeys() {
  for (const key in keys) {
    keys[key] = false;
  }
}

export function initKeyboard() {
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    keys[e.code] = true;
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
    keys[e.code] = false;
  });

  window.addEventListener("blur", () => {
    clearKeys();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearKeys();
    }
  });
}