export function removeObject(scene, object) {
  if (!object) return;
  if (shouldPreserveObject(object)) return;

  object.traverse((child) => {
    if (shouldPreserveObject(child)) return;

    if (child.geometry) {
      child.geometry.dispose?.();
    }

    if (child.material) {
      disposeMaterial(child.material);
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
    if (shouldPreserveObject(object)) return;
    if (hasPreservedAncestor(object)) return;
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

function hasPreservedAncestor(object) {
  let parent = object.parent;

  while (parent && !parent.isScene) {
    if (shouldPreserveObject(parent)) return true;

    parent = parent.parent;
  }

  return false;
}

function shouldPreserveObject(object) {
  if (!object?.userData) return false;

  if (object.userData.preserveOnStageRebuild) return true;
  if (object.userData.isTransformShowcase) return true;
  if (object.userData.isUtilityVisual) return true;
  if (object.userData.isSelector) return true;

  return false;
}

function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach((item) => disposeMaterial(item));
    return;
  }

  if (!material) return;

  disposeMaterialTextures(material);

  material.dispose?.();
}

function disposeMaterialTextures(material) {
  const textureKeys = [
    "map",
    "normalMap",
    "roughnessMap",
    "metalnessMap",
    "emissiveMap",
    "alphaMap",
    "aoMap",
    "bumpMap",
    "displacementMap",
    "envMap",
    "lightMap"
  ];

  for (const key of textureKeys) {
    if (material[key]) {
      material[key].dispose?.();
    }
  }

  if (material.uniforms) {
    for (const uniform of Object.values(material.uniforms)) {
      const value = uniform?.value;

      if (value?.isTexture) {
        value.dispose?.();
      }
    }
  }
}