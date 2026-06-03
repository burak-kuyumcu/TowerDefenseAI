import * as THREE from "three";
import "./style.css";

import {
  createSceneSetup,
  rebuildStageMap,
  updateSceneVisuals
} from "./core/sceneSetup.js";

import {
  updateCameraProjection
} from "./core/cameraSetup.js";

import {
  resizeGameRenderer
} from "./core/rendererSetup.js";

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
import { initSettingsPanel, updateSettingsPanel } from "./ui/settingsPanel.js";
import { initBuildPanel, updateBuildPanel } from "./ui/buildPanel.js";

import { toggleShaderMode } from "./visuals/materials.js";
import { startGame, togglePause, restartGame } from "./systems/gameFlow.js";
import { initBaseSystem, updateBaseSystem } from "./systems/base.js";
import { updateCameraShake } from "./systems/cameraShake.js";
import { toggleMute } from "./game/audio.js";
import { updateBossAbilities } from "./entities/bossAbilities.js";
import { createPostProcessing } from "./visuals/postProcessing.js";
import { activateSelectedTowerUltimate } from "./entities/towerUltimates.js";

import {
  initNameShowcase,
  toggleNameShowcaseCamera,
  updateNameShowcaseCamera
} from "./visuals/nameShowcase.js";

import {
  initTransformShowcase,
  getTransformShowcaseObjects
} from "./visuals/transformShowcase.js";

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

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const pickingPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshBasicMaterial({ visible: false })
);

pickingPlane.rotation.x = -Math.PI / 2;
scene.add(pickingPlane);

function isUIElement(target) {
  return target.closest(
    "#hud, #help, #selectedInfo, #actionPanel, #overlay, #minimap, #settingsButton, #quickPanelButtons, #settingsPanel, #buildPanel, #bossHud, #wavePreview, #eventLog, #aiFeedback, #achievementPanel, #stageIntelPanel, #controlStatusPanel"
  );
}

function toggleHelp() {
  document.querySelector("#help")?.classList.toggle("hidden");
}

function closeInfoPanels(exceptSelector = null) {
  const panels = ["#stageIntelPanel", "#achievementPanel", "#aiFeedback"];

  for (const selector of panels) {
    if (selector === exceptSelector) continue;

    document.querySelector(selector)?.classList.add("hidden");
  }
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
}

function toggleStageIntel() {
  toggleExclusivePanel("#stageIntelPanel");
}

function toggleAchievements() {
  toggleExclusivePanel("#achievementPanel");
}

