import { state } from "../game/state.js";

export function refundAndClearTowersForStageChange(scene) {
  let refund = 0;

  for (const tower of state.towers) {
    refund += Math.floor(getTowerRefundValue(tower) * 0.7);

    removeTowerLabel(scene, tower);
    scene.remove(tower);
    disposeObject(tower);
  }

  clearOrphanTowerLabels(scene);

  state.gold += refund;
  state.towers = [];
  state.towerSet.clear();
  state.selectedObject = null;

  return refund;
}

function removeTowerLabel(scene, tower) {
  const label = tower.userData.levelLabel || tower.userData.label;

  if (!label) return;

  scene.remove(label);
  disposeObject(label);

  tower.userData.levelLabel = null;
  tower.userData.label = null;
}

function clearOrphanTowerLabels(scene) {
  const labelsToRemove = [];

  scene.traverse((object) => {
    const name = object.name?.toLowerCase?.() ?? "";

    if (
      object.userData?.isTowerLabel ||
      object.userData?.towerLabel ||
      object.userData?.labelType === "tower" ||
      name.includes("towerlabel") ||
      name.includes("tower-label") ||
      name.includes("levellabel") ||
      name.includes("level-label")
    ) {
      labelsToRemove.push(object);
    }
  });

  for (const label of labelsToRemove) {
    scene.remove(label);
    disposeObject(label);
  }
}

function disposeObject(object) {
  object.traverse?.((child) => {
    if (!child.isMesh && !child.isSprite) return;

    child.geometry?.dispose?.();

    if (Array.isArray(child.material)) {
      child.material.forEach(disposeMaterial);
    } else {
      disposeMaterial(child.material);
    }
  });
}

function disposeMaterial(material) {
  if (!material) return;

  material.map?.dispose?.();
  material.dispose?.();
}

function getTowerRefundValue(tower) {
  const type = tower.userData.type;
  const level = tower.userData.level ?? 1;

  let baseCost = 25;

  if (type === "rapid") baseCost = 30;
  if (type === "sniper") baseCost = 45;
  if (type === "slow") baseCost = 35;
  if (type === "splash") baseCost = 50;

  return baseCost + (level - 1) * Math.floor(baseCost * 0.65);
}