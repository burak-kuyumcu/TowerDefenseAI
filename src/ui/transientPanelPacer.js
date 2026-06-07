const STYLE_ID = "transientPanelPacerStyles";

const OLD_HOST_IDS = [
  "tpqSinglePanelHost",
  "tpqSinglePanelBody"
];

const OLD_ATTRIBUTES = [
  "data-tpq-source-hidden",
  "data-tpq-managed",
  "data-tpq-auto-key"
];

const OLD_CLASSES = [
  "paced-panel",
  "paced-panel-visible",
  "paced-panel-briefing",
  "paced-panel-objective",
  "paced-panel-contract",
  "paced-panel-progress",
  "paced-panel-report",
  "paced-panel-toast",
  "paced-panel-coach",
  "paced-panel-secondary",
  "paced-panel-soft-hidden",
  "paced-panel-main",
  "paced-panel-strip",
  "paced-panel-large",
  "paced-panel-medium",
  "paced-panel-small",
  "paced-panel-compact",
  "paced-side-panel",
  "paced-side-left",
  "paced-side-right",
  "tp-paced-panel",
  "tp-panel-visible",
  "tp-panel-hidden",
  "tp-slot-topStrip",
  "tp-slot-hero",
  "tp-slot-bottomDock",
  "tp-slot-leftInfo",
  "tp-slot-coach",
  "tp-slot-rightToast",
  "tp-side-safe-left",
  "tp-side-safe-right",
  "tpq-center-panel",
  "tpq-center-active",
  "tpq-center-hidden",
  "tpq-center-gap",
  "tpq-managed-panel",
  "tpq-host-visible",
  "transient-pacer-suppressed"
];

const ALWAYS_IGNORE_IDS = new Set([
  "app",
  "hud",
  "overlay",
  "missionBriefing",
  "selectedInfo",
  "announcer",
  "controlStatusPanel",
  "minimap",
  "actionPanel",
  "settingsButton",
  "quickPanelButtons",
  "settingsPanel",
  "buildPanel",
  "bossHud",
  "wavePreview",
  "eventLog",
  "aiFeedback",
  "achievementPanel",
  "help"
]);

const BACK_PANEL_SELECTORS = [
  "#smartCoachToast",
  "#missionObjectivesPanel",
  "#optionalContractsPanel",
  "#campaignProgressPanel",
  "#waveReportPanel",
  "#battlefieldEventToast",
  "#commanderRankToast"
];

let initialized = false;
let cleanupFrames = 0;
let guardLoopStarted = false;
let rafId = null;

const suppressedElements = new Set();

export function initTransientPanelPacer() {
  if (initialized) return;

  initialized = true;

  injectStyles();
  removeOldHostPanels();
  cleanupLegacyMarks();
  startGuardLoop();
  runPanelGuard();
}

export function updateTransientPanelPacer() {
  if (!initialized) {
    initTransientPanelPacer();
    return;
  }

  injectStyles();

  if (cleanupFrames < 300) {
    cleanupFrames++;
    removeOldHostPanels();
    cleanupLegacyMarks();
  }

  runPanelGuard();
}

