import * as THREE from "three";
import "./style.css";

import {
  createSceneSetup,
  rebuildStageMap,
  updateSceneVisuals
} from "./core/sceneSetup.js";

import { updateCameraProjection } from "./core/cameraSetup.js";
import { resizeGameRenderer } from "./core/rendererSetup.js";

import { initKeyboard, keys } from "./core/input.js";
import { state } from "./game/state.js";

import {
  placeTower,
  updateTowers,
  getClickedTower,
  cycleSelectedTowerTargetMode
} from "./entities/towers.js";

import { upgradeSelectedTower, sellTower } from "./game/upgrade.js";

import {
  updateWave,
  initWaveControls,
  updateWaveControls,
  startNextWave
} from "./systems/wave.js";

import { updateEnemies, cleanupEnemies } from "./entities/enemies.js";
import { updateProjectiles } from "./entities/projectiles.js";

import { updateHealthBars } from "./visuals/healthBars.js";
import { updateEffects } from "./visuals/effects.js";
import { updateFloatingTexts } from "./visuals/floatingText.js";
import { updateTacticalSignals } from "./visuals/tacticalSignals.js";

import {
  initTacticalOverlay,
  updateTacticalOverlay
} from "./visuals/tacticalOverlay.js";

import { updateCombo } from "./systems/combo.js";

import {
  initAchievements,
  updateAchievements
} from "./systems/achievements.js";

import { initPathVisuals, updatePathVisuals } from "./visuals/pathVisuals.js";
import { initStageVisuals, updateStageVisuals } from "./visuals/stageVisuals.js";
import { updateTowerLabels } from "./visuals/towerLabels.js";

import {
  initLightControlVisuals,
  updateLightControlVisuals
} from "./visuals/lightControlVisuals.js";

import {
  initScreenFeedback,
  updateScreenFeedback,
  resetScreenFeedback
} from "./visuals/screenFeedback.js";

import {
  initStageParticles,
  updateStageParticles,
  resetStageParticles
} from "./visuals/stageParticles.js";

import {
  initPathPressure,
  updatePathPressure,
  resetPathPressure
} from "./visuals/pathPressure.js";

import {
  initPortalSurge,
  updatePortalSurge,
  resetPortalSurge
} from "./visuals/portalSurge.js";

import {
  initBaseCoreShield,
  updateBaseCoreShield,
  resetBaseCoreShield
} from "./visuals/baseCoreShield.js";

import {
  initBuildHologram,
  updateBuildHologram,
  resetBuildHologram
} from "./visuals/buildHologram.js";

import {
  initTowerCombatJuice,
  updateTowerCombatJuice,
  resetTowerCombatJuice
} from "./visuals/towerCombatJuice.js";

import {
  initEnemyThreatAura,
  updateEnemyThreatAura,
  resetEnemyThreatAura
} from "./visuals/enemyThreatAura.js";

import {
  initEnemyBurstFx,
  updateEnemyBurstFx,
  resetEnemyBurstFx
} from "./visuals/enemyBurstFx.js";

import {
  initProjectileImpactFx,
  updateProjectileImpactFx,
  resetProjectileImpactFx
} from "./visuals/projectileImpactFx.js";

import {
  initEnemyTrailFx,
  updateEnemyTrailFx,
  resetEnemyTrailFx
} from "./visuals/enemyTrailFx.js";

import {
  initTowerDeployFx,
  updateTowerDeployFx,
  resetTowerDeployFx
} from "./visuals/towerDeployFx.js";

import {
  initEconomyRewardFx,
  updateEconomyRewardFx,
  resetEconomyRewardFx
} from "./visuals/economyRewardFx.js";

import {
  initTowerSynergyLinks,
  updateTowerSynergyLinks,
  resetTowerSynergyLinks
} from "./visuals/towerSynergyLinks.js";

import { updateHud } from "./ui/hud.js";
import { updateOverlay } from "./ui/overlay.js";
import { updateMinimap } from "./ui/minimap.js";
import { updateSelectedInfo } from "./ui/selectedInfo.js";
import { updateAnnouncer } from "./ui/announcer.js";
import { updateBossHud } from "./ui/bossHud.js";
import { updateWavePreview } from "./ui/wavePreview.js";
import { updateEventLog } from "./ui/eventLog.js";
import { updateAIFeedback } from "./ui/aiFeedback.js";
import { updateControlStatus } from "./ui/controlStatus.js";

