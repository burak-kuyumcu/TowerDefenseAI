import * as THREE from "three";

const DEFAULT_FOCUS_ANGLE = 0;
const DEFAULT_FOCUS_ARC = Math.PI / 2.35;

export function ensureDirectionalFocus(tower) {
  if (!tower?.userData) return;

  if (typeof tower.userData.focusAngle !== "number") {
    tower.userData.focusAngle = DEFAULT_FOCUS_ANGLE;
  }

  if (typeof tower.userData.focusArc !== "number") {
    tower.userData.focusArc = DEFAULT_FOCUS_ARC;
  }
}

export function rotateTowerFocus(tower, amount) {
  if (!tower) return;

  ensureDirectionalFocus(tower);

  tower.userData.focusAngle = normalizeAngle(
    tower.userData.focusAngle + amount
  );

  tower.userData.focusWasManuallyRotated = true;
}

export function getTowerFocusAngle(tower) {
  ensureDirectionalFocus(tower);
  return tower?.userData?.focusAngle ?? DEFAULT_FOCUS_ANGLE;
}

export function getTowerFocusArc(tower) {
  ensureDirectionalFocus(tower);
  return tower?.userData?.focusArc ?? DEFAULT_FOCUS_ARC;
}

export function getFocusForwardVector(tower) {
  const angle = getTowerFocusAngle(tower);

  return new THREE.Vector3(
    Math.sin(angle),
    0,
    Math.cos(angle)
  ).normalize();
}

export function isEnemyInDirectionalFocus(tower, enemy) {
  if (!tower || !enemy) return false;

  ensureDirectionalFocus(tower);

  const dx = enemy.position.x - tower.position.x;
  const dz = enemy.position.z - tower.position.z;

  if (dx === 0 && dz === 0) return true;

  const enemyAngle = Math.atan2(dx, dz);
  const focusAngle = getTowerFocusAngle(tower);
  const focusArc = getTowerFocusArc(tower);

  const diff = Math.abs(normalizeAngle(enemyAngle - focusAngle));

  return diff <= focusArc / 2;
}

export function getDirectionalFocusBonus(tower, enemy = null) {
  const type = tower?.userData?.type ?? "normal";
  const active = enemy ? isEnemyInDirectionalFocus(tower, enemy) : true;

  const noBonus = {
    active: false,
    damageMultiplier: 1,
    fireRateMultiplier: 1,
    critBonus: 0,
    slowDurationMultiplier: 1,
    splashRadiusMultiplier: 1,
    label: "No Focus Bonus"
  };

  if (!active) return noBonus;

  if (type === "rapid") {
    return {
      active: true,
      damageMultiplier: 1,
      fireRateMultiplier: 0.72,
      critBonus: 0,
      slowDurationMultiplier: 1,
      splashRadiusMultiplier: 1,
      label: "Rapid Focus: +28% Fire Rate"
    };
  }

  if (type === "sniper") {
    return {
      active: true,
      damageMultiplier: 1.12,
      fireRateMultiplier: 1,
      critBonus: 0.2,
      slowDurationMultiplier: 1,
      splashRadiusMultiplier: 1,
      label: "Sniper Focus: +20% Crit, +12% Damage"
    };
  }

  if (type === "slow") {
    return {
      active: true,
      damageMultiplier: 1,
      fireRateMultiplier: 1,
      critBonus: 0,
      slowDurationMultiplier: 1.35,
      splashRadiusMultiplier: 1,
      label: "Cryo Focus: +35% Slow Duration"
    };
  }

  if (type === "splash") {
    return {
      active: true,
      damageMultiplier: 1,
      fireRateMultiplier: 1,
      critBonus: 0,
      slowDurationMultiplier: 1,
      splashRadiusMultiplier: 1.25,
      label: "Artillery Focus: +25% Splash Radius"
    };
  }

  return {
    active: true,
    damageMultiplier: 1.22,
    fireRateMultiplier: 1,
    critBonus: 0,
    slowDurationMultiplier: 1,
    splashRadiusMultiplier: 1,
    label: "Cannon Focus: +22% Damage"
  };
}

export function getDirectionalFocusText(tower) {
  if (!tower) return "-";

  const bonus = getDirectionalFocusBonus(tower, null);
  const angle = Math.round(THREE.MathUtils.radToDeg(getTowerFocusAngle(tower)));
  const arc = Math.round(THREE.MathUtils.radToDeg(getTowerFocusArc(tower)));

  return `${bonus.label}<br>Facing: ${angle}° / Arc: ${arc}°`;
}

export function getDirectionalFocusShortText(tower) {
  if (!tower) return "-";

  return getDirectionalFocusBonus(tower, null).label;
}

export function normalizeAngle(angle) {
  let normalized = angle;

  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;

  return normalized;
}