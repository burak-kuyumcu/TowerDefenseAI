import * as THREE from "three";
import "./style.css";

import { createSceneSetup } from "./core/sceneSetup.js";
import { initKeyboard, keys } from "./core/input.js";
import { state } from "./game/state.js";

import {
  placeTower,
  updateTowers,
  getClickedTower
} from "./game/towers.js";

import {
  upgradeSelectedTower,
  sellTower
} from "./game/upgrade.js";

import { updateEnemies, cleanupEnemies } from "./game/enemies.js";
import { updateWave } from "./game/wave.js";
import { updateProjectiles } from "./game/projectiles.js";
import { updateHud } from "./game/hud.js";

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
  selector
} = createSceneSetup(canvas);

initKeyboard();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const pickingPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshBasicMaterial({ visible: false })
);

pickingPlane.rotation.x = -Math.PI / 2;
scene.add(pickingPlane);

window.addEventListener("keydown", (e) => {
  if (e.key === "1") state.selectedTowerType = "normal";
  if (e.key === "2") state.selectedTowerType = "rapid";

  if (e.key === "t" || e.key === "T") placeTower(scene);
  if (e.key === "u" || e.key === "U") upgradeSelectedTower();

  if (e.key === "o" || e.key === "O") spotLight.visible = !spotLight.visible;
  if (e.key === "p" || e.key === "P") directionalLight.visible = !directionalLight.visible;
  if (e.key === "h" || e.key === "H") spotLightHelper.visible = !spotLightHelper.visible;

  if (e.key === "Escape") state.selectedObject = null;
});

window.addEventListener("mousemove", (e) => {
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

  if (!state.gameOver) {
    updateCamera(camera, keys);
    updateLights(spotLight, spotLightHelper, keys);
    moveSelectedObject(keys);

    updateSelector(selector);
    updateWave(scene);
    updateEnemies(scene);
    updateTowers(scene);
    updateProjectiles(scene);
    cleanupEnemies();
    updateHighlights();

    if (state.baseHp <= 0) {
      state.baseHp = 0;
      state.gameOver = true;
    }
  }

  updateHud();
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();