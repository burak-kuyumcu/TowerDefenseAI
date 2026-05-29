import { getCurrentStage } from "../game/stages.js";

let groundMesh = null;
let pathMeshes = [];

export function initStageVisuals(scene) {
  groundMesh = null;
  pathMeshes = [];

  scene.traverse((object) => {
    if (!object.isMesh) return;

    if (object.userData?.shaderRole === "ground") {
      groundMesh = object;
    }

    if (object.userData?.isPathTile) {
      pathMeshes.push(object);
    }
  });

  updateStageVisuals();
}

export function updateStageVisuals() {
  const stage = getCurrentStage();

  if (groundMesh) {
    setMaterialColor(groundMesh.material, stage.groundColor);
    groundMesh.userData.baseColor = stage.groundColor;
  }

  for (const tile of pathMeshes) {
    setMaterialColor(tile.material, stage.roadColor);
    tile.userData.baseColor = stage.roadColor;
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