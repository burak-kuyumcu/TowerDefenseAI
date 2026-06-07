const STYLE_ID = "panelHardResetStyle";
const BACKDROP_ID = "panelHardBackdrop";
const HELP_CLOSE_ID = "helpHardCloseButton";
const STAGE_CLOSE_ID = "stageIntelHardCloseButton";

let initialized = false;
let listenersInstalled = false;

const DRAWER_SELECTORS = [
  "#help",
  "#achievementPanel",
  "#aiFeedback",
  "#stageIntelPanel"
];

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

const ARCHIVE_SELECTORS = [
  "#storyArchive",
  "#storyArchivePanel",
  "#loreArchive",
  "#loreArchivePanel",
  "#missionArchivePanel",
  ".story-archive-panel"
];

export function initPanelHardReset() {
  if (initialized) return;

  initialized = true;

  injectStyles();
  ensureBackdrop();
  ensureHelpCloseButton();
  ensureStageIntelCloseButton();
  installListeners();
  updatePanelHardReset();
}

export function updatePanelHardReset() {
  if (!initialized) {
    initPanelHardReset();
    return;
  }

  injectStyles();
  ensureBackdrop();
  ensureHelpCloseButton();
  ensureStageIntelCloseButton();

  forceSettingsLayout();
  forceHelpLayout();
  forceDrawerLayout("#achievementPanel", 680, 8950);
  forceDrawerLayout("#aiFeedback", 680, 8950);
  forceDrawerLayout("#stageIntelPanel", 700, 8950);

  releaseArchiveLayout();

  syncBodyPanelClasses();
  restoreGameplayUiIfNeeded();
}

function installListeners() {
  if (listenersInstalled) return;

  listenersInstalled = true;

  document.addEventListener(
    "click",
    function (event) {
      const target = event.target;

      if (!target || !target.closest) return;

      if (target.closest("#" + STAGE_CLOSE_ID)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        hardCloseStageIntelPanel();
        return;
      }

      if (target.closest("#" + BACKDROP_ID)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        closeSettingsPanelHard();
        closeAllDrawers();
        syncBodyPanelClasses();
        updatePanelHardReset();
        return;
      }

      if (target.closest("#quickHelpButton")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        toggleDrawer("#help");
        return;
      }

      if (target.closest("#quickStageButton")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        toggleDrawer("#stageIntelPanel");
        return;
      }

      if (target.closest("#quickAchievementsButton")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        toggleDrawer("#achievementPanel");
        return;
      }

      if (target.closest("#quickAIButton")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        toggleDrawer("#aiFeedback");
        return;
      }

      if (target.closest("#settingsButton")) {
        closeAllDrawers();
        closeStoryArchive();

        window.setTimeout(updatePanelHardReset, 0);
        return;
      }

      if (target.closest("#" + HELP_CLOSE_ID)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        closePanel("#help");
        syncBodyPanelClasses();
        updatePanelHardReset();
        return;
      }

      if (target.closest("#settingsCloseButton")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        closeSettingsPanelHard();
        syncBodyPanelClasses();
        updatePanelHardReset();
      }
    },
    true
  );

  window.addEventListener(
    "keydown",
    function (event) {
      if (isTypingTarget(event.target)) return;
      if (event.key !== "Escape") return;

      const hasOpenPanel =
        isOpen("#settingsPanel") ||
        DRAWER_SELECTORS.some((selector) => isOpen(selector));

      if (!hasOpenPanel) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      closeSettingsPanelHard();
      closeAllDrawers();
      syncBodyPanelClasses();
      updatePanelHardReset();
    },
    true
  );
}

function toggleDrawer(selector) {
  const panel = document.querySelector(selector);

  if (!panel) return;

  const willOpen = !isOpen(selector);

  closeSettingsPanelHard();
  closeStoryArchive();
  closeAllDrawers(selector);

  if (willOpen) {
    openPanel(selector);
  } else {
    closePanel(selector);
  }

  syncBodyPanelClasses();
  updatePanelHardReset();
}

