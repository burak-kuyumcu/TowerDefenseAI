import * as THREE from "three";
import { state } from "../game/state.js";
import {
  getTowerFocusAngle,
  getTowerFocusArc,
  getDirectionalFocusShortText
} from "../systems/directionalFocus.js";

let rangePreview = null;
let towerSelectionRing = null;
let towerUltimateReadyRing = null;
let enemySelectionRing = null;
let hoverRing = null;
let focusArcPreview = null;
let focusArrow = null;

export function createRangePreview(scene) {
  rangePreview = createRingMesh({
    innerRadius: 0.95,
    outerRadius: 1,
    color: 0x60a5fa,
    opacity: 0.26
  });

  towerSelectionRing = createRingMesh({
    innerRadius: 0.52,
    outerRadius: 0.68,
    color: 0xfacc15,
    opacity: 0.78
  });

  towerUltimateReadyRing = createRingMesh({
    innerRadius: 0.78,
    outerRadius: 0.92,
    color: 0x38bdf8,
    opacity: 0.46
  });

  enemySelectionRing = createRingMesh({
    innerRadius: 0.48,
    outerRadius: 0.64,
    color: 0xef4444,
    opacity: 0.82
  });

  hoverRing = createRingMesh({
    innerRadius: 0.42,
    outerRadius: 0.54,
    color: 0xffffff,
    opacity: 0.42
  });

  focusArcPreview = createFocusArcMesh({
    innerRadius: 0.55,
    outerRadius: 1,
    color: 0xfacc15,
    opacity: 0.22,
    angle: 0,
    arc: Math.PI / 2.35
  });

  focusArrow = createFocusArrowMesh();

  rangePreview.position.y = 0.075;
  towerSelectionRing.position.y = 0.105;
  towerUltimateReadyRing.position.y = 0.115;
  enemySelectionRing.position.y = 0.12;
  hoverRing.position.y = 0.13;
  focusArcPreview.position.y = 0.095;
  focusArrow.position.y = 0.155;

  scene.add(rangePreview);
  scene.add(towerSelectionRing);
  scene.add(towerUltimateReadyRing);
  scene.add(enemySelectionRing);
  scene.add(hoverRing);
  scene.add(focusArcPreview);
  scene.add(focusArrow);

  hideAllPreviewObjects();
}

export function updateRangePreview() {
  if (
    !rangePreview ||
    !towerSelectionRing ||
    !towerUltimateReadyRing ||
    !enemySelectionRing ||
    !hoverRing ||
    !focusArcPreview ||
    !focusArrow
  ) {
    return;
  }

  hideAllPreviewObjects();

  updateHoverRing();

  const selected = state.selectedObject;

  if (!selected) return;

  if (state.towers.includes(selected)) {
    updateSelectedTowerPreview(selected);
    return;
  }

  if (state.enemies.includes(selected)) {
    updateSelectedEnemyPreview(selected);
  }
}

function updateSelectedTowerPreview(tower) {
  const range = tower.userData.range ?? 1;
  const color = getTowerColor(tower.userData.type);

  rangePreview.visible = true;
  rangePreview.position.x = tower.position.x;
  rangePreview.position.z = tower.position.z;
  rangePreview.scale.set(range, range, range);

  setMaterialColor(rangePreview.material, color);
  rangePreview.material.opacity = getPulsingOpacity(0.2, 0.1, 0.006);

  towerSelectionRing.visible = true;
  towerSelectionRing.position.x = tower.position.x;
  towerSelectionRing.position.z = tower.position.z;
  towerSelectionRing.scale.setScalar(getPulsingScale(1.0, 0.055, 0.008));

  setMaterialColor(towerSelectionRing.material, 0xfacc15);
  towerSelectionRing.material.opacity = getPulsingOpacity(0.66, 0.14, 0.01);

  updateFocusPreview(tower, range, color);

  const ultimateReady =
    (tower.userData.ultimateCharge ?? 0) >= 100 &&
    tower.userData.ultimateCooldown <= 0;

  const ultimateActive = tower.userData.ultimateActiveTimer > 0;

  if (ultimateReady || ultimateActive) {
    towerUltimateReadyRing.visible = true;
    towerUltimateReadyRing.position.x = tower.position.x;
    towerUltimateReadyRing.position.z = tower.position.z;

    const ultimateColor = getTowerColor(tower.userData.type);
    setMaterialColor(towerUltimateReadyRing.material, ultimateColor);

    const scale = ultimateActive
      ? getPulsingScale(1.18, 0.1, 0.016)
      : getPulsingScale(1.05, 0.08, 0.01);

    towerUltimateReadyRing.scale.setScalar(scale);
    towerUltimateReadyRing.rotation.z += ultimateActive ? 0.045 : 0.025;
    towerUltimateReadyRing.material.opacity = ultimateActive ? 0.72 : 0.48;
  }
}

