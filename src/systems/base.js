import * as THREE from "three";
import { state } from "../game/state.js";
import { playBaseHitSound } from "../game/audio.js";
import { addEventLog } from "../ui/eventLog.js";
import { showScreenFlash } from "../ui/announcer.js";
import { addCameraShake } from "./cameraShake.js";

let baseScene = null;
let baseObject = null;

let baseBar = null;
let baseBarFill = null;
let baseBarFrame = null;
let baseBarGlow = null;

let criticalGroundRing = null;
let damageWarningBeacon = null;

let flashTimer = 0;
let criticalPulseTimer = 0;

const BASE_BAR_HEIGHT = 3.0;

export function initBaseSystem(scene, base) {
  baseScene = scene;
  baseObject = base;

  baseBar = createBaseHealthBar();
  scene.add(baseBar);

  criticalGroundRing = createCriticalGroundRing();
  scene.add(criticalGroundRing);

  damageWarningBeacon = createDamageWarningBeacon();
  scene.add(damageWarningBeacon);

  updateBaseOverlayPositions();
}

export function damageBase(amount) {
  state.baseHp = Math.max(0, state.baseHp - amount);
  flashTimer = 16;
  criticalPulseTimer = 60;

  addEventLog(`Base took ${amount} damage.`);
  playBaseHitSound();

  setBaseEmissive(0xff0000, 0.85);
  spawnBaseDamageBurst(amount);
  spawnBaseImpactRing(amount);

  showScreenFlash("rgba(239, 68, 68, 0.32)", 18);
  addCameraShake(0.16 + amount * 0.035, 18 + amount * 3);

  if (state.baseHp <= 0) {
    state.baseHp = 0;
    state.gameOver = true;

    addEventLog("Base destroyed!");
    spawnBaseDestroyedBurst();
    showScreenFlash("rgba(127, 29, 29, 0.55)", 34);

    addCameraShake(0.42, 48);
  }
}

export function updateBaseSystem(camera) {
  if (!baseObject || !baseBar || !baseBarFill) return;

  updateBaseOverlayPositions();

  baseBar.lookAt(camera.position);

  const hpRatio = Math.max(0, state.baseHp / state.baseMaxHp);

  baseBarFill.scale.x = hpRatio;
  baseBarFill.position.x = -0.72 * (1 - hpRatio);

  updateBaseBarColor(hpRatio);
  updateBaseDamageVisual(hpRatio);
  updateBaseCriticalVisuals(hpRatio);

  if (flashTimer > 0) {
    flashTimer--;

    if (flashTimer <= 0) {
      applyBaseHealthEmissive(hpRatio);
    }
  }
}

function createBaseHealthBar() {
  const group = new THREE.Group();

  const backPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.72, 0.34),
    new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(1.44, 0.16),
    new THREE.MeshBasicMaterial({
      color: 0x7f1d1d,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  background.position.z = 0.01;

  baseBarFill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.44, 0.16),
    new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  baseBarFill.position.z = 0.02;

  baseBarGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.22),
    new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  baseBarGlow.position.z = 0.015;

  baseBarFrame = createBaseBarFrame();

  const title = createBaseBarTitle();

  group.add(backPlate, background, baseBarGlow, baseBarFill, baseBarFrame, title);

  return group;
}

function createBaseBarFrame() {
  const frame = new THREE.Group();

  const material = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const top = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 0.025), material);
  top.position.set(0, 0.105, 0.035);

  const bottom = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 0.025), material);
  bottom.position.set(0, -0.105, 0.035);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(0.025, 0.22), material);
  left.position.set(-0.76, 0, 0.035);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(0.025, 0.22), material);
  right.position.set(0.76, 0, 0.035);

  frame.add(top, bottom, left, right);

  for (let i = 1; i < 4; i++) {
    const tick = new THREE.Mesh(
      new THREE.PlaneGeometry(0.016, 0.16),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );

    tick.position.set(-0.72 + i * 0.36, 0, 0.04);
    frame.add(tick);
  }

  return frame;
}

function createBaseBarTitle() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
  ctx.lineWidth = 5;
  ctx.strokeText("BASE CORE", 128, 32);

  ctx.fillStyle = "#e0f2fe";
  ctx.fillText("BASE CORE", 128, 32);

  const texture = new THREE.CanvasTexture(canvas);

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    })
  );

  sprite.position.set(0, 0.32, 0);
  sprite.scale.set(1.25, 0.3, 1);

  return sprite;
}

