import * as THREE from "three";
import {
  getActivePaths,
  getActivePathTiles,
  getActivePathSet,
  getActiveBasePosition,
  getActivePortalPosition,
  MAP_SIZE
} from "./constants.js";
import { createGameMaterial } from "../visuals/materials.js";
import { clearEffects } from "../visuals/effects.js";
import { getCurrentStage } from "../game/stages.js";
import { state } from "../game/state.js";

let portalGroup = null;
let portalOuterRing = null;
let portalInnerCore = null;
let portalGroundRing = null;
let portalLight = null;

let baseLight = null;
let baseBeacon = null;
let baseShieldRing = null;
let baseFlag = null;

let ambientLightRef = null;
let directionalLightRef = null;
let groundMeshRef = null;

const animatedSceneObjects = [];
const decorPositions = [];

export function createSceneSetup(canvas) {
  ensureTerrainBlockedSet();
  resetDecorRegistry();

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.set(0, 15, 13);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.45);
  directionalLight.position.set(5, 14, 7);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  directionalLightRef = directionalLight;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.42);
  scene.add(ambientLight);
  ambientLightRef = ambientLight;

  const spotLight = new THREE.SpotLight(0xffffff, 3.4);
  spotLight.position.set(-4, 11, 5);
  spotLight.angle = Math.PI / 6;
  spotLight.penumbra = 0.25;
  spotLight.distance = 45;
  spotLight.decay = 1.1;
  spotLight.castShadow = true;
  scene.add(spotLight);

  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, 0, 0);
  scene.add(spotTarget);
  spotLight.target = spotTarget;

  const spotLightHelper = new THREE.SpotLightHelper(spotLight);
  spotLightHelper.visible = false;
  scene.add(spotLightHelper);

  const ground = applyShaderData(
    new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE),
      createGameMaterial(0x256b2f, "ground")
    ),
    0x256b2f,
    "ground"
  );

  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  groundMeshRef = ground;

  applyStageAtmosphere(scene);

  const grid = new THREE.GridHelper(MAP_SIZE, MAP_SIZE, 0x9ca3af, 0x365f46);
  grid.position.y = 0.032;
  scene.add(grid);

  state.terrainBlockedSet.clear();

  createTerrainDepth(scene);
  createPathTiles(scene);
  addMapDecorations(scene);
  addStageDecorations(scene);
  createPortal(scene);

  const base = createBaseFort(scene);

  const selector = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.05, 1),
    new THREE.MeshBasicMaterial({
      color: 0xffff00,
      opacity: 0.4,
      transparent: true
    })
  );

  selector.position.y = 0.05;
  scene.add(selector);

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
  clearStageDecorations(scene);
  clearAnimatedSceneObjects();
  resetDecorRegistry();

  state.terrainBlockedSet.clear();

  applyStageAtmosphere(scene);
  createTerrainDepth(scene);
  createPathTiles(scene);
  addMapDecorations(scene);
  addStageDecorations(scene);

  const portalPosition = getActivePortalPosition();
  const basePosition = getActiveBasePosition();

  if (portalGroup) {
    portalGroup.position.set(portalPosition.x, 0, portalPosition.z);
  }

  if (portalLight) {
    portalLight.position.set(portalPosition.x, 1.1, portalPosition.z);
  }

  if (base) {
    base.position.set(basePosition.x, 0, basePosition.z);
  }

  if (baseLight) {
    baseLight.position.set(basePosition.x, 2.1, basePosition.z);
  }
}

export function updateSceneVisuals() {
  const time = Date.now();

  if (portalGroup) {
    portalGroup.rotation.y += 0.004;
  }

  if (portalOuterRing) {
    portalOuterRing.rotation.z += 0.025;
    portalOuterRing.rotation.y += 0.012;
  }

  if (portalInnerCore) {
    const pulse = 1 + Math.sin(time * 0.008) * 0.12;
    portalInnerCore.scale.setScalar(pulse);
    portalInnerCore.rotation.y += 0.035;
  }

  if (portalGroundRing) {
    portalGroundRing.rotation.z -= 0.018;
  }

  if (portalLight) {
    portalLight.intensity = 1.25 + Math.sin(time * 0.01) * 0.28;
  }

  if (baseBeacon) {
    const pulse = 1 + Math.sin(time * 0.006) * 0.16;
    baseBeacon.scale.setScalar(pulse);
    baseBeacon.rotation.y += 0.025;
  }

  if (baseShieldRing) {
    baseShieldRing.rotation.z += 0.01;

    const pulse = 1 + Math.sin(time * 0.005) * 0.035;
    baseShieldRing.scale.set(pulse, pulse, pulse);
  }

  if (baseFlag) {
    baseFlag.rotation.z = Math.sin(time * 0.006) * 0.08;
  }

  if (baseLight) {
    baseLight.intensity = 1.05 + Math.sin(time * 0.007) * 0.16;
  }

  if (baseShieldRing?.parent?.userData?.baseTurrets) {
    const turrets = baseShieldRing.parent.userData.baseTurrets;

    turrets.forEach((turret, index) => {
      turret.rotation.y += 0.006 + index * 0.0015;

      const head = turret.userData.turretHead;
      if (head) {
        head.position.y = 0.2 + Math.sin(time * 0.006 + index) * 0.015;
      }
    });
  }

  for (const item of animatedSceneObjects) {
    if (!item.object) continue;

    if (item.type === "tree") {
      item.object.rotation.z =
        item.baseRotZ + Math.sin(time * 0.0018 + item.offset) * 0.008;
    }

    if (item.type === "crystal") {
      item.object.rotation.y += item.speed ?? 0.004;

      const pulse = 1 + Math.sin(time * 0.004 + item.offset) * 0.03;
      item.object.scale.set(
        item.baseScaleX * pulse,
        item.baseScaleY,
        item.baseScaleZ * pulse
      );
    }

    if (item.type === "runeGlow") {
      const opacity = 0.22 + Math.sin(time * 0.006 + item.offset) * 0.08;

      item.object.traverse((child) => {
        if (child.material?.opacity !== undefined) {
          child.material.transparent = true;
          child.material.opacity = Math.max(0.05, opacity);
        }
      });
    }
  }
}

/* ---------------- CORE HELPERS ---------------- */

function ensureTerrainBlockedSet() {
  if (!state.terrainBlockedSet) {
    state.terrainBlockedSet = new Set();
  }
}

function resetDecorRegistry() {
  decorPositions.length = 0;
}

function reserveDecorSpot(x, z, radius = 1) {
  decorPositions.push({ x, z, radius });
}

function isDecorSpotFree(x, z, radius = 1) {
  for (const item of decorPositions) {
    const distance = Math.hypot(x - item.x, z - item.z);
    if (distance < radius + item.radius) return false;
  }

  return true;
}

function registerAnimatedObject(object, type, options = {}) {
  animatedSceneObjects.push({
    object,
    type,
    offset: Math.random() * Math.PI * 2,
    baseRotZ: object.rotation?.z ?? 0,
    baseScaleX: object.scale?.x ?? 1,
    baseScaleY: object.scale?.y ?? 1,
    baseScaleZ: object.scale?.z ?? 1,
    ...options
  });
}

function clearAnimatedSceneObjects() {
  animatedSceneObjects.length = 0;
}

function applyStageAtmosphere(scene) {
  const stage = getCurrentStage();

  let background = 0x1f2937;
  let fogColor = 0x1f2937;
  let fogNear = 18;
  let fogFar = 42;
  let ambientColor = 0xffffff;
  let ambientIntensity = 0.42;
  let directionalColor = 0xffffff;
  let directionalIntensity = 1.45;
  let groundColor = stage.groundColor ?? 0x256b2f;

  if (stage.id === 1) {
    background = 0x06140c;
    fogColor = 0x173821;
    groundColor = 0x245f2d;
    ambientColor = 0xe4ffe6;
    ambientIntensity = 0.48;
    directionalColor = 0xf3ffe9;
    directionalIntensity = 1.5;
  }

  if (stage.id === 2) {
    background = 0x2b160d;
    fogColor = 0x6a321a;
    groundColor = 0x7a3f1d;
    ambientColor = 0xffc28a;
    ambientIntensity = 0.36;
    directionalColor = 0xffa65c;
    directionalIntensity = 1.72;
  }

  if (stage.id === 3) {
    background = 0x102638;
    fogColor = 0x8ecae6;
    groundColor = 0x5f86a4;
    fogNear = 12;
    fogFar = 34;
    ambientColor = 0xd8f3ff;
    ambientIntensity = 0.5;
    directionalColor = 0xbdefff;
    directionalIntensity = 1.34;
  }

  if (stage.id === 4) {
    background = 0x241d17;
    fogColor = 0x6b5a42;
    groundColor = 0x574839;
    fogNear = 14;
    fogFar = 36;
    ambientColor = 0xffe0aa;
    ambientIntensity = 0.36;
    directionalColor = 0xffcc7a;
    directionalIntensity = 1.42;
  }

  if (stage.id === 5) {
    background = 0x120606;
    fogColor = 0x4a0f0b;
    groundColor = 0x3b1210;
    fogNear = 12;
    fogFar = 34;
    ambientColor = 0xffb077;
    ambientIntensity = 0.34;
    directionalColor = 0xff5a1f;
    directionalIntensity = 1.9;
  }

  if (stage.id === 6) {
    background = 0x07140e;
    fogColor = 0x123524;
    groundColor = 0x1f3a2e;
    fogNear = 10;
    fogFar = 32;
    ambientColor = 0xcfffdc;
    ambientIntensity = 0.43;
    directionalColor = 0xa7f3d0;
    directionalIntensity = 1.25;
  }

  if (stage.id === 7) {
    background = 0x10162f;
    fogColor = 0x4338ca;
    groundColor = 0x243b53;
    fogNear = 13;
    fogFar = 38;
    ambientColor = 0xdbeafe;
    ambientIntensity = 0.48;
    directionalColor = 0xc4b5fd;
    directionalIntensity = 1.55;
  }

  scene.background = new THREE.Color(background);
  scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

  if (groundMeshRef) {
    setMaterialColor(groundMeshRef.material, groundColor);
    groundMeshRef.userData.baseColor = groundColor;
  }

  if (ambientLightRef) {
    ambientLightRef.color.set(ambientColor);
    ambientLightRef.intensity = ambientIntensity;
  }

  if (directionalLightRef) {
    directionalLightRef.color.set(directionalColor);
    directionalLightRef.intensity = directionalIntensity;
  }
}

function getStageRoadColor() {
  const stage = getCurrentStage();

  if (stage.id === 1) return 0xbfa01a;
  if (stage.id === 2) return 0xd97706;
  if (stage.id === 3) return 0xd7edf7;
  if (stage.id === 4) return 0xc7aa6b;
  if (stage.id === 5) return 0xf97316;
  if (stage.id === 6) return 0x6b8e23;
  if (stage.id === 7) return 0x7dd3fc;

  return stage.roadColor ?? 0x6b4423;
}

function getStageBorderColor() {
  const stage = getCurrentStage();

  if (stage.id === 1) return 0x2f2412;
  if (stage.id === 2) return 0x78350f;
  if (stage.id === 3) return 0xe0f2fe;
  if (stage.id === 4) return 0x8a7354;
  if (stage.id === 5) return 0x7f1d1d;
  if (stage.id === 6) return 0x14532d;
  if (stage.id === 7) return 0x38bdf8;

  return 0x4b5563;
}

