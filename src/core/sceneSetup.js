import * as THREE from "three";
import { pathPoints } from "./constants.js";

export function createSceneSetup(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1f2937);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.set(0, 13, 11);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
  directionalLight.position.set(4, 12, 6);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.28);
  scene.add(ambientLight);

  const spotLight = new THREE.SpotLight(0xffffff, 3.5);
  spotLight.position.set(-3, 9, 4);
  spotLight.angle = Math.PI / 6;
  spotLight.penumbra = 0.25;
  spotLight.distance = 35;
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
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ color: 0x2f7d32 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(12, 12, 0x9ca3af, 0x4b5563);
  grid.position.y = 0.02;
  scene.add(grid);

  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x9a6b32 });

  pathPoints.forEach((p) => {
    const tile = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.1, 1),
      pathMaterial
    );

    tile.position.set(p.x, 0.05, p.z);
    tile.receiveShadow = true;
    scene.add(tile);
  });

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
    new THREE.CylinderGeometry(0.6, 0.8, 1.2, 24),
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8 })
  );
  base.position.set(5, 0.6, 3);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

  const portal = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.12, 16, 32),
    new THREE.MeshStandardMaterial({ color: 0xef4444 })
  );
  portal.position.set(-5, 0.7, -5);
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
    selector
  };
}