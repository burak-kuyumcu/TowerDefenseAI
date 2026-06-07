const STYLE_ID = "modalLayoutFixStyle";
const HELP_CLOSE_ID = "helpModalCloseButton";
const FORCE_CLOSED_ATTR = "data-modal-force-closed";

const GAMEPLAY_UI_SELECTORS = [
  "#hud",
  "#selectedInfo",
  "#actionPanel",
  "#wavePreview",
  "#buildPanel",
  "#quickPanelButtons",
  "#settingsButton",
  "#eventLog",
  "#minimap",
  "#controlStatusPanel"
];

let initialized = false;
let listenersInstalled = false;

export function initModalLayoutFix() {
  if (initialized) return;

  initialized = true;

  injectModalLayoutFixStyles();
  installModalLayoutListeners();
  ensureHelpCloseButton();
  updateModalLayoutFix();
}

export function updateModalLayoutFix() {
  if (!initialized) {
    initModalLayoutFix();
    return;
  }

  injectModalLayoutFixStyles();
  ensureHelpCloseButton();

  enforceClosedModals();
  applyModalClasses();
  fixOpenModalLayout();

  if (!hasAnyOpenModal()) {
    cleanupModalBodyState();
    restoreGameplayUi();
  }
}

function installModalLayoutListeners() {
  if (listenersInstalled) return;

  listenersInstalled = true;

  document.addEventListener(
    "click",
    function (event) {
      const target = event.target;

      if (!target || !target.closest) return;

      if (target.closest("#settingsButton")) {
        releasePanel(getSettingsPanel());
        closeHelp();
        return;
      }

      if (target.closest("#quickHelpButton")) {
        releasePanel(getHelpPanel());
        closeSettings();
        return;
      }

      if (target.closest("#quickAchievementsButton")) {
        closeHelp();
        closeSettings();
        return;
      }

      if (target.closest("#quickAIButton")) {
        closeHelp();
        closeSettings();
        return;
      }

      if (target.closest("#quickStageButton")) {
        closeHelp();
        closeSettings();
        return;
      }

      if (target.closest("#" + HELP_CLOSE_ID)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        closeHelp(true);
        cleanupModalBodyState();
        restoreGameplayUi();
        return;
      }

      if (
        target.closest("#settingsCloseButton") ||
        isCloseButtonInside(target, getSettingsPanel())
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        closeSettings(true);
        cleanupModalBodyState();
        restoreGameplayUi();
        return;
      }

      const settingsPanel = getSettingsPanel();

      if (settingsPanel && event.target === settingsPanel) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        closeSettings(true);
        cleanupModalBodyState();
        restoreGameplayUi();
      }
    },
    true
  );

  window.addEventListener(
    "keydown",
    function (event) {
      if (isTypingTarget(event.target)) return;

      if (event.key === "Escape") {
        const hadModal = hasAnyOpenModal();

        if (!hadModal) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        closeHelp(true);
        closeSettings(true);
        cleanupModalBodyState();
        restoreGameplayUi();
        return;
      }

      if (event.code === "KeyH") {
        releasePanel(getHelpPanel());
        closeSettings(true);
        return;
      }

      if (event.code === "KeyL") {
        closeHelp(true);
        closeSettings(true);
      }
    },
    true
  );
}

function applyModalClasses() {
  const help = getHelpPanel();
  const settings = getSettingsPanel();

  if (help) {
    help.classList.add("full-modal-panel", "full-help-modal");
  }

  if (settings) {
    settings.classList.add("full-modal-panel", "full-settings-modal");
  }

  document.body.classList.toggle("help-modal-open", isPanelOpen(help));
  document.body.classList.toggle("settings-modal-open", isPanelOpen(settings));
}

function fixOpenModalLayout() {
  const help = getHelpPanel();
  const settings = getSettingsPanel();

  if (isPanelOpen(settings)) {
    forceSettingsLayout(settings);
  }

  if (isPanelOpen(help)) {
    forceHelpLayout(help);
  }
}