import { initUIActions, updateUIActions } from "./ui/uiActions.js";

import {
  initSettingsPanel,
  updateSettingsPanel,
  closeSettingsPanel,
  isSettingsPanelOpen
} from "./ui/settingsPanel.js";

import { initBuildPanel, updateBuildPanel } from "./ui/buildPanel.js";
import { initUIPolish } from "./ui/uiPolish.js";

import {
  initPanelHardReset,
  updatePanelHardReset
} from "./ui/panelHardReset.js";

import {
  initTransientPanelPacer,
  updateTransientPanelPacer
} from "./ui/transientPanelPacer.js";

import {
  initStageIntelGate,
  updateStageIntelGate,
  toggleStageIntelGate,
  closeStageIntelGate
} from "./ui/stageIntelGate.js";

import {
  initStoryArchive,
  updateStoryArchive,
  toggleStoryArchive
} from "./ui/storyArchive.js";

import {
  initMissionBriefing,
  hideMissionBriefing
} from "./ui/missionBriefing.js";

import { toggleShaderMode } from "./visuals/materials.js";
import { startGame, togglePause, restartGame } from "./systems/gameFlow.js";
import { initBaseSystem, updateBaseSystem } from "./systems/base.js";
import { updateCameraShake } from "./systems/cameraShake.js";
import { toggleMute } from "./game/audio.js";
import { updateBossAbilities } from "./entities/bossAbilities.js";
import { createPostProcessing } from "./visuals/postProcessing.js";
import { activateSelectedTowerUltimate } from "./entities/towerUltimates.js";

import {
  initStageMusic,
  updateStageMusic
} from "./systems/stageMusic.js";

import {
  initStoryDirector,
  updateStoryDirector
} from "./systems/storyDirector.js";

import {
  initEnemyEvolution,
  updateEnemyEvolution,
  resetEnemyEvolution
} from "./systems/enemyEvolution.js";

import {
  initTacticalUpgradeCards,
  updateTacticalUpgradeCards,
  resetTacticalUpgradeCards
} from "./systems/tacticalUpgradeCards.js";

import {
  initOptionalContracts,
  updateOptionalContracts,
  resetOptionalContracts
} from "./systems/optionalContracts.js";

import {
  initSupplyDrops,
  updateSupplyDrops,
  resetSupplyDrops
} from "./systems/supplyDrops.js";

import {
  initMissionObjectives,
  updateMissionObjectives
} from "./systems/missionObjectives.js";

import {
  initCampaignProgress,
  updateCampaignProgress,
  resetCampaignProgress
} from "./systems/campaignProgress.js";

import {
  initBattlefieldEvents,
  updateBattlefieldEvents,
  resetBattlefieldEvents
} from "./systems/battlefieldEvents.js";

import {
  initCommanderRank,
  updateCommanderRank,
  resetCommanderRank
} from "./systems/commanderRank.js";

import {
  initWaveReport,
  updateWaveReport,
  resetWaveReport
} from "./systems/waveReport.js";

import {
  initSmartCoach,
  updateSmartCoach,
  resetSmartCoach
} from "./systems/smartCoach.js";

import {
  initNameShowcase,
  toggleNameShowcaseCamera,
  updateNameShowcaseCamera
} from "./visuals/nameShowcase.js";

import {
  initTransformShowcase,
  getTransformShowcaseObjects,
  updateTransformShowcase
} from "./visuals/transformShowcase.js";

import {
  toggleTransformShowcaseCamera,
  updateTransformShowcaseCamera
} from "./visuals/transformShowcaseCamera.js";

import {
  createRangePreview,
  updateRangePreview
} from "./visuals/rangePreview.js";

import {
  updateSelectorFromMouse,
  updateSelector,
  updateHighlights,
  handleSelectionClick
} from "./game/selection.js";

import {
  updateCamera,
  updateLights,
  updateDirectionalLight,
  moveSelectedObject,
  rotateSelectedObject,
  cycleControlMode,
  getControlModeLabel,
  adjustActiveLightIntensity
} from "./systems/controls.js";

const canvas = document.querySelector("#app");

const {
  scene,
  camera,
  renderer,
  directionalLight,
  spotLight,
  spotLightHelper,
  selector,
  base
} = createSceneSetup(canvas);

const postProcessing = createPostProcessing(renderer);

let renderedStageVersion = state.stageVersion;

