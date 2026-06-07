import * as THREE from "three";

import { createGameCamera } from "./cameraSetup.js";
import { createGameRenderer } from "./rendererSetup.js";
import { createGameLights } from "./lightSetup.js";

import {
  createGroundPlane,
  createGridOverlay,
  ensureTerrainBlockedSet
} from "./terrainBaseSetup.js";

import { applyStageAtmosphere } from "./stageAtmosphere.js";

import { createTerrainDepth } from "./terrainDepthSetup.js";

import {
  createPathTiles,
  clearPathTiles
} from "./pathTileSetup.js";

import { clearStageDecorations } from "./sceneCleanup.js";

import {
  resetDecorRegistry,
  clearAnimatedSceneObjects
} from "./decorRegistry.js";

import {
  addMapDecorations,
  addStageDecorations
} from "./stageDecorationSetup.js";

import {
  addStoryTerrainDecorations,
  clearStoryTerrainDecorations
} from "./storyTerrainSetup.js";

import {
  createPortal,
  updatePortalPosition
} from "./portalSetup.js";

import {
  createBaseFort,
  updateBaseFortPosition
} from "./baseFortSetup.js";

import { createTileSelector } from "./selectorSetup.js";

import { clearEffects } from "../visuals/effects.js";
import { state } from "../game/state.js";

export { updateSceneVisuals } from "./sceneVisualsAnimator.js";

let ambientLightRef = null;
let directionalLightRef = null;
let groundMeshRef = null;

export function createSceneSetup(canvas) {
  ensureTerrainBlockedSet();
  resetDecorRegistry();

  const scene = new THREE.Scene();
  const camera = createGameCamera();
  const renderer = createGameRenderer(canvas);

  const {
    directionalLight,
    ambientLight,
    spotLight,
    spotLightHelper
  } = createGameLights(scene);

  directionalLightRef = directionalLight;
  ambientLightRef = ambientLight;

  const ground = createGroundPlane(scene, 0x256b2f);
  groundMeshRef = ground;

  applyCurrentStageAtmosphere(scene);

  createGridOverlay(scene);

  state.terrainBlockedSet.clear();

  createTerrainDepth(scene);
  createPathTiles(scene);

  addMapDecorations(scene);
  addStageDecorations(scene);
  addStoryTerrainDecorations(scene);

  createPortal(scene);

  const base = createBaseFort(scene);
  const selector = createTileSelector(scene);

  return {
    scene,
    camera,
    renderer,
    directionalLight,
    ambientLight,
    spotLight,
    spotLightHelper,
    selector,
    base
  };
}

export function rebuildStageMap(scene, base) {
  ensureTerrainBlockedSet();

  clearEffects(scene);
  clearPathTiles(scene);

  clearStoryTerrainDecorations(scene);
  clearStageDecorations(scene);
  clearAnimatedSceneObjects();
  resetDecorRegistry();

  state.terrainBlockedSet.clear();

  applyCurrentStageAtmosphere(scene);

  createTerrainDepth(scene);
  createPathTiles(scene);

  addMapDecorations(scene);
  addStageDecorations(scene);
  addStoryTerrainDecorations(scene);

  updatePortalPosition();
  updateBaseFortPosition(base);
}

function applyCurrentStageAtmosphere(scene) {
  applyStageAtmosphere({
    scene,
    groundMesh: groundMeshRef,
    ambientLight: ambientLightRef,
    directionalLight: directionalLightRef
  });
}