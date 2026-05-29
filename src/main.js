import * as THREE from "three";
import "./style.css";

import {
  createSceneSetup,
  rebuildStageMap
} from "./core/sceneSetup.js";

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

import { initPathVisuals, updatePathVisuals } from "./visuals/pathVisuals.js";
import { initStageVisuals, updateStageVisuals } from "./visuals/stageVisuals.js";
import { updateTowerLabels } from "./visuals/towerLabels.js";

import { updateHud } from "./ui/hud.js";
import { updateOverlay } from "./ui/overlay.js";
import { updateMinimap } from "./ui/minimap.js";
import { updateSelectedInfo } from "./ui/selectedInfo.js";
import { updateAnnouncer } from "./ui/announcer.js";
import { updateBossHud } from "./ui/bossHud.js";
import { updateWavePreview } from "./ui/wavePreview.js";
import { updateEventLog } from "./ui/eventLog.js";
import { updateAIFeedback } from "./ui/aiFeedback.js";

import { initUIActions, updateUIActions } from "./ui/uiActions.js";
import { initSettingsPanel, updateSettingsPanel } from "./ui/settingsPanel.js";
import { initBuildPanel, updateBuildPanel } from "./ui/buildPanel.js";

import { toggleShaderMode } from "./visuals/materials.js";
import { startGame, togglePause, restartGame } from "./systems/gameFlow.js";
import { initBaseSystem, updateBaseSystem } from "./systems/base.js";
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
  rotateSelectedObject
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
    "#hud, #help, #selectedInfo, #actionPanel, #overlay, #minimap, #settingsButton, #settingsPanel, #buildPanel, #bossHud, #wavePreview, #eventLog, #aiFeedback"
  );
}

function toggleHelp() {
  document.querySelector("#help")?.classList.toggle("hidden");
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (!state.started) startGame();
    else startNextWave(scene);
    return;
  }

  if (e.key === "v" || e.key === "V") {
    startNextWave(scene);
    return;
  }

  if (e.code === "Space") {
    e.preventDefault();
    togglePause();
    return;
  }

  if (e.key === "r" || e.key === "R") {
    restartGame(scene);
    return;
  }

  if (e.key === "n" || e.key === "N") {
    toggleMute();
    return;
  }

  if (e.key === "c" || e.key === "C") {
    toggleNameShowcaseCamera(camera);
    return;
  }

  if (e.key === "h" || e.key === "H") {
    if (e.shiftKey) spotLightHelper.visible = !spotLightHelper.visible;
    else toggleHelp();
    return;
  }

  if (!state.started || state.gameOver) return;

  if (e.key === "1") state.selectedTowerType = "normal";
  if (e.key === "2") state.selectedTowerType = "rapid";
  if (e.key === "3") state.selectedTowerType = "sniper";
  if (e.key === "4") state.selectedTowerType = "slow";
  if (e.key === "5") state.selectedTowerType = "splash";

  if (e.key === "t" || e.key === "T") {
    placeTower(scene);
    return;
  }

  if (e.key === "u" || e.key === "U") {
    upgradeSelectedTower();
    return;
  }

  if (e.key === "f" || e.key === "F") {
    activateSelectedTowerUltimate(scene);
    return;
  }

  if (e.key === "g" || e.key === "G") {
    cycleSelectedTowerTargetMode();
    return;
  }

  if (e.key === "m" || e.key === "M") {
    toggleShaderMode(scene);
    return;
  }

  if (e.key === "o" || e.key === "O") {
    spotLight.visible = !spotLight.visible;
  }

  if (e.key === "p" || e.key === "P") {
    directionalLight.visible = !directionalLight.visible;
  }

  if (e.key === "+" || e.key === "=") {
    spotLight.intensity = Math.min(8, spotLight.intensity + 0.25);
  }

  if (e.key === "-" || e.key === "_") {
    spotLight.intensity = Math.max(0, spotLight.intensity - 0.25);
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

    updateLights(spotLight, spotLightHelper, keys);
    updateDirectionalLight(directionalLight, keys);
    rotateSelectedObject(keys);
  }

  updateHud();
  updateOverlay();
  updateMinimap();
  updateSelectedInfo();
  updateAnnouncer();
  updateBossHud();
  updateWavePreview();
  updateAIFeedback();
  updateUIActions();
  updateSettingsPanel();
  updateBuildPanel();
  updateWaveControls();
  updateEventLog();

  postProcessing.render(scene, camera, state.shaderMode);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  postProcessing.resize(window.innerWidth, window.innerHeight);
});

animate();