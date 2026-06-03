import * as THREE from "three";

export function createGameCamera() {
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.set(0, 10.5, 12.75);
  camera.lookAt(0, 0.8, 0);

  return camera;
}

export function updateCameraProjection(camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}