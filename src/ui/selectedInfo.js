import { state } from "../game/state.js";
import { getControlModeLabel } from "../systems/controls.js";

export function updateSelectedInfo() {
  const content = document.querySelector("#selectedInfoContent");
  if (!content) return;

  const selected = state.selectedObject;

  if (!selected) {
    content.innerHTML = `
      <div class="selected-empty">None</div>
      <div class="selected-hint">
        Left click a tower or enemy to select it.
      </div>
      <div class="selected-hint">
        F3 cycles Camera / Object / Spotlight / Directional modes.
      </div>
    `;
    return;
  }

  const type = getSelectedType(selected);
  const displayName = getSelectedName(selected);
  const positionText = formatVector(selected.position);
  const rotationText = formatRotation(selected.rotation);
  const isObjectMode = state.controlMode === "object";

  content.innerHTML = `
    <div class="selected-title">${displayName}</div>

    <div class="selected-row">
      <span>Type</span>
      <b>${type}</b>
    </div>

    <div class="selected-row">
      <span>Control</span>
      <b>${getControlModeLabel()}</b>
    </div>

    <div class="selected-row">
      <span>Position</span>
      <b>${positionText}</b>
    </div>

    <div class="selected-row">
      <span>Rotation</span>
      <b>${rotationText}</b>
    </div>

    ${getTowerInfo(selected)}
    ${getEnemyInfo(selected)}

    <div class="${isObjectMode ? "selected-mode-active" : "selected-mode-passive"}">
      ${getObjectModeText(isObjectMode)}
    </div>
  `;
}

function getSelectedType(object) {
  if (state.towers.includes(object)) return "Tower";
  if (state.enemies.includes(object)) return "Enemy";
  if (object.userData?.type) return object.userData.type;

  return "Object";
}

function getSelectedName(object) {
  if (state.towers.includes(object)) {
    return `${formatTowerType(object.userData.type)} Tower`;
  }

  if (state.enemies.includes(object)) {
    return object.userData.isBoss
      ? `${formatEnemyType(object.userData.type)} Boss`
      : `${formatEnemyType(object.userData.type)} Enemy`;
  }

  return object.userData?.name ?? "Selected Object";
}

function getTowerInfo(object) {
  if (!state.towers.includes(object)) return "";

  const level = object.userData.level ?? 1;
  const damage = object.userData.damage ?? "-";
  const range = object.userData.range ?? "-";
  const targetMode = object.userData.targetMode ?? "first";
  const ultimateCharge = Math.floor(object.userData.ultimateCharge ?? 0);

  return `
    <div class="selected-row">
      <span>Level</span>
      <b>${level}</b>
    </div>

    <div class="selected-row">
      <span>Damage</span>
      <b>${damage}</b>
    </div>

    <div class="selected-row">
      <span>Range</span>
      <b>${Number(range).toFixed ? Number(range).toFixed(1) : range}</b>
    </div>

    <div class="selected-row">
      <span>Target</span>
      <b>${formatTargetMode(targetMode)}</b>
    </div>

    <div class="selected-row">
      <span>Ultimate</span>
      <b>${ultimateCharge}%</b>
    </div>
  `;
}

function getEnemyInfo(object) {
  if (!state.enemies.includes(object)) return "";

  const hp = Math.ceil(object.userData.hp ?? 0);
  const maxHp = Math.ceil(object.userData.maxHp ?? hp);
  const speed = object.userData.speed ?? "-";

  return `
    <div class="selected-row">
      <span>HP</span>
      <b>${hp} / ${maxHp}</b>
    </div>

    <div class="selected-row">
      <span>Speed</span>
      <b>${Number(speed).toFixed ? Number(speed).toFixed(2) : speed}</b>
    </div>
  `;
}

function getObjectModeText(isObjectMode) {
  if (isObjectMode) {
    return `
      Object 6DOF active<br>
      W/A/S/D: Move X/Z<br>
      Q/E: Move Y<br>
      Arrows: Pitch/Yaw<br>
      PageUp/PageDown: Roll
    `;
  }

  return `
    Press F3 until Object 6DOF mode to freely translate and rotate this object.
  `;
}

function formatVector(vector) {
  if (!vector) return "-";

  return `X ${vector.x.toFixed(2)}, Y ${vector.y.toFixed(2)}, Z ${vector.z.toFixed(2)}`;
}

function formatRotation(rotation) {
  if (!rotation) return "-";

  const x = THREE_RAD_TO_DEG(rotation.x);
  const y = THREE_RAD_TO_DEG(rotation.y);
  const z = THREE_RAD_TO_DEG(rotation.z);

  return `X ${x}°, Y ${y}°, Z ${z}°`;
}

function THREE_RAD_TO_DEG(value) {
  return Math.round((value * 180) / Math.PI);
}

function formatTowerType(type) {
  if (type === "rapid") return "Rapid";
  if (type === "sniper") return "Sniper";
  if (type === "slow") return "Slow";
  if (type === "splash") return "Splash";

  return "Normal";
}

function formatEnemyType(type) {
  if (type === "fast") return "Fast";
  if (type === "tank") return "Tank";
  if (type === "armored") return "Armored";
  if (type === "swarm") return "Swarm";
  if (type === "boss") return "Boss";

  return "Basic";
}

function formatTargetMode(mode) {
  if (mode === "first") return "First";
  if (mode === "last") return "Last";
  if (mode === "strongest") return "Strongest";
  if (mode === "weakest") return "Weakest";

  return mode;
}