function forceSettingsLayout() {
  const panel = document.querySelector("#settingsPanel");

  if (!panel) return;

  if (panel.classList.contains("hidden")) {
    setHidden(panel);
    document.body.classList.remove("settings-panel-open");
    return;
  }

  document.body.classList.add("settings-panel-open");

  setImportant(panel, "position", "fixed");
  setImportant(panel, "inset", "0");
  setImportant(panel, "top", "0");
  setImportant(panel, "left", "0");
  setImportant(panel, "right", "0");
  setImportant(panel, "bottom", "0");
  setImportant(panel, "transform", "none");
  setImportant(panel, "width", "100vw");
  setImportant(panel, "height", "100vh");
  setImportant(panel, "max-width", "none");
  setImportant(panel, "max-height", "none");
  setImportant(panel, "display", "flex");
  setImportant(panel, "align-items", "center");
  setImportant(panel, "justify-content", "center");
  setImportant(panel, "padding", "24px");
  setImportant(panel, "overflow", "hidden");
  setImportant(panel, "visibility", "visible");
  setImportant(panel, "pointer-events", "auto");
  setImportant(panel, "z-index", "9100");
  setImportant(panel, "box-sizing", "border-box");
  setImportant(panel, "background", "rgba(0, 8, 18, 0.62)");
  setImportant(panel, "backdrop-filter", "blur(6px)");

  const card = panel.querySelector(".settings-card");

  if (!card) return;

  setImportant(card, "position", "relative");
  setImportant(card, "left", "auto");
  setImportant(card, "top", "auto");
  setImportant(card, "right", "auto");
  setImportant(card, "bottom", "auto");
  setImportant(card, "transform", "none");

  setImportant(card, "width", "min(620px, calc(100vw - 56px))");
  setImportant(card, "max-width", "min(620px, calc(100vw - 56px))");
  setImportant(card, "height", "auto");
  setImportant(card, "max-height", "calc(100vh - 56px)");

  setImportant(card, "overflow-y", "auto");
  setImportant(card, "overflow-x", "hidden");

  setImportant(card, "padding", "28px 30px");
  setImportant(card, "box-sizing", "border-box");
  setImportant(card, "border-radius", "24px");
  setImportant(card, "text-align", "center");
}

function forceHelpLayout() {
  const panel = document.querySelector("#help");

  if (!panel) return;

  if (panel.classList.contains("hidden")) {
    setHidden(panel);
    return;
  }

  setImportant(panel, "position", "fixed");
  setImportant(panel, "top", "50%");
  setImportant(panel, "left", "50%");
  setImportant(panel, "right", "auto");
  setImportant(panel, "bottom", "auto");
  setImportant(panel, "transform", "translate(-50%, -50%)");
  setImportant(panel, "width", "min(1180px, calc(100vw - 56px))");
  setImportant(panel, "height", "auto");
  setImportant(panel, "max-height", "calc(100vh - 48px)");
  setImportant(panel, "overflow-y", "auto");
  setImportant(panel, "overflow-x", "hidden");
  setImportant(panel, "display", "block");
  setImportant(panel, "visibility", "visible");
  setImportant(panel, "pointer-events", "auto");
  setImportant(panel, "z-index", "9050");
  setImportant(panel, "box-sizing", "border-box");
}

function forceDrawerLayout(selector, width, zIndex) {
  const panel = document.querySelector(selector);

  if (!panel) return;

  if (panel.classList.contains("hidden")) {
    setHidden(panel);
    return;
  }

  setImportant(panel, "position", "fixed");
  setImportant(panel, "top", "50%");
  setImportant(panel, "left", "50%");
  setImportant(panel, "right", "auto");
  setImportant(panel, "bottom", "auto");
  setImportant(panel, "transform", "translate(-50%, -50%)");
  setImportant(panel, "width", `min(${width}px, calc(100vw - 56px))`);
  setImportant(panel, "height", "auto");
  setImportant(panel, "max-height", "calc(100vh - 72px)");
  setImportant(panel, "overflow-y", "auto");
  setImportant(panel, "overflow-x", "hidden");
  setImportant(panel, "display", "block");
  setImportant(panel, "visibility", "visible");
  setImportant(panel, "pointer-events", "auto");
  setImportant(panel, "z-index", String(zIndex));
  setImportant(panel, "box-sizing", "border-box");
}

function releaseArchiveLayout() {
  ARCHIVE_SELECTORS.forEach((selector) => {
    const panel = document.querySelector(selector);

    if (!panel) return;

    clearPanelHardInlineStyles(panel);
  });
}

