import * as THREE from "three";
import { state } from "../game/state.js";
import { addEventLog } from "../ui/eventLog.js";
import { showAnnouncement } from "../ui/announcer.js";

const GROUP_NAME = "SupplyDrops";
const MAX_DROPS = 2;

let sceneRef = null;
let cameraRef = null;
let rendererRef = null;
let groupRef = null;

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

let drops = [];
let offeredForWave = 0;
let initialized = false;
let clickHandlerInstalled = false;
let time = 0;

const REWARDS = [
  {
    id: "gold_cache",
    label: "GOLD",
    title: "Gold Cache",
    color: 0xfacc15,
    amount: 55,
    apply: function () {
      state.gold = Number(state.gold || 0) + 55;
      return "+55 Gold";
    }
  },
  {
    id: "repair_kit",
    label: "REPAIR",
    title: "Repair Kit",
    color: 0x22c55e,
    amount: 2,
    apply: function () {
      const maxHp = Number(state.baseMaxHp || 10);
      const currentHp = Number(state.baseHp || 0);

      state.baseMaxHp = maxHp;
      state.baseHp = Math.min(maxHp, currentHp + 2);

      return "+2 Base HP";
    }
  },
  {
    id: "relocation_beacon",
    label: "MOVE",
    title: "Relocation Beacon",
    color: 0x38bdf8,
    amount: 1,
    apply: function () {
      state.relocationTokens = Number(state.relocationTokens || 0) + 1;
      state.relocationMaxTokens = Math.max(
        Number(state.relocationMaxTokens || 0),
        Number(state.relocationTokens || 0)
      );

      return "+1 Relocation";
    }
  },
  {
    id: "score_packet",
    label: "DATA",
    title: "Score Packet",
    color: 0xc084fc,
    amount: 120,
    apply: function () {
      state.score = Number(state.score || 0) + 120;
      return "+120 Score";
    }
  }
];

export function initSupplyDrops(scene, camera, renderer) {
  initialized = true;

  sceneRef = scene;
  cameraRef = camera;
  rendererRef = renderer;

  clearSupplyDrops();

  groupRef = new THREE.Group();
  groupRef.name = GROUP_NAME;
  scene.add(groupRef);

  offeredForWave = Number(state.wave || 1);
  time = 0;

  if (!clickHandlerInstalled) {
    window.addEventListener("click", handleSupplyDropClick, true);
    clickHandlerInstalled = true;
  }
}

export function updateSupplyDrops() {
  if (!initialized) return;
  if (!groupRef) return;

  time += 0.04;

  maybeSpawnDrops();
  updateDropVisuals();

  if (state.waveActive && drops.length > 0) {
    clearActiveDrops(false);
  }
}

export function resetSupplyDrops() {
  offeredForWave = Number(state.wave || 1);
  time = 0;
  clearActiveDrops(false);
}

export function clearSupplyDrops() {
  if (groupRef && sceneRef) {
    sceneRef.remove(groupRef);
  }

  if (groupRef) {
    groupRef.traverse(function (child) {
      disposeChild(child);
    });

    groupRef.clear();
  }

  groupRef = null;
  drops = [];
}

function maybeSpawnDrops() {
  if (!state.started) return;
  if (state.gameOver) return;
  if (state.paused) return;
  if (state.waveActive) return;
  if (!state.waitingForNextWave) return;

  const wave = Number(state.wave || 1);

  if (wave <= 1) return;
  if (offeredForWave === wave) return;

  offeredForWave = wave;

  const dropCount = wave % 5 === 0 ? 2 : 1;

  for (let i = 0; i < dropCount; i++) {
    spawnSupplyDrop(wave, i);
  }
}

function spawnSupplyDrop(wave, index) {
  if (!groupRef) return;

  while (drops.length >= MAX_DROPS) {
    const oldDrop = drops.shift();

    if (oldDrop) {
      removeDrop(oldDrop);
    }
  }

  const reward = chooseReward(wave, index);
  const position = chooseDropPosition();

  const visual = createDropVisual(reward);
  visual.position.set(position.x, 0.08, position.z);

  groupRef.add(visual);

  const drop = {
    id: "drop_" + wave + "_" + index + "_" + Date.now(),
    wave: wave,
    reward: reward,
    group: visual,
    baseY: 0.08,
    phase: Math.random() * Math.PI * 2,
    age: 0,
    collected: false
  };

  visual.userData.supplyDrop = drop;

  visual.traverse(function (child) {
    child.userData.supplyDrop = drop;
  });

  drops.push(drop);

  addEventLog("Supply drop landed: " + reward.title + ".");
  showAnnouncement("Supply Drop Incoming");
}

