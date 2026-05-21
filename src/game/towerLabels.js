import * as THREE from "three";

export function createTowerLabel(scene, tower) {
  const sprite = makeLabelSprite(
    tower.userData.level ?? 1,
    tower.userData.targetMode ?? "nearest"
  );

  sprite.position.set(
    tower.position.x,
    getLabelHeight(tower),
    tower.position.z
  );

  tower.userData.levelLabel = sprite;
  scene.add(sprite);
}

export function updateTowerLabelText(tower) {
  if (!tower.userData.levelLabel) return;

  const oldSprite = tower.userData.levelLabel;
  const scene = oldSprite.parent;

  if (!scene) return;

  scene.remove(oldSprite);

  const newSprite = makeLabelSprite(
    tower.userData.level ?? 1,
    tower.userData.targetMode ?? "nearest"
  );

  newSprite.position.set(
    tower.position.x,
    getLabelHeight(tower),
    tower.position.z
  );

  tower.userData.levelLabel = newSprite;
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
  if (!tower.userData.levelLabel) return;

  scene.remove(tower.userData.levelLabel);
  tower.userData.levelLabel = null;
}

function getLabelHeight(tower) {
  const type = tower.userData.type;

  if (type === "sniper") return tower.position.y + 2.35;
  if (type === "slow") return tower.position.y + 2.2;
  if (type === "splash") return tower.position.y + 1.95;
  if (type === "rapid") return tower.position.y + 1.8;

  return tower.position.y + 1.95;
}

function makeLabelSprite(level, targetMode) {
  const canvas = document.createElement("canvas");
  canvas.width = 220;
  canvas.height = 96;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
  ctx.roundRect(18, 10, 184, 74, 16);
  ctx.fill();

  ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
  ctx.lineWidth = 3;
  ctx.roundRect(18, 10, 184, 74, 16);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`LVL ${level}`, 110, 34);

  ctx.fillStyle = "#facc15";
  ctx.font = "bold 18px Arial";
  ctx.fillText(getTargetModeLabel(targetMode), 110, 64);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.45, 0.65, 1);

  return sprite;
}

function getTargetModeLabel(mode) {
  if (mode === "first") return "FIRST";
  if (mode === "strongest") return "STRONG";
  if (mode === "weakest") return "WEAK";
  return "NEAR";
}