function startGuardLoop() {
  if (guardLoopStarted) return;

  guardLoopStarted = true;

  const tick = function () {
    runPanelGuard();
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
}

function runPanelGuard() {
  releaseSuppressedElements();

  const stageIntelOpen =
    document.body.classList.contains("stage-intel-open") ||
    Boolean(
      document.querySelector(
        '#stageIntelPanel[data-stage-intel-gate="managed-open"]'
      )
    );

  const missionBriefingVisible = isActuallyVisible(
    document.querySelector("#missionBriefing")
  );

  if (!stageIntelOpen) {
    hideDuplicateStageIntelPanels();
  }

  if (missionBriefingVisible || stageIntelOpen) {
    hideBackPanels();
  }

  preventCenterPanelPileup();
}

function hideDuplicateStageIntelPanels() {
  const panels = findDuplicateStageIntelPanels();

  for (const panel of panels) {
    suppressElement(panel);
  }
}

function findDuplicateStageIntelPanels() {
  const result = [];
  const elements = Array.from(document.querySelectorAll("body *"));

  for (const element of elements) {
    if (!element || element === document.body) continue;
    if (shouldIgnoreElement(element)) continue;

    const text = getNormalizedText(element);

    if (!looksLikeStageIntelText(text)) continue;
    if (!looksLikeBigCenterPanel(element)) continue;

    result.push(element);
  }

  return removeNestedCandidates(result);
}

function looksLikeStageIntelText(text) {
  if (!text) return false;

  const hasForestRoute = /Forest\s+Route/i.test(text);
  const hasForestBalance = /Forest\s+Balance/i.test(text);
  const hasOuterGrove = /Outer\s+Grove\s+Defense\s+Line/i.test(text);
  const hasObjective = /Hold\s+the\s+forest\s+road/i.test(text);
  const hasStageModifier = /Stage/i.test(text) && /Modifier/i.test(text);

  if (hasOuterGrove) return true;
  if (hasForestRoute && hasForestBalance && hasObjective) return true;
  if (hasForestRoute && hasForestBalance && hasStageModifier) return true;

  return false;
}

function looksLikeBigCenterPanel(element) {
  if (!element) return false;

  const rect = element.getBoundingClientRect();

  if (rect.width < 360) return false;
  if (rect.height < 120) return false;
  if (rect.width > window.innerWidth * 0.95) return false;
  if (rect.height > window.innerHeight * 0.72) return false;

  const centerX = rect.left + rect.width / 2;

  if (centerX < window.innerWidth * 0.12) return false;
  if (centerX > window.innerWidth * 0.88) return false;

  if (rect.top < -20) return false;
  if (rect.top > window.innerHeight * 0.72) return false;

  return true;
}

function preventCenterPanelPileup() {
  const visiblePanels = collectVisibleTransientPanels();

  if (visiblePanels.length <= 1) {
    return;
  }

  visiblePanels.sort(function (a, b) {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    return b.area - a.area;
  });

  const keeper = visiblePanels[0];

  for (const item of visiblePanels) {
    if (item.element === keeper.element) continue;

    if (rectsOverlap(item.rect, keeper.rect)) {
      suppressElement(item.element);
    }
  }
}

function collectVisibleTransientPanels() {
  const result = [];

  for (const selector of BACK_PANEL_SELECTORS) {
    const element = document.querySelector(selector);

    if (!isActuallyVisible(element)) continue;

    const rect = element.getBoundingClientRect();

    if (!isCenterishRect(rect)) continue;

    result.push({
      element,
      rect,
      area: rect.width * rect.height,
      priority: getPanelPriority(element)
    });
  }

  const textPanels = findTextBasedTransientPanels();

  for (const element of textPanels) {
    if (!isActuallyVisible(element)) continue;

    const rect = element.getBoundingClientRect();

    if (!isCenterishRect(rect)) continue;

    result.push({
      element,
      rect,
      area: rect.width * rect.height,
      priority: getPanelPriority(element)
    });
  }

  return removeDuplicatePanelItems(result);
}

function findTextBasedTransientPanels() {
  const candidates = [];
  const elements = Array.from(document.querySelectorAll("body *"));

  for (const element of elements) {
    if (!element || shouldIgnoreElement(element)) continue;

    const text = getNormalizedText(element);

    if (!looksLikeTransientText(text)) continue;
    if (!looksLikeTransientBox(element)) continue;

    candidates.push(element);
  }

  return removeNestedCandidates(candidates);
}

function looksLikeTransientText(text) {
  if (!text) return false;

  if (/Build\s+towers\s+before\s+wave/i.test(text)) return true;
  if (/COMMANDER\s+PROMOTION/i.test(text)) return true;
  if (/OPTIONAL\s+CONTRACT/i.test(text)) return true;
  if (/WAVE\s+DEBRIEF/i.test(text)) return true;
  if (/WAVE\s+REPORT/i.test(text)) return true;
  if (/SECTOR\s+ORDERS/i.test(text)) return true;
  if (/FIELD\s+OPERATOR/i.test(text)) return true;

  return false;
}

function looksLikeTransientBox(element) {
  const rect = element.getBoundingClientRect();

  if (rect.width < 260) return false;
  if (rect.height < 50) return false;
  if (rect.width > window.innerWidth * 0.92) return false;
  if (rect.height > window.innerHeight * 0.65) return false;

  return true;
}

function getPanelPriority(element) {
  const id = element.id || "";
  const text = getNormalizedText(element);

  if (id === "missionBriefing") return 1000;
  if (id === "stageIntelPanel") return 900;
  if (/COMMANDER\s+PROMOTION/i.test(text)) return 120;
  if (/OPTIONAL\s+CONTRACT/i.test(text)) return 110;
  if (/WAVE\s+DEBRIEF|WAVE\s+REPORT/i.test(text)) return 100;
  if (/SECTOR\s+ORDERS/i.test(text)) return 95;
  if (/Build\s+towers\s+before\s+wave/i.test(text)) return 80;

  return 50;
}

function isCenterishRect(rect) {
  if (!rect) return false;

  const centerX = rect.left + rect.width / 2;

  if (centerX < window.innerWidth * 0.08) return false;
  if (centerX > window.innerWidth * 0.92) return false;

  if (rect.top < -40) return false;
  if (rect.top > window.innerHeight * 0.76) return false;

  return true;
}

function hideBackPanels() {
  for (const selector of BACK_PANEL_SELECTORS) {
    const panel = document.querySelector(selector);

    if (!panel) continue;

    suppressElement(panel);
  }

  const textPanels = findTextBasedTransientPanels();

  for (const panel of textPanels) {
    suppressElement(panel);
  }
}

function releaseSuppressedElements() {
  for (const element of suppressedElements) {
    if (!element || !document.body.contains(element)) continue;

    element.removeAttribute("data-panel-guard-suppressed");

    element.style.removeProperty("display");
    element.style.removeProperty("opacity");
    element.style.removeProperty("visibility");
    element.style.removeProperty("pointer-events");
  }

  suppressedElements.clear();
}

function suppressElement(element) {
  if (!element) return;
  if (ALWAYS_IGNORE_IDS.has(element.id || "")) return;

  element.setAttribute("data-panel-guard-suppressed", "1");

  element.style.setProperty("display", "none", "important");
  element.style.setProperty("opacity", "0", "important");
  element.style.setProperty("visibility", "hidden", "important");
  element.style.setProperty("pointer-events", "none", "important");

  suppressedElements.add(element);
}

function removeNestedCandidates(candidates) {
  const unique = Array.from(new Set(candidates));

  return unique.filter(function (candidate) {
    for (const other of unique) {
      if (candidate === other) continue;

      if (other.contains(candidate)) {
        const otherRect = other.getBoundingClientRect();
        const candidateRect = candidate.getBoundingClientRect();

        if (
          otherRect.width >= candidateRect.width &&
          otherRect.height >= candidateRect.height
        ) {
          return false;
        }
      }
    }

    return true;
  });
}

function removeDuplicatePanelItems(items) {
  const map = new Map();

  for (const item of items) {
    if (!item || !item.element) continue;

    map.set(item.element, item);
  }

  return Array.from(map.values());
}

function rectsOverlap(a, b) {
  if (!a || !b) return false;

  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function shouldIgnoreElement(element) {
  if (!element) return true;
  if (ALWAYS_IGNORE_IDS.has(element.id || "")) return true;

  if (element.closest("#hud")) return true;
  if (element.closest("#overlay")) return true;
  if (element.closest("#quickPanelButtons")) return true;
  if (element.closest("#settingsPanel")) return true;
  if (element.closest("#buildPanel")) return true;
  if (element.closest("#eventLog")) return true;
  if (element.closest("#minimap")) return true;
  if (element.closest("#selectedInfo")) return true;
  if (element.closest("#actionPanel")) return true;

  return false;
}

function isActuallyVisible(element) {
  if (!element) return false;
  if (element.classList.contains("hidden")) return false;

  const style = window.getComputedStyle(element);

  if (style.display === "none") return false;
  if (style.visibility === "hidden") return false;
  if (Number(style.opacity) === 0) return false;

  const rect = element.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) return false;

  return true;
}

function getNormalizedText(element) {
  return String(element.innerText || element.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanupLegacyMarks() {
  const elements = document.querySelectorAll("body *");

  for (const element of elements) {
    let touched = false;

    for (const className of OLD_CLASSES) {
      if (element.classList && element.classList.contains(className)) {
        element.classList.remove(className);
        touched = true;
      }
    }

    for (const attributeName of OLD_ATTRIBUTES) {
      if (element.hasAttribute && element.hasAttribute(attributeName)) {
        element.removeAttribute(attributeName);
        touched = true;
      }
    }

    if (touched) {
      element.style.removeProperty("--paced-top");
      element.style.removeProperty("top");
      element.style.removeProperty("bottom");
      element.style.removeProperty("left");
      element.style.removeProperty("right");
      element.style.removeProperty("transform");
      element.style.removeProperty("width");
      element.style.removeProperty("max-width");
      element.style.removeProperty("max-height");
      element.style.removeProperty("overflow");
    }
  }
}

function removeOldHostPanels() {
  for (const id of OLD_HOST_IDS) {
    const element = document.querySelector("#" + id);

    if (element) {
      element.remove();
    }
  }
}

function injectStyles() {
  let style = document.querySelector("#" + STYLE_ID);

  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = `
    [data-panel-guard-suppressed="1"] {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  `;
}