function chooseReward(wave, index) {
  if (Number(state.baseHp || 0) <= 4 && index === 0) {
    return REWARDS[1];
  }

  if (wave % 5 === 0 && index === 1) {
    return REWARDS[2];
  }

  const randomIndex = Math.floor(Math.random() * REWARDS.length);
  return REWARDS[randomIndex];
}

function chooseDropPosition() {
  const pathPoints = getPathPoints();

  for (let attempt = 0; attempt < 18; attempt++) {
    let candidate;

    if (pathPoints.length >= 2) {
      candidate = getPositionNearPath(pathPoints);
    } else {
      candidate = getFallbackPosition();
    }

    if (isGoodDropPosition(candidate)) {
      return candidate;
    }
  }

  return getFallbackPosition();
}

function getPositionNearPath(points) {
  const segmentIndex = Math.floor(Math.random() * (points.length - 1));
  const start = points[segmentIndex];
  const end = points[segmentIndex + 1];

  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.sqrt(dx * dx + dz * dz) || 1;

  const nx = -dz / length;
  const nz = dx / length;

  const t = randomRange(0.2, 0.8);
  const side = Math.random() > 0.5 ? 1 : -1;
  const offset = randomRange(0.85, 1.35) * side;

  return {
    x: start.x + dx * t + nx * offset,
    z: start.z + dz * t + nz * offset
  };
}

function getFallbackPosition() {
  return {
    x: randomRange(-4.5, 5.5),
    z: randomRange(-3.5, 4.5)
  };
}

function isGoodDropPosition(position) {
  if (!position) return false;

  if (Array.isArray(state.towers)) {
    for (const tower of state.towers) {
      if (!tower || !tower.position) continue;

      const dx = tower.position.x - position.x;
      const dz = tower.position.z - position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 0.9) {
        return false;
      }
    }
  }

  for (const drop of drops) {
    if (!drop || !drop.group) continue;

    const dx = drop.group.position.x - position.x;
    const dz = drop.group.position.z - position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 1.2) {
      return false;
    }
  }

  return true;
}

function createDropVisual(reward) {
  const root = new THREE.Group();
  root.name = "SupplyDrop";

  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(0.33, 0.42, 44),
    createAdditiveMaterial(reward.color, 0.38)
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = 0.025;
  baseRing.name = "SupplyDropRing";

  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.32, 0.42),
    new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.42,
      metalness: 0.25,
      emissive: new THREE.Color(reward.color),
      emissiveIntensity: 0.08
    })
  );
  crate.position.y = 0.26;
  crate.rotation.y = Math.PI / 4;
  crate.name = "SupplyDropCrate";

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.08, 0.5),
    new THREE.MeshStandardMaterial({
      color: reward.color,
      roughness: 0.3,
      metalness: 0.35,
      emissive: new THREE.Color(reward.color),
      emissiveIntensity: 0.18
    })
  );
  cap.position.y = 0.47;
  cap.rotation.y = Math.PI / 4;
  cap.name = "SupplyDropCap";

  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.16, 0.62, 18, 1, true),
    createAdditiveMaterial(reward.color, 0.16)
  );
  beacon.position.y = 0.62;
  beacon.name = "SupplyDropBeacon";

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 14, 14),
    createAdditiveMaterial(reward.color, 0.55)
  );
  glow.position.y = 0.82;
  glow.name = "SupplyDropGlow";

  const label = createLabelSprite(reward.label, reward.color);
  label.position.y = 1.08;
  label.name = "SupplyDropLabel";

  root.add(baseRing);
  root.add(crate);
  root.add(cap);
  root.add(beacon);
  root.add(glow);
  root.add(label);

  root.userData.parts = {
    baseRing: baseRing,
    crate: crate,
    cap: cap,
    beacon: beacon,
    glow: glow,
    label: label
  };

  return root;
}

function createLabelSprite(text, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;

  const context = canvas.getContext("2d");
  const colorStyle = "#" + color.toString(16).padStart(6, "0");

  context.clearRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(2, 6, 23, 0.86)";
  roundRect(context, 18, 22, 220, 48, 14);
  context.fill();

  context.strokeStyle = colorStyle;
  context.lineWidth = 3;
  roundRect(context, 18, 22, 220, 48, 14);
  context.stroke();

  context.font = "bold 28px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = colorStyle;
  context.fillText(text, 128, 47);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.92,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.9, 0.34, 1);

  return sprite;
}

