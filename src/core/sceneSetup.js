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

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.32);
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
    new THREE.MeshStandardMaterial({ color: 0x2f7d32 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(MAP_SIZE, MAP_SIZE, 0x9ca3af, 0x4b5563);
  grid.position.y = 0.02;
  scene.add(grid);

  const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
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
      baseColor: 0x8b5a2b
    };

    scene.add(tile);
  });

  addMapDecorations(scene);

  const selector = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.05, 1),
    new THREE.MeshBasicMaterial({
      color: 0xffff00,
      opacity: 0.4,
      transparent: true
    })
  );
  scene.add(selector);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 1.05, 1.5, 28),
    new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      emissive: 0x000000
    })
  );
  base.position.copy(BASE_POSITION);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

  const flagPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8),
    new THREE.MeshStandardMaterial({ color: 0xe5e7eb })
  );
  flagPole.position.set(BASE_POSITION.x, 1.75, BASE_POSITION.z);
  flagPole.castShadow = true;
  scene.add(flagPole);

  const flag = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.35, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x22c55e })
  );
  flag.position.set(BASE_POSITION.x + 0.35, 2.15, BASE_POSITION.z);
  flag.castShadow = true;
  scene.add(flag);

  const portalBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.9, 0.3, 24),
    new THREE.MeshStandardMaterial({ color: 0x7c2d12 })
  );
  portalBase.position.set(PORTAL_POSITION.x, 0.15, PORTAL_POSITION.z);
  portalBase.castShadow = true;
  portalBase.receiveShadow = true;
  scene.add(portalBase);

  const portal = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.14, 16, 32),
    new THREE.MeshStandardMaterial({ color: 0xef4444 })
  );
  portal.position.copy(PORTAL_POSITION);
  portal.rotation.x = Math.PI / 2;
  portal.castShadow = true;
  portal.receiveShadow = true;
  scene.add(portal);

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
    [7, 7]
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
    [7, 0]
  ];

  for (const [x, z] of rockPositions) {
    createRock(scene, x, z);
  }

  const cratePositions = [
    [-6.5, -7.2],
    [-5.7, -7.2],
    [6.8, 6.5]
  ];

  for (const [x, z] of cratePositions) {
    createCrate(scene, x, z);
  }
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
    new THREE.MeshStandardMaterial({ color: 0x166534 })
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