function createCriticalGroundRing() {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.45, 96),
    new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.13;
  ring.visible = false;

  return ring;
}

function createDamageWarningBeacon() {
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18),
    new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  );

  beacon.visible = false;

  return beacon;
}

function updateBaseOverlayPositions() {
  if (!baseObject) return;

  if (baseBar) {
    baseBar.position.set(
      baseObject.position.x,
      baseObject.position.y + BASE_BAR_HEIGHT,
      baseObject.position.z
    );
  }

  if (criticalGroundRing) {
    criticalGroundRing.position.x = baseObject.position.x;
    criticalGroundRing.position.z = baseObject.position.z;
  }

  if (damageWarningBeacon) {
    damageWarningBeacon.position.set(
      baseObject.position.x,
      baseObject.position.y + 2.35,
      baseObject.position.z
    );
  }
}

function updateBaseBarColor(hpRatio) {
  if (!baseBarFill?.material?.color?.set) return;

  let color = 0x22c55e;

  if (hpRatio <= 0.3) {
    color = 0xef4444;
  } else if (hpRatio <= 0.6) {
    color = 0xfacc15;
  }

  baseBarFill.material.color.set(color);

  if (baseBarGlow?.material?.color?.set) {
    baseBarGlow.material.color.set(color);
  }

  if (baseBarGlow?.material) {
    const warningPulse =
      hpRatio <= 0.3
        ? 0.22 + Math.sin(Date.now() * 0.018) * 0.12
        : hpRatio <= 0.6
          ? 0.16
          : 0.1;

    baseBarGlow.material.opacity = Math.max(0.04, warningPulse);
  }
}

function updateBaseDamageVisual(hpRatio) {
  if (!baseObject) return;

  if (criticalPulseTimer > 0) {
    criticalPulseTimer--;
  }

  const pulse =
    hpRatio <= 0.3
      ? 1 + Math.sin(Date.now() * 0.014) * 0.035
      : hpRatio <= 0.6
        ? 1 + Math.sin(Date.now() * 0.008) * 0.018
        : 1;

  baseObject.scale.set(pulse, pulse, pulse);

  if (flashTimer > 0) return;

  applyBaseHealthEmissive(hpRatio);
}

function updateBaseCriticalVisuals(hpRatio) {
  const isCritical = hpRatio <= 0.3 && state.baseHp > 0;
  const isWarning = hpRatio <= 0.6 && state.baseHp > 0;

  if (criticalGroundRing) {
    criticalGroundRing.visible = isWarning;

    if (isWarning) {
      const pulse = isCritical
        ? 0.42 + Math.sin(Date.now() * 0.018) * 0.18
        : 0.18 + Math.sin(Date.now() * 0.008) * 0.08;

      criticalGroundRing.material.opacity = Math.max(0.04, pulse);
      criticalGroundRing.rotation.z += isCritical ? 0.035 : 0.012;

      const scale = isCritical
        ? 1 + Math.sin(Date.now() * 0.014) * 0.08
        : 1 + Math.sin(Date.now() * 0.008) * 0.035;

      criticalGroundRing.scale.set(scale, scale, scale);
    }
  }

  if (damageWarningBeacon) {
    damageWarningBeacon.visible = isCritical;

    if (isCritical) {
      damageWarningBeacon.material.opacity =
        0.45 + Math.sin(Date.now() * 0.02) * 0.22;

      damageWarningBeacon.rotation.y += 0.06;
      damageWarningBeacon.rotation.z += 0.03;

      const scale = 1 + Math.sin(Date.now() * 0.017) * 0.12;
      damageWarningBeacon.scale.setScalar(scale);
    }
  }
}

function applyBaseHealthEmissive(hpRatio) {
  if (hpRatio <= 0.3) {
    const blink = Math.sin(Date.now() * 0.018) > 0 ? 0xff0000 : 0x7f1d1d;
    setBaseEmissive(blink, 0.75);
    return;
  }

  if (hpRatio <= 0.6) {
    setBaseEmissive(0xf59e0b, 0.38);
    return;
  }

  setBaseEmissive(0x000000, 0);
}

