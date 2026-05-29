import * as THREE from "three";

const floatingTexts = [];

export function spawnFloatingText(scene, text, position, color = "#ffffff") {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 80;

  const ctx = canvas.getContext("2d");

  ctx.font = "bold 42px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 6;

  ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
  ctx.strokeText(text, 80, 40);

  ctx.fillStyle = color;
  ctx.fillText(text, 80, 40);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);

  sprite.position.set(
    position.x + (Math.random() - 0.5) * 0.35,
    position.y + 0.9,
    position.z + (Math.random() - 0.5) * 0.35
  );

  sprite.scale.set(1.1, 0.55, 1);

  sprite.userData = {
    life: 55,
    maxLife: 55,
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 0.01,
      0.035,
      (Math.random() - 0.5) * 0.01
    )
  };

  scene.add(sprite);
  floatingTexts.push(sprite);
}

export function updateFloatingTexts(scene, camera) {
  for (const text of floatingTexts) {
    text.userData.life--;

    text.position.add(text.userData.velocity);
    text.lookAt(camera.position);

    const ratio = text.userData.life / text.userData.maxLife;
    text.material.opacity = Math.max(0, ratio);

    const scale = 0.9 + (1 - ratio) * 0.35;
    text.scale.set(1.1 * scale, 0.55 * scale, 1);
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    if (floatingTexts[i].userData.life <= 0) {
      scene.remove(floatingTexts[i]);

      if (floatingTexts[i].material.map) {
        floatingTexts[i].material.map.dispose();
      }

      floatingTexts[i].material.dispose();
      floatingTexts.splice(i, 1);
    }
  }
}