function getTerrainPalette(stageId) {
  if (stageId === 1) {
    return {
      low: 0x08150c,
      dark: 0x102918,
      mid: 0x245f2d,
      high: 0x347a38,
      accent: 0x16a34a,
      shadow: 0x0b1f12
    };
  }

  if (stageId === 2) {
    return {
      low: 0x1f0d06,
      dark: 0x35180c,
      mid: 0x7c3f1d,
      high: 0xb45309,
      accent: 0xf59e0b,
      shadow: 0x160703
    };
  }

  if (stageId === 3) {
    return {
      low: 0x082f49,
      dark: 0x163247,
      mid: 0x5f86a4,
      high: 0xbae6fd,
      accent: 0x67e8f9,
      shadow: 0x061f33
    };
  }

  if (stageId === 4) {
    return {
      low: 0x17110c,
      dark: 0x2f261d,
      mid: 0x7d6a4f,
      high: 0xc7aa6b,
      accent: 0xfacc15,
      shadow: 0x0f0a07
    };
  }

  if (stageId === 5) {
    return {
      low: 0x110504,
      dark: 0x2a0b08,
      mid: 0x5b1a12,
      high: 0xb91c1c,
      accent: 0xf97316,
      shadow: 0x070202
    };
  }

  if (stageId === 6) {
    return {
      low: 0x07130d,
      dark: 0x123524,
      mid: 0x1f4d36,
      high: 0x4d7c0f,
      accent: 0x84cc16,
      shadow: 0x03100a
    };
  }

  return {
    low: 0x0f172a,
    dark: 0x1e1b4b,
    mid: 0x312e81,
    high: 0x7dd3fc,
    accent: 0xc084fc,
    shadow: 0x070b1f
  };
}

function setMaterialColor(material, color) {
  if (material?.color?.set) {
    material.color.set(color);
  }

  if (material?.uniforms?.uColor?.value?.set) {
    material.uniforms.uColor.value.set(color);
  }
}

function clearPathTiles(scene) {
  const oldObjects = [];

  scene.traverse((object) => {
    if (
      object.userData?.isPathTile ||
      object.userData?.isPathBorder ||
      object.userData?.isPathGlow ||
      object.userData?.isRoadDecoration
    ) {
      oldObjects.push(object);
    }
  });

  for (const object of oldObjects) {
    removeObject(scene, object);
  }
}

function clearStageDecorations(scene) {
  const decorations = [];

  scene.traverse((object) => {
    if (!object.userData?.isStageDecoration) return;
    if (hasStageDecorationAncestor(object)) return;
    decorations.push(object);
  });

  for (const decoration of decorations) {
    removeObject(scene, decoration);
  }
}

function hasStageDecorationAncestor(object) {
  let parent = object.parent;

  while (parent && !parent.isScene) {
    if (parent.userData?.isStageDecoration) return true;
    parent = parent.parent;
  }

  return false;
}

/* ---------------- TERRAIN DEPTH ---------------- */

function createTerrainDepth(scene) {
  createMapBaseSlab(scene);
  createMapEdgeWalls(scene);
  createBiomeTerrain(scene);
}

function createMapBaseSlab(scene) {
  const stage = getCurrentStage();
  const colors = getTerrainPalette(stage.id);

  const slab = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(MAP_SIZE, 0.85, MAP_SIZE),
      createGameMaterial(colors.low, "ground")
    ),
    colors.low,
    "ground"
  );

  slab.position.y = -0.48;
  slab.receiveShadow = true;

  markStageDecoration(slab);
  scene.add(slab);
}

function createMapEdgeWalls(scene) {
  const stage = getCurrentStage();
  const colors = getTerrainPalette(stage.id);

  const half = MAP_SIZE / 2;
  const thickness = 0.26;
  const height = 0.72;

  const north = createEdgeWall(MAP_SIZE, thickness, height, colors.dark);
  north.position.set(0, -0.14, -half - thickness / 2);

  const south = createEdgeWall(MAP_SIZE, thickness, height, colors.dark);
  south.position.set(0, -0.14, half + thickness / 2);

  const west = createEdgeWall(thickness, MAP_SIZE, height, colors.dark);
  west.position.set(-half - thickness / 2, -0.14, 0);

  const east = createEdgeWall(thickness, MAP_SIZE, height, colors.dark);
  east.position.set(half + thickness / 2, -0.14, 0);

  markStageDecoration(north);
  markStageDecoration(south);
  markStageDecoration(west);
  markStageDecoration(east);

  scene.add(north, south, west, east);
}

function createEdgeWall(width, depth, height, color) {
  const wall = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      createGameMaterial(color, "ground")
    ),
    color,
    "ground"
  );

  wall.castShadow = true;
  wall.receiveShadow = true;
  return wall;
}

function createBiomeTerrain(scene) {
  const stage = getCurrentStage();

  if (stage.id === 1) {
    createForestTerrain(scene);
    return;
  }

  if (stage.id === 2) {
    createCanyonTerrain(scene);
    return;
  }

  if (stage.id === 3) {
    createFrozenTerrain(scene);
    return;
  }

  if (stage.id === 4) {
    createRuinsTerrain(scene);
    return;
  }

  if (stage.id === 5) {
    createVolcanicTerrain(scene);
    return;
  }

  if (stage.id === 6) {
    createSwampTerrain(scene);
    return;
  }

  createCrystalTerrain(scene);
}
function createForestTerrain(scene) {
  const colors = getTerrainPalette(1);

  const hills = [
    [-7.25, 7.05, 1.9, 0.95],
    [7.15, -7.1, 1.55, 0.74],
    [7.1, 7.05, 1.5, 0.72],
    [-7.25, -7.15, 1.45, 0.68],
    [-5.8, 6.35, 1.08, 0.44],
    [5.75, -6.35, 1.0, 0.4],
    [6.35, 3.05, 0.96, 0.38],
    [-6.35, -2.05, 0.9, 0.34],
    [-1.85, 6.75, 0.86, 0.32],
    [3.75, 6.55, 0.86, 0.32],
    [6.7, -2.45, 0.78, 0.3]
  ];

  for (const [x, z, radius, height] of hills) {
    createLayeredHill(scene, {
      x,
      z,
      radius,
      height,
      baseColor: colors.dark,
      midColor: colors.mid,
      topColor: colors.high,
      style: "forest",
      addTrees: true
    });
  }

  createForestFloorPatch(scene, -5.5, 5.7, 2.0, 1.3);
  createForestFloorPatch(scene, 5.6, 3.4, 1.8, 1.1);
  createForestFloorPatch(scene, -6.4, -5.2, 1.6, 1.0);
  createForestFloorPatch(scene, 2.0, 5.8, 1.7, 1.0);
  createForestFloorPatch(scene, 5.8, -1.6, 1.4, 0.9);
  createForestFloorPatch(scene, -3.4, -6.3, 1.5, 0.9);
}

function createCanyonTerrain(scene) {
  const colors = getTerrainPalette(2);

  const mesas = [
    [-7.25, -7.1, 1.45, 0.82],
    [7.15, -7.15, 1.35, 0.76],
    [-7.2, 7.1, 1.3, 0.68],
    [7.25, 7.05, 1.35, 0.78],
    [6.45, 2.7, 1.02, 0.52],
    [-5.9, -5.8, 0.95, 0.48],
    [3.2, 6.7, 0.95, 0.46],
    [-4.8, 6.6, 0.9, 0.42],
    [6.7, -3.4, 0.86, 0.42]
  ];

  for (const [x, z, radius, height] of mesas) {
    createLayeredHill(scene, {
      x,
      z,
      radius,
      height,
      baseColor: colors.dark,
      midColor: colors.mid,
      topColor: colors.high,
      style: "canyon"
    });
  }

  createBiomeGroundPatch(scene, -5.5, 5.7, 1.8, 1.0, 0x8f3f17, 0.22);
  createBiomeGroundPatch(scene, 4.8, -5.7, 1.5, 0.9, 0x8f3f17, 0.22);
  createBiomeGroundPatch(scene, 6.0, 3.5, 1.4, 0.8, 0x9a4a1a, 0.18);
  createBiomeGroundPatch(scene, -6.5, -2.2, 1.4, 0.8, 0x9a4a1a, 0.18);
}

function createFrozenTerrain(scene) {
  const colors = getTerrainPalette(3);

  const snowHills = [
    [-7.25, -7.1, 1.35, 0.58],
    [7.15, -7.15, 1.3, 0.54],
    [7.15, 7.05, 1.25, 0.5],
    [-6.85, 6.35, 1.08, 0.42],
    [5.8, -6.2, 1.02, 0.42],
    [3.2, 6.7, 0.9, 0.34]
  ];

  for (const [x, z, radius, height] of snowHills) {
    createLayeredHill(scene, {
      x,
      z,
      radius,
      height,
      baseColor: colors.dark,
      midColor: colors.mid,
      topColor: colors.high,
      style: "frozen"
    });
  }

  createSnowDrift(scene, -5.8, 5.9);
  createSnowDrift(scene, 4.8, -5.9);
  createSnowDrift(scene, 6.1, 1.2);
}

function createRuinsTerrain(scene) {
  const colors = getTerrainPalette(4);

  const platforms = [
    [-7.25, -7.1, 1.3, 0.42],
    [7.1, -7.15, 1.25, 0.42],
    [7.15, 7.05, 1.2, 0.38],
    [-6.5, 6.4, 1.0, 0.32],
    [3.0, 6.65, 0.9, 0.28],
    [6.6, -3.2, 0.9, 0.28]
  ];

  for (const [x, z, radius, height] of platforms) {
    createLayeredHill(scene, {
      x,
      z,
      radius,
      height,
      baseColor: colors.dark,
      midColor: colors.mid,
      topColor: colors.high,
      style: "ruins"
    });
  }

  createRuinFloorPlateGroup(scene, -5.9, 3.6);
  createRuinFloorPlateGroup(scene, 2.9, -6.2);
}

function createVolcanicTerrain(scene) {
  const colors = getTerrainPalette(5);

  const volcanoRidges = [
    [-7.2, -7.1, 1.55, 0.82],
    [7.1, -7.0, 1.45, 0.76],
    [7.1, 7.0, 1.45, 0.78],
    [-7.2, 7.0, 1.25, 0.62],
    [-5.8, -2.5, 0.95, 0.44],
    [5.9, 2.7, 1.0, 0.46],
    [3.0, 6.6, 0.9, 0.38],
    [-3.5, 6.6, 0.86, 0.35]
  ];

  for (const [x, z, radius, height] of volcanoRidges) {
    createLayeredHill(scene, {
      x,
      z,
      radius,
      height,
      baseColor: colors.dark,
      midColor: colors.mid,
      topColor: colors.high,
      style: "canyon"
    });
  }

  createLavaCrack(scene, -5.7, 5.8, 1.4, 0.34);
  createLavaCrack(scene, 4.8, -5.7, 1.6, 0.32);
  createLavaCrack(scene, 6.2, 1.2, 1.2, 0.28);
  createLavaCrack(scene, -2.2, -6.4, 1.3, 0.28);
  createAshPatch(scene, -6.5, 2.4);
  createAshPatch(scene, 5.5, 5.5);
}

function createSwampTerrain(scene) {
  const colors = getTerrainPalette(6);

  const mounds = [
    [-7.2, -7.1, 1.25, 0.38],
    [7.1, -7.1, 1.2, 0.34],
    [7.1, 7.1, 1.25, 0.38],
    [-7.2, 7.1, 1.2, 0.34],
    [-5.5, 5.5, 0.9, 0.28],
    [5.7, -4.8, 0.9, 0.28],
    [2.8, 6.4, 0.8, 0.24]
  ];

  for (const [x, z, radius, height] of mounds) {
    createLayeredHill(scene, {
      x,
      z,
      radius,
      height,
      baseColor: colors.dark,
      midColor: colors.mid,
      topColor: colors.high,
      style: "forest"
    });
  }

  createSwampPool(scene, -6.0, 5.6, 1.25, 0.85);
  createSwampPool(scene, 5.8, -5.8, 1.25, 0.85);
  createSwampPool(scene, 6.4, 2.2, 1.05, 0.7);
  createSwampPool(scene, -3.4, -6.5, 1.0, 0.65);
}

