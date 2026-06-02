import * as THREE from "three";

export function createTowerLabel(scene, tower) {
  const sprite = makeLabelSprite(
    tower.userData.level ?? 1,
    tower.userData.targetMode ?? "nearest",
    tower.userData.type ?? "normal"
  );

  sprite.position.set(
    tower.position.x,
    getLabelHeight(tower),
    tower.position.z
  );

  markTowerLabel(sprite, tower);

  tower.userData.levelLabel = sprite;
  tower.userData.label = sprite;

  scene.add(sprite);
}

export function updateTowerLabelText(tower) {
  if (!tower.userData.levelLabel) return;

  const oldSprite = tower.userData.levelLabel;
  const scene = oldSprite.parent;

  if (!scene) return;

  scene.remove(oldSprite);
  disposeLabel(oldSprite);

  const newSprite = makeLabelSprite(
    tower.userData.level ?? 1,
    tower.userData.targetMode ?? "nearest",
    tower.userData.type ?? "normal"
  );

  newSprite.position.set(
    tower.position.x,
    getLabelHeight(tower),
    tower.position.z
  );

  markTowerLabel(newSprite, tower);

  tower.userData.levelLabel = newSprite;
  tower.userData.label = newSprite;

  scene.add(newSprite);
}

export function updateTowerLabels(camera, towers) {
  for (const tower of towers) {
    const label = tower.userData.levelLabel;
    if (!label) continue;

    label.position.set(
      tower.position.x,
      getLabelHeight(tower),
      tower.position.z
    );

    label.lookAt(camera.position);
  }
}

export function removeTowerLabel(scene, tower) {
  const label = tower.userData.levelLabel || tower.userData.label;

  if (!label) return;

  scene.remove(label);
  disposeLabel(label);

  tower.userData.levelLabel = null;
  tower.userData.label = null;
}

function markTowerLabel(sprite, tower) {
  sprite.name = "TowerLabel";
  sprite.userData.isTowerLabel = true;
  sprite.userData.towerLabel = true;
  sprite.userData.labelType = "tower";
  sprite.userData.parentTower = tower;
}

function disposeLabel(sprite) {
  sprite.material?.map?.dispose?.();
  sprite.material?.dispose?.();
  sprite.geometry?.dispose?.();
}

function getLabelHeight(tower) {
  const type = tower.userData.type;
  const level = tower.userData.level ?? 1;
  const levelBonus = (level - 1) * 0.1;

  if (type === "sniper") return tower.position.y + 2.35 + levelBonus;
  if (type === "slow") return tower.position.y + 2.2 + levelBonus;
  if (type === "splash") return tower.position.y + 1.95 + levelBonus;
  if (type === "rapid") return tower.position.y + 1.8 + levelBonus;

  return tower.position.y + 1.95 + levelBonus;
}

function makeLabelSprite(level, targetMode, towerType) {
  const canvas = document.createElement("canvas");
  canvas.width = 240;
  canvas.height = 104;

  const ctx = canvas.getContext("2d");

  const borderColor = getLevelBorderColor(level);
  const accentColor = getTowerAccentColor(towerType);

  ctx.fillStyle = "rgba(0, 0, 0, 0.84)";
  ctx.roundRect(16, 10, 208, 82, 18);
  ctx.fill();

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = level >= 3 ? 5 : 3;
  ctx.roundRect(16, 10, 208, 82, 18);
  ctx.stroke();

  if (level >= 3) {
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.roundRect(24, 18, 192, 66, 14);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 29px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`LVL ${level}`, 120, 36);

  ctx.fillStyle = accentColor;
  ctx.font = "bold 18px Arial";
  ctx.fillText(getTargetModeLabel(targetMode), 120, 66);

  if (level >= 2) {
    ctx.fillStyle = level >= 3 ? "#facc15" : "#bae6fd";
    ctx.font = "bold 13px Arial";
    ctx.fillText(level >= 3 ? "ELITE MODULES" : "UPGRADED", 120, 84);
  }

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(level >= 3 ? 1.62 : 1.5, level >= 3 ? 0.72 : 0.67, 1);

  return sprite;
}

function getLevelBorderColor(level) {
  if (level >= 3) return "rgba(250, 204, 21, 0.92)";
  if (level === 2) return "rgba(34, 197, 94, 0.82)";

  return "rgba(56, 189, 248, 0.6)";
}

function getTowerAccentColor(type) {
  if (type === "rapid") return "#38bdf8";
  if (type === "sniper") return "#c084fc";
  if (type === "slow") return "#5eead4";
  if (type === "splash") return "#fb923c";

  return "#60a5fa";
}

function getTargetModeLabel(mode) {
  if (mode === "first") return "FIRST";
  if (mode === "strongest") return "STRONG";
  if (mode === "weakest") return "WEAK";

  return "NEAR";
}