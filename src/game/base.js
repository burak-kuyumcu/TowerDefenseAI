import * as THREE from "three";
import { state } from "./state.js";
import { playBaseHitSound } from "./audio.js";
import { addEventLog } from "./eventLog.js";

let baseObject = null;
let baseBar = null;
let baseBarFill = null;
let flashTimer = 0;

export function initBaseSystem(scene, base) {
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
  flashTimer = 12;

  addEventLog(`Base took ${amount} damage.`);
  playBaseHitSound();

  setBaseEmissive(0xff0000);

  if (state.baseHp <= 0) {
    state.baseHp = 0;
    state.gameOver = true;
    addEventLog("Base destroyed!");
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

  if (flashTimer > 0) {
    flashTimer--;

    if (flashTimer <= 0) {
      setBaseEmissive(0x000000);
    }
  }
}

function setBaseEmissive(color) {
  if (!baseObject) return;

  baseObject.traverse((child) => {
    if (!child.isMesh) return;

    if (child.material?.emissive?.set) {
      child.material.emissive.set(color);
    } else if (child.material?.uniforms?.uEmissive?.value?.set) {
      child.material.uniforms.uEmissive.value.set(color);
    }
  });
}