function createCrystalTerrain(scene) {
  const colors = getTerrainPalette(7);

  const crystalHills = [
    [-7.2, -7.1, 1.25, 0.5],
    [7.1, -7.1, 1.3, 0.54],
    [7.1, 7.1, 1.25, 0.5],
    [-7.2, 7.1, 1.15, 0.46],
    [-5.6, 5.8, 0.9, 0.34],
    [5.5, -5.5, 0.95, 0.36],
    [3.1, 6.6, 0.82, 0.3]
  ];

  for (const [x, z, radius, height] of crystalHills) {
    createLayeredHill(scene, {
      x,
      z,
      radius,
      height,
      baseColor: colors.dark,
      midColor: colors.mid,
      topColor: colors.high,
      style: "frozen"
    });
  }

  createCrystalField(scene, -6.8, 6.6, 5, 0.9);
  createCrystalField(scene, 6.8, -6.5, 5, 0.9);
  createCrystalField(scene, 5.9, 4.9, 4, 0.75);
}

function createLayeredHill(scene, config) {
  const {
    x,
    z,
    radius,
    height,
    baseColor,
    midColor,
    topColor,
    style = "forest",
    addTrees = false
  } = config;

  if (!isAreaSafe(x, z, radius * 2.05, radius * 2.05, 0.14, true)) return;
  if (!isDecorSpotFree(x, z, Math.min(radius * 0.65, 0.95))) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const segmentCount = style === "canyon" ? 8 : 18;

  const base = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius * 0.98,
        radius * 1.18,
        height * 0.42,
        segmentCount
      ),
      createGameMaterial(baseColor, "decor")
    ),
    baseColor,
    "decor"
  );

  base.position.y = height * 0.21;
  base.castShadow = true;
  base.receiveShadow = true;

  const middle = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius * 0.74,
        radius * 0.98,
        height * 0.36,
        segmentCount
      ),
      createGameMaterial(midColor, "decor")
    ),
    midColor,
    "decor"
  );

  middle.position.y = height * 0.6;
  middle.castShadow = true;
  middle.receiveShadow = true;

  const upper = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius * 0.52,
        radius * 0.74,
        height * 0.24,
        segmentCount
      ),
      createGameMaterial(topColor, "decor")
    ),
    topColor,
    "decor"
  );

  upper.position.y = height * 0.9;
  upper.castShadow = true;
  upper.receiveShadow = true;

  group.add(base, middle, upper);

  if (style === "forest") {
    const cap = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.52, 18, 12),
        createGameMaterial(topColor, "decor")
      ),
      topColor,
      "decor"
    );

    cap.position.y = height * 1.08;
    cap.scale.y = 0.24;
    cap.castShadow = true;
    cap.receiveShadow = true;
    group.add(cap);

    if (addTrees) {
      addHillTopTrees(group, radius, height);
      addHillRocks(group, radius, height);
    }
  } else if (style === "canyon") {
    const top = applyShaderData(
      new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.65, radius * 0.72, 0.12, 8),
        createGameMaterial(topColor, "decor")
      ),
      topColor,
      "decor"
    );

    top.position.y = height + 0.06;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);
  } else if (style === "frozen") {
    const snow = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.62, 16, 12),
        createGameMaterial(0xe0f2fe, "decor")
      ),
      0xe0f2fe,
      "decor"
    );

    snow.position.y = height * 1.05;
    snow.scale.y = 0.24;
    snow.castShadow = true;
    snow.receiveShadow = true;
    group.add(snow);
  } else {
    const stoneTop = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(radius * 1.25, 0.1, radius * 0.95),
        createGameMaterial(topColor, "decor")
      ),
      topColor,
      "decor"
    );

    stoneTop.position.y = height + 0.05;
    stoneTop.rotation.y = hash01(x, z, 19) * Math.PI;
    stoneTop.castShadow = true;
    stoneTop.receiveShadow = true;
    group.add(stoneTop);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, Math.min(radius * 0.55, 0.85));
  scene.add(group);
}

function addHillTopTrees(group, radius, height) {
  const treeCount = radius > 1.5 ? 4 : 2;

  for (let i = 0; i < treeCount; i++) {
    const angle = (Math.PI * 2 * i) / treeCount + 0.45;
    const distance = radius * (0.22 + i * 0.06);

    const tree = createTreeModel(i % 2 === 0 ? "round" : "conifer", 0.48);

    tree.position.set(
      Math.cos(angle) * distance,
      height * 1.02,
      Math.sin(angle) * distance
    );

    tree.scale.multiplyScalar(0.75 + i * 0.05);
    group.add(tree);
  }
}

function addHillRocks(group, radius, height) {
  for (let i = 0; i < 3; i++) {
    const angle = i * 2.1 + 0.3;

    const rock = applyShaderData(
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.12 + i * 0.025),
        createGameMaterial(0x475569, "decor")
      ),
      0x475569,
      "decor"
    );

    rock.position.set(
      Math.cos(angle) * radius * 0.45,
      height * 0.72,
      Math.sin(angle) * radius * 0.45
    );

    rock.scale.y = 0.65;
    rock.rotation.y = angle;
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }
}

function createForestFloorPatch(scene, x, z, width, depth) {
  if (!isAreaSafe(x, z, width, depth, 0.08)) return;

  const patch = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.018, depth),
      createGameMaterial(0x2f7d37, "decor")
    ),
    0x2f7d37,
    "decor"
  );

  patch.position.set(x, 0.052, z);
  patch.rotation.y = hash01(x, z, 27) * Math.PI;

  if (patch.material) {
    patch.material.transparent = true;
    patch.material.opacity = 0.28;
    patch.material.depthWrite = false;
  }

  markStageDecoration(patch);
  scene.add(patch);
}

/* ---------------- MAP DECOR ---------------- */

function addMapDecorations(scene) {
  const stage = getCurrentStage();

  if (stage.id === 1) {
    createForestInterior(scene);
    return;
  }

  if (stage.id === 2) {
    createCanyonInterior(scene);
    return;
  }

  if (stage.id === 3) {
    createFrozenInterior(scene);
    return;
  }

  if (stage.id === 4) {
    createRuinsInterior(scene);
    return;
  }

  if (stage.id === 5) {
    createVolcanicInterior(scene);
    return;
  }

  if (stage.id === 6) {
    createSwampInterior(scene);
    return;
  }

  createCrystalInterior(scene);
}

function addStageDecorations(scene) {
  const stage = getCurrentStage();

  if (stage.id === 1) {
    createForestHeroProps(scene);
    return;
  }

  if (stage.id === 2) {
    createCanyonHeroProps(scene);
    return;
  }

  if (stage.id === 3) {
    createFrozenHeroProps(scene);
    return;
  }

  if (stage.id === 4) {
    createRuinsHeroProps(scene);
    return;
  }

  if (stage.id === 5) {
    createVolcanicHeroProps(scene);
    return;
  }

  if (stage.id === 6) {
    createSwampHeroProps(scene);
    return;
  }

  createCrystalHeroProps(scene);
}
/* ---------------- FOREST LEVEL DESIGN ---------------- */

function createForestInterior(scene) {
  createForestZone(scene, [
    [-6.8, -6.2, "cluster"],
    [-6.1, -5.1, "tree"],
    [-7.1, -3.6, "bush"],
    [-6.3, -1.4, "tree"],
    [-7.0, 1.5, "bush"],
    [-6.4, 4.7, "cluster"],
    [-7.1, 6.2, "tree"],

    [-3.9, -7.0, "tree"],
    [-2.2, -6.7, "bush"],
    [0.2, -7.1, "tree"],
    [2.6, -6.8, "cluster"],
    [5.2, -6.9, "bush"],

    [6.9, -6.2, "cluster"],
    [6.3, -4.1, "tree"],
    [7.0, -1.6, "bush"],
    [6.4, 1.8, "cluster"],
    [7.0, 4.7, "tree"],
    [6.2, 6.4, "bush"],

    [-4.9, 6.6, "tree"],
    [-2.7, 6.9, "bush"],
    [0.7, 6.8, "tree"],
    [3.2, 6.5, "cluster"],

    [-2.8, 2.2, "bush"],
    [2.8, 2.6, "tree"],
    [4.9, -3.6, "bush"],
    [-4.6, -4.1, "tree"]
  ]);

  createForestLandmarkGrove(scene);
  createForestGroundDetails(scene);

  createLog(scene, -6.0, -2.6);
  createLog(scene, 3.8, 6.6);
  createLog(scene, 5.0, -5.2);
}

function createForestHeroProps(scene) {
  createForestCluster(scene, -7.25, -7.2, 5, 0.85);
  createForestCluster(scene, -7.15, 7.15, 5, 0.85);
  createForestCluster(scene, 7.1, -7.1, 5, 0.85);
  createForestCluster(scene, 7.1, 7.1, 5, 0.85);

  createTallTree(scene, -6.6, -6.8);
  createTallTree(scene, -6.8, 6.7);
  createTallTree(scene, 6.7, -6.8);
  createTallTree(scene, 6.6, 6.7);
}

function createForestZone(scene, plan) {
  for (const [x, z, type] of plan) {
    if (type === "cluster") {
      createForestCluster(scene, x, z, 3, 0.62);
      continue;
    }

    if (type === "tree") {
      createSingleForestTree(scene, x, z);
      continue;
    }

    if (type === "bush") {
      createBushPatch(scene, x, z);
    }
  }
}

function createSingleForestTree(scene, x, z) {
  if (!isAreaSafe(x, z, 0.95, 0.95, 0.26)) return;
  if (!isDecorSpotFree(x, z, 0.62)) return;

  const tree = createTreeModel(
    hash01(x, z, 201) > 0.45 ? "conifer" : "round",
    0.82 + hash01(x, z, 203) * 0.16
  );

  tree.position.set(x, 0, z);

  markStageDecoration(tree);
  registerAnimatedObject(tree, "tree");
  reserveDecorSpot(x, z, 0.62);
  blockTerrainArea(x, z, 0.9, 0.9);
  scene.add(tree);
}

function createTallTree(scene, x, z) {
  if (!isAreaSafe(x, z, 1.1, 1.1, 0.3)) return;
  if (!isDecorSpotFree(x, z, 0.8)) return;

  const tree = createTreeModel("round", 1.18);
  tree.position.set(x, 0, z);

  markStageDecoration(tree);
  registerAnimatedObject(tree, "tree");
  reserveDecorSpot(x, z, 0.8);
  blockTerrainArea(x, z, 1.1, 1.1);
  scene.add(tree);
}

function createForestLandmarkGrove(scene) {
  const grove = [
    [-5.9, 5.9],
    [-5.2, 6.4],
    [-4.7, 5.7],
    [-5.5, 5.2]
  ];

  for (const [x, z] of grove) {
    createSingleForestTree(scene, x, z);
  }

  createBushPatch(scene, -5.25, 5.85);
}

function createForestGroundDetails(scene) {
  createGrassPatch(scene, -5.2, 3.7, 1.25, 0.8);
  createGrassPatch(scene, 4.8, 4.8, 1.1, 0.7);
  createGrassPatch(scene, -2.4, -5.8, 1.2, 0.7);
  createGrassPatch(scene, 5.7, -2.8, 1.0, 0.65);
  createGrassPatch(scene, 1.2, 5.2, 1.1, 0.7);
  createGrassPatch(scene, -5.7, -0.4, 1.0, 0.65);

  createSmallStone(scene, -4.8, 2.8);
  createSmallStone(scene, 2.7, 5.7);
  createSmallStone(scene, 5.5, -5.8);
  createSmallStone(scene, -6.1, 0.5);
  createSmallStone(scene, 3.9, -2.3);
  createSmallStone(scene, -2.9, -6.2);
}

