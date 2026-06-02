let shakeTimer = 0;
let shakeMaxTimer = 0;
let shakeIntensity = 0;
let originalCameraPosition = null;

export function addCameraShake(intensity = 0.12, duration = 18) {
  shakeIntensity = Math.max(shakeIntensity, intensity);
  shakeTimer = Math.max(shakeTimer, duration);
  shakeMaxTimer = Math.max(shakeMaxTimer, duration);
}

export function updateCameraShake(camera) {
  if (!camera) return;

  if (!originalCameraPosition) {
    originalCameraPosition = camera.position.clone();
  }

  if (shakeTimer <= 0) {
    if (originalCameraPosition) {
      camera.position.lerp(originalCameraPosition, 0.18);

      if (camera.position.distanceTo(originalCameraPosition) < 0.005) {
        camera.position.copy(originalCameraPosition);
      }
    }

    return;
  }

  if (shakeTimer === shakeMaxTimer) {
    originalCameraPosition = camera.position.clone();
  }

  const ratio = shakeTimer / shakeMaxTimer;
  const power = shakeIntensity * ratio;

  const offsetX = (Math.random() - 0.5) * power;
  const offsetY = (Math.random() - 0.5) * power * 0.45;
  const offsetZ = (Math.random() - 0.5) * power;

  camera.position.set(
    originalCameraPosition.x + offsetX,
    originalCameraPosition.y + offsetY,
    originalCameraPosition.z + offsetZ
  );

  shakeTimer--;

  if (shakeTimer <= 0) {
    shakeIntensity = 0;
  }
}

export function clearCameraShake(camera) {
  shakeTimer = 0;
  shakeMaxTimer = 0;
  shakeIntensity = 0;

  if (camera && originalCameraPosition) {
    camera.position.copy(originalCameraPosition);
  }

  originalCameraPosition = null;
}