function openPanel(selector) {
  const panel = document.querySelector(selector);

  if (!panel) return;

  panel.classList.remove("hidden");
  panel.classList.add("open");

  panel.removeAttribute("data-panel-hard-closed");

  setImportant(panel, "display", "block");
  setImportant(panel, "visibility", "visible");
  setImportant(panel, "pointer-events", "auto");
  panel.style.removeProperty("opacity");

  if (selector === "#stageIntelPanel") {
    document.body.classList.add("stage-intel-open");
  }
}

function closePanel(selector) {
  const panel = document.querySelector(selector);

  if (!panel) return;

  panel.classList.add("hidden");
  panel.classList.remove("open", "active", "visible");
  panel.setAttribute("data-panel-hard-closed", "1");

  setHidden(panel);
  setImportant(panel, "opacity", "0");

  if (selector === "#stageIntelPanel") {
    document.body.classList.remove("stage-intel-open");
  }
}

function hardCloseStageIntelPanel() {
  const panel = document.querySelector("#stageIntelPanel");

  if (!panel) return;

  panel.classList.add("hidden");
  panel.classList.remove("open", "active", "visible");
  panel.setAttribute("data-panel-hard-closed", "1");

  if (panel.dataset) {
    panel.dataset.stageIntelGate = "hard-closed";
  }

  setImportant(panel, "display", "none");
  setImportant(panel, "opacity", "0");
  setImportant(panel, "visibility", "hidden");
  setImportant(panel, "pointer-events", "none");

  document.body.classList.remove("stage-intel-open");
  document.body.classList.remove("info-drawer-open");
  document.body.classList.remove("panel-hard-modal-open");

  restoreGameplayUiIfNeeded();

  window.setTimeout(() => {
    const latePanel = document.querySelector("#stageIntelPanel");

    if (!latePanel) return;

    if (latePanel.getAttribute("data-panel-hard-closed") === "1") {
      latePanel.classList.add("hidden");
      latePanel.classList.remove("open", "active", "visible");

      setImportant(latePanel, "display", "none");
      setImportant(latePanel, "opacity", "0");
      setImportant(latePanel, "visibility", "hidden");
      setImportant(latePanel, "pointer-events", "none");
    }

    syncBodyPanelClasses();
    restoreGameplayUiIfNeeded();
  }, 0);
}

function closeSettingsPanelHard() {
  const panel = document.querySelector("#settingsPanel");

  if (!panel) return;

  panel.classList.add("hidden");
  panel.classList.remove("open", "active", "visible");

  setHidden(panel);

  document.body.classList.remove("settings-panel-open");
}

function closeAllDrawers(exceptSelector = null) {
  DRAWER_SELECTORS.forEach((selector) => {
    if (selector !== exceptSelector) {
      closePanel(selector);
    }
  });
}

function closeStoryArchive() {
  ARCHIVE_SELECTORS.forEach((selector) => {
    const panel = document.querySelector(selector);

    if (!panel) return;

    panel.classList.add("hidden");
    panel.classList.remove("open", "active", "visible");

    clearPanelHardInlineStyles(panel);
  });

  document.body.classList.remove("archive-modal-open");
}

function syncBodyPanelClasses() {
  const settingsOpen = isOpen("#settingsPanel");
  const drawerOpen = DRAWER_SELECTORS.some((selector) => isOpen(selector));

  document.body.classList.toggle("settings-panel-open", settingsOpen);
  document.body.classList.toggle("info-drawer-open", drawerOpen);
  document.body.classList.toggle(
    "panel-hard-modal-open",
    settingsOpen || drawerOpen
  );

  if (!isOpen("#stageIntelPanel")) {
    document.body.classList.remove("stage-intel-open");
  }
}

function restoreGameplayUiIfNeeded() {
  const settingsOpen = isOpen("#settingsPanel");
  const drawerOpen = DRAWER_SELECTORS.some((selector) => isOpen(selector));

  if (settingsOpen || drawerOpen) return;

  GAMEPLAY_UI_SELECTORS.forEach((selector) => {
    const element = document.querySelector(selector);

    if (!element) return;

    element.style.removeProperty("pointer-events");
    element.style.removeProperty("opacity");
    element.style.removeProperty("visibility");
  });

  document.body.classList.remove("settings-panel-open");
  document.body.classList.remove("info-drawer-open");
  document.body.classList.remove("panel-hard-modal-open");
}

function ensureBackdrop() {
  let backdrop = document.querySelector("#" + BACKDROP_ID);

  if (backdrop) return;

  backdrop = document.createElement("div");
  backdrop.id = BACKDROP_ID;
  document.body.appendChild(backdrop);
}