function setBaseEmissive(color, intensity = 0.6) {
  if (!baseObject) return;

  baseObject.traverse((child) => {
    if (!child.isMesh) return;

    if (child.material?.emissive?.set) {
      child.material.emissive.set(color);
    }

    if (typeof child.material?.emissiveIntensity === "number") {
      child.material.emissiveIntensity = color === 0x000000 ? 0 : intensity;
    }

    if (child.material?.uniforms?.uEmissive?.value?.set) {
      child.material.uniforms.uEmissive.value.set(color);
    }

    if (child.material?.uniforms?.uEmissiveIntensity) {
      child.material.uniforms.uEmissiveIntensity.value =
        color === 0x000000 ? 0 : intensity;
    }
  });
}

function spawnBaseDamageBurst(amount) {
  if (!baseScene || !baseObject) return;

  const particleCount = Math.min(22, 8 + amount * 4);

  for (let i = 0; i < particleCount; i++) {
    const color = i % 3 === 0 ? 0xfacc15 : i % 2 === 0 ? 0xef4444 : 0xf97316;

    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.045 + Math.random() * 0.025, 8, 8),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.92,
        depthWrite: false
      })
    );

    particle.position.set(
      baseObject.position.x + (Math.random() - 0.5) * 0.95,
      baseObject.position.y + 0.9 + Math.random() * 1.15,
      baseObject.position.z + (Math.random() - 0.5) * 0.95
    );

    baseScene.add(particle);

    let life = 28 + Math.floor(Math.random() * 12);

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.065,
      0.035 + Math.random() * 0.075,
      (Math.random() - 0.5) * 0.065
    );

    const interval = setInterval(() => {
      particle.position.add(velocity);
      velocity.y -= 0.004;

      particle.material.opacity *= 0.9;
      particle.scale.multiplyScalar(0.965);

      life--;

      if (life <= 0) {
        baseScene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
        clearInterval(interval);
      }
    }, 16);
  }
}

function spawnBaseImpactRing(amount) {
  if (!baseScene || !baseObject) return;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.65, 0.78, 80),
    new THREE.MeshBasicMaterial({
      color: amount >= 2 ? 0xef4444 : 0xf97316,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(baseObject.position.x, 0.18, baseObject.position.z);

  baseScene.add(ring);

  let life = 26;

  const interval = setInterval(() => {
    ring.rotation.z += 0.045;
    ring.scale.multiplyScalar(1.035);
    ring.material.opacity *= 0.9;

    life--;

    if (life <= 0) {
      baseScene.remove(ring);
      ring.geometry.dispose();
      ring.material.dispose();
      clearInterval(interval);
    }
  }, 16);
}

function spawnBaseDestroyedBurst() {
  if (!baseScene || !baseObject) return;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.8, 96),
    new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(baseObject.position.x, 0.12, baseObject.position.z);

  baseScene.add(ring);

  for (let i = 0; i < 28; i++) {
    spawnDestructionShard();
  }

  let life = 70;

  const interval = setInterval(() => {
    ring.rotation.z += 0.035;
    ring.scale.multiplyScalar(1.025);
    ring.material.opacity *= 0.965;

    life--;

    if (life <= 0) {
      baseScene.remove(ring);
      ring.geometry.dispose();
      ring.material.dispose();
      clearInterval(interval);
    }
  }, 16);
}

function spawnDestructionShard() {
  if (!baseScene || !baseObject) return;

  const shard = new THREE.Mesh(
    new THREE.BoxGeometry(
      0.08 + Math.random() * 0.08,
      0.06 + Math.random() * 0.08,
      0.08 + Math.random() * 0.08
    ),
    new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0x1e3a8a : 0xef4444,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    })
  );

  shard.position.set(
    baseObject.position.x,
    baseObject.position.y + 0.9 + Math.random() * 0.9,
    baseObject.position.z
  );

  shard.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );

  baseScene.add(shard);

  const angle = Math.random() * Math.PI * 2;

  const velocity = new THREE.Vector3(
    Math.cos(angle) * (0.025 + Math.random() * 0.045),
    0.05 + Math.random() * 0.07,
    Math.sin(angle) * (0.025 + Math.random() * 0.045)
  );

  let life = 42;

  const interval = setInterval(() => {
    shard.position.add(velocity);

    velocity.y -= 0.0045;

    shard.rotation.x += 0.08;
    shard.rotation.y += 0.05;

    shard.material.opacity *= 0.94;

    life--;

    if (life <= 0) {
      baseScene.remove(shard);
      shard.geometry.dispose();
      shard.material.dispose();
      clearInterval(interval);
    }
  }, 16);
}