initKeyboard();
createRangePreview(scene);
initBaseSystem(scene, base);
initUIActions(scene);
initSettingsPanel(scene);
initBuildPanel();
initMissionBriefing();
initWaveControls(scene);
initPathVisuals(scene);
initStageVisuals(scene);
updateStageVisuals();
initTacticalOverlay(scene);
initNameShowcase(scene);
initTransformShowcase(scene);

window.__transformShowcaseObjects = getTransformShowcaseObjects();

initLightControlVisuals(scene, directionalLight, spotLight);
initAchievements();
initStageMusic();
initStoryDirector();
initEnemyEvolution();
initTacticalUpgradeCards();
initUIPolish();
initStoryArchive();
initMissionObjectives();
initOptionalContracts();
initSupplyDrops(scene, camera, renderer);
initBattlefieldEvents();
initCommanderRank();
initWaveReport();
initSmartCoach();
initTransientPanelPacer();
initStageIntelGate();
closeStageIntelGate();
initScreenFeedback();
initStageParticles(scene);
initPathPressure(scene);
initPortalSurge(scene);
initBaseCoreShield(scene, base);
initBuildHologram(scene);
initTowerCombatJuice(scene);
initEnemyThreatAura(scene);
initEnemyBurstFx(scene);
initProjectileImpactFx(scene);
initEnemyTrailFx(scene);
initTowerDeployFx(scene);
initEconomyRewardFx(scene, base);
initTowerSynergyLinks(scene);
initPanelHardReset();

initCampaignProgress({
  onRestart: function () {
    closeSettingsPanel();
    closeStageIntelGate();
    resetBattlefieldEvents();
    resetCommanderRank();
    resetWaveReport();
    resetSmartCoach();
    resetScreenFeedback();
    resetStageParticles();
    resetPathPressure();
    resetPortalSurge();
    resetBaseCoreShield();
    resetBuildHologram();
    resetTowerCombatJuice();
    resetEnemyThreatAura();
    resetEnemyBurstFx();
    resetProjectileImpactFx();
    resetEnemyTrailFx();
    resetTowerDeployFx();
    resetEconomyRewardFx();
    resetTowerSynergyLinks();
    resetEnemyEvolution();
    resetTacticalUpgradeCards();
    resetOptionalContracts();
    resetSupplyDrops();
    restartGame(scene);
    updatePanelHardReset();
  },
  onContinue: function () {
    state.campaignComplete = false;
    updatePanelHardReset();
  }
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const lockedActionKeys = new Set();

const pickingPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshBasicMaterial({ visible: false })
);

pickingPlane.rotation.x = -Math.PI / 2;
scene.add(pickingPlane);

const INFO_PANEL_SELECTORS = [
  "#help",
  "#achievementPanel",
  "#aiFeedback",
  "#stageIntelPanel"
];

function isUIElement(target) {
  if (!target || !target.closest) return false;

  return Boolean(
    target.closest(
      "#hud, #help, #selectedInfo, #actionPanel, #overlay, #missionBriefing, #minimap, #settingsButton, #quickPanelButtons, #settingsPanel, #buildPanel, #bossHud, #wavePreview, #eventLog, #aiFeedback, #achievementPanel, #stageIntelPanel, #controlStatusPanel, #storyPanel, #storyCommsPanel, #storyObjectiveStrip, #storyArchive, #storyArchivePanel, #loreArchive, #loreArchivePanel, #missionArchivePanel, #missionObjectivesPanel, #campaignProgressPanel, #battlefieldEventToast, #commanderRankToast, #waveReportPanel, #smartCoachToast, #tacticalUpgradeCardsPanel, #optionalContractsPanel"
    )
  );
}

function syncInfoDrawerState() {
  const hasOpenStandardPanel = INFO_PANEL_SELECTORS.some((selector) => {
    const panel = document.querySelector(selector);

    return panel && !panel.classList.contains("hidden");
  });

  const hasOpenStagePanel = document.body.classList.contains("stage-intel-open");

  document.body.classList.toggle(
    "info-drawer-open",
    hasOpenStandardPanel || hasOpenStagePanel
  );
}

function closeInfoPanels(exceptSelector = null) {
  for (const selector of INFO_PANEL_SELECTORS) {
    if (selector === exceptSelector) continue;

    document.querySelector(selector)?.classList.add("hidden");
  }

  if (exceptSelector !== "#stageIntelPanel") {
    closeStageIntelGate();
  }

  if (exceptSelector !== "#settingsPanel") {
    closeSettingsPanel();
  }

  syncInfoDrawerState();
  updatePanelHardReset();
}

function toggleExclusivePanel(selector) {
  const panel = document.querySelector(selector);
  if (!panel) return;

  const willOpen = panel.classList.contains("hidden");

  closeInfoPanels(selector);

  if (willOpen) {
    panel.classList.remove("hidden");
  } else {
    panel.classList.add("hidden");
  }

  syncInfoDrawerState();
  updatePanelHardReset();
}

function toggleHelp() {
  toggleExclusivePanel("#help");
}

function toggleStageIntel() {
  closeInfoPanels("#stageIntelPanel");
  toggleStageIntelGate();
  syncInfoDrawerState();
  updatePanelHardReset();
}

function toggleAchievements() {
  toggleExclusivePanel("#achievementPanel");
}

function toggleAIFeedback() {
  toggleExclusivePanel("#aiFeedback");
}

function closeStoryArchivePanelOnly() {
  const panels = [
    document.querySelector("#storyArchive"),
    document.querySelector("#storyArchivePanel"),
    document.querySelector("#loreArchive"),
    document.querySelector("#loreArchivePanel"),
    document.querySelector("#missionArchivePanel"),
    document.querySelector(".story-archive-panel")
  ];

  for (const panel of panels) {
    panel?.classList.add("hidden");
  }

  updatePanelHardReset();
}

function initQuickPanelButtons() {
  document
    .querySelector("#quickHelpButton")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleHelp();
    });

  document
    .querySelector("#quickStageButton")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleStageIntel();
    });

  document
    .querySelector("#quickAchievementsButton")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleAchievements();
    });

  document
    .querySelector("#quickAIButton")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleAIFeedback();
    });
}