function ensureHelpCloseButton() {
  const help = document.querySelector("#help");

  if (!help) return;

  let button = help.querySelector("#" + HELP_CLOSE_ID);

  if (button) return;

  button = document.createElement("button");
  button.id = HELP_CLOSE_ID;
  button.type = "button";
  button.textContent = "×";
  button.setAttribute("aria-label", "Close help panel");

  button.addEventListener(
    "click",
    function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      closePanel("#help");
      syncBodyPanelClasses();
      updatePanelHardReset();
    },
    true
  );

  help.prepend(button);
}

function ensureStageIntelCloseButton() {
  const panel = document.querySelector("#stageIntelPanel");

  if (!panel) return;

  let button = panel.querySelector("#" + STAGE_CLOSE_ID);

  if (button) {
    button.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      hardCloseStageIntelPanel();
    };

    return;
  }

  button = document.createElement("button");
  button.id = STAGE_CLOSE_ID;
  button.type = "button";
  button.textContent = "×";
  button.setAttribute("aria-label", "Close stage intel panel");

  button.onclick = function (event) {
    event.preventDefault();
    event.stopPropagation();
    hardCloseStageIntelPanel();
  };

  button.addEventListener(
    "click",
    function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      hardCloseStageIntelPanel();
    },
    true
  );

  panel.prepend(button);
}

function setHidden(element) {
  setImportant(element, "display", "none");
  setImportant(element, "visibility", "hidden");
  setImportant(element, "pointer-events", "none");
}

function setImportant(element, property, value) {
  element.style.setProperty(property, value, "important");
}

function clearPanelHardInlineStyles(element) {
  const properties = [
    "position",
    "inset",
    "top",
    "left",
    "right",
    "bottom",
    "transform",
    "width",
    "height",
    "min-width",
    "min-height",
    "max-width",
    "max-height",
    "overflow",
    "overflow-y",
    "overflow-x",
    "display",
    "visibility",
    "pointer-events",
    "z-index",
    "box-sizing",
    "padding",
    "border-radius",
    "background",
    "backdrop-filter",
    "box-shadow"
  ];

  properties.forEach((property) => {
    element.style.removeProperty(property);
  });
}

function isOpen(selector) {
  const element = document.querySelector(selector);

  if (!element) return false;
  if (element.classList.contains("hidden")) return false;
  if (element.getAttribute("data-panel-hard-closed") === "1") return false;

  const style = window.getComputedStyle(element);

  return style.display !== "none" && style.visibility !== "hidden";
}

