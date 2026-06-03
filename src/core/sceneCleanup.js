export function removeObject(scene, object) {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose?.());
      } else {
        child.material.dispose?.();
      }
    }
  });

  if (object.parent) {
    object.parent.remove(object);
  } else {
    scene.remove(object);
  }
}

export function clearStageDecorations(scene) {
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