function showControlModeAnnouncement() {
  const announcer = document.querySelector("#announcer");

  if (!announcer) return;

  announcer.textContent = `Control Mode: ${getControlModeLabel()}`;

  window.clearTimeout(showControlModeAnnouncement.timeoutId);

  showControlModeAnnouncement.timeoutId = window.setTimeout(() => {
    if (announcer.textContent.startsWith("Control Mode:")) {
      announcer.textContent = "";
    }
  }, 1400);
}

function consumeActionKey(event) {
  if (event.repeat) return false;

  if (lockedActionKeys.has(event.code)) {
    return false;
  }

  lockedActionKeys.add(event.code);

  return true;
}

showControlModeAnnouncement.timeoutId = null;

initQuickPanelButtons();
syncInfoDrawerState();
updatePanelHardReset();

window.addEventListener("keyup", (event) => {
  lockedActionKeys.delete(event.code);
});

window.addEventListener("blur", () => {
  lockedActionKeys.clear();
});

window.addEventListener("keydown", (event) => {
  if (
    event.code === "ArrowUp" ||
    event.code === "ArrowDown" ||
    event.code === "ArrowLeft" ||
    event.code === "ArrowRight" ||
    event.code === "PageUp" ||
    event.code === "PageDown"
  ) {
    event.preventDefault();
  }

  if (event.code === "F3") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    cycleControlMode();
    showControlModeAnnouncement();
    return;
  }

  if (event.code === "KeyZ") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    toggleTransformShowcaseCamera(camera);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    hideMissionBriefing();
    closeSettingsPanel();
    closeStageIntelGate();
    syncInfoDrawerState();
    updatePanelHardReset();

    if (!state.started) {
      startGame();
    } else {
      startNextWave(scene);
    }

    return;
  }

  if (event.code === "KeyV") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    hideMissionBriefing();
    closeSettingsPanel();
    closeStageIntelGate();
    syncInfoDrawerState();
    updatePanelHardReset();
    startNextWave(scene);
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    togglePause();
    return;
  }

  if (event.code === "KeyR") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    hideMissionBriefing();
    closeSettingsPanel();
    closeStageIntelGate();
    closeInfoPanels();
    closeStoryArchivePanelOnly();
    resetCampaignProgress();
    resetBattlefieldEvents();
    resetCommanderRank();
    resetWaveReport();
    resetSmartCoach();
    resetScreenFeedback();
    resetStageParticles();
    resetPathPressure();
    resetPortalSurge();
    resetBaseCoreShield();
    resetBuildHologram();
    resetTowerCombatJuice();
    resetEnemyThreatAura();
    resetEnemyBurstFx();
    resetProjectileImpactFx();
    resetEnemyTrailFx();
    resetTowerDeployFx();
    resetEconomyRewardFx();
    resetTowerSynergyLinks();
    resetEnemyEvolution();
    resetTacticalUpgradeCards();
    resetOptionalContracts();
    resetSupplyDrops();
    restartGame(scene);
    syncInfoDrawerState();
    updatePanelHardReset();
    return;
  }

  if (event.code === "KeyN") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    toggleMute();
    return;
  }

  if (event.code === "KeyC") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    toggleNameShowcaseCamera(camera);
    return;
  }

  if (event.code === "KeyH") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    if (event.shiftKey) {
      spotLightHelper.visible = !spotLightHelper.visible;
    } else {
      toggleHelp();
    }

    return;
  }

  if (event.code === "KeyI") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    toggleStageIntel();
    return;
  }

  if (event.code === "KeyB") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    toggleAIFeedback();
    return;
  }

  if (event.code === "KeyL") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    closeSettingsPanel();
    closeInfoPanels();
    toggleStoryArchive();
    updatePanelHardReset();
    return;
  }

  if (event.code === "F2") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    toggleAchievements();
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();

    if (isSettingsPanelOpen()) {
      closeSettingsPanel();
      syncInfoDrawerState();
      updatePanelHardReset();
      return;
    }

    if (document.body.classList.contains("stage-intel-open")) {
      closeStageIntelGate();
      syncInfoDrawerState();
      updatePanelHardReset();
      return;
    }

    if (document.body.classList.contains("info-drawer-open")) {
      closeInfoPanels();
      updatePanelHardReset();
      return;
    }

    closeStoryArchivePanelOnly();
    state.selectedObject = null;
    updatePanelHardReset();
    return;
  }

  if (!state.started || state.gameOver) return;

  if (event.key === "1") state.selectedTowerType = "normal";
  if (event.key === "2") state.selectedTowerType = "rapid";
  if (event.key === "3") state.selectedTowerType = "sniper";
  if (event.key === "4") state.selectedTowerType = "slow";
  if (event.key === "5") state.selectedTowerType = "splash";

  if (event.code === "KeyT") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    placeTower(scene);
    return;
  }

  if (event.code === "KeyU") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    upgradeSelectedTower();
    return;
  }

  if (event.code === "KeyF") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    activateSelectedTowerUltimate(scene);
    return;
  }

  if (event.code === "KeyG") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    cycleSelectedTowerTargetMode();
    return;
  }

  if (event.code === "KeyM") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    toggleShaderMode(scene);
    return;
  }

  if (event.code === "KeyO") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    spotLight.visible = !spotLight.visible;
    return;
  }

  if (event.code === "KeyP") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    directionalLight.visible = !directionalLight.visible;
    return;
  }

  if (event.key === "+" || event.key === "=") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    adjustActiveLightIntensity(spotLight, directionalLight, 0.25);
    return;
  }

  if (event.key === "-" || event.key === "_") {
    event.preventDefault();
    if (!consumeActionKey(event)) return;

    adjustActiveLightIntensity(spotLight, directionalLight, -0.25);
    return;
  }
});