function updateFocusPreview(tower, range, color) {
  const angle = getTowerFocusAngle(tower);
  const arc = getTowerFocusArc(tower);

  rebuildFocusArcGeometry(focusArcPreview, angle, arc);

  focusArcPreview.visible = true;
  focusArcPreview.position.x = tower.position.x;
  focusArcPreview.position.z = tower.position.z;
  focusArcPreview.scale.set(range, range, range);

  setMaterialColor(focusArcPreview.material, color);
  focusArcPreview.material.opacity = getPulsingOpacity(0.15, 0.08, 0.01);

  focusArrow.visible = true;
  focusArrow.position.x = tower.position.x;
  focusArrow.position.z = tower.position.z;
  focusArrow.rotation.y = angle;
  focusArrow.scale.setScalar(0.9 + Math.sin(Date.now() * 0.01) * 0.06);

  setObjectMaterialColor(focusArrow, color);

  tower.userData.focusPreviewText = getDirectionalFocusShortText(tower);
}

function updateSelectedEnemyPreview(enemy) {
  const isBoss = enemy.userData.type?.startsWith("boss");
  const scale = isBoss ? 1.55 : 1;

  enemySelectionRing.visible = true;
  enemySelectionRing.position.x = enemy.position.x;
  enemySelectionRing.position.z = enemy.position.z;

  enemySelectionRing.scale.setScalar(
    scale * getPulsingScale(1, 0.08, 0.012)
  );

  enemySelectionRing.rotation.z -= 0.035;
  enemySelectionRing.material.opacity = getPulsingOpacity(0.68, 0.16, 0.012);

  const color = isBoss ? 0xa855f7 : 0xef4444;
  setMaterialColor(enemySelectionRing.material, color);
}

function updateHoverRing() {
  const hovered = state.hoveredObject;

  if (!hovered || hovered === state.selectedObject) {
    hoverRing.visible = false;
    return;
  }

  const isTower = state.towers.includes(hovered);
  const isEnemy = state.enemies.includes(hovered);

  if (!isTower && !isEnemy) {
    hoverRing.visible = false;
    return;
  }

  hoverRing.visible = true;
  hoverRing.position.x = hovered.position.x;
  hoverRing.position.z = hovered.position.z;

  const color = isTower ? 0x60a5fa : 0xf97316;
  const baseScale = isEnemy && hovered.userData.type?.startsWith("boss") ? 1.45 : 1;

  setMaterialColor(hoverRing.material, color);

  hoverRing.scale.setScalar(
    baseScale * getPulsingScale(0.9, 0.05, 0.01)
  );

  hoverRing.rotation.z += isTower ? 0.025 : -0.025;
  hoverRing.material.opacity = getPulsingOpacity(0.34, 0.1, 0.01);
}

function createRingMesh({ innerRadius, outerRadius, color, opacity }) {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);

  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;

  return ring;
}

function createFocusArcMesh({ innerRadius, outerRadius, color, opacity, angle, arc }) {
  const geometry = makeFocusArcGeometry(innerRadius, outerRadius, angle, arc);

  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;

  mesh.userData.innerRadius = innerRadius;
  mesh.userData.outerRadius = outerRadius;

  return mesh;
}

function rebuildFocusArcGeometry(mesh, angle, arc) {
  const innerRadius = mesh.userData.innerRadius ?? 0.55;
  const outerRadius = mesh.userData.outerRadius ?? 1;

  mesh.geometry.dispose();
  mesh.geometry = makeFocusArcGeometry(innerRadius, outerRadius, angle, arc);
}

function makeFocusArcGeometry(innerRadius, outerRadius, angle, arc) {
  const thetaCenter = angle - Math.PI / 2;
  const thetaStart = thetaCenter - arc / 2;

  return new THREE.RingGeometry(
    innerRadius,
    outerRadius,
    72,
    1,
    thetaStart,
    arc
  );
}

function createFocusArrowMesh() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.74, 8),
    new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.78,
      depthWrite: false
    })
  );

  body.rotation.x = Math.PI / 2;
  body.position.z = 0.46;

  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.28, 16),
    new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    })
  );

  head.rotation.x = Math.PI / 2;
  head.position.z = 0.9;

  group.add(body, head);
  group.visible = false;

  return group;
}

function hideAllPreviewObjects() {
  rangePreview.visible = false;
  towerSelectionRing.visible = false;
  towerUltimateReadyRing.visible = false;
  enemySelectionRing.visible = false;
  hoverRing.visible = false;
  focusArcPreview.visible = false;
  focusArrow.visible = false;
}

function getTowerColor(type) {
  if (type === "rapid") return 0x38bdf8;
  if (type === "sniper") return 0xc084fc;
  if (type === "slow") return 0x5eead4;
  if (type === "splash") return 0xfb923c;

  return 0x60a5fa;
}

function getPulsingScale(base, amount, speed) {
  return base + Math.sin(Date.now() * speed) * amount;
}

function getPulsingOpacity(base, amount, speed) {
  return Math.max(0.08, base + Math.sin(Date.now() * speed) * amount);
}

function setMaterialColor(material, color) {
  if (material?.color?.set) {
    material.color.set(color);
  }
}

function setObjectMaterialColor(object, color) {
  object.traverse((child) => {
    if (child.material?.color?.set) {
      child.material.color.set(color);
    }
  });
}