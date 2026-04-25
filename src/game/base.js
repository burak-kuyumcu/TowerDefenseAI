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
    base.position.y + 1.25,
    base.position.z
  );

  scene.add(baseBar);
}

export function damageBase(amount) {
  state.baseHp = Math.max(0, state.baseHp - amount);
  flashTimer = 12;

  addEventLog(`Base took ${amount} damage.`);
  playBaseHitSound();

  if (baseObject?.material?.emissive) {
    baseObject.material.emissive.set(0xff0000);
  }

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
    baseObject.position.y + 1.25,
    baseObject.position.z
  );

  baseBar.lookAt(camera.position);

  const hpRatio = Math.max(0, state.baseHp / state.baseMaxHp);

  baseBarFill.scale.x = hpRatio;
  baseBarFill.position.x = -0.7 * (1 - hpRatio);

  if (flashTimer > 0) {
    flashTimer--;

    if (flashTimer <= 0 && baseObject.material?.emissive) {
      baseObject.material.emissive.set(0x000000);
    }
  }
}