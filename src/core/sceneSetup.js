import * as THREE from "three";
import {
  getActivePathTiles,
  getActivePathSet,
  getActiveBasePosition,
  getActivePortalPosition,
  MAP_SIZE
} from "./constants.js";
import { createGameMaterial } from "../game/materials.js";
import { getCurrentStage } from "../game/stages.js";

let portalGroup = null;
let portalLight = null;
let baseLight = null;

export function createSceneSetup(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1f2937);

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

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.34);
  scene.add(ambientLight);

  const spotLight = new THREE.SpotLight(0xffffff, 3.5);
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

  const grid = new THREE.GridHelper(MAP_SIZE, MAP_SIZE, 0x9ca3af, 0x365f46);
  grid.position.y = 0.025;
  scene.add(grid);

  createMapZones(scene);
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
  clearPathTiles(scene);
  clearStageDecorations(scene);

  createPathTiles(scene);
  addStageDecorations(scene);

  const portalPosition = getActivePortalPosition();
  const basePosition = getActiveBasePosition();

  portalGroup?.position.set(portalPosition.x, 0, portalPosition.z);
  portalLight?.position.set(portalPosition.x, 1.1, portalPosition.z);

  base?.position.set(basePosition.x, 0, basePosition.z);
  baseLight?.position.set(basePosition.x, 2.2, basePosition.z);
}

function clearPathTiles(scene) {
  const oldTiles = [];

  scene.traverse((object) => {
    if (object.isMesh && object.userData?.isPathTile) {
      oldTiles.push(object);
    }
  });

  for (const tile of oldTiles) {
    removeObject(scene, tile);
  }
}

function clearStageDecorations(scene) {
  const decorations = [];

  scene.traverse((object) => {
    if (object.userData?.isStageDecoration) {
      decorations.push(object);
    }
  });

  for (const decoration of decorations) {
    removeObject(scene, decoration);
  }
}

function createMapZones(scene) {
  createZone(scene, -6, 6, 2.4, 1.6, 0x7f1d1d, 0.18);
  createZone(scene, 6, -5, 2.6, 1.8, 0x0ea5e9, 0.16);
  createZone(scene, -3, -6, 3.2, 1.4, 0x14532d, 0.16);
  createZone(scene, 5, 5, 2.6, 1.5, 0x475569, 0.14);
}

function createZone(scene, x, z, width, depth, color, opacity) {
  const zone = applyShaderData(
    new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      createGameMaterial(color, "decor")
    ),
    color,
    "decor"
  );

  zone.rotation.x = -Math.PI / 2;
  zone.position.set(x, 0.035, z);
  zone.material.transparent = true;
  zone.material.opacity = opacity;
  zone.material.depthWrite = false;

  scene.add(zone);
}

function createPathTiles(scene) {
  const activeTiles = getActivePathTiles();

  activeTiles.forEach((p) => {
    const tile = applyShaderData(
      new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.08, 1),
        createGameMaterial(0x6b4423, "path")
      ),
      0x6b4423,
      "path"
    );

    tile.position.set(p.x, 0.045, p.z);
    tile.receiveShadow = true;
    tile.userData.isPathTile = true;
    tile.userData.pathKey = `${p.x},${p.z}`;
    tile.userData.pathOpacity = 0.34;

    if (tile.material) {
      tile.material.transparent = true;
      tile.material.opacity = 0.34;
      tile.material.depthWrite = false;
    }

    scene.add(tile);
  });
}

function createPortal(scene) {
  const portalPosition = getActivePortalPosition();

  const group = new THREE.Group();
  group.position.set(portalPosition.x, 0, portalPosition.z);
  portalGroup = group;

  const base = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.95, 0.28, 32),
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
      new THREE.TorusGeometry(0.62, 0.12, 18, 48),
      createGameMaterial(0xef4444, "portal")
    ),
    0xef4444,
    "portal"
  );
  outerRing.position.y = 0.86;
  outerRing.rotation.x = Math.PI / 2;
  outerRing.castShadow = true;

  const innerCore = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 24, 24),
      createGameMaterial(0xfacc15, "portal")
    ),
    0xfacc15,
    "portal"
  );
  innerCore.position.y = 0.86;

  const groundRing = applyShaderData(
    new THREE.Mesh(
      new THREE.RingGeometry(0.72, 0.92, 64),
      createGameMaterial(0xf97316, "portal")
    ),
    0xf97316,
    "portal"
  );
  groundRing.rotation.x = -Math.PI / 2;
  groundRing.position.y = 0.07;

  group.add(base, outerRing, innerCore, groundRing);
  scene.add(group);

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
      new THREE.CylinderGeometry(0.95, 1.15, 0.32, 32),
      createGameMaterial(0x1e3a8a, "base")
    ),
    0x1e3a8a,
    "base"
  );
  foundation.position.y = 0.16;
  foundation.castShadow = true;
  foundation.receiveShadow = true;

  const tower = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.85, 1.25, 32),
      createGameMaterial(0x1d4ed8, "base")
    ),
    0x1d4ed8,
    "base"
  );
  tower.position.y = 0.93;
  tower.castShadow = true;
  tower.receiveShadow = true;

  const roof = applyShaderData(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 0.55, 32),
      createGameMaterial(0x0f172a, "base")
    ),
    0x0f172a,
    "base"
  );
  roof.position.y = 1.82;
  roof.castShadow = true;

  const beacon = applyShaderData(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 20, 20),
      createGameMaterial(0x38bdf8, "base")
    ),
    0x38bdf8,
    "base"
  );
  beacon.position.y = 2.18;

  const flagPole = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8),
      createGameMaterial(0xe5e7eb, "base")
    ),
    0xe5e7eb,
    "base"
  );
  flagPole.position.set(0.2, 2.55, 0);

  const flag = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.24, 0.04),
      createGameMaterial(0x22c55e, "base")
    ),
    0x22c55e,
    "base"
  );
  flag.position.set(0.48, 2.75, 0);

  const shieldRing = applyShaderData(
    new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.22, 72),
      createGameMaterial(0x38bdf8, "base")
    ),
    0x38bdf8,
    "base"
  );
  shieldRing.rotation.x = -Math.PI / 2;
  shieldRing.position.y = 0.08;

  group.add(foundation, tower, roof, beacon, flagPole, flag, shieldRing);
  scene.add(group);

  baseLight = new THREE.PointLight(0x38bdf8, 1.2, 5);
  baseLight.position.set(basePosition.x, 2.2, basePosition.z);
  scene.add(baseLight);

  group.userData.coreMesh = tower;

  return group;
}