window.addEventListener("mousemove", (event) => {
  if (!state.started) return;
  if (isUIElement(event.target)) return;

  updateSelectorFromMouse(
    event.clientX,
    event.clientY,
    renderer,
    camera,
    raycaster,
    mouse,
    pickingPlane
  );
});

window.addEventListener("click", (event) => {
  if (isUIElement(event.target)) return;
  if (!state.started || state.gameOver || state.paused) return;

  const selected = handleSelectionClick(
    event,
    renderer,
    camera,
    raycaster,
    mouse
  );

  if (selected) return;

  updateSelectorFromMouse(
    event.clientX,
    event.clientY,
    renderer,
    camera,
    raycaster,
    mouse,
    pickingPlane
  );

  placeTower(scene);
});

window.addEventListener("contextmenu", (event) => {
  event.preventDefault();

  if (isUIElement(event.target)) return;
  if (!state.started || state.gameOver || state.paused) return;

  const clickedTower = getClickedTower(
    raycaster,
    mouse,
    renderer,
    camera,
    event.clientX,
    event.clientY
  );

  if (clickedTower) sellTower(scene, clickedTower);
});

function syncStageVisualsIfNeeded() {
  if (renderedStageVersion === state.stageVersion) {
    return;
  }

  closeSettingsPanel();
  closeStageIntelGate();
  syncInfoDrawerState();
  updatePanelHardReset();

  rebuildStageMap(scene, base);

  initPathVisuals(scene);
  initStageVisuals(scene);
  updateStageVisuals();

  updateMinimap();
  resetStageParticles();
  resetPathPressure();
  resetPortalSurge();
  resetBaseCoreShield();
  resetBuildHologram();
  resetTowerCombatJuice();
  resetEnemyThreatAura();
  resetEnemyBurstFx();
  resetProjectileImpactFx();
  resetEnemyTrailFx();
  resetTowerDeployFx();
  resetEconomyRewardFx();
  resetTowerSynergyLinks();
  resetEnemyEvolution();
  resetOptionalContracts();
  resetSupplyDrops();

  renderedStageVersion = state.stageVersion;
}