function forceHelpLayout(help) {
  setImportant(help, "position", "fixed");
  setImportant(help, "left", "50%");
  setImportant(help, "top", "50%");
  setImportant(help, "right", "auto");
  setImportant(help, "bottom", "auto");
  setImportant(help, "transform", "translate(-50%, -50%)");
  setImportant(help, "width", "min(920px, calc(100vw - 96px))");
  setImportant(help, "max-width", "min(920px, calc(100vw - 96px))");
  setImportant(help, "height", "min(740px, calc(100vh - 92px))");
  setImportant(help, "max-height", "min(740px, calc(100vh - 92px))");
  setImportant(help, "display", "block");
  setImportant(help, "opacity", "1");
  setImportant(help, "visibility", "visible");
  setImportant(help, "pointer-events", "auto");
  setImportant(help, "overflow-y", "auto");
  setImportant(help, "overflow-x", "hidden");
  setImportant(help, "z-index", "220");
}

function forceSettingsLayout(settings) {
  setImportant(settings, "position", "fixed");
  setImportant(settings, "inset", "0");
  setImportant(settings, "left", "0");
  setImportant(settings, "top", "0");
  setImportant(settings, "right", "0");
  setImportant(settings, "bottom", "0");
  setImportant(settings, "width", "100vw");
  setImportant(settings, "height", "100vh");
  setImportant(settings, "max-width", "none");
  setImportant(settings, "max-height", "none");
  setImportant(settings, "transform", "none");
  setImportant(settings, "display", "flex");
  setImportant(settings, "opacity", "1");
  setImportant(settings, "visibility", "visible");
  setImportant(settings, "pointer-events", "auto");
  setImportant(settings, "align-items", "center");
  setImportant(settings, "justify-content", "center");
  setImportant(settings, "padding", "34px");
  setImportant(settings, "box-sizing", "border-box");
  setImportant(settings, "z-index", "230");

  const card = settings.querySelector(".settings-card");

  if (!card) return;

  setImportant(card, "position", "relative");
  setImportant(card, "left", "auto");
  setImportant(card, "top", "auto");
  setImportant(card, "right", "auto");
  setImportant(card, "bottom", "auto");
  setImportant(card, "transform", "none");
  setImportant(card, "width", "min(780px, calc(100vw - 96px))");
  setImportant(card, "max-width", "min(780px, calc(100vw - 96px))");
  setImportant(card, "height", "auto");
  setImportant(card, "max-height", "calc(100vh - 96px)");
  setImportant(card, "overflow-y", "auto");
  setImportant(card, "overflow-x", "hidden");
}

function ensureHelpCloseButton() {
  const help = getHelpPanel();

  if (!help) return;

  let button = help.querySelector("#" + HELP_CLOSE_ID);

  if (button) return;

  button = document.createElement("button");
  button.id = HELP_CLOSE_ID;
  button.type = "button";
  button.textContent = "Close";

  help.prepend(button);
}

function closeHelp(force = false) {
  closePanel(getHelpPanel(), force);
  document.body.classList.remove("help-modal-open");
}

function closeSettings(force = false) {
  closePanel(getSettingsPanel(), force);
  document.body.classList.remove("settings-modal-open");
}

function closePanel(panel, force) {
  if (!panel) return;

  panel.classList.add("hidden");

  if (force) {
    panel.setAttribute(FORCE_CLOSED_ATTR, "1");
  }

  setImportant(panel, "display", "none");
  setImportant(panel, "opacity", "0");
  setImportant(panel, "visibility", "hidden");
  setImportant(panel, "pointer-events", "none");
}

function releasePanel(panel) {
  if (!panel) return;

  panel.removeAttribute(FORCE_CLOSED_ATTR);

  panel.style.removeProperty("display");
  panel.style.removeProperty("opacity");
  panel.style.removeProperty("visibility");
  panel.style.removeProperty("pointer-events");
}

function enforceClosedModals() {
  const modals = [getHelpPanel(), getSettingsPanel()];

  for (const modal of modals) {
    if (!modal) continue;

    if (
      modal.getAttribute(FORCE_CLOSED_ATTR) === "1" ||
      modal.classList.contains("hidden")
    ) {
      modal.classList.add("hidden");

      setImportant(modal, "display", "none");
      setImportant(modal, "opacity", "0");
      setImportant(modal, "visibility", "hidden");
      setImportant(modal, "pointer-events", "none");
    }
  }
}