function toggleAIFeedback() {
  toggleExclusivePanel("#aiFeedback");
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

showControlModeAnnouncement.timeoutId = null;

initQuickPanelButtons();

window.addEventListener("keydown", (e) => {
  if (
    e.code === "ArrowUp" ||
    e.code === "ArrowDown" ||
    e.code === "ArrowLeft" ||
    e.code === "ArrowRight" ||
    e.code === "PageUp" ||
    e.code === "PageDown"
  ) {
    e.preventDefault();
  }

  if (e.code === "F3") {
    e.preventDefault();
    cycleControlMode();
    showControlModeAnnouncement();
    return;
  }

  if (e.key === "Enter") {
    if (!state.started) startGame();
    else startNextWave(scene);
    return;
  }

  if (e.code === "KeyV") {
    startNextWave(scene);
    return;
  }

  if (e.code === "Space") {
    e.preventDefault();
    togglePause();
    return;
  }

  if (e.code === "KeyR") {
    restartGame(scene);
    return;
  }

  if (e.code === "KeyN") {
    toggleMute();
    return;
  }

  if (e.code === "KeyC") {
    toggleNameShowcaseCamera(camera);
    return;
  }

  if (e.code === "KeyH") {
    if (e.shiftKey) {
      spotLightHelper.visible = !spotLightHelper.visible;
    } else {
      toggleHelp();
    }

    return;
  }

  if (e.code === "KeyI") {
    toggleStageIntel();
    return;
  }

  if (e.code === "KeyB") {
    toggleAIFeedback();
    return;
  }

  if (e.code === "F2") {
    toggleAchievements();
    return;
  }

  if (!state.started || state.gameOver) return;

  if (e.key === "1") state.selectedTowerType = "normal";
  if (e.key === "2") state.selectedTowerType = "rapid";
  if (e.key === "3") state.selectedTowerType = "sniper";
  if (e.key === "4") state.selectedTowerType = "slow";
  if (e.key === "5") state.selectedTowerType = "splash";

  if (e.code === "KeyT") {
    placeTower(scene);
    return;
  }

  if (e.code === "KeyU") {
    upgradeSelectedTower();
    return;
  }

  if (e.code === "KeyF") {
    activateSelectedTowerUltimate(scene);
    return;
  }

  if (e.code === "KeyG") {
    cycleSelectedTowerTargetMode();
    return;
  }

  if (e.code === "KeyM") {
    toggleShaderMode(scene);
    return;
  }

  if (e.code === "KeyO") {
    spotLight.visible = !spotLight.visible;
    return;
  }

  if (e.code === "KeyP") {
    directionalLight.visible = !directionalLight.visible;
    return;
  }

  if (e.key === "+" || e.key === "=") {
    adjustActiveLightIntensity(spotLight, directionalLight, 0.25);
    return;
  }

  if (e.key === "-" || e.key === "_") {
    adjustActiveLightIntensity(spotLight, directionalLight, -0.25);
    return;
  }

  if (e.key === "Escape") {
    state.selectedObject = null;
  }
});

window.addEventListener("mousemove", (e) => {
  if (!state.started) return;
  if (isUIElement(e.target)) return;

  updateSelectorFromMouse(
    e.clientX,
    e.clientY,
    renderer,
    camera,
    raycaster,
    mouse,
    pickingPlane
  );
});

window.addEventListener("click", (e) => {
  if (isUIElement(e.target)) return;
  if (!state.started || state.gameOver || state.paused) return;

  const selected = handleSelectionClick(
    e,
    renderer,
    camera,
    raycaster,
    mouse
  );

  if (selected) return;

  updateSelectorFromMouse(
    e.clientX,
    e.clientY,
    renderer,
    camera,
    raycaster,
    mouse,
    pickingPlane
  );

  placeTower(scene);
});

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  if (isUIElement(e.target)) return;
  if (!state.started || state.gameOver || state.paused) return;

  const clickedTower = getClickedTower(
    raycaster,
    mouse,
    renderer,
    camera,
    e.clientX,
    e.clientY
  );

  if (clickedTower) sellTower(scene, clickedTower);
});

function syncStageVisualsIfNeeded() {
  if (renderedStageVersion === state.stageVersion) {
    return;
  }

  rebuildStageMap(scene, base);

  initPathVisuals(scene);
  initStageVisuals(scene);
  updateStageVisuals();

  updateMinimap();

  renderedStageVersion = state.stageVersion;
}

function animate() {
  requestAnimationFrame(animate);

  syncStageVisualsIfNeeded();

  const cameraControlledByNameShowcase = updateNameShowcaseCamera(camera);

  if (state.started && !state.gameOver && !state.paused) {
    if (!cameraControlledByNameShowcase) {
      updateCamera(camera, keys);
    }

    updateLights(spotLight, spotLightHelper, keys);
    updateDirectionalLight(directionalLight, keys);

    moveSelectedObject(keys);
    rotateSelectedObject(keys);

    updateSelector(selector);

    updateWave(scene);
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

  updateLightControlVisuals(directionalLight, spotLight);
  updateSceneVisuals();
  updateCameraShake(camera);

  postProcessing.render(scene, camera, state.shaderMode);
}

window.addEventListener("resize", () => {
  updateCameraProjection(camera);
  resizeGameRenderer(renderer);

  postProcessing.resize(window.innerWidth, window.innerHeight);
});

animate();