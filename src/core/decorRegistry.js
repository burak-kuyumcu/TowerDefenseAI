const animatedSceneObjects = [];
const decorPositions = [];

export function resetDecorRegistry() {
  decorPositions.length = 0;
}

export function reserveDecorSpot(x, z, radius = 1) {
  decorPositions.push({ x, z, radius });
}

export function isDecorSpotFree(x, z, radius = 1) {
  for (const item of decorPositions) {
    const distance = Math.hypot(x - item.x, z - item.z);

    if (distance < radius + item.radius) {
      return false;
    }
  }

  return true;
}

export function registerAnimatedObject(object, type, options = {}) {
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

export function clearAnimatedSceneObjects() {
  animatedSceneObjects.length = 0;
}

export function getAnimatedSceneObjects() {
  return animatedSceneObjects;
}