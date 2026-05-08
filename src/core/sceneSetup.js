import * as THREE from "three";
import {
  pathTiles,
  MAP_SIZE,
  BASE_POSITION,
  PORTAL_POSITION
} from "./constants.js";

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

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE),
    new THREE.MeshStandardMaterial({ color: 0x256b2f })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(MAP_SIZE, MAP_SIZE, 0x9ca3af, 0x365f46);
  grid.position.y = 0.025;
  scene.add(grid);

  createPathTiles(scene);
  addMapDecorations(scene);
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

function createPathTiles(scene) {
  const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0x7c4f25,
    emissive: 0x000000
  });

  pathTiles.forEach((p) => {
    const tile = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.1, 1),
      pathMaterial.clone()
    );

    tile.position.set(p.x, 0.05, p.z);
    tile.receiveShadow = true;

    tile.userData = {
      isPathTile: true,
      pathKey: `${p.x},${p.z}`,
      baseColor: 0x7c4f25
    };

    scene.add(tile);
  });
}

function createPortal(scene) {
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.15, 0.35, 32),
    new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
      roughness: 0.7
    })
  );
  base.position.set(PORTAL_POSITION.x, 0.18, PORTAL_POSITION.z);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.15, 18, 48),
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.45
    })
  );
  outerRing.position.copy(PORTAL_POSITION);
  outerRing.position.y = 0.92;
  outerRing.rotation.x = Math.PI / 2;
  outerRing.castShadow = true;
  scene.add(outerRing);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.07, 12, 36),
    new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xf97316,
      emissiveIntensity: 0.7
    })
  );
  innerRing.position.copy(outerRing.position);
  innerRing.rotation.x = Math.PI / 2;
  scene.add(innerRing);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 24, 24),
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf97316,
      emissiveIntensity: 0.75
    })
  );
  core.position.set(PORTAL_POSITION.x, 0.92, PORTAL_POSITION.z);
  scene.add(core);

  const warningRing = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.25, 64),
    new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  warningRing.rotation.x = -Math.PI / 2;
  warningRing.position.set(PORTAL_POSITION.x, 0.08, PORTAL_POSITION.z);
  scene.add(warningRing);

  const light = new THREE.PointLight(0xff6b00, 1.6, 6);
  light.position.set(PORTAL_POSITION.x, 1.2, PORTAL_POSITION.z);
  scene.add(light);

  addSmallPillarsAround(scene, PORTAL_POSITION.x, PORTAL_POSITION.z, 0xef4444);
}

function createBaseFort(scene) {
  const group = new THREE.Group();
  group.position.copy(BASE_POSITION);

  const foundation = new THREE.Mesh(
    new THREE.CylinderGeometry(1.18, 1.35, 0.35, 32),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a })
  );
  foundation.position.y = -0.38;
  foundation.castShadow = true;
  foundation.receiveShadow = true;

  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.78, 1.02, 1.65, 32),
    new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      emissive: 0x000000
    })
  );
  tower.position.y = 0.25;
  tower.castShadow = true;
  tower.receiveShadow = true;

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.0, 0.7, 32),
    new THREE.MeshStandardMaterial({ color: 0x0f172a })
  );
  roof.position.y = 1.42;
  roof.castShadow = true;

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 20, 20),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.75
    })
  );
  beacon.position.y = 1.93;

  const flagPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 1.25, 8),
    new THREE.MeshStandardMaterial({ color: 0xe5e7eb })
  );
  flagPole.position.set(0, 2.25, 0);

  const flag = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.34, 0.045),
    new THREE.MeshStandardMaterial({ color: 0x22c55e })
  );
  flag.position.set(0.4, 2.48, 0);

  const shieldRing = new THREE.Mesh(
    new THREE.RingGeometry(1.25, 1.55, 72),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  shieldRing.rotation.x = -Math.PI / 2;
  shieldRing.position.y = -0.52;

  group.add(foundation, tower, roof, beacon, flagPole, flag, shieldRing);
  scene.add(group);

  const light = new THREE.PointLight(0x38bdf8, 1.25, 5);
  light.position.set(BASE_POSITION.x, 2.2, BASE_POSITION.z);
  scene.add(light);

  addSmallPillarsAround(scene, BASE_POSITION.x, BASE_POSITION.z, 0x38bdf8);

  return group;
}

function addSmallPillarsAround(scene, x, z, color) {
  const positions = [
    [1.35, 1.35],
    [-1.35, 1.35],
    [1.35, -1.35],
    [-1.35, -1.35]
  ];

  for (const [dx, dz] of positions) {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.15, 0.55, 10),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.22
      })
    );

    pillar.position.set(x + dx, 0.28, z + dz);
    pillar.castShadow = true;
    scene.add(pillar);
  }
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
    [6, 1],
    [7, -3],
    [7, 7],
    [-7, -6],
    [-6, -2],
    [5, 6],
    [6, -7]
  ];

  for (const [x, z] of treePositions) {
    createTree(scene, x, z);
  }

  const rockPositions = [
    [-7, -1],
    [-6, 4],
    [-3, 5],
    [-1, -6],
    [2, -5],
    [4, 3],
    [5, -7],
    [7, 0],
    [-5, -7],
    [3, 7]
  ];

  for (const [x, z] of rockPositions) {
    createRock(scene, x, z);
  }

  const cratePositions = [
    [-6.5, -7.2],
    [-5.7, -7.2],
    [6.8, 6.5],
    [-7.2, 6.3],
    [7.2, -6.3]
  ];

  for (const [x, z] of cratePositions) {
    createCrate(scene, x, z);
  }

  createEnergyPad(scene, -5.5, 6.9, 0xef4444);
  createEnergyPad(scene, 6.3, 5.7, 0x38bdf8);
}

function createTree(scene, x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.12, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x7c2d12 })
  );
  trunk.position.set(x, 0.25, z);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  scene.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 0.95, 12),
    new THREE.MeshStandardMaterial({ color: 0x14532d })
  );
  leaves.position.set(x, 0.95, z);
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  scene.add(leaves);
}

function createRock(scene, x, z) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.33),
    new THREE.MeshStandardMaterial({ color: 0x6b7280 })
  );
  rock.position.set(x, 0.27, z);
  rock.scale.y = 0.72;
  rock.rotation.y = Math.random() * Math.PI;
  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);
}

function createCrate(scene, x, z) {
  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.45, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x92400e })
  );
  crate.position.set(x, 0.25, z);
  crate.rotation.y = Math.random() * Math.PI;
  crate.castShadow = true;
  crate.receiveShadow = true;
  scene.add(crate);
}

function createEnergyPad(scene, x, z, color) {
  const pad = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.58, 48),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  pad.rotation.x = -Math.PI / 2;
  pad.position.set(x, 0.07, z);
  scene.add(pad);
}