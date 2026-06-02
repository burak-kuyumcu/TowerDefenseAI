import * as THREE from "three";

const floatingTexts = [];

export function spawnFloatingText(
  scene,
  text,
  position,
  color = "#ffffff",
  options = {}
) {
  const {
    variant = "normal",
    life = variant === "crit" ? 70 : 55,
    yOffset = variant === "crit" ? 1.15 : 0.9,
    spread = 0.35
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = variant === "crit" ? 260 : 180;
  canvas.height = variant === "crit" ? 110 : 86;

  const ctx = canvas.getContext("2d");

  const fontSize =
    variant === "crit" ? 50 :
      variant === "big" ? 46 :
        42;

  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = variant === "crit" ? 8 : 6;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  if (variant === "crit") {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#facc15");
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, "#fb923c");

    ctx.strokeStyle = "rgba(0, 0, 0, 0.92)";
    ctx.strokeText(text, centerX, centerY);

    ctx.fillStyle = gradient;
    ctx.fillText(text, centerX, centerY);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 2;
    ctx.strokeText(text, centerX, centerY);
  } else {
    ctx.strokeStyle = "rgba(0, 0, 0, 0.82)";
    ctx.strokeText(text, centerX, centerY);

    ctx.fillStyle = color;
    ctx.fillText(text, centerX, centerY);
  }

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);

  sprite.position.set(
    position.x + (Math.random() - 0.5) * spread,
    position.y + yOffset,
    position.z + (Math.random() - 0.5) * spread
  );

  const baseScale =
    variant === "crit" ? 1.55 :
      variant === "big" ? 1.28 :
        1.1;

  sprite.scale.set(baseScale, baseScale * 0.5, 1);

  sprite.userData = {
    life,
    maxLife: life,
    variant,
    baseScale,
    spin: variant === "crit" ? (Math.random() - 0.5) * 0.025 : 0,
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 0.012,
      variant === "crit" ? 0.045 : 0.035,
      (Math.random() - 0.5) * 0.012
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

    if (text.userData.variant === "crit") {
      const pop = 1.05 + Math.sin((1 - ratio) * Math.PI) * 0.28;
      const scale = text.userData.baseScale * pop;

      text.scale.set(scale, scale * 0.5, 1);
      text.material.rotation += text.userData.spin;
    } else {
      const scale = text.userData.baseScale + (1 - ratio) * 0.35;
      text.scale.set(scale, scale * 0.5, 1);
    }
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