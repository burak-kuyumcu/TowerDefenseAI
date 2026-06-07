import * as THREE from "three";

let showcaseActive = false;
let showcaseTransitioning = false;

let savedCameraPosition = null;
let savedCameraQuaternion = null;

let startPosition = null;
let startQuaternion = null;
let targetPosition = null;
let targetQuaternion = null;

let showcaseTarget = new THREE.Vector3(-9.4, 1.0, 15.4);

let transitionStartTime = 0;

const TRANSITION_DURATION = 1350;

const FALLBACK_TARGET = new THREE.Vector3(-9.4, 1.0, 15.4);
const FALLBACK_CAMERA_POSITION = new THREE.Vector3(-9.4, 7.2, 21.2);

export function toggleTransformShowcaseCamera(camera) {
  if (showcaseTransitioning) return;

  showcaseTransitioning = true;
  transitionStartTime = performance.now();

  startPosition = camera.position.clone();
  startQuaternion = camera.quaternion.clone();

  if (!showcaseActive) {
    const transformView = getTransformShowcaseView();

    showcaseTarget = transformView.target.clone();
    targetPosition = transformView.cameraPosition.clone();
    targetQuaternion = null;

    savedCameraPosition = camera.position.clone();
    savedCameraQuaternion = camera.quaternion.clone();

    showcaseActive = true;
  } else {
    targetPosition = savedCameraPosition.clone();
    targetQuaternion = savedCameraQuaternion.clone();

    showcaseActive = false;
  }
}

export function updateTransformShowcaseCamera(camera) {
  if (!showcaseTransitioning) {
    if (showcaseActive) {
      const transformView = getTransformShowcaseView();

      showcaseTarget.copy(transformView.target);
      camera.position.copy(transformView.cameraPosition);
      camera.lookAt(showcaseTarget);

      return true;
    }

    return false;
  }

  const elapsed = performance.now() - transitionStartTime;
  const t = Math.min(elapsed / TRANSITION_DURATION, 1);
  const eased = easeInOutCubic(t);

  camera.position.lerpVectors(startPosition, targetPosition, eased);

  if (showcaseActive) {
    camera.lookAt(showcaseTarget);
  } else if (targetQuaternion) {
    camera.quaternion.slerpQuaternions(
      startQuaternion,
      targetQuaternion,
      eased
    );
  }

  if (t >= 1) {
    camera.position.copy(targetPosition);

    if (showcaseActive) {
      camera.lookAt(showcaseTarget);
    } else if (targetQuaternion) {
      camera.quaternion.copy(targetQuaternion);
    }

    showcaseTransitioning = false;
  }

  return true;
}

function getTransformShowcaseView() {
  const objects = getValidTransformObjects();

  if (objects.length === 0) {
    return {
      target: FALLBACK_TARGET.clone(),
      cameraPosition: FALLBACK_CAMERA_POSITION.clone()
    };
  }

  const box = new THREE.Box3();

  for (const object of objects) {
    box.expandByObject(object);
  }

  if (box.isEmpty()) {
    return {
      target: FALLBACK_TARGET.clone(),
      cameraPosition: FALLBACK_CAMERA_POSITION.clone()
    };
  }

  const center = new THREE.Vector3();
  const size = new THREE.Vector3();

  box.getCenter(center);
  box.getSize(size);

  const maxSize = Math.max(size.x, size.z, 4);

  const target = new THREE.Vector3(
    center.x,
    Math.max(0.9, center.y + 0.55),
    center.z
  );

  const cameraPosition = new THREE.Vector3(
    center.x,
    Math.max(6.3, maxSize * 1.45),
    center.z + Math.max(5.8, maxSize * 1.25)
  );

  return {
    target,
    cameraPosition
  };
}

function getValidTransformObjects() {
  const objects = window.__transformShowcaseObjects;

  if (!Array.isArray(objects)) return [];

  return objects.filter((object) => {
    if (!object) return false;
    if (!object.isObject3D) return false;
    if (!object.parent) return false;
    if (object.visible === false) return false;

    return true;
  });
}

function easeInOutCubic(t) {
  if (t < 0.5) {
    return 4 * t * t * t;
  }

  return 1 - Math.pow(-2 * t + 2, 3) / 2;
}