function isTypingTarget(target) {
  if (!target) return false;

  const tagName = target.tagName ? target.tagName.toLowerCase() : "";

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

function injectStyles() {
  let style = document.querySelector("#" + STYLE_ID);

  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = `
    #panelHardBackdrop {
      position: fixed !important;
      inset: 0 !important;
      display: none !important;
      background:
        radial-gradient(circle at 50% 20%, rgba(45, 150, 255, 0.12), transparent 42%),
        rgba(0, 8, 14, 0.5) !important;
      backdrop-filter: blur(3px) !important;
      z-index: 8800 !important;
      pointer-events: auto !important;
    }

    body.panel-hard-modal-open #panelHardBackdrop {
      display: block !important;
    }

    #settingsPanel.hidden,
    #help.hidden,
    #achievementPanel.hidden,
    #aiFeedback.hidden,
    #stageIntelPanel.hidden,
    [data-panel-hard-closed="1"] {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    #settingsPanel {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: none !important;
      max-height: none !important;
      transform: none !important;

      display: flex !important;
      align-items: center !important;
      justify-content: center !important;

      padding: 24px !important;
      overflow: hidden !important;
      box-sizing: border-box !important;

      z-index: 9100 !important;

      background: rgba(0, 8, 18, 0.62) !important;
      backdrop-filter: blur(6px) !important;
    }

    #settingsPanel:not(.hidden) {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    #settingsPanel .settings-card {
      position: relative !important;
      left: auto !important;
      top: auto !important;
      right: auto !important;
      bottom: auto !important;
      transform: none !important;

      width: min(620px, calc(100vw - 56px)) !important;
      max-width: min(620px, calc(100vw - 56px)) !important;
      height: auto !important;
      max-height: calc(100vh - 56px) !important;

      overflow-y: auto !important;
      overflow-x: hidden !important;

      padding: 28px 30px !important;
      box-sizing: border-box !important;
      border-radius: 24px !important;
      text-align: center !important;

      border: 1px solid rgba(56, 189, 248, 0.72) !important;
      background:
        radial-gradient(circle at top, rgba(56, 189, 248, 0.12), transparent 34%),
        linear-gradient(180deg, rgba(8, 15, 32, 0.99), rgba(3, 8, 20, 0.98)) !important;

      box-shadow:
        0 30px 90px rgba(0, 0, 0, 0.64),
        0 0 34px rgba(56, 189, 248, 0.16) !important;
    }

    #settingsPanel *,
    #help *,
    #achievementPanel *,
    #aiFeedback *,
    #stageIntelPanel * {
      box-sizing: border-box !important;
      max-width: 100% !important;
    }

    #settingsPanel .settings-title {
      margin: 0 0 22px 0 !important;
      color: #38bdf8 !important;
      font-size: clamp(30px, 4vw, 38px) !important;
      line-height: 1 !important;
      font-weight: 950 !important;
      text-align: center !important;
      text-shadow: 0 0 24px rgba(56, 189, 248, 0.24) !important;
      white-space: normal !important;
    }

    #settingsPanel button {
      width: 100% !important;
      max-width: 100% !important;
      min-height: 46px !important;
      margin: 0 0 12px 0 !important;
      white-space: normal !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      border-radius: 13px !important;
      font-size: 15px !important;
      font-weight: 950 !important;
    }

    #settingsPanel .settings-about {
      width: 100% !important;
      margin: 14px 0 !important;
      padding: 18px !important;
      border-radius: 18px !important;
      border: 1px solid rgba(56, 189, 248, 0.24) !important;
      background: rgba(15, 23, 42, 0.62) !important;
      overflow: hidden !important;
    }

    #settingsPanel .settings-about p {
      max-width: 100% !important;
      margin: 10px auto !important;
      color: #dbeafe !important;
      font-size: 13px !important;
      line-height: 1.45 !important;
      text-align: center !important;
      white-space: normal !important;
      overflow-wrap: break-word !important;
    }

    #settingsPanel .requirement-proof {
      width: 100% !important;
      margin-top: 16px !important;
      padding: 14px !important;
      border-radius: 15px !important;
      border: 1px solid rgba(56, 189, 248, 0.26) !important;
      background: rgba(3, 7, 18, 0.5) !important;
      overflow: hidden !important;
    }

    #settingsPanel .requirement-proof div {
      display: grid !important;
      grid-template-columns: 135px minmax(0, 1fr) !important;
      gap: 10px !important;
      padding: 7px 0 !important;
      border-bottom: 1px solid rgba(148, 163, 184, 0.13) !important;
      color: #dbeafe !important;
      font-size: 12px !important;
      line-height: 1.35 !important;
      min-width: 0 !important;
    }

    #settingsPanel .requirement-proof div:last-child {
      border-bottom: none !important;
    }

    #settingsPanel .requirement-proof b {
      color: #facc15 !important;
      min-width: 0 !important;
      overflow-wrap: break-word !important;
    }

    #settingsPanel p,
    #settingsPanel div,
    #settingsPanel span,
    #settingsPanel td,
    #settingsPanel th,
    #settingsPanel li,
    #help p,
    #help div,
    #help span,
    #help td,
    #help th,
    #help li {
      white-space: normal !important;
      overflow-wrap: break-word !important;
      word-break: normal !important;
    }

    #settingsPanel table,
    #help table {
      width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
    }

    #help:not(.hidden),
    #achievementPanel:not(.hidden),
    #aiFeedback:not(.hidden),
    #stageIntelPanel:not(.hidden):not([data-panel-hard-closed="1"]) {
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      right: auto !important;
      bottom: auto !important;
      transform: translate(-50%, -50%) !important;

      width: min(700px, calc(100vw - 56px)) !important;
      height: auto !important;
      max-height: calc(100vh - 72px) !important;

      overflow-y: auto !important;
      overflow-x: hidden !important;

      z-index: 8950 !important;
      display: block !important;
      visibility: visible !important;
      pointer-events: auto !important;

      padding: 24px 30px !important;
      border-radius: 20px !important;

      background:
        radial-gradient(circle at top, rgba(56, 189, 248, 0.12), transparent 34%),
        linear-gradient(180deg, rgba(8, 15, 32, 0.98), rgba(3, 8, 20, 0.97)) !important;

      box-shadow:
        0 28px 80px rgba(0, 0, 0, 0.62),
        0 0 30px rgba(56, 189, 248, 0.14) !important;
    }

    #help:not(.hidden) {
      z-index: 9050 !important;
      line-height: 1.52 !important;
    }

    #stageIntelPanel:not(.hidden):not([data-panel-hard-closed="1"]) {
      position: fixed !important;
      padding: 28px 30px !important;
      padding-top: 34px !important;
    }

    #help h1,
    #help h2,
    #help h3,
    #help .section-title {
      text-align: center !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    #help ul,
    #help ol {
      padding-left: 20px !important;
      margin-left: 0 !important;
    }

    #helpHardCloseButton {
      position: sticky !important;
      top: 0 !important;
      float: right !important;
      width: 38px !important;
      height: 38px !important;
      margin: -8px -10px 8px 14px !important;
      border: 1px solid rgba(255, 255, 255, 0.22) !important;
      border-radius: 999px !important;
      background: rgba(8, 16, 36, 0.96) !important;
      color: #ffffff !important;
      font-size: 24px !important;
      line-height: 32px !important;
      cursor: pointer !important;
      z-index: 40 !important;
      box-shadow: 0 0 18px rgba(0, 255, 255, 0.24) !important;
    }

    #helpHardCloseButton:hover {
      transform: scale(1.05) !important;
    }

    #stageIntelHardCloseButton {
      position: absolute !important;
      top: 14px !important;
      right: 14px !important;

      width: 38px !important;
      height: 38px !important;

      display: flex !important;
      align-items: center !important;
      justify-content: center !important;

      border: 1px solid rgba(96, 165, 250, 0.68) !important;
      border-radius: 999px !important;

      background: rgba(15, 23, 42, 0.96) !important;
      color: #e5f6ff !important;

      font-size: 24px !important;
      font-weight: 900 !important;
      line-height: 1 !important;

      cursor: pointer !important;
      z-index: 9999 !important;
      pointer-events: auto !important;

      box-shadow:
        0 0 18px rgba(56, 189, 248, 0.18),
        inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
    }

    #stageIntelHardCloseButton:hover {
      color: #facc15 !important;
      border-color: rgba(250, 204, 21, 0.85) !important;
      transform: scale(1.04) !important;
    }

    #quickPanelButtons,
    #quickPanelButtons button,
    #quickHelpButton,
    #quickStageButton,
    #quickAchievementsButton,
    #quickAIButton,
    #settingsButton {
      pointer-events: auto !important;
      visibility: visible !important;
    }

    body:not(.settings-panel-open):not(.info-drawer-open) #hud,
    body:not(.settings-panel-open):not(.info-drawer-open) #selectedInfo,
    body:not(.settings-panel-open):not(.info-drawer-open) #actionPanel,
    body:not(.settings-panel-open):not(.info-drawer-open) #wavePreview,
    body:not(.settings-panel-open):not(.info-drawer-open) #buildPanel,
    body:not(.settings-panel-open):not(.info-drawer-open) #quickPanelButtons,
    body:not(.settings-panel-open):not(.info-drawer-open) #settingsButton,
    body:not(.settings-panel-open):not(.info-drawer-open) #eventLog,
    body:not(.settings-panel-open):not(.info-drawer-open) #minimap,
    body:not(.settings-panel-open):not(.info-drawer-open) #controlStatusPanel {
      visibility: visible !important;
      pointer-events: auto !important;
    }

    @media (max-width: 720px) {
      #settingsPanel {
        padding: 14px !important;
      }

      #settingsPanel .settings-card,
      #help:not(.hidden),
      #achievementPanel:not(.hidden),
      #aiFeedback:not(.hidden),
      #stageIntelPanel:not(.hidden):not([data-panel-hard-closed="1"]) {
        width: calc(100vw - 28px) !important;
        max-width: calc(100vw - 28px) !important;
        max-height: calc(100vh - 42px) !important;
      }

      #settingsPanel .settings-card {
        padding: 22px 20px !important;
      }

      #settingsPanel .requirement-proof div {
        grid-template-columns: 1fr !important;
      }

      #help:not(.hidden) {
        padding: 22px 22px !important;
      }
    }
  `;
}