/* ---------------- CANYON ---------------- */

function createCanyonInterior(scene) {
  createProceduralCanyon(scene, 28);

  createCanyonRock(scene, -6.5, -5.9);
  createCanyonRock(scene, -5.8, 2.6);
  createCanyonRock(scene, -3.2, 6.2);
  createCanyonRock(scene, 2.8, -6.6);
  createCanyonRock(scene, 5.9, -4.9);
  createCanyonRock(scene, 6.3, 2.9);
  createCanyonRock(scene, 4.6, 5.8);

  createDeadShrub(scene, -6.2, 1.2);
  createDeadShrub(scene, 6.4, 4.9);
  createDeadShrub(scene, -2.6, -6.2);
  createDeadShrub(scene, 3.8, -2.7);
  createDeadShrub(scene, 5.7, 0.6);

  createGroundCrack(scene, -5.4, 1.8, 0x3b1d12);
  createGroundCrack(scene, 4.8, 5.8, 0x3b1d12);
  createGroundCrack(scene, 0.9, -6.4, 0x3b1d12);
  createGroundCrack(scene, 6.1, -1.8, 0x3b1d12);

  createPebbleField(scene, -4.6, -6.7, 0x78350f);
  createPebbleField(scene, 2.9, 6.6, 0x78350f);
  createPebbleField(scene, 6.5, -6.2, 0x78350f);
}

function createCanyonHeroProps(scene) {
  createTallCanyonSpire(scene, -7.1, 7.05);
  createTallCanyonSpire(scene, 7.05, -7.1);
  createTallCanyonSpire(scene, 7.2, 6.7);

  createCanyonNeedleGroup(scene, -7.0, -6.6);
  createCanyonNeedleGroup(scene, 6.9, 3.4);
  createCanyonBonePile(scene, -6.4, 4.6);
  createCanyonBonePile(scene, 5.4, -5.8);
}

function createProceduralCanyon(scene, count) {
  const spots = collectSafeDecorSpots({
    count,
    width: 1.05,
    depth: 1.05,
    padding: 0.22,
    spacing: 1.55,
    seed: 29
  });

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];

    if (i % 5 === 0) {
      createGroundCrack(scene, spot.x, spot.z, 0x3b1d12);
    } else if (i % 3 === 0) {
      createDeadShrub(scene, spot.x, spot.z);
    } else {
      createCanyonRock(scene, spot.x, spot.z);
    }
  }
}

/* ---------------- FROZEN ---------------- */

function createFrozenInterior(scene) {
  createProceduralFrozen(scene, 25);

  createIcePatch(scene, -6.0, 1.5);
  createIcePatch(scene, 3.8, 6.2);
  createIcePatch(scene, 5.7, -4.8);
  createIcePatch(scene, -3.9, -6.1);

  createSnowPile(scene, -1.4, -6.7);
  createSnowPile(scene, 6.1, 2.5);
  createSnowPile(scene, -6.5, 5.2);
  createSnowPile(scene, 2.4, 5.9);

  createSnowyRock(scene, 5.6, 2.5);
  createSnowyRock(scene, -5.8, -3.4);
  createSnowyRock(scene, 4.7, -6.3);

  createIceShardField(scene, -6.7, 6.5);
  createIceShardField(scene, 6.6, -6.3);
  createIceShardField(scene, 5.9, 4.8);
}

function createFrozenHeroProps(scene) {
  createLargeIceFormation(scene, -7.0, 7.0);
  createLargeIceFormation(scene, 7.0, -7.0);
  createLargeIceFormation(scene, 7.0, 6.8);
}

function createProceduralFrozen(scene, count) {
  const spots = collectSafeDecorSpots({
    count,
    width: 1.05,
    depth: 1.05,
    padding: 0.22,
    spacing: 1.65,
    seed: 41
  });

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];

    if (i % 4 === 0) {
      createSnowPile(scene, spot.x, spot.z);
    } else if (i % 3 === 0) {
      createSnowyRock(scene, spot.x, spot.z);
    } else {
      createIceCrystal(scene, spot.x, spot.z);
    }
  }
}

/* ---------------- RUINS ---------------- */

function createRuinsInterior(scene) {
  createProceduralRuins(scene, 25);

  createStonePlate(scene, -2.8, 6.2);
  createStonePlate(scene, 4.8, -5.9);
  createStonePlate(scene, -6.2, 1.9);
  createStonePlate(scene, 5.9, 3.4);

  createRuinsBlock(scene, -6.4, -5.8);
  createRuinsBlock(scene, 6.4, -5.7);
  createRuinsBlock(scene, -5.7, 5.8);
  createRuinsBlock(scene, 3.9, 6.3);

  createBrokenArch(scene, 6.5, 1.8);
  createBrokenArch(scene, -6.6, 6.4);

  createRuinsDebrisField(scene, -4.8, -6.3);
  createRuinsDebrisField(scene, 4.9, 5.8);
  createRuinsDebrisField(scene, 6.2, -2.4);
}

function createRuinsHeroProps(scene) {
  createRuinsColumn(scene, -7.0, 7.0);
  createRuinsColumn(scene, 7.0, -7.0);
  createRuinsColumn(scene, 7.0, 6.8);

  createBrokenArch(scene, 7.0, -7.0);
}

function createProceduralRuins(scene, count) {
  const spots = collectSafeDecorSpots({
    count,
    width: 1.1,
    depth: 1.1,
    padding: 0.24,
    spacing: 1.65,
    seed: 53
  });

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];

    if (i % 4 === 0) {
      createRuinsColumn(scene, spot.x, spot.z);
    } else if (i % 3 === 0) {
      createStonePlate(scene, spot.x, spot.z);
    } else {
      createRuinsBlock(scene, spot.x, spot.z);
    }
  }
}

/* ---------------- VOLCANIC ---------------- */

function createVolcanicInterior(scene) {
  createVolcanicRock(scene, -6.5, -5.8);
  createVolcanicRock(scene, -5.5, 2.6);
  createVolcanicRock(scene, -3.5, 6.4);
  createVolcanicRock(scene, 2.8, -6.5);
  createVolcanicRock(scene, 5.8, -4.9);
  createVolcanicRock(scene, 6.4, 2.7);
  createVolcanicRock(scene, 4.8, 5.9);

  createLavaCrack(scene, -6.0, 1.0, 0.95, 0.22);
  createLavaCrack(scene, 6.1, 4.6, 0.95, 0.22);
  createLavaCrack(scene, -2.2, -6.2, 1.1, 0.24);
  createLavaCrack(scene, 3.6, -2.6, 0.9, 0.2);

  createAshPatch(scene, -4.8, -6.7);
  createAshPatch(scene, 2.5, 6.6);
  createAshPatch(scene, 6.6, -6.2);
}

function createVolcanicHeroProps(scene) {
  createLavaSpire(scene, -7.0, 7.0);
  createLavaSpire(scene, 7.0, -7.0);
  createLavaSpire(scene, 7.0, 6.8);

  createLavaVent(scene, -6.7, -6.5);
  createLavaVent(scene, 6.7, 3.3);
  createLavaVent(scene, -5.3, 4.9);
}

/* ---------------- SWAMP ---------------- */

function createSwampInterior(scene) {
  createSwampTree(scene, -6.7, -6.0);
  createSwampTree(scene, -6.2, -2.2);
  createSwampTree(scene, -6.8, 5.9);
  createSwampTree(scene, 6.6, -5.8);
  createSwampTree(scene, 6.5, 2.5);
  createSwampTree(scene, 6.8, 6.2);

  createReedPatch(scene, -5.8, 2.6);
  createReedPatch(scene, 5.6, -3.2);
  createReedPatch(scene, -3.0, 6.6);
  createReedPatch(scene, 3.4, 5.8);
  createReedPatch(scene, -2.2, -6.3);

  createSwampPool(scene, -5.4, 5.2, 0.85, 0.5);
  createSwampPool(scene, 5.4, -5.2, 0.85, 0.5);
  createMushroomCluster(scene, -4.7, -6.5);
  createMushroomCluster(scene, 4.8, 6.3);
}

function createSwampHeroProps(scene) {
  createSwampTree(scene, -7.2, 7.0, 1.25);
  createSwampTree(scene, 7.1, -7.0, 1.25);
  createSwampTree(scene, 7.1, 7.0, 1.2);

  createLargeMushroomCluster(scene, -6.9, -6.9);
  createLargeMushroomCluster(scene, 6.9, 3.8);
}

/* ---------------- CRYSTAL ---------------- */

function createCrystalInterior(scene) {
  createCrystalField(scene, -6.4, -5.8, 4, 0.65);
  createCrystalField(scene, -5.7, 2.6, 3, 0.55);
  createCrystalField(scene, -3.2, 6.2, 3, 0.55);
  createCrystalField(scene, 2.8, -6.4, 4, 0.65);
  createCrystalField(scene, 5.8, -4.7, 3, 0.55);
  createCrystalField(scene, 6.4, 2.8, 4, 0.65);
  createCrystalField(scene, 4.6, 5.8, 3, 0.55);

  createRunePlate(scene, -5.8, 1.1);
  createRunePlate(scene, 5.9, 4.6);
  createRunePlate(scene, -2.6, -6.2);
  createRunePlate(scene, 3.7, -2.7);
}

function createCrystalHeroProps(scene) {
  createLargeCrystalFormation(scene, -7.0, 7.0);
  createLargeCrystalFormation(scene, 7.0, -7.0);
  createLargeCrystalFormation(scene, 7.0, 6.8);

  createRunePlate(scene, -6.8, -6.8, 1.15);
  createRunePlate(scene, 6.8, 3.7, 1.15);
}

/* ---------------- PROCEDURAL SAFE SPOTS ---------------- */

function collectSafeDecorSpots({
  count,
  width,
  depth,
  padding,
  spacing,
  seed
}) {
  const candidates = [];

  for (let x = -7; x <= 7; x++) {
    for (let z = -7; z <= 7; z++) {
      if (!isAreaSafe(x, z, width, depth, padding)) continue;
      if (!isDecorSpotFree(x, z, spacing * 0.35)) continue;

      const edgeBias = Math.min(
        Math.abs(x + 8),
        Math.abs(x - 8),
        Math.abs(z + 8),
        Math.abs(z - 8)
      );

      const score = hash01(x, z, seed) + edgeBias * 0.035;
      candidates.push({ x, z, score });
    }
  }

  candidates.sort((a, b) => a.score - b.score);

  const selected = [];

  for (const candidate of candidates) {
    if (selected.length >= count) break;

    let tooClose = false;

    for (const other of selected) {
      const dist = Math.hypot(candidate.x - other.x, candidate.z - other.z);

      if (dist < spacing) {
        tooClose = true;
        break;
      }
    }

    if (tooClose) continue;

    selected.push(candidate);
  }

  return selected;
}

function hash01(x, z, seed = 1) {
  const value = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453;
  return value - Math.floor(value);
}
/* ---------------- ROAD ---------------- */

function createPathTiles(scene) {
  const allPathTiles = getActivePathTiles();
  const allPathSet = getActivePathSet();

  for (const tile of allPathTiles) {
    createRoadTile(scene, tile.x, tile.z);
  }

  for (const tile of allPathTiles) {
    createRoadBorders(scene, tile.x, tile.z, allPathSet);
  }
}

