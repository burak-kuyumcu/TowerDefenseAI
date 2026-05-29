import * as THREE from "three";
import { state } from "../game/state.js";


const signals = [];

export function spawnTacticalSignal(scene, strategy) {
  const color = getStrategyColor(strategy);

  const path = state.currentPath ?? [];
  if (path.length === 0) return;

  for (let i = 0; i < path.length; i += 2) {
    const point = path[i];

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.5, 48),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );

    ring.rotation.x = -Math.PI / 2;
    ring.position.set(point.x, 0.16, point.z);

    ring.userData = {
      life: 80,
      maxLife: 80,
      baseScale: 0.5 + i * 0.03
    };

    scene.add(ring);
    signals.push(ring);
  }
}

export function updateTacticalSignals(scene) {
  for (const signal of signals) {
    signal.userData.life--;

    const ratio = signal.userData.life / signal.userData.maxLife;
    const pulse = 1 + Math.sin(Date.now() * 0.012) * 0.18;
    const grow = 1 + (1 - ratio) * 1.6;

    signal.scale.setScalar(signal.userData.baseScale * pulse * grow);
    signal.material.opacity = Math.max(0, ratio * 0.65);
  }

  for (let i = signals.length - 1; i >= 0; i--) {
    if (signals[i].userData.life <= 0) {
      scene.remove(signals[i]);
      signals[i].geometry.dispose();
      signals[i].material.dispose();
      signals.splice(i, 1);
    }
  }
}

function getStrategyColor(strategy) {
  if (strategy.includes("Swarm") || strategy.includes("Fast")) return 0xfb923c;
  if (strategy.includes("Armor") || strategy.includes("Crusher") || strategy.includes("Tank")) return 0x7f1d1d;
  if (strategy.includes("Shield")) return 0x22c55e;
  if (strategy.includes("Disruption")) return 0x06b6d4;
  if (strategy.includes("Boss")) return 0xa855f7;

  return 0xfacc15;
}