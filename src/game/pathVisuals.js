import { state } from "./state.js";

let pathMeshes = [];

export function initPathVisuals(scene) {
  pathMeshes = [];

  scene.traverse((object) => {
    if (object.userData?.isPathTile) {
      pathMeshes.push(object);
    }
  });
}

export function updatePathVisuals() {
  if (pathMeshes.length === 0) return;

  const activePathSet = buildActivePathTileSet();
  const shouldHighlight =
    state.started &&
    !state.gameOver &&
    state.waitingForNextWave &&
    !state.waveActive;

  for (const tile of pathMeshes) {
    const isActive = activePathSet.has(tile.userData.pathKey);

    if (shouldHighlight && isActive) {
      setMaterialColor(tile.material, 0xf59e0b);
      setMaterialEmissive(tile.material, 0x7c2d12);
    } else {
      setMaterialColor(tile.material, tile.userData.baseColor ?? 0x8b5a2b);
      setMaterialEmissive(tile.material, 0x000000);
    }
  }
}

function setMaterialColor(material, color) {
  if (material?.color?.set) {
    material.color.set(color);
    return;
  }

  if (material?.uniforms?.uColor?.value?.set) {
    material.uniforms.uColor.value.set(color);
  }
}

function setMaterialEmissive(material, color) {
  if (material?.emissive?.set) {
    material.emissive.set(color);
    return;
  }

  if (material?.uniforms?.uEmissive?.value?.set) {
    material.uniforms.uEmissive.value.set(color);
  }
}

function buildActivePathTileSet() {
  const result = new Set();
  const path = state.currentPath ?? [];

  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];

    const dx = Math.sign(end.x - start.x);
    const dz = Math.sign(end.z - start.z);

    let x = start.x;
    let z = start.z;

    result.add(`${x},${z}`);

    while (x !== end.x || z !== end.z) {
      if (x !== end.x) x += dx;
      if (z !== end.z) z += dz;

      result.add(`${x},${z}`);
    }
  }

  return result;
}