function createRoadTile(scene, x, z) {
  const stage = getCurrentStage();
  const roadColor = getStageRoadColor();

  const tile = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.1, 0.96),
      createGameMaterial(roadColor, "path")
    ),
    roadColor,
    "path"
  );

  tile.position.set(x, 0.055, z);
  tile.receiveShadow = true;
  tile.userData.isPathTile = true;
  tile.userData.pathKey = `${x},${z}`;

  if (tile.material) {
    tile.material.transparent = false;
    tile.material.opacity = 1;
    tile.material.depthWrite = true;
    tile.material.depthTest = true;
  }

  scene.add(tile);

  createRoadSurfaceDetail(scene, x, z, stage.id);
}

function createRoadSurfaceDetail(scene, x, z, stageId) {
  if (hash01(x, z, 701) > 0.12) return;

  let color = 0x8a5a1f;

  if (stageId === 1) color = 0x8a7a22;
  if (stageId === 2) color = 0x8a3b12;
  if (stageId === 3) color = 0xf0f9ff;
  if (stageId === 4) color = 0x9b845f;
  if (stageId === 5) color = 0x7f1d1d;
  if (stageId === 6) color = 0x365314;
  if (stageId === 7) color = 0xc084fc;

  const detail = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.16 + hash01(x, z, 703) * 0.14,
        0.012,
        0.035 + hash01(x, z, 705) * 0.045
      ),
      createGameMaterial(color, "path")
    ),
    color,
    "path"
  );

  detail.position.set(
    x + (hash01(x, z, 707) - 0.5) * 0.3,
    0.112,
    z + (hash01(x, z, 709) - 0.5) * 0.3
  );

  detail.rotation.y = hash01(x, z, 711) * Math.PI;
  detail.userData.isRoadDecoration = true;

  if (detail.material) {
    detail.material.transparent = true;
    detail.material.opacity = stageId === 3 || stageId === 7 ? 0.22 : 0.14;
    detail.material.depthWrite = false;
  }

  scene.add(detail);
}

function createRoadBorders(scene, x, z, pathSet) {
  const borderColor = getStageBorderColor();

  const directions = [
    { dx: 0, dz: -1, px: 0, pz: -0.51, sx: 0.82, sz: 0.075 },
    { dx: 0, dz: 1, px: 0, pz: 0.51, sx: 0.82, sz: 0.075 },
    { dx: -1, dz: 0, px: -0.51, pz: 0, sx: 0.075, sz: 0.82 },
    { dx: 1, dz: 0, px: 0.51, pz: 0, sx: 0.075, sz: 0.82 }
  ];

  for (const dir of directions) {
    const neighborKey = `${x + dir.dx},${z + dir.dz}`;

    if (pathSet.has(neighborKey)) continue;

    const border = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(dir.sx, 0.105, dir.sz),
        createGameMaterial(borderColor, "decor")
      ),
      borderColor,
      "decor"
    );

    border.position.set(x + dir.px, 0.124, z + dir.pz);
    border.castShadow = true;
    border.receiveShadow = true;
    border.userData.isPathBorder = true;
    border.userData.pathKey = `${x},${z}`;

    if (border.material) {
      border.material.transparent = true;
      border.material.opacity = 0.78;
    }

    scene.add(border);
  }
}

/* ---------------- PORTAL / BASE ---------------- */

function createPortal(scene) {
  const portalPosition = getActivePortalPosition();

  const group = new THREE.Group();
  group.position.set(portalPosition.x, 0, portalPosition.z);
  portalGroup = group;

  const base = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 1.02, 0.28, 32),
      createGameMaterial(0x7c2d12, "portal")
    ),
    0x7c2d12,
    "portal"
  );

  base.position.y = 0.14;
  base.castShadow = true;
  base.receiveShadow = true;

  const outerRing = applyShaderData(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.105, 18, 56),
      createGameMaterial(0xef4444, "portal")
    ),
    0xef4444,
    "portal"
  );

  outerRing.position.y = 0.9;
  outerRing.rotation.x = Math.PI / 2;
  outerRing.castShadow = true;

  const verticalRing = applyShaderData(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.045, 12, 42),
      createGameMaterial(0xfacc15, "portal")
    ),
    0xfacc15,
    "portal"
  );

  verticalRing.position.y = 0.9;
  verticalRing.rotation.y = Math.PI / 2;

  const innerCore = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 24, 24),
      createGameMaterial(0xfacc15, "portal")
    ),
    0xfacc15,
    "portal"
  );

  innerCore.position.y = 0.9;

  const groundRing = applyShaderData(
    new THREE.Mesh(
      new THREE.RingGeometry(0.72, 0.98, 80),
      createGameMaterial(0xf97316, "portal")
    ),
    0xf97316,
    "portal"
  );

  groundRing.rotation.x = -Math.PI / 2;
  groundRing.position.y = 0.07;

  const spikeGroup = new THREE.Group();

  for (let i = 0; i < 6; i++) {
    const spike = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.36, 8),
        createGameMaterial(0xffedd5, "portal")
      ),
      0xffedd5,
      "portal"
    );

    const angle = (Math.PI * 2 * i) / 6;

    spike.position.set(
      Math.cos(angle) * 0.88,
      0.42,
      Math.sin(angle) * 0.88
    );

    spike.rotation.z = Math.PI;
    spike.castShadow = true;
    spikeGroup.add(spike);
  }

  group.add(base, outerRing, verticalRing, innerCore, groundRing, spikeGroup);
  scene.add(group);

  portalOuterRing = outerRing;
  portalInnerCore = innerCore;
  portalGroundRing = groundRing;

  portalLight = new THREE.PointLight(0xff6b00, 1.4, 5);
  portalLight.position.set(portalPosition.x, 1.1, portalPosition.z);
  scene.add(portalLight);
}

function createBaseFort(scene) {
  const basePosition = getActiveBasePosition();

  const group = new THREE.Group();
  group.position.set(basePosition.x, 0, basePosition.z);

  const foundation = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.95, 0.26, 32),
      createGameMaterial(0x0f172a, "base")
    ),
    0x0f172a,
    "base"
  );

  foundation.position.y = 0.13;
  foundation.castShadow = true;
  foundation.receiveShadow = true;

  const lowerRing = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.78, 0.18, 32),
      createGameMaterial(0x1e3a8a, "base")
    ),
    0x1e3a8a,
    "base"
  );

  lowerRing.position.y = 0.34;
  lowerRing.castShadow = true;
  lowerRing.receiveShadow = true;

  const coreTower = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.55, 1.15, 24),
      createGameMaterial(0x1d4ed8, "base")
    ),
    0x1d4ed8,
    "base"
  );

  coreTower.position.y = 0.92;
  coreTower.castShadow = true;
  coreTower.receiveShadow = true;

  const armorBand = applyShaderData(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.055, 10, 36),
      createGameMaterial(0x60a5fa, "base")
    ),
    0x60a5fa,
    "base"
  );

  armorBand.position.y = 1.15;
  armorBand.rotation.x = Math.PI / 2;

  const roof = applyShaderData(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.58, 0.45, 24),
      createGameMaterial(0x020617, "base")
    ),
    0x020617,
    "base"
  );

  roof.position.y = 1.72;
  roof.castShadow = true;

  const beacon = applyShaderData(
    new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22),
      createGameMaterial(0x38bdf8, "base")
    ),
    0x38bdf8,
    "base"
  );

  beacon.position.y = 2.05;

  const shieldRing = applyShaderData(
    new THREE.Mesh(
      new THREE.RingGeometry(0.86, 1.02, 80),
      createGameMaterial(0x38bdf8, "base")
    ),
    0x38bdf8,
    "base"
  );

  shieldRing.rotation.x = -Math.PI / 2;
  shieldRing.position.y = 0.055;

  if (shieldRing.material) {
    shieldRing.material.transparent = true;
    shieldRing.material.opacity = 0.5;
    shieldRing.material.depthWrite = false;
  }

  const frontPanel = createBasePanel(0, 0.62, 0.5, 0);
  const backPanel = createBasePanel(0, 0.62, -0.5, Math.PI);
  const leftPanel = createBasePanel(-0.5, 0.62, 0, Math.PI / 2);
  const rightPanel = createBasePanel(0.5, 0.62, 0, -Math.PI / 2);

  const turretA = createBaseMiniTurret(-0.46, 0.52, 0.46);
  const turretB = createBaseMiniTurret(0.46, 0.52, 0.46);
  const turretC = createBaseMiniTurret(0, 0.52, -0.54);

  const antenna = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8),
      createGameMaterial(0xe0f2fe, "base")
    ),
    0xe0f2fe,
    "base"
  );

  antenna.position.set(-0.16, 2.28, 0);

  const antennaOrb = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 12, 12),
      createGameMaterial(0x93c5fd, "base")
    ),
    0x93c5fd,
    "base"
  );

  antennaOrb.position.set(-0.16, 2.58, 0);

  const flagPole = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8),
      createGameMaterial(0xe5e7eb, "base")
    ),
    0xe5e7eb,
    "base"
  );

  flagPole.position.set(0.18, 2.26, 0);

  const flag = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.2, 0.035),
      createGameMaterial(0x22c55e, "base")
    ),
    0x22c55e,
    "base"
  );

  flag.position.set(0.4, 2.42, 0);

  group.add(
    foundation,
    lowerRing,
    coreTower,
    armorBand,
    roof,
    beacon,
    shieldRing,
    frontPanel,
    backPanel,
    leftPanel,
    rightPanel,
    turretA,
    turretB,
    turretC,
    antenna,
    antennaOrb,
    flagPole,
    flag
  );

  scene.add(group);

  baseBeacon = beacon;
  baseShieldRing = shieldRing;
  baseFlag = flag;

  baseLight = new THREE.PointLight(0x38bdf8, 1.25, 5);
  baseLight.position.set(basePosition.x, 2.1, basePosition.z);
  scene.add(baseLight);

  group.userData.baseTurrets = [turretA, turretB, turretC];

  return group;
}

function createBasePanel(x, y, z, rotationY) {
  const panel = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.34, 0.08),
      createGameMaterial(0x172554, "base")
    ),
    0x172554,
    "base"
  );

  panel.position.set(x, y, z);
  panel.rotation.y = rotationY;
  panel.castShadow = true;
  panel.receiveShadow = true;

  const gem = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.12, 0.025),
      createGameMaterial(0x38bdf8, "base")
    ),
    0x38bdf8,
    "base"
  );

  gem.position.set(0, 0.02, 0.045);
  panel.add(gem);

  return panel;
}

function createBaseMiniTurret(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const base = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, 0.12, 12),
      createGameMaterial(0x1e40af, "base")
    ),
    0x1e40af,
    "base"
  );

  base.position.y = 0.06;

  const head = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.16, 0.22),
      createGameMaterial(0x2563eb, "base")
    ),
    0x2563eb,
    "base"
  );

  head.position.y = 0.2;

  const barrel = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.03, 0.36, 8),
      createGameMaterial(0x93c5fd, "base")
    ),
    0x93c5fd,
    "base"
  );

  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.2, 0.25);

  group.add(base, head, barrel);
  group.userData.turretHead = head;

  return group;
}

/* ---------------- DECOR MODELS ---------------- */

function createForestCluster(scene, x, z, treeCount = 3, spread = 0.55) {
  if (!isAreaSafe(x, z, 1.25, 1.25, 0.24)) return;
  if (!isDecorSpotFree(x, z, 0.72)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < treeCount; i++) {
    const tree = createTreeModel(
      hash01(x + i, z, 71) > 0.55 ? "conifer" : "round",
      0.78 + hash01(x, z + i, 73) * 0.18
    );

    tree.position.set(
      (hash01(x + i, z, 81) - 0.5) * spread,
      0,
      (hash01(x, z + i, 83) - 0.5) * spread
    );

    group.add(tree);
  }

  markStageDecoration(group);
  registerAnimatedObject(group, "tree");
  reserveDecorSpot(x, z, 0.72);
  blockTerrainArea(x, z, 1.15, 1.15);
  scene.add(group);
}

