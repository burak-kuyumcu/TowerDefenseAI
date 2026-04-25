import * as THREE from "three";

export function createTowerLabel(scene, tower) {
  const sprite = makeLabelSprite(
    tower.userData.level ?? 1,
    tower.userData.targetMode ?? "nearest"
  );

  sprite.position.set(
    tower.position.x,
    tower.position.y + 1.05,
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

  newSprite.position.copy(oldSprite.position);

  tower.userData.levelLabel = newSprite;
  scene.add(newSprite);
}

export function updateTowerLabels(camera, towers) {
  for (const tower of towers) {
    const label = tower.userData.levelLabel;
    if (!label) continue;

    label.position.set(
      tower.position.x,
      tower.position.y + 1.05,
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

function makeLabelSprite(level, targetMode) {
  const canvas = document.createElement("canvas");
  canvas.width = 180;
  canvas.height = 80;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.roundRect(10, 8, 160, 64, 14);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`LVL ${level}`, 90, 28);

  ctx.fillStyle = "#facc15";
  ctx.font = "bold 18px Arial";
  ctx.fillText(getTargetModeLabel(targetMode), 90, 56);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.35, 0.6, 1);

  return sprite;
}

function getTargetModeLabel(mode) {
  if (mode === "first") return "FIRST";
  if (mode === "strongest") return "STRONG";
  if (mode === "weakest") return "WEAK";
  return "NEAR";
}