import * as THREE from "three";
import "./style.css";

import { createSceneSetup } from "./core/sceneSetup.js";
import { initKeyboard, keys } from "./core/input.js";
import { state } from "./game/state.js";

import {
  placeTower,
  updateTowers,
  getClickedTower,
  cycleSelectedTowerTargetMode
} from "./game/towers.js";

import { upgradeSelectedTower, sellTower } from "./game/upgrade.js";

import {
  updateWave,
  initWaveControls,
  updateWaveControls,
  startNextWave
} from "./game/wave.js";

import { updateEnemies, cleanupEnemies } from "./game/enemies.js";
import { updateProjectiles } from "./game/projectiles.js";
import { updateHealthBars } from "./game/healthBars.js";
import { updateEffects } from "./game/effects.js";
import { updateFloatingTexts } from "./game/floatingText.js";
import { updateTacticalSignals } from "./game/tacticalSignals.js";
import { updateCombo } from "./game/combo.js";

import { updateHud } from "./game/hud.js";
import { updateOverlay } from "./game/overlay.js";
import { updateMinimap } from "./game/minimap.js";
import { updateSelectedInfo } from "./game/selectedInfo.js";
import { updateAnnouncer } from "./game/announcer.js";
import { updateBossHud } from "./game/bossHud.js";
import { updateWavePreview } from "./game/wavePreview.js";
import { updateEventLog } from "./game/eventLog.js";
import { updateAIFeedback } from "./game/aiFeedback.js";
import { initPathVisuals, updatePathVisuals } from "./game/pathVisuals.js";
import { updateTowerLabels } from "./game/towerLabels.js";

import { initUIActions, updateUIActions } from "./game/uiActions.js";
import { initSettingsPanel, updateSettingsPanel } from "./game/settingsPanel.js";
import { initBuildPanel, updateBuildPanel } from "./game/buildPanel.js";

import { toggleShaderMode } from "./game/materials.js";
import { startGame, togglePause, restartGame } from "./game/gameFlow.js";
import { initBaseSystem, updateBaseSystem } from "./game/base.js";
import { toggleMute } from "./game/audio.js";
import { updateBossAbilities } from "./game/bossAbilities.js";

import {
  createRangePreview,
  updateRangePreview
} from "./game/rangePreview.js";

import {
  updateSelectorFromMouse,
  updateSelector,
  updateHighlights,
  handleSelectionClick
} from "./game/selection.js";

import {
  updateCamera,
  updateLights,
  moveSelectedObject
} from "./game/controls.js";

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

initKeyboard();
createRangePreview(scene);
initBaseSystem(scene, base);
initUIActions(scene);
initSettingsPanel(scene);
initBuildPanel();
initWaveControls(scene);
initPathVisuals(scene);

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
    if (!state.started) {
      startGame();
    } else {
      startNextWave(scene);
    }
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

  if (e.key === "h" || e.key === "H") {
    if (e.shiftKey) {
      spotLightHelper.visible = !spotLightHelper.visible;
    } else {
      toggleHelp();
    }
    return;
  }

  if (!state.started || state.gameOver) return;

  if (e.key === "1") state.selectedTowerType = "normal";
  if (e.key === "2") state.selectedTowerType = "rapid";
  if (e.key === "3") state.selectedTowerType = "sniper";
  if (e.key === "4") state.selectedTowerType = "slow";
  if (e.key === "5") state.selectedTowerType = "splash";

  if (e.key === "t" || e.key === "T") placeTower(scene);
  if (e.key === "u" || e.key === "U") upgradeSelectedTower();
  if (e.key === "g" || e.key === "G") cycleSelectedTowerTargetMode();
  if (e.key === "m" || e.key === "M") toggleShaderMode(scene);

  if (e.key === "o" || e.key === "O") spotLight.visible = !spotLight.visible;
  if (e.key === "p" || e.key === "P") directionalLight.visible = !directionalLight.visible;

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

  if (clickedTower) {
    sellTower(scene, clickedTower);
  }
});

function animate() {
  requestAnimationFrame(animate);

  if (state.started && !state.gameOver && !state.paused) {
    updateCamera(camera, keys);
    updateLights(spotLight, spotLightHelper, keys);
    moveSelectedObject(keys);

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

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