function createTreeModel(type = "conifer", scale = 1) {
  const group = new THREE.Group();
  group.scale.setScalar(scale);

  const trunk = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.12, 0.55, 8),
      createGameMaterial(0x7c2d12, "decor")
    ),
    0x7c2d12,
    "decor"
  );

  trunk.position.y = 0.28;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  if (type === "conifer") {
    const leavesA = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.34, 0.64, 10),
        createGameMaterial(0x14532d, "decor")
      ),
      0x14532d,
      "decor"
    );

    leavesA.position.y = 0.76;
    leavesA.castShadow = true;
    leavesA.receiveShadow = true;

    const leavesB = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.26, 0.48, 10),
        createGameMaterial(0x166534, "decor")
      ),
      0x166534,
      "decor"
    );

    leavesB.position.y = 1.03;
    leavesB.castShadow = true;
    leavesB.receiveShadow = true;

    group.add(leavesA, leavesB);
  } else {
    const crownA = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 12),
        createGameMaterial(0x166534, "decor")
      ),
      0x166534,
      "decor"
    );

    crownA.position.set(-0.1, 0.92, 0);

    const crownB = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 12, 12),
        createGameMaterial(0x14532d, "decor")
      ),
      0x14532d,
      "decor"
    );

    crownB.position.set(0.15, 0.98, 0.04);

    const crownC = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 12, 12),
        createGameMaterial(0x15803d, "decor")
      ),
      0x15803d,
      "decor"
    );

    crownC.position.set(0.02, 1.11, -0.05);

    crownA.castShadow = true;
    crownB.castShadow = true;
    crownC.castShadow = true;
    crownA.receiveShadow = true;
    crownB.receiveShadow = true;
    crownC.receiveShadow = true;

    group.add(crownA, crownB, crownC);
  }

  return group;
}

function createBushPatch(scene, x, z) {
  if (!isAreaSafe(x, z, 0.95, 0.95, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.52)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const colors = [0x14532d, 0x166534, 0x15803d, 0x1f7a35];

  for (let i = 0; i < 6; i++) {
    const bush = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.17 + hash01(x + i, z, 91) * 0.09, 12, 12),
        createGameMaterial(colors[i % colors.length], "decor")
      ),
      colors[i % colors.length],
      "decor"
    );

    bush.position.set(
      (hash01(x + i, z, 93) - 0.5) * 0.78,
      0.13 + hash01(x, z + i, 94) * 0.05,
      (hash01(x, z + i, 95) - 0.5) * 0.78
    );

    bush.scale.y = 0.52 + hash01(x + i, z, 97) * 0.18;
    bush.castShadow = true;
    bush.receiveShadow = true;

    group.add(bush);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.52);
  blockTerrainArea(x, z, 0.9, 0.9);
  scene.add(group);
}

function createGrassPatch(scene, x, z, width = 1, depth = 0.65) {
  if (!isAreaSafe(x, z, width, depth, 0.1)) return;

  const patch = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.018, depth),
      createGameMaterial(0x2f7d37, "decor")
    ),
    0x2f7d37,
    "decor"
  );

  patch.position.set(x, 0.052, z);
  patch.rotation.y = hash01(x, z, 211) * Math.PI;

  if (patch.material) {
    patch.material.transparent = true;
    patch.material.opacity = 0.32;
    patch.material.depthWrite = false;
  }

  markStageDecoration(patch);
  scene.add(patch);
}

function createSmallStone(scene, x, z) {
  if (!isAreaSafe(x, z, 0.72, 0.72, 0.18)) return;
  if (!isDecorSpotFree(x, z, 0.4)) return;

  const stone = applyShaderData(
    new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.22 + hash01(x, z, 221) * 0.08),
      createGameMaterial(0x64748b, "decor")
    ),
    0x64748b,
    "decor"
  );

  stone.position.set(x, 0.18, z);
  stone.scale.y = 0.65;
  stone.rotation.y = hash01(x, z, 223) * Math.PI;
  stone.castShadow = true;
  stone.receiveShadow = true;

  markStageDecoration(stone);
  reserveDecorSpot(x, z, 0.4);
  scene.add(stone);
}

function createLog(scene, x, z) {
  if (!isAreaSafe(x, z, 1.1, 1.1, 0.22)) return;
  if (!isDecorSpotFree(x, z, 0.6)) return;

  const log = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.17, 0.9, 12),
      createGameMaterial(0x7c2d12, "decor")
    ),
    0x7c2d12,
    "decor"
  );

  log.rotation.z = Math.PI / 2;
  log.rotation.y = hash01(x, z, 101) * Math.PI;
  log.position.set(x, 0.18, z);
  log.castShadow = true;
  log.receiveShadow = true;

  markStageDecoration(log);
  reserveDecorSpot(x, z, 0.6);
  blockTerrainArea(x, z, 1.0, 1.0);
  scene.add(log);
}

function createCanyonRock(scene, x, z) {
  if (!isAreaSafe(x, z, 1.0, 1.0, 0.25)) return;
  if (!isDecorSpotFree(x, z, 0.58)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const colors = [0x7c2d12, 0x92400e, 0x78350f];

  for (let i = 0; i < 3; i++) {
    const rock = applyShaderData(
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.28 + i * 0.06),
        createGameMaterial(colors[i], "decor")
      ),
      colors[i],
      "decor"
    );

    rock.position.set(i * 0.22 - 0.2, 0.2 + i * 0.04, i * 0.14 - 0.12);
    rock.scale.y = 0.65;
    rock.rotation.y = hash01(x + i, z, 111) * Math.PI;
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.58);
  blockTerrainArea(x, z, 0.95, 0.95);
  scene.add(group);
}

function createTallCanyonSpire(scene, x, z) {
  if (!isAreaSafe(x, z, 1.0, 1.0, 0.25)) return;
  if (!isDecorSpotFree(x, z, 0.65)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const base = applyShaderData(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.34, 1.1, 7),
      createGameMaterial(0x7c2d12, "decor")
    ),
    0x7c2d12,
    "decor"
  );

  base.position.y = 0.55;
  base.scale.x = 0.75;
  base.scale.z = 1.05;
  base.castShadow = true;

  const cap = applyShaderData(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.38, 7),
      createGameMaterial(0xf59e0b, "decor")
    ),
    0xf59e0b,
    "decor"
  );

  cap.position.y = 1.15;
  cap.castShadow = true;

  group.add(base, cap);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.65);
  blockTerrainArea(x, z, 1.0, 1.0);
  scene.add(group);
}

function createGroundCrack(scene, x, z, color) {
  if (!isAreaSafe(x, z, 1.0, 1.0, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.5)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.065, z);

  for (let i = 0; i < 4; i++) {
    const crack = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.34 - i * 0.04, 0.018, 0.03),
        createGameMaterial(color, "decor")
      ),
      color,
      "decor"
    );

    crack.position.set(
      i * 0.15 - 0.18,
      0,
      (hash01(x, z + i, 121) - 0.5) * 0.18
    );

    crack.rotation.y = hash01(x + i, z, 123) * Math.PI;
    group.add(crack);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.5);
  scene.add(group);
}

/* ---------------- SAFETY / BLOCKING ---------------- */

function isAreaSafe(
  centerX,
  centerZ,
  width,
  depth,
  padding = 0,
  ignoreDecorRegistry = false
) {
  const activeTiles = getActivePathTiles();

  const minX = centerX - width / 2 - padding;
  const maxX = centerX + width / 2 + padding;
  const minZ = centerZ - depth / 2 - padding;
  const maxZ = centerZ + depth / 2 + padding;

  if (minX < -8.55 || maxX > 8.55 || minZ < -8.55 || maxZ > 8.55) {
    return false;
  }

  for (const tile of activeTiles) {
    const tileMinX = tile.x - 0.6;
    const tileMaxX = tile.x + 0.6;
    const tileMinZ = tile.z - 0.6;
    const tileMaxZ = tile.z + 0.6;

    const overlaps =
      minX <= tileMaxX &&
      maxX >= tileMinX &&
      minZ <= tileMaxZ &&
      maxZ >= tileMinZ;

    if (overlaps) return false;
  }

  if (!ignoreDecorRegistry) {
    const radius = Math.max(width, depth) * 0.5;

    if (!isDecorSpotFree(centerX, centerZ, radius * 0.62)) {
      return false;
    }
  }

  const portal = getActivePortalPosition();
  const base = getActiveBasePosition();
  const safeRadius = Math.max(width, depth) * 0.5 + 0.78;

  if (Math.hypot(centerX - portal.x, centerZ - portal.z) < safeRadius) {
    return false;
  }

  if (Math.hypot(centerX - base.x, centerZ - base.z) < safeRadius) {
    return false;
  }

  return true;
}

function markStageDecoration(object) {
  object.userData.isStageDecoration = true;

  object.traverse?.((child) => {
    child.userData.isStageDecoration = true;
  });
}

function blockTerrainArea(centerX, centerZ, width, depth) {
  ensureTerrainBlockedSet();

  const minX = Math.floor(centerX - width / 2);
  const maxX = Math.ceil(centerX + width / 2);
  const minZ = Math.floor(centerZ - depth / 2);
  const maxZ = Math.ceil(centerZ + depth / 2);

  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      state.terrainBlockedSet.add(`${x},${z}`);
    }
  }
}

/* ---------------- REMOVE / DISPOSE ---------------- */

function removeObject(scene, object) {
  if (!object) return;

  scene.remove(object);

  object.traverse?.((child) => {
    if (!child.isMesh) return;

    child.geometry?.dispose?.();

    if (Array.isArray(child.material)) {
      child.material.forEach(disposeMaterial);
    } else {
      disposeMaterial(child.material);
    }
  });

  if (object.isMesh) {
    object.geometry?.dispose?.();

    if (Array.isArray(object.material)) {
      object.material.forEach(disposeMaterial);
    } else {
      disposeMaterial(object.material);
    }
  }
}

function disposeMaterial(material) {
  if (!material) return;

  material.map?.dispose?.();
  material.dispose?.();
}

function applyShaderData(mesh, color, role) {
  mesh.userData.baseColor = color;
  mesh.userData.shaderRole = role;
  return mesh;
}

/* ---------------- MISSING BIOME / DECOR HELPERS ---------------- */

function createBiomeGroundPatch(scene, x, z, width, depth, color, opacity = 0.2) {
  if (!isAreaSafe(x, z, width, depth, 0.1, true)) return;

  const patch = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.018, depth),
      createGameMaterial(color, "decor")
    ),
    color,
    "decor"
  );

  patch.position.set(x, 0.054, z);
  patch.rotation.y = hash01(x, z, 801) * Math.PI;

  if (patch.material) {
    patch.material.transparent = true;
    patch.material.opacity = opacity;
    patch.material.depthWrite = false;
  }

  markStageDecoration(patch);
  scene.add(patch);
}

function createPebbleField(scene, x, z, color = 0x78350f) {
  if (!isAreaSafe(x, z, 1.2, 1.2, 0.18, true)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < 7; i++) {
    const pebble = applyShaderData(
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.07 + hash01(x + i, z, 811) * 0.05),
        createGameMaterial(color, "decor")
      ),
      color,
      "decor"
    );

    pebble.position.set(
      (hash01(x + i, z, 813) - 0.5) * 0.9,
      0.08,
      (hash01(x, z + i, 815) - 0.5) * 0.9
    );

    pebble.scale.y = 0.55;
    pebble.rotation.y = hash01(x + i, z, 817) * Math.PI;
    pebble.castShadow = true;
    pebble.receiveShadow = true;

    group.add(pebble);
  }

  markStageDecoration(group);
  scene.add(group);
}