function cleanupModalBodyState() {
  if (hasAnyOpenModal()) return;

  document.body.classList.remove("help-modal-open");
  document.body.classList.remove("settings-modal-open");
}

function restoreGameplayUi() {
  for (const selector of GAMEPLAY_UI_SELECTORS) {
    const element = document.querySelector(selector);

    if (!element) continue;

    element.style.removeProperty("opacity");
    element.style.removeProperty("visibility");
    element.style.removeProperty("pointer-events");

    if (!element.classList.contains("hidden")) {
      element.style.removeProperty("display");
    }
  }
}

function hasAnyOpenModal() {
  return isPanelOpen(getHelpPanel()) || isPanelOpen(getSettingsPanel());
}

function isCloseButtonInside(target, panel) {
  if (!target || !panel) return false;

  const button = target.closest("button");

  if (!button) return false;
  if (!panel.contains(button)) return false;

  const text = String(button.textContent || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return text === "close" || text === "kapat";
}

function getHelpPanel() {
  return document.querySelector("#help");
}

function getSettingsPanel() {
  return document.querySelector("#settingsPanel");
}

function isPanelOpen(element) {
  if (!element) return false;
  if (element.getAttribute(FORCE_CLOSED_ATTR) === "1") return false;
  if (element.classList.contains("hidden")) return false;

  const computed = window.getComputedStyle(element);

  if (computed.display === "none") return false;
  if (computed.visibility === "hidden") return false;
  if (Number(computed.opacity) === 0) return false;

  const rect = element.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) return false;

  return true;
}

function isTypingTarget(target) {
  if (!target) return false;

  const tagName = String(target.tagName || "").toLowerCase();

  if (tagName === "input") return true;
  if (tagName === "textarea") return true;
  if (tagName === "select") return true;

  return Boolean(target.isContentEditable);
}

function setImportant(element, property, value) {
  if (!element) return;

  element.style.setProperty(property, value, "important");
}

