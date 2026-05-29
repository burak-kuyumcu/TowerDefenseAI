import * as THREE from "three";
import { state } from "../game/state.js";
import { playBaseHitSound } from "../game/audio.js";
import { addEventLog } from "../ui/eventLog.js";

let baseScene = null;
let baseObject = null;
let baseBar = null;
let baseBarFill = null;
let flashTimer = 0;
let criticalPulseTimer = 0;

export function initBaseSystem(scene, base) {
  baseScene = scene;
  baseObject = base;

  baseBar = new THREE.Group();

  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.16),
    new THREE.MeshBasicMaterial({
      color: 0x7f1d1d,
      side: THREE.DoubleSide
    })
  );

  baseBarFill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.16),
    new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide
    })
  );

  baseBarFill.position.z = 0.01;

  baseBar.add(background);
  baseBar.add(baseBarFill);

  baseBar.position.set(
    base.position.x,
    base.position.y + 2.65,
    base.position.z
  );

  scene.add(baseBar);
}

export function damageBase(amount) {
  state.baseHp = Math.max(0, state.baseHp - amount);
  flashTimer = 16;
  criticalPulseTimer = 50;

  addEventLog(`Base took ${amount} damage.`);
  playBaseHitSound();

  setBaseEmissive(0xff0000, 0.85);
  spawnBaseDamageBurst(amount);

  if (state.baseHp <= 0) {
    state.baseHp = 0;
    state.gameOver = true;
    addEventLog("Base destroyed!");
    spawnBaseDestroyedBurst();
  }
}

export function updateBaseSystem(camera) {
  if (!baseObject || !baseBar || !baseBarFill) return;

  baseBar.position.set(
    baseObject.position.x,
    baseObject.position.y + 2.65,
    baseObject.position.z
  );

  baseBar.lookAt(camera.position);

  const hpRatio = Math.max(0, state.baseHp / state.baseMaxHp);

  baseBarFill.scale.x = hpRatio;
  baseBarFill.position.x = -0.7 * (1 - hpRatio);

  updateBaseBarColor(hpRatio);
  updateBaseDamageVisual(hpRatio);

  if (flashTimer > 0) {
    flashTimer--;

    if (flashTimer <= 0) {
      applyBaseHealthEmissive(hpRatio);
    }
  }
}

function updateBaseBarColor(hpRatio) {
  if (!baseBarFill?.material?.color?.set) return;

  if (hpRatio > 0.6) {
    baseBarFill.material.color.set(0x22c55e);
  } else if (hpRatio > 0.3) {
    baseBarFill.material.color.set(0xfacc15);
  } else {
    baseBarFill.material.color.set(0xef4444);
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

  const particleCount = Math.min(18, 6 + amount * 4);

  for (let i = 0; i < particleCount; i++) {
    const color = i % 2 === 0 ? 0xef4444 : 0xf97316;

    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 8, 8),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9
      })
    );

    particle.position.set(
      baseObject.position.x + (Math.random() - 0.5) * 0.9,
      baseObject.position.y + 1.2 + Math.random() * 0.8,
      baseObject.position.z + (Math.random() - 0.5) * 0.9
    );

    baseScene.add(particle);

    let life = 26;
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.06,
      Math.random() * 0.08,
      (Math.random() - 0.5) * 0.06
    );

    const interval = setInterval(() => {
      particle.position.add(velocity);
      velocity.y -= 0.004;
      particle.material.opacity *= 0.9;
      particle.scale.multiplyScalar(0.97);
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