function addMapDecorations(scene) {
  const treePositions = [
    [-7, 2],
    [-6, 6],
    [-4, 7],
    [-2, -7],
    [0, -5],
    [2, 6],
    [4, -6],
    [7, -3],
    [7, 7],
    [-7, -6],
    [6, -7],
    [-6, 1],
    [5, 2]
  ];

  for (const [x, z] of treePositions) {
    if (isDecorationSafe(x, z)) createTree(scene, x, z);
  }

  const rockPositions = [
    [-7, -1],
    [-6, 4],
    [-3, 5],
    [-1, -6],
    [2, -5],
    [5, -7],
    [7, 0],
    [3, 7],
    [-5, 2],
    [6, 3],
    [-4, -2],
    [1, 4]
  ];

  for (const [x, z] of rockPositions) {
    if (isDecorationSafe(x, z)) createRock(scene, x, z);
  }

  const cratePositions = [
    [-6.5, -7.2],
    [-5.7, -7.2],
    [6.8, 6.5],
    [7.2, -6.3],
    [-7.1, 6.4]
  ];

  for (const [x, z] of cratePositions) {
    if (isDecorationSafe(Math.round(x), Math.round(z))) {
      createCrate(scene, x, z);
    }
  }

  createEnergyPad(scene, 6.2, 4.8, 0x38bdf8);
}

function addStageDecorations(scene) {
  const stage = getCurrentStage();

  if (stage.id === 1) {
    createStageTree(scene, -7, 7, 0x166534);
    createStageTree(scene, -6, 3, 0x15803d);
    createStageTree(scene, 6, -6, 0x14532d);
    createEnergyPad(scene, -6.5, 6.5, 0x22c55e, true);
    return;
  }

  if (stage.id === 2) {
    createCanyonRock(scene, -7, 4);
    createCanyonRock(scene, -4, 6);
    createCanyonRock(scene, 5, -6);
    createCanyonRock(scene, 7, -3);
    createEnergyPad(scene, 6.5, -6.5, 0xf97316, true);
    return;
  }

  if (stage.id === 3) {
    createIceCrystal(scene, -7, 5);
    createIceCrystal(scene, -3, 7);
    createIceCrystal(scene, 4, -7);
    createIceCrystal(scene, 7, -4);
    createEnergyPad(scene, 6.5, 6.5, 0x67e8f9, true);
    return;
  }

  if (stage.id === 4) {
    createRuinsColumn(scene, -7, 5);
    createRuinsColumn(scene, -4, -6);
    createRuinsColumn(scene, 5, -7);
    createRuinsBlock(scene, 6, 7);
    createRuinsBlock(scene, -6, 7);
    createEnergyPad(scene, 6.5, -6.5, 0xc7aa6b, true);
  }
}

function isDecorationSafe(x, z) {
  const key = `${Math.round(x)},${Math.round(z)}`;
  const activePathSet = getActivePathSet();

  if (activePathSet.has(key)) return false;

  const portalPosition = getActivePortalPosition();
  const basePosition = getActiveBasePosition();

  const protectedKeys = new Set([
    `${portalPosition.x},${portalPosition.z}`,
    `${basePosition.x},${basePosition.z}`
  ]);

  return !protectedKeys.has(key);
}

function markStageDecoration(object) {
  object.userData.isStageDecoration = true;

  object.traverse?.((child) => {
    child.userData.isStageDecoration = true;
  });
}

