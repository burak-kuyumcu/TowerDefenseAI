import * as THREE from "three";

export function createGameLights(scene) {
  const directionalLight = createDirectionalLight();
  const ambientLight = createAmbientLight();
  const { spotLight, spotLightHelper } = createSpotLight(scene);

  scene.add(directionalLight);
  scene.add(ambientLight);
  scene.add(spotLight);
  scene.add(spotLightHelper);

  return {
    directionalLight,
    ambientLight,
    spotLight,
    spotLightHelper
  };
}

function createDirectionalLight() {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.45);

  directionalLight.position.set(5, 14, 7);
  directionalLight.castShadow = true;

  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.bias = -0.0005;

  return directionalLight;
}

function createAmbientLight() {
  return new THREE.AmbientLight(0xffffff, 0.42);
}

function createSpotLight(scene) {
  const spotLight = new THREE.SpotLight(0xffffff, 3.4);

  spotLight.position.set(-4, 11, 5);
  spotLight.angle = Math.PI / 6;
  spotLight.penumbra = 0.25;
  spotLight.distance = 45;
  spotLight.decay = 1.1;
  spotLight.castShadow = true;

  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;

  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, 0, 0);
  scene.add(spotTarget);

  spotLight.target = spotTarget;

  const spotLightHelper = new THREE.SpotLightHelper(spotLight);
  spotLightHelper.visible = false;

  return {
    spotLight,
    spotLightHelper
  };
}