function injectModalLayoutFixStyles() {
  let style = document.querySelector("#" + STYLE_ID);

  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = `
    body.help-modal-open::before,
    body.settings-modal-open::before {
      content: "";
      position: fixed;
      inset: 0;
      z-index: 210;
      background: rgba(0, 0, 0, 0.52);
      backdrop-filter: blur(6px);
      pointer-events: none;
    }

    [${FORCE_CLOSED_ATTR}="1"] {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    #help.full-help-modal {
      padding: 30px 34px !important;
      box-sizing: border-box !important;

      color: #e5f6ff !important;
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 34%),
        linear-gradient(180deg, rgba(8, 15, 32, 0.99), rgba(2, 8, 20, 0.98)) !important;

      border: 1px solid rgba(56, 189, 248, 0.72) !important;
      border-radius: 24px !important;

      box-shadow:
        0 32px 90px rgba(0, 0, 0, 0.62),
        0 0 34px rgba(56, 189, 248, 0.16),
        inset 0 0 32px rgba(56, 189, 248, 0.07) !important;

      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
    }

    #help.full-help-modal.hidden {
      display: none !important;
    }

    #${HELP_CLOSE_ID} {
      position: sticky !important;
      top: 0 !important;
      float: right !important;

      min-width: 110px !important;
      height: 38px !important;
      margin: 0 0 12px 18px !important;

      border-radius: 12px !important;
      border: 1px solid rgba(96, 165, 250, 0.72) !important;
      background: rgba(15, 23, 42, 0.96) !important;
      color: #e5f6ff !important;
      font-size: 13px !important;
      font-weight: 950 !important;
      cursor: pointer !important;
      z-index: 3 !important;
    }

    #${HELP_CLOSE_ID}:hover {
      color: #facc15 !important;
      border-color: rgba(250, 204, 21, 0.86) !important;
    }

    #help.full-help-modal::before {
      content: "COMMAND MANUAL";
      display: block;
      margin-bottom: 6px;

      color: #38bdf8;
      font-size: 12px;
      font-weight: 950;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }

    #help.full-help-modal > div:first-of-type {
      margin-bottom: 22px !important;

      color: #facc15 !important;
      font-size: 36px !important;
      line-height: 1 !important;
      font-weight: 950 !important;
      letter-spacing: 0.02em !important;
      text-shadow: 0 0 22px rgba(250, 204, 21, 0.13) !important;
    }

    #help.full-help-modal > div {
      color: #dbeafe !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
    }

    #help.full-help-modal b {
      color: #38bdf8 !important;
      font-weight: 950 !important;
    }

    #help.full-help-modal br {
      display: block !important;
      margin: 12px 0 !important;
      content: "" !important;
    }

    #settingsPanel.full-settings-modal {
      background: rgba(0, 0, 0, 0.52) !important;
      backdrop-filter: blur(6px) !important;
    }

    #settingsPanel.full-settings-modal.hidden {
      display: none !important;
    }

    #settingsPanel.full-settings-modal .settings-card {
      padding: 28px 30px !important;
      box-sizing: border-box !important;

      border-radius: 24px !important;
      border: 1px solid rgba(56, 189, 248, 0.68) !important;

      background:
        radial-gradient(circle at top, rgba(56, 189, 248, 0.12), transparent 32%),
        linear-gradient(180deg, rgba(8, 15, 32, 0.99), rgba(3, 8, 20, 0.98)) !important;

      box-shadow:
        0 30px 90px rgba(0, 0, 0, 0.6),
        0 0 34px rgba(56, 189, 248, 0.14) !important;
    }

    #settingsPanel.full-settings-modal .settings-title {
      margin-bottom: 22px !important;

      color: #38bdf8 !important;
      font-size: 38px !important;
      line-height: 1 !important;
      font-weight: 950 !important;
      text-align: center !important;
      text-shadow: 0 0 24px rgba(56, 189, 248, 0.24) !important;
    }

    #settingsPanel.full-settings-modal button {
      width: 100% !important;
      min-height: 46px !important;
      margin-bottom: 12px !important;

      border-radius: 13px !important;
      font-size: 15px !important;
      font-weight: 950 !important;
    }

    #settingsPanel.full-settings-modal .settings-about {
      margin-top: 14px !important;
      padding: 18px !important;

      border-radius: 18px !important;
      border: 1px solid rgba(56, 189, 248, 0.22) !important;
      background: rgba(15, 23, 42, 0.62) !important;
    }

    #settingsPanel.full-settings-modal .settings-about p {
      max-width: 620px !important;
      margin: 10px auto !important;

      color: #dbeafe !important;
      font-size: 13px !important;
      line-height: 1.45 !important;
      text-align: center !important;
    }

    #settingsPanel.full-settings-modal .requirement-proof {
      margin-top: 16px !important;
      padding: 14px !important;

      border-radius: 15px !important;
      border: 1px solid rgba(56, 189, 248, 0.26) !important;
      background: rgba(3, 7, 18, 0.5) !important;
    }

    #settingsPanel.full-settings-modal .requirement-proof div {
      display: grid !important;
      grid-template-columns: 150px 1fr !important;
      gap: 10px !important;

      padding: 7px 0 !important;
      border-bottom: 1px solid rgba(148, 163, 184, 0.13) !important;

      color: #dbeafe !important;
      font-size: 12px !important;
      line-height: 1.35 !important;
    }

    #settingsPanel.full-settings-modal .requirement-proof div:last-child {
      border-bottom: none !important;
    }

    #settingsPanel.full-settings-modal .requirement-proof b {
      color: #facc15 !important;
    }

    @media (max-width: 900px) {
      #help.full-help-modal,
      #settingsPanel.full-settings-modal .settings-card {
        width: calc(100vw - 32px) !important;
        max-width: calc(100vw - 32px) !important;
        height: calc(100vh - 32px) !important;
        max-height: calc(100vh - 32px) !important;
      }

      #settingsPanel.full-settings-modal .requirement-proof div {
        grid-template-columns: 1fr !important;
      }
    }
  `;
}