function createStageTree(scene, x, z, leafColor) {
  if (!isDecorationSafe(x, z)) return;

  const group = new THREE.Group();

  const trunk = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.14, 0.62, 8),
      createGameMaterial(0x7c2d12, "decor")
    ),
    0x7c2d12,
    "decor"
  );
  trunk.position.y = 0.31;

  const leaves = applyShaderData(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.56, 1.15, 12),
      createGameMaterial(leafColor, "decor")
    ),
    leafColor,
    "decor"
  );
  leaves.position.y = 1.12;

  group.position.set(x, 0, z);
  group.add(trunk, leaves);
  markStageDecoration(group);
  scene.add(group);
}

function createCanyonRock(scene, x, z) {
  if (!isDecorationSafe(x, z)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const colors = [0x7c2d12, 0x92400e, 0x78350f];

  for (let i = 0; i < 3; i++) {
    const rock = applyShaderData(
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.35 + i * 0.08),
        createGameMaterial(colors[i], "decor")
      ),
      colors[i],
      "decor"
    );

    rock.position.set(i * 0.28 - 0.25, 0.25 + i * 0.05, i * 0.18 - 0.18);
    rock.scale.y = 0.65;
    rock.rotation.y = Math.random() * Math.PI;
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }

  markStageDecoration(group);
  scene.add(group);
}

function createIceCrystal(scene, x, z) {
  if (!isDecorationSafe(x, z)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const colors = [0x67e8f9, 0xbae6fd, 0x38bdf8];

  for (let i = 0; i < 3; i++) {
    const crystal = applyShaderData(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.16, 0.85 + i * 0.18, 6),
        createGameMaterial(colors[i], "decor")
      ),
      colors[i],
      "decor"
    );

    crystal.position.set(i * 0.28 - 0.26, 0.43 + i * 0.06, i * 0.18 - 0.18);
    crystal.rotation.z = i % 2 === 0 ? 0.12 : -0.16;
    crystal.castShadow = true;
    crystal.receiveShadow = true;
    group.add(crystal);
  }

  markStageDecoration(group);
  scene.add(group);
}

function createRuinsColumn(scene, x, z) {
  if (!isDecorationSafe(x, z)) return;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const base = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.38, 0.22, 14),
      createGameMaterial(0xc7aa6b, "decor")
    ),
    0xc7aa6b,
    "decor"
  );
  base.position.y = 0.11;

  const shaft = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.26, 1.1, 14),
      createGameMaterial(0x8a7354, "decor")
    ),
    0x8a7354,
    "decor"
  );
  shaft.position.y = 0.77;

  const top = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.18, 0.72),
      createGameMaterial(0xc7aa6b, "decor")
    ),
    0xc7aa6b,
    "decor"
  );
  top.position.y = 1.42;

  group.add(base, shaft, top);
  markStageDecoration(group);
  scene.add(group);
}

function createRuinsBlock(scene, x, z) {
  if (!isDecorationSafe(x, z)) return;

  const block = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.45, 0.75),
      createGameMaterial(0x8a7354, "decor")
    ),
    0x8a7354,
    "decor"
  );

  block.position.set(x, 0.25, z);
  block.rotation.y = Math.random() * Math.PI;
  block.castShadow = true;
  block.receiveShadow = true;
  markStageDecoration(block);
  scene.add(block);
}

function createTree(scene, x, z) {
  const trunk = applyShaderData(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.12, 0.5, 8),
      createGameMaterial(0x7c2d12, "decor")
    ),
    0x7c2d12,
    "decor"
  );
  trunk.position.set(x, 0.25, z);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  scene.add(trunk);

  const leaves = applyShaderData(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 0.95, 12),
      createGameMaterial(0x14532d, "decor")
    ),
    0x14532d,
    "decor"
  );
  leaves.position.set(x, 0.95, z);
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  scene.add(leaves);
}

function createRock(scene, x, z) {
  const rock = applyShaderData(
    new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.33),
      createGameMaterial(0x6b7280, "decor")
    ),
    0x6b7280,
    "decor"
  );

  rock.position.set(x, 0.27, z);
  rock.scale.y = 0.72;
  rock.rotation.y = Math.random() * Math.PI;
  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);
}

function createCrate(scene, x, z) {
  const crate = applyShaderData(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.45, 0.45),
      createGameMaterial(0x92400e, "decor")
    ),
    0x92400e,
    "decor"
  );

  crate.position.set(x, 0.25, z);
  crate.rotation.y = Math.random() * Math.PI;
  crate.castShadow = true;
  crate.receiveShadow = true;
  scene.add(crate);
}

function createEnergyPad(scene, x, z, color, isStageDecoration = false) {
  if (!isDecorationSafe(x, z)) return;

  const pad = applyShaderData(
    new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.58, 48),
      createGameMaterial(color, "decor")
    ),
    color,
    "decor"
  );

  pad.rotation.x = -Math.PI / 2;
  pad.position.set(x, 0.07, z);

  if (isStageDecoration) {
    markStageDecoration(pad);
  }

  scene.add(pad);
}

function removeObject(scene, object) {
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