function animate() {
  requestAnimationFrame(animate);

  updateStageMusic();
  updateStoryDirector();

  syncStageVisualsIfNeeded();

  const cameraControlledByNameShowcase = updateNameShowcaseCamera(camera);
  const cameraControlledByTransformShowcase =
    updateTransformShowcaseCamera(camera);

  const cameraControlledByShowcase =
    cameraControlledByNameShowcase || cameraControlledByTransformShowcase;

  if (state.started && !state.gameOver && !state.paused) {
    if (!cameraControlledByShowcase) {
      updateCamera(camera, keys);
    }

    updateLights(spotLight, spotLightHelper, keys);
    updateDirectionalLight(directionalLight, keys);

    moveSelectedObject(keys);
    rotateSelectedObject(keys);

    updateSelector(selector);

    updateWave(scene);
    updateEnemyEvolution();
    updateEnemies(scene);
    updateBossAbilities(scene);
    updateTowers(scene);
    updateProjectiles(scene);
    updateHealthBars(camera);
    updateTowerLabels(camera, state.towers);
    updateBaseSystem(camera);
    updateEffects(scene);
    updateFloatingTexts(scene, camera);
    updateTacticalSignals(scene);
    updateTacticalOverlay(scene);
    updateCombo();
    updateAchievements();
    cleanupEnemies(scene);

    updateHighlights();
    updateRangePreview();
    updatePathVisuals();

    if (state.baseHp <= 0) {
      state.baseHp = 0;
      state.gameOver = true;
    }
  }

  if (!state.started || state.paused || state.gameOver) {
    updateSelector(selector);
    updateHighlights();
    updateRangePreview();
    updateBaseSystem(camera);
    updateTowerLabels(camera, state.towers);
    updatePathVisuals();
    updateTacticalSignals(scene);
    updateTacticalOverlay(scene);
    updateAchievements();

    updateLights(spotLight, spotLightHelper, keys);
    updateDirectionalLight(directionalLight, keys);
    rotateSelectedObject(keys);
  }

  updateHud();
  updateOverlay();
  updateMinimap();
  updateSelectedInfo();
  updateControlStatus();
  updateAnnouncer();
  updateBossHud();
  updateWavePreview();
  updateAIFeedback();
  updateUIActions();
  updateSettingsPanel();
  updateBuildPanel();
  updateWaveControls();
  updateEventLog();
  updateStoryArchive();
  updateMissionObjectives();
  updateOptionalContracts();
  updateSupplyDrops();
  updateCampaignProgress();
  updateBattlefieldEvents();
  updateCommanderRank();
  updateWaveReport();
  updateSmartCoach();
  updateTacticalUpgradeCards();
  updateTransientPanelPacer();
  updateStageIntelGate();
  updateScreenFeedback();

  updateTransformShowcase(camera);
  updateLightControlVisuals(directionalLight, spotLight);
  updateSceneVisuals();
  updateStageParticles();
  updatePathPressure();
  updatePortalSurge();
  updateBaseCoreShield();
  updateBuildHologram();
  updateTowerCombatJuice();
  updateEnemyThreatAura(camera);
  updateEnemyBurstFx();
  updateProjectileImpactFx();
  updateEnemyTrailFx();
  updateTowerDeployFx();
  updateEconomyRewardFx();
  updateTowerSynergyLinks();
  updateCameraShake(camera);

  syncInfoDrawerState();
  updatePanelHardReset();

  postProcessing.render(scene, camera, state.shaderMode);
}

window.addEventListener("resize", () => {
  updateCameraProjection(camera);
  resizeGameRenderer(renderer);

  postProcessing.resize(window.innerWidth, window.innerHeight);
  updatePanelHardReset();
});

animate();