function updateDropVisuals() {
  for (let i = drops.length - 1; i >= 0; i--) {
    const drop = drops[i];

    if (!drop || !drop.group) {
      drops.splice(i, 1);
      continue;
    }

    drop.age += 1;

    const pulse = 0.5 + Math.sin(time * 3 + drop.phase) * 0.5;
    const parts = drop.group.userData.parts || {};

    drop.group.position.y = drop.baseY + pulse * 0.045;
    drop.group.rotation.y += 0.004;

    if (parts.baseRing) {
      parts.baseRing.rotation.z += 0.018;
      parts.baseRing.scale.setScalar(1 + pulse * 0.16);

      if (parts.baseRing.material) {
        parts.baseRing.material.opacity = 0.22 + pulse * 0.18;
      }
    }

    if (parts.glow) {
      parts.glow.scale.setScalar(0.85 + pulse * 0.32);

      if (parts.glow.material) {
        parts.glow.material.opacity = 0.34 + pulse * 0.32;
      }
    }

    if (parts.beacon && parts.beacon.material) {
      parts.beacon.material.opacity = 0.08 + pulse * 0.12;
    }

    if (parts.label && cameraRef) {
      parts.label.lookAt(cameraRef.position);
    }
  }
}

function handleSupplyDropClick(event) {
  if (!initialized) return;
  if (!groupRef) return;
  if (!cameraRef) return;
  if (!rendererRef) return;
  if (drops.length === 0) return;

  if (isUIElement(event.target)) return;

  const canvas = rendererRef.domElement;
  const rect = canvas.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, cameraRef);

  const intersects = raycaster.intersectObjects(groupRef.children, true);

  if (intersects.length === 0) return;

  const drop = findDropFromObject(intersects[0].object);

  if (!drop) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  collectDrop(drop);
}

function findDropFromObject(object) {
  let current = object;

  while (current) {
    if (current.userData && current.userData.supplyDrop) {
      return current.userData.supplyDrop;
    }

    current = current.parent;
  }

  return null;
}

function collectDrop(drop) {
  if (!drop || drop.collected) return;

  drop.collected = true;

  const result = drop.reward.apply();

  addEventLog("Supply drop collected: " + drop.reward.title + " " + result + ".");
  showAnnouncement("Supply Collected: " + result);

  removeDrop(drop);

  const index = drops.indexOf(drop);

  if (index !== -1) {
    drops.splice(index, 1);
  }
}

function clearActiveDrops(silent) {
  while (drops.length > 0) {
    const drop = drops.pop();

    if (drop) {
      removeDrop(drop);
    }
  }

  if (!silent) {
    return;
  }
}

function removeDrop(drop) {
  if (!drop || !drop.group) return;

  if (groupRef) {
    groupRef.remove(drop.group);
  }

  disposeObject(drop.group);
}

function getPathPoints() {
  const rawPath = Array.isArray(state.currentPath) ? state.currentPath : [];
  const points = [];

  for (const rawPoint of rawPath) {
    const point = normalizePoint(rawPoint);

    if (point) {
      points.push(point);
    }
  }

  return points;
}

function normalizePoint(point) {
  if (!point) return null;

  if (Array.isArray(point) && point.length >= 2) {
    return {
      x: Number(point[0]),
      z: Number(point[1])
    };
  }

  if (typeof point.x === "number" && typeof point.z === "number") {
    return {
      x: point.x,
      z: point.z
    };
  }

  if (typeof point.x === "number" && typeof point.y === "number") {
    return {
      x: point.x,
      z: point.y
    };
  }

  return null;
}

function isUIElement(target) {
  if (!target || !target.closest) return false;

  return Boolean(
    target.closest(
      "#hud, #help, #selectedInfo, #actionPanel, #overlay, #missionBriefing, #minimap, #settingsButton, #quickPanelButtons, #settingsPanel, #buildPanel, #bossHud, #wavePreview, #eventLog, #aiFeedback, #achievementPanel, #stageIntelPanel, #controlStatusPanel, #storyPanel, #storyCommsPanel, #storyObjectiveStrip, #storyArchivePanel, #missionObjectivesPanel, #campaignProgressPanel, #battlefieldEventToast, #commanderRankToast, #waveReportPanel, #smartCoachToast, #tacticalUpgradeCardsPanel, #optionalContractsPanel"
    )
  );
}

function createAdditiveMaterial(color, opacity) {
  return new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
}

function disposeObject(object) {
  if (!object) return;

  if (typeof object.traverse === "function") {
    object.traverse(function (child) {
      disposeChild(child);
    });
  } else {
    disposeChild(object);
  }
}

function disposeChild(child) {
  if (!child) return;

  if (child.geometry) {
    child.geometry.dispose();
  }

  if (child.material) {
    disposeMaterial(child.material);
  }
}

function disposeMaterial(material) {
  if (Array.isArray(material)) {
    for (const item of material) {
      disposeMaterial(item);
    }

    return;
  }

  if (!material) return;

  if (material.map) {
    material.map.dispose();
  }

  material.dispose();
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}