function createSnowDrift(scene, x, z) {
  if (!isAreaSafe(x, z, 1.3, 0.9, 0.18, true)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.055, z);

  for (let i = 0; i < 4; i++) {
    const drift = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.2 + i * 0.035, 12, 10),
        createGameMaterial(0xe0f2fe, "decor")
      ),
      0xe0f2fe,
      "decor"
    );

    drift.position.set(i * 0.23 - 0.34, 0.05, (i % 2) * 0.12);
    drift.scale.y = 0.18;
    drift.castShadow = true;
    drift.receiveShadow = true;

    group.add(drift);
  }

  markStageDecoration(group);
  scene.add(group);
}

function createCanyonBonePile(scene, x, z) {
  if (!isAreaSafe(x, z, 1.1, 1.1, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.55)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.08, z);

  for (let i = 0; i < 4; i++) {
    const bone = applyShaderData(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.03, 0.55, 8),
        createGameMaterial(0xe7d7b5, "decor")
      ),
      0xe7d7b5,
      "decor"
    );

    bone.rotation.z = Math.PI / 2;
    bone.rotation.y = i * 0.75;
    bone.position.set(
      (hash01(x + i, z, 821) - 0.5) * 0.45,
      0.05,
      (hash01(x, z + i, 823) - 0.5) * 0.45
    );

    bone.castShadow = true;
    group.add(bone);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.55);
  scene.add(group);
}

function createCanyonNeedleGroup(scene, x, z) {
  if (!isAreaSafe(x, z, 1.25, 1.25, 0.22)) return;
  if (!isDecorSpotFree(x, z, 0.65)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < 3; i++) {
    const color = i % 2 === 0 ? 0x7c2d12 : 0x92400e;

    const needle = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.16 + i * 0.04, 0.85 - i * 0.12, 7),
        createGameMaterial(color, "decor")
      ),
      color,
      "decor"
    );

    needle.position.set(i * 0.28 - 0.28, 0.42, (i % 2) * 0.18);
    needle.rotation.z = (i - 1) * 0.08;
    needle.castShadow = true;

    group.add(needle);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.65);
  scene.add(group);
}

function createIcePatch(scene, x, z) {
  if (!isAreaSafe(x, z, 1.0, 1.0, 0.18)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.048, z);

  for (let i = 0; i < 3; i++) {
    const patch = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.26 + hash01(x + i, z, 141) * 0.12,
          0.012,
          0.15 + hash01(x, z + i, 143) * 0.08
        ),
        createGameMaterial(0xbae6fd, "decor")
      ),
      0xbae6fd,
      "decor"
    );

    patch.position.set(
      (hash01(x + i, z, 145) - 0.5) * 0.48,
      i * 0.002,
      (hash01(x, z + i, 147) - 0.5) * 0.48
    );

    patch.rotation.y = hash01(x + i, z, 149) * Math.PI;

    if (patch.material) {
      patch.material.transparent = true;
      patch.material.opacity = 0.14;
      patch.material.depthWrite = false;
    }

    group.add(patch);
  }

  markStageDecoration(group);
  scene.add(group);
}

function createSnowPile(scene, x, z) {
  if (!isAreaSafe(x, z, 0.95, 0.95, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.5)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < 4; i++) {
    const snow = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.16 + i * 0.03, 12, 12),
        createGameMaterial(0xe0f2fe, "decor")
      ),
      0xe0f2fe,
      "decor"
    );

    snow.position.set(i * 0.14 - 0.2, 0.12, (i % 2) * 0.12);
    snow.scale.y = 0.35;

    group.add(snow);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.5);
  scene.add(group);
}

function createSnowyRock(scene, x, z) {
  if (!isAreaSafe(x, z, 0.95, 0.95, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.5)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const rock = applyShaderData(
    new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.3),
      createGameMaterial(0x64748b, "decor")
    ),
    0x64748b,
    "decor"
  );

  rock.position.y = 0.24;
  rock.scale.y = 0.7;
  rock.castShadow = true;
  rock.receiveShadow = true;

  const snowCap = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 12, 12),
      createGameMaterial(0xe0f2fe, "decor")
    ),
    0xe0f2fe,
    "decor"
  );

  snowCap.position.y = 0.42;
  snowCap.scale.y = 0.28;

  group.add(rock, snowCap);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.5);
  scene.add(group);
}

function createIceShardField(scene, x, z) {
  if (!isAreaSafe(x, z, 1.2, 1.2, 0.22)) return;
  if (!isDecorSpotFree(x, z, 0.6)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < 5; i++) {
    const color = i % 2 === 0 ? 0x67e8f9 : 0xbae6fd;

    const shard = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.07 + i * 0.01, 0.42 + i * 0.07, 5),
        createGameMaterial(color, "decor")
      ),
      color,
      "decor"
    );

    shard.position.set(
      (hash01(x + i, z, 831) - 0.5) * 0.65,
      0.22,
      (hash01(x, z + i, 833) - 0.5) * 0.65
    );

    shard.rotation.z = (hash01(x + i, z, 835) - 0.5) * 0.25;
    shard.castShadow = true;

    group.add(shard);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.6);
  scene.add(group);
}

function createLargeIceFormation(scene, x, z) {
  if (!isAreaSafe(x, z, 1.2, 1.2, 0.28)) return;
  if (!isDecorSpotFree(x, z, 0.68)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < 4; i++) {
    const color = i % 2 === 0 ? 0x67e8f9 : 0xbae6fd;

    const crystal = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.16 + i * 0.02, 0.82 + i * 0.14, 6),
        createGameMaterial(color, "decor")
      ),
      color,
      "decor"
    );

    crystal.position.set(
      (hash01(x + i, z, 131) - 0.5) * 0.6,
      0.4 + i * 0.03,
      (hash01(x, z + i, 133) - 0.5) * 0.6
    );

    crystal.rotation.z = (hash01(x + i, z, 135) - 0.5) * 0.18;
    crystal.castShadow = true;

    group.add(crystal);
  }

  markStageDecoration(group);
  registerAnimatedObject(group, "crystal", { speed: 0.0025 });
  reserveDecorSpot(x, z, 0.68);
  blockTerrainArea(x, z, 1.1, 1.1);
  scene.add(group);
}
function createDeadShrub(scene, x, z) {
  if (!isAreaSafe(x, z, 0.9, 0.9, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.45)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.08, z);

  const branchColor = 0x5c2d18;

  for (let i = 0; i < 5; i++) {
    const branch = applyShaderData(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.032, 0.42 + i * 0.035, 6),
        createGameMaterial(branchColor, "decor")
      ),
      branchColor,
      "decor"
    );

    branch.position.y = 0.15 + i * 0.015;
    branch.rotation.z = 0.55 + i * 0.22;
    branch.rotation.y = i * 1.18;

    branch.castShadow = true;
    branch.receiveShadow = true;

    group.add(branch);
  }

  const root = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 8, 8),
      createGameMaterial(0x3b1d12, "decor")
    ),
    0x3b1d12,
    "decor"
  );

  root.position.y = 0.08;
  root.scale.y = 0.45;
  root.castShadow = true;
  root.receiveShadow = true;

  group.add(root);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.45);
  scene.add(group);
}

function createIceCrystal(scene, x, z) {
  if (!isAreaSafe(x, z, 1.0, 1.0, 0.24)) return;
  if (!isDecorSpotFree(x, z, 0.58)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const colors = [0x67e8f9, 0xbae6fd, 0x38bdf8];

  for (let i = 0; i < 3; i++) {
    const crystal = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.72 + i * 0.14, 6),
        createGameMaterial(colors[i], "decor")
      ),
      colors[i],
      "decor"
    );

    crystal.position.set(
      i * 0.22 - 0.2,
      0.36 + i * 0.05,
      i * 0.15 - 0.12
    );

    crystal.rotation.z = i % 2 === 0 ? 0.1 : -0.14;
    crystal.rotation.y = hash01(x + i, z, 1441) * Math.PI;

    crystal.castShadow = true;
    crystal.receiveShadow = true;

    group.add(crystal);
  }

  const baseGlow = applyShaderData(
    new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.46, 32),
      createGameMaterial(0x67e8f9, "decor")
    ),
    0x67e8f9,
    "decor"
  );

  baseGlow.rotation.x = -Math.PI / 2;
  baseGlow.position.y = 0.035;

  if (baseGlow.material) {
    baseGlow.material.transparent = true;
    baseGlow.material.opacity = 0.22;
    baseGlow.material.depthWrite = false;
  }

  group.add(baseGlow);

  markStageDecoration(group);
  registerAnimatedObject(group, "crystal", { speed: 0.004 });
  reserveDecorSpot(x, z, 0.58);
  blockTerrainArea(x, z, 0.95, 0.95);

  scene.add(group);
}
/* ---------------- REMAINING DECOR MODEL HELPERS ---------------- */

function createRuinFloorPlateGroup(scene, x, z) {
  if (!isAreaSafe(x, z, 1.4, 1.0, 0.15, true)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.055, z);

  for (let i = 0; i < 4; i++) {
    const plate = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.035, 0.32),
        createGameMaterial(0x8a7354, "decor")
      ),
      0x8a7354,
      "decor"
    );

    plate.position.set(
      (i % 2) * 0.46 - 0.23,
      0,
      Math.floor(i / 2) * 0.36 - 0.18
    );

    plate.rotation.y = (hash01(x + i, z, 861) - 0.5) * 0.2;
    plate.castShadow = true;
    plate.receiveShadow = true;

    group.add(plate);
  }

  markStageDecoration(group);
  scene.add(group);
}

function createStonePlate(scene, x, z) {
  if (!isAreaSafe(x, z, 1.0, 1.0, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.5)) return;

  const plate = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.06, 0.54),
      createGameMaterial(0x8a7354, "decor")
    ),
    0x8a7354,
    "decor"
  );

  plate.position.set(x, 0.07, z);
  plate.rotation.y = hash01(x, z, 161) * Math.PI;
  plate.castShadow = true;
  plate.receiveShadow = true;

  markStageDecoration(plate);
  reserveDecorSpot(x, z, 0.5);
  scene.add(plate);
}

function createRuinsBlock(scene, x, z) {
  if (!isAreaSafe(x, z, 1.0, 1.0, 0.25)) return;
  if (!isDecorSpotFree(x, z, 0.58)) return;

  const block = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.4, 0.68),
      createGameMaterial(0x8a7354, "decor")
    ),
    0x8a7354,
    "decor"
  );

  block.position.set(x, 0.22, z);
  block.rotation.y = hash01(x, z, 151) * Math.PI;
  block.rotation.z = (hash01(x, z, 152) - 0.5) * 0.14;
  block.castShadow = true;
  block.receiveShadow = true;

  markStageDecoration(block);
  reserveDecorSpot(x, z, 0.58);
  blockTerrainArea(x, z, 0.95, 0.95);
  scene.add(block);
}

function createRuinsColumn(scene, x, z) {
  if (!isAreaSafe(x, z, 1.0, 1.0, 0.25)) return;
  if (!isDecorSpotFree(x, z, 0.62)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const base = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.34, 0.2, 14),
      createGameMaterial(0xc7aa6b, "decor")
    ),
    0xc7aa6b,
    "decor"
  );

  base.position.y = 0.1;

  const shaft = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.88, 14),
      createGameMaterial(0x8a7354, "decor")
    ),
    0x8a7354,
    "decor"
  );

  shaft.position.y = 0.64;

  const top = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.16, 0.58),
      createGameMaterial(0xc7aa6b, "decor")
    ),
    0xc7aa6b,
    "decor"
  );

  top.position.y = 1.16;

  group.add(base, shaft, top);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.62);
  blockTerrainArea(x, z, 1.0, 1.0);
  scene.add(group);
}

function createBrokenArch(scene, x, z) {
  if (!isAreaSafe(x, z, 1.15, 1.15, 0.28)) return;
  if (!isDecorSpotFree(x, z, 0.68)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = hash01(x, z, 170) * Math.PI;

  const left = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.8, 0.2),
      createGameMaterial(0x8a7354, "decor")
    ),
    0x8a7354,
    "decor"
  );

  left.position.set(-0.24, 0.4, 0);

  const right = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.58, 0.2),
      createGameMaterial(0x8a7354, "decor")
    ),
    0x8a7354,
    "decor"
  );

  right.position.set(0.24, 0.29, 0);

  const top = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.16, 0.22),
      createGameMaterial(0xc7aa6b, "decor")
    ),
    0xc7aa6b,
    "decor"
  );

  top.position.set(0, 0.82, 0);
  top.rotation.z = -0.2;

  group.add(left, right, top);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.68);
  blockTerrainArea(x, z, 1.1, 1.1);
  scene.add(group);
}

function createRuinsDebrisField(scene, x, z) {
  if (!isAreaSafe(x, z, 1.25, 1.25, 0.2, true)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < 7; i++) {
    const color = i % 2 === 0 ? 0x8a7354 : 0xc7aa6b;

    const block = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.16 + hash01(x + i, z, 841) * 0.12,
          0.08 + hash01(x, z + i, 843) * 0.08,
          0.12 + hash01(x + i, z, 845) * 0.1
        ),
        createGameMaterial(color, "decor")
      ),
      color,
      "decor"
    );

    block.position.set(
      (hash01(x + i, z, 847) - 0.5) * 0.9,
      0.08,
      (hash01(x, z + i, 849) - 0.5) * 0.9
    );

    block.rotation.y = hash01(x + i, z, 851) * Math.PI;
    block.castShadow = true;
    block.receiveShadow = true;

    group.add(block);
  }

  markStageDecoration(group);
  scene.add(group);
}

/* ---------------- VOLCANIC MODELS ---------------- */

function createVolcanicRock(scene, x, z) {
  if (!isAreaSafe(x, z, 1.0, 1.0, 0.25)) return;
  if (!isDecorSpotFree(x, z, 0.58)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const colors = [0x450a0a, 0x7f1d1d, 0xb91c1c];

  for (let i = 0; i < 3; i++) {
    const rock = applyShaderData(
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.26 + i * 0.06),
        createGameMaterial(colors[i], "decor")
      ),
      colors[i],
      "decor"
    );

    rock.position.set(i * 0.2 - 0.2, 0.2 + i * 0.04, i * 0.12 - 0.12);
    rock.scale.y = 0.7;
    rock.rotation.y = hash01(x + i, z, 911) * Math.PI;
    rock.castShadow = true;
    rock.receiveShadow = true;

    group.add(rock);
  }

  const glow = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      createGameMaterial(0xf97316, "decor")
    ),
    0xf97316,
    "decor"
  );

  glow.position.set(0.08, 0.42, 0.04);
  glow.scale.y = 0.45;

  group.add(glow);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.58);
  blockTerrainArea(x, z, 0.95, 0.95);
  scene.add(group);
}

function createLavaCrack(scene, x, z, width = 1.1, depth = 0.25) {
  if (!isAreaSafe(x, z, width, depth, 0.18, true)) return;
  if (!isDecorSpotFree(x, z, 0.5)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.067, z);
  group.rotation.y = hash01(x, z, 921) * Math.PI;

  const lava = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.018, depth),
      createGameMaterial(0xf97316, "decor")
    ),
    0xf97316,
    "decor"
  );

  if (lava.material) {
    lava.material.transparent = true;
    lava.material.opacity = 0.75;
    lava.material.depthWrite = false;
  }

  const leftLip = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.04, 0.045),
      createGameMaterial(0x450a0a, "decor")
    ),
    0x450a0a,
    "decor"
  );

  leftLip.position.z = -depth / 2;

  const rightLip = leftLip.clone();
  rightLip.material = leftLip.material.clone();
  rightLip.position.z = depth / 2;

  group.add(lava, leftLip, rightLip);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.5);
  scene.add(group);
}

function createAshPatch(scene, x, z) {
  createBiomeGroundPatch(scene, x, z, 1.25, 0.85, 0x1f1f1f, 0.22);
}

function createLavaSpire(scene, x, z) {
  if (!isAreaSafe(x, z, 1.15, 1.15, 0.26)) return;
  if (!isDecorSpotFree(x, z, 0.7)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const base = applyShaderData(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.34, 1.15, 7),
      createGameMaterial(0x7f1d1d, "decor")
    ),
    0x7f1d1d,
    "decor"
  );

  base.position.y = 0.58;
  base.castShadow = true;

  const tip = applyShaderData(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.42, 7),
      createGameMaterial(0xf97316, "decor")
    ),
    0xf97316,
    "decor"
  );

  tip.position.y = 1.28;
  tip.castShadow = true;

  group.add(base, tip);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.7);
  blockTerrainArea(x, z, 1.05, 1.05);
  scene.add(group);
}

function createLavaVent(scene, x, z) {
  if (!isAreaSafe(x, z, 0.95, 0.95, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.55)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.075, z);

  const stone = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.48, 0.12, 12),
      createGameMaterial(0x450a0a, "decor")
    ),
    0x450a0a,
    "decor"
  );

  stone.position.y = 0.02;

  const ring = applyShaderData(
    new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.38, 32),
      createGameMaterial(0xf97316, "decor")
    ),
    0xf97316,
    "decor"
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.09;

  group.add(stone, ring);

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.55);
  scene.add(group);
}

/* ---------------- SWAMP MODELS ---------------- */

function createSwampPool(scene, x, z, width = 1.1, depth = 0.7) {
  if (!isAreaSafe(x, z, width, depth, 0.12, true)) return;
  if (!isDecorSpotFree(x, z, 0.55)) return;

  const pool = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.018, depth),
      createGameMaterial(0x064e3b, "decor")
    ),
    0x064e3b,
    "decor"
  );

  pool.position.set(x, 0.052, z);
  pool.rotation.y = hash01(x, z, 931) * Math.PI;

  if (pool.material) {
    pool.material.transparent = true;
    pool.material.opacity = 0.5;
    pool.material.depthWrite = false;
  }

  markStageDecoration(pool);
  reserveDecorSpot(x, z, 0.55);
  scene.add(pool);
}

function createSwampTree(scene, x, z, scale = 1) {
  if (!isAreaSafe(x, z, 1.0, 1.0, 0.25)) return;
  if (!isDecorSpotFree(x, z, 0.62)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);

  const trunk = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.18, 0.9, 8),
      createGameMaterial(0x3f2f1d, "decor")
    ),
    0x3f2f1d,
    "decor"
  );

  trunk.position.y = 0.45;
  trunk.rotation.z = (hash01(x, z, 941) - 0.5) * 0.18;
  trunk.castShadow = true;

  const moss = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 12, 12),
      createGameMaterial(0x166534, "decor")
    ),
    0x166534,
    "decor"
  );

  moss.position.y = 0.96;
  moss.scale.set(1.1, 0.5, 0.85);
  moss.castShadow = true;

  group.add(trunk, moss);

  markStageDecoration(group);
  registerAnimatedObject(group, "tree");
  reserveDecorSpot(x, z, 0.62);
  blockTerrainArea(x, z, 0.95, 0.95);
  scene.add(group);
}

function createReedPatch(scene, x, z) {
  if (!isAreaSafe(x, z, 0.9, 0.9, 0.18)) return;
  if (!isDecorSpotFree(x, z, 0.45)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < 6; i++) {
    const color = i % 2 === 0 ? 0x365314 : 0x4d7c0f;

    const reed = applyShaderData(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.026, 0.46 + i * 0.025, 6),
        createGameMaterial(color, "decor")
      ),
      color,
      "decor"
    );

    reed.position.set(
      (hash01(x + i, z, 951) - 0.5) * 0.55,
      0.22,
      (hash01(x, z + i, 953) - 0.5) * 0.55
    );

    reed.rotation.z = (hash01(x + i, z, 955) - 0.5) * 0.22;

    group.add(reed);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.45);
  scene.add(group);
}

function createMushroomCluster(scene, x, z) {
  if (!isAreaSafe(x, z, 0.9, 0.9, 0.2)) return;
  if (!isDecorSpotFree(x, z, 0.45)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let i = 0; i < 4; i++) {
    const stem = applyShaderData(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.045, 0.22, 8),
        createGameMaterial(0xd6d3d1, "decor")
      ),
      0xd6d3d1,
      "decor"
    );

    stem.position.set(i * 0.12 - 0.18, 0.11, (i % 2) * 0.12);

    const capColor = i % 2 === 0 ? 0x84cc16 : 0xa3e635;

    const cap = applyShaderData(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.105, 12, 8),
        createGameMaterial(capColor, "decor")
      ),
      capColor,
      "decor"
    );

    cap.position.set(stem.position.x, 0.24, stem.position.z);
    cap.scale.y = 0.45;

    group.add(stem, cap);
  }

  markStageDecoration(group);
  reserveDecorSpot(x, z, 0.45);
  scene.add(group);
}

function createLargeMushroomCluster(scene, x, z) {
  createMushroomCluster(scene, x, z);
  createMushroomCluster(scene, x + 0.45, z + 0.2);
}

/* ---------------- CRYSTAL MODELS ---------------- */

function createCrystalField(scene, x, z, count = 4, spread = 0.65) {
  if (!isAreaSafe(x, z, 1.15, 1.15, 0.24)) return;
  if (!isDecorSpotFree(x, z, 0.62)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const colors = [0x7dd3fc, 0xc084fc, 0x38bdf8];

  for (let i = 0; i < count; i++) {
    const color = colors[i % colors.length];

    const crystal = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.08 + i * 0.012, 0.5 + i * 0.11, 6),
        createGameMaterial(color, "decor")
      ),
      color,
      "decor"
    );

    crystal.position.set(
      (hash01(x + i, z, 961) - 0.5) * spread,
      0.28 + i * 0.035,
      (hash01(x, z + i, 963) - 0.5) * spread
    );

    crystal.rotation.z = (hash01(x + i, z, 965) - 0.5) * 0.25;
    crystal.castShadow = true;

    group.add(crystal);
  }

  markStageDecoration(group);
  registerAnimatedObject(group, "crystal", { speed: 0.003 });
  reserveDecorSpot(x, z, 0.62);
  blockTerrainArea(x, z, 1.0, 1.0);
  scene.add(group);
}

function createLargeCrystalFormation(scene, x, z) {
  createCrystalField(scene, x, z, 6, 0.85);
}

function createRunePlate(scene, x, z, scale = 1) {
  if (!isAreaSafe(x, z, 0.95, 0.95, 0.18, true)) return;
  if (!isDecorSpotFree(x, z, 0.5)) return;

  const group = new THREE.Group();
  group.position.set(x, 0.065, z);
  group.scale.setScalar(scale);

  const plate = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.4, 0.055, 24),
      createGameMaterial(0x1e1b4b, "decor")
    ),
    0x1e1b4b,
    "decor"
  );

  const rune = applyShaderData(
    new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.27, 36),
      createGameMaterial(0xc084fc, "decor")
    ),
    0xc084fc,
    "decor"
  );

  rune.rotation.x = -Math.PI / 2;
  rune.position.y = 0.04;

  if (rune.material) {
    rune.material.transparent = true;
    rune.material.opacity = 0.65;
    rune.material.depthWrite = false;
  }

  group.add(plate, rune);

  markStageDecoration(group);
  registerAnimatedObject(group, "runeGlow");
  reserveDecorSpot(x, z, 0.5);
  scene.add(group);
}
