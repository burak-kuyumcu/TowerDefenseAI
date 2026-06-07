import * as THREE from "three";
import { state } from "../game/state.js";
import { chooseEnemyType, getEnemyConfig } from "../ai/aiDirector.js";
import { createGameMaterial } from "../visuals/materials.js";
import { createHealthBar, removeHealthBar } from "../visuals/healthBars.js";
import { damageBase } from "../systems/base.js";
import {
  spawnEliteAura,
  spawnBossAura,
  spawnFootstepDust,
  spawnPortalSpawnEffect,
  spawnProjectileTrailEffect
} from "../visuals/effects.js";
import { showAnnouncement } from "../ui/announcer.js";
import { addEventLog } from "../ui/eventLog.js";
import {
  getCurrentStage,
  getCurrentStageEffect,
  getCurrentStageEnemySpeedMultiplier,
  getCurrentStageEnemyHealthMultiplier,
  getCurrentStageGoldMultiplier,
  getCurrentStageSlowBonus
} from "../game/stages.js";
import { addCameraShake } from "../systems/cameraShake.js";

export function spawnEnemy(scene) {
  const enemyType = chooseEnemyType();
  const stage = getCurrentStage();
  const stageEffect = getCurrentStageEffect();

  const config = {
    ...getEnemyConfig(enemyType)
  };

  const speedMultiplier = getCurrentStageEnemySpeedMultiplier();
  const healthMultiplier = getCurrentStageEnemyHealthMultiplier();
  const goldMultiplier = getCurrentStageGoldMultiplier();
  const slowBonus = getCurrentStageSlowBonus();

  config.speed *= speedMultiplier;

  config.health = Math.max(
    1,
    Math.floor(config.health * healthMultiplier)
  );

  config.gold = Math.max(
    1,
    Math.floor((config.gold ?? 5) * goldMultiplier)
  );

  const enemy = createEnemyModel(config);
  const startPoint = state.currentPath[0];

  enemy.position.set(startPoint.x, startPoint.y, startPoint.z);
  enemy.scale.setScalar(config.scale ?? 1);

  const isBoss = config.type.startsWith("boss");

  enemy.userData = {
    ...enemy.userData,

    type: config.type,
    index: 0,
    speed: config.speed,
    baseSpeed: config.speed,
    speedMultiplier: 1,

    health: config.health,
    maxHealth: config.health,

    stageId: stage.id,
    stageName: stage.name,
    stageEffectId: stageEffect.id,
    stageEffectLabel: stageEffect.label,
    stageSlowBonus: slowBonus,

    score: config.score,
    gold: config.gold,
    baseDamage: config.baseDamage,

    reachedGoal: false,
    dead: false,
    selectable: true,
    baseColor: config.color,

    modelScale: config.scale ?? 1,
    healthBarOffset: isBoss ? 1.7 : 0.9,

    slowTimer: 0,
    slowMultiplier: 1,
    freezeFlashTimer: 0,

    armor: 0,
    shieldArmor: false,

    pulseCooldown: config.type === "boss_purple" ? 120 : 0,
    pulseInterval: config.type === "boss_purple" ? 180 : 0,

    speedBoostTimer: 0,
    disruptTimer: 150,
    auraEffect: null,
    bossAuraEffect: null,

    walkPhase: Math.random() * Math.PI * 2,
    stepTimer: Math.floor(Math.random() * 20),
    trailTimer: Math.floor(Math.random() * 10),
    specialAnimTimer: Math.floor(Math.random() * 60),

    previousX: startPoint.x,
    previousZ: startPoint.z
  };

  scene.add(enemy);

  spawnPortalSpawnEffect(
    scene,
    enemy.position,
    isBoss ? getBossAuraColor(config.type) : 0xfb923c
  );

  const healthBar = createHealthBar(enemy);
  scene.add(healthBar);

  if (config.type === "elite") {
    spawnEliteAura(scene, enemy);
    showAnnouncement("⚠ ELITE ENEMY APPROACHING!");
    addEventLog("Elite enemy spawned.");
  }

  if (config.type.startsWith("boss")) {
    const bossName = formatBossType(config.type);

    spawnBossAura(scene, enemy, getBossAuraColor(config.type));
    showAnnouncement(`⚠ BOSS DEPLOYED: ${bossName}`);
    addEventLog(`${bossName} spawned.`);

    addCameraShake(0.28, 32);
  }

  state.enemies.push(enemy);
}

function createEnemyModel(config) {
  if (config.type === "fast") return createFastEnemy(config);
  if (config.type === "tank") return createTankEnemy(config);
  if (config.type === "elite") return createEliteEnemy(config);

  if (config.type === "boss_purple") return createPurpleBoss(config);
  if (config.type === "boss_crusher") return createCrusherBoss(config);
  if (config.type === "boss_runner") return createRunnerBoss(config);
  if (config.type === "boss_shield") return createShieldBoss(config);
  if (config.type === "boss_splitter") return createSplitterBoss(config);
  if (config.type === "boss_disruptor") return createDisruptorBoss(config);

  return createNormalEnemy(config);
}

function createNormalEnemy(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.BoxGeometry(0.52, 0.46, 0.48), config.color);
  body.position.y = 0.34;

  const belly = mesh(new THREE.BoxGeometry(0.34, 0.24, 0.12), 0x991b1b);
  belly.position.set(0, 0.34, 0.27);

  const head = mesh(new THREE.BoxGeometry(0.38, 0.32, 0.34), 0xef4444);
  head.position.y = 0.72;
  head.position.z = 0.04;

  const jaw = mesh(new THREE.BoxGeometry(0.26, 0.08, 0.12), 0x7f1d1d);
  jaw.position.set(0, 0.58, 0.23);

  const eyeLeft = mesh(new THREE.SphereGeometry(0.045, 8, 8), 0xffffff, true);
  eyeLeft.position.set(-0.11, 0.74, 0.22);

  const eyeRight = mesh(new THREE.SphereGeometry(0.045, 8, 8), 0xffffff, true);
  eyeRight.position.set(0.11, 0.74, 0.22);

  const browLeft = mesh(new THREE.BoxGeometry(0.14, 0.035, 0.045), 0x450a0a);
  browLeft.position.set(-0.11, 0.82, 0.23);
  browLeft.rotation.z = 0.22;

  const browRight = mesh(new THREE.BoxGeometry(0.14, 0.035, 0.045), 0x450a0a);
  browRight.position.set(0.11, 0.82, 0.23);
  browRight.rotation.z = -0.22;

  const hornLeft = mesh(new THREE.ConeGeometry(0.045, 0.18, 6), 0xfca5a5, true);
  hornLeft.position.set(-0.18, 0.93, 0.02);
  hornLeft.rotation.z = Math.PI;

  const hornRight = mesh(new THREE.ConeGeometry(0.045, 0.18, 6), 0xfca5a5, true);
  hornRight.position.set(0.18, 0.93, 0.02);
  hornRight.rotation.z = Math.PI;

  const footLeft = mesh(new THREE.BoxGeometry(0.18, 0.08, 0.26), 0x7f1d1d);
  footLeft.position.set(-0.17, 0.06, 0.08);

  const footRight = mesh(new THREE.BoxGeometry(0.18, 0.08, 0.26), 0x7f1d1d);
  footRight.position.set(0.17, 0.06, 0.08);

  const armLeft = mesh(new THREE.BoxGeometry(0.09, 0.25, 0.1), 0x991b1b);
  armLeft.position.set(-0.36, 0.34, 0.02);
  armLeft.rotation.z = 0.25;

  const armRight = mesh(new THREE.BoxGeometry(0.09, 0.25, 0.1), 0x991b1b);
  armRight.position.set(0.36, 0.34, 0.02);
  armRight.rotation.z = -0.25;

  group.add(
    body,
    belly,
    head,
    jaw,
    eyeLeft,
    eyeRight,
    browLeft,
    browRight,
    hornLeft,
    hornRight,
    footLeft,
    footRight,
    armLeft,
    armRight
  );

  group.userData.core = head;
  group.userData.body = body;
  group.userData.head = head;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;
  group.userData.leftArm = armLeft;
  group.userData.rightArm = armRight;

  markBaseTransform(body);
  markBaseTransform(head);
  markBaseTransform(jaw);
  markBaseTransform(footLeft);
  markBaseTransform(footRight);
  markBaseTransform(armLeft);
  markBaseTransform(armRight);

  return group;
}

function createFastEnemy(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.CapsuleGeometry(0.22, 0.45, 6, 12), config.color, true);
  body.position.y = 0.48;
  body.scale.z = 1.4;
  body.rotation.x = Math.PI / 2;

  const nose = mesh(new THREE.ConeGeometry(0.18, 0.34, 14), 0xfacc15, true);
  nose.position.set(0, 0.48, 0.48);
  nose.rotation.x = Math.PI / 2;

  const core = mesh(new THREE.SphereGeometry(0.15, 14, 14), 0xffedd5, true);
  core.position.set(0, 0.52, 0.12);

  const engine = mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.22, 14), 0x7c2d12);
  engine.position.set(0, 0.48, -0.48);
  engine.rotation.x = Math.PI / 2;

  const flame = mesh(new THREE.ConeGeometry(0.14, 0.42, 12), 0xfb923c, true);
  flame.position.set(0, 0.48, -0.72);
  flame.rotation.x = -Math.PI / 2;

  const wingLeft = mesh(new THREE.BoxGeometry(0.08, 0.16, 0.5), 0xffedd5);
  wingLeft.position.set(-0.28, 0.5, -0.05);
  wingLeft.rotation.z = 0.18;

  const wingRight = mesh(new THREE.BoxGeometry(0.08, 0.16, 0.5), 0xffedd5);
  wingRight.position.set(0.28, 0.5, -0.05);
  wingRight.rotation.z = -0.18;

  const footLeft = mesh(new THREE.BoxGeometry(0.12, 0.06, 0.24), 0x7c2d12);
  footLeft.position.set(-0.15, 0.05, 0.08);

  const footRight = mesh(new THREE.BoxGeometry(0.12, 0.06, 0.24), 0x7c2d12);
  footRight.position.set(0.15, 0.05, 0.08);

  const antennaLeft = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), 0xfef3c7, true);
  antennaLeft.position.set(-0.1, 0.72, 0.24);
  antennaLeft.rotation.z = -0.35;

  const antennaRight = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), 0xfef3c7, true);
  antennaRight.position.set(0.1, 0.72, 0.24);
  antennaRight.rotation.z = 0.35;

  group.add(
    body,
    nose,
    core,
    engine,
    flame,
    wingLeft,
    wingRight,
    footLeft,
    footRight,
    antennaLeft,
    antennaRight
  );

  group.userData.core = core;
  group.userData.body = body;
  group.userData.engine = engine;
  group.userData.flame = flame;
  group.userData.leftWing = wingLeft;
  group.userData.rightWing = wingRight;
  group.userData.extraSpin = flame;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markBaseTransform(body);
  markBaseTransform(core);
  markBaseTransform(engine);
  markBaseTransform(flame);
  markBaseTransform(wingLeft);
  markBaseTransform(wingRight);
  markBaseTransform(footLeft);
  markBaseTransform(footRight);

  return group;
}

function createTankEnemy(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.BoxGeometry(0.9, 0.5, 0.78), config.color);
  body.position.y = 0.42;

  const shell = mesh(new THREE.BoxGeometry(1.0, 0.24, 0.86), 0x450a0a);
  shell.position.y = 0.76;

  const turret = mesh(new THREE.BoxGeometry(0.46, 0.24, 0.42), 0x991b1b);
  turret.position.y = 1.0;

  const cannon = mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.56, 10), 0x111827);
  cannon.rotation.x = Math.PI / 2;
  cannon.position.set(0, 1.0, 0.45);

  const frontPlate = mesh(new THREE.BoxGeometry(0.72, 0.35, 0.08), 0x991b1b);
  frontPlate.position.set(0, 0.43, 0.43);

  const core = mesh(new THREE.BoxGeometry(0.22, 0.22, 0.08), 0xfca5a5, true);
  core.position.set(0, 0.46, 0.49);

  const treadLeft = createTankTread(-0.55);
  const treadRight = createTankTread(0.55);

  const rearExhaustLeft = mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.32, 8), 0x111827);
  rearExhaustLeft.position.set(-0.23, 0.64, -0.5);
  rearExhaustLeft.rotation.x = Math.PI / 2;

  const rearExhaustRight = mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.32, 8), 0x111827);
  rearExhaustRight.position.set(0.23, 0.64, -0.5);
  rearExhaustRight.rotation.x = Math.PI / 2;

  group.add(
    body,
    shell,
    turret,
    cannon,
    frontPlate,
    core,
    treadLeft,
    treadRight,
    rearExhaustLeft,
    rearExhaustRight
  );

  group.userData.core = core;
  group.userData.body = body;
  group.userData.head = turret;
  group.userData.extraSpin = core;
  group.userData.leftFoot = treadLeft;
  group.userData.rightFoot = treadRight;
  group.userData.leftTread = treadLeft;
  group.userData.rightTread = treadRight;

  markBaseTransform(body);
  markBaseTransform(shell);
  markBaseTransform(turret);
  markBaseTransform(cannon);
  markBaseTransform(frontPlate);
  markBaseTransform(core);
  markBaseTransform(treadLeft);
  markBaseTransform(treadRight);
  markBaseTransform(rearExhaustLeft);
  markBaseTransform(rearExhaustRight);

  return group;
}
function createEliteEnemy(config) {
  const group = new THREE.Group();

  const robe = mesh(
    new THREE.CylinderGeometry(0.34, 0.48, 0.72, 6),
    config.color,
    true
  );
  robe.position.y = 0.44;

  const chest = mesh(new THREE.BoxGeometry(0.46, 0.34, 0.22), 0xbe185d, true);
  chest.position.set(0, 0.58, 0.22);

  const head = mesh(new THREE.OctahedronGeometry(0.26), 0xf9a8d4, true);
  head.position.y = 0.98;

  const core = mesh(new THREE.OctahedronGeometry(0.17), 0xf472b6, true);
  core.position.set(0, 0.58, 0.36);

  const shoulderLeft = mesh(new THREE.ConeGeometry(0.15, 0.3, 6), 0xf9a8d4, true);
  shoulderLeft.position.set(-0.36, 0.72, 0);
  shoulderLeft.rotation.z = Math.PI / 2;

  const shoulderRight = mesh(new THREE.ConeGeometry(0.15, 0.3, 6), 0xf9a8d4, true);
  shoulderRight.position.set(0.36, 0.72, 0);
  shoulderRight.rotation.z = -Math.PI / 2;

  const staff = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8), 0xf9a8d4, true);
  staff.position.set(0.48, 0.72, 0.02);

  const staffOrb = mesh(new THREE.SphereGeometry(0.09, 12, 12), 0xfbcfe8, true);
  staffOrb.position.set(0.48, 1.22, 0.02);

  const backShard1 = mesh(new THREE.ConeGeometry(0.07, 0.42, 6), 0xf9a8d4, true);
  backShard1.position.set(-0.16, 0.92, -0.24);
  backShard1.rotation.z = Math.PI;

  const backShard2 = mesh(new THREE.ConeGeometry(0.07, 0.42, 6), 0xf9a8d4, true);
  backShard2.position.set(0.16, 0.92, -0.24);
  backShard2.rotation.z = Math.PI;

  const footLeft = mesh(new THREE.BoxGeometry(0.15, 0.07, 0.26), 0x831843);
  footLeft.position.set(-0.2, 0.06, 0.04);

  const footRight = mesh(new THREE.BoxGeometry(0.15, 0.07, 0.26), 0x831843);
  footRight.position.set(0.2, 0.06, 0.04);

  group.add(
    robe,
    chest,
    head,
    core,
    shoulderLeft,
    shoulderRight,
    staff,
    staffOrb,
    backShard1,
    backShard2,
    footLeft,
    footRight
  );

  group.userData.core = core;
  group.userData.body = robe;
  group.userData.head = head;
  group.userData.secondarySpin = staffOrb;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;
  group.userData.leftArm = shoulderLeft;
  group.userData.rightArm = shoulderRight;
  group.userData.floatingParts = [backShard1, backShard2, staffOrb];

  markBaseTransform(robe);
  markBaseTransform(chest);
  markBaseTransform(head);
  markBaseTransform(core);
  markBaseTransform(shoulderLeft);
  markBaseTransform(shoulderRight);
  markBaseTransform(staff);
  markBaseTransform(staffOrb);
  markBaseTransform(backShard1);
  markBaseTransform(backShard2);
  markBaseTransform(footLeft);
  markBaseTransform(footRight);

  return group;
}

function createPurpleBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.BoxGeometry(0.92, 1.02, 0.82), config.color, true);
  body.position.y = 0.72;

  const chestCore = mesh(new THREE.OctahedronGeometry(0.28), 0xfacc15, true);
  chestCore.position.set(0, 0.72, 0.46);

  const head = mesh(new THREE.BoxGeometry(0.55, 0.36, 0.5), 0x7e22ce, true);
  head.position.y = 1.36;
  head.position.z = 0.02;

  const crownBase = mesh(new THREE.BoxGeometry(0.72, 0.08, 0.22), 0xc084fc, true);
  crownBase.position.y = 1.6;

  const crownShard1 = mesh(new THREE.ConeGeometry(0.07, 0.32, 6), 0xe9d5ff, true);
  crownShard1.position.set(-0.24, 1.78, 0);
  crownShard1.rotation.z = Math.PI;

  const crownShard2 = mesh(new THREE.ConeGeometry(0.09, 0.42, 6), 0xe9d5ff, true);
  crownShard2.position.set(0, 1.84, 0);
  crownShard2.rotation.z = Math.PI;

  const crownShard3 = mesh(new THREE.ConeGeometry(0.07, 0.32, 6), 0xe9d5ff, true);
  crownShard3.position.set(0.24, 1.78, 0);
  crownShard3.rotation.z = Math.PI;

  const shoulderLeft = mesh(new THREE.BoxGeometry(0.3, 0.28, 0.42), 0x4c1d95);
  shoulderLeft.position.set(-0.62, 1.02, 0);

  const shoulderRight = mesh(new THREE.BoxGeometry(0.3, 0.28, 0.42), 0x4c1d95);
  shoulderRight.position.set(0.62, 1.02, 0);

  const handLeft = mesh(new THREE.SphereGeometry(0.16, 12, 12), 0xc084fc, true);
  handLeft.position.set(-0.72, 0.55, 0.2);

  const handRight = mesh(new THREE.SphereGeometry(0.16, 12, 12), 0xc084fc, true);
  handRight.position.set(0.72, 0.55, 0.2);

  const footLeft = mesh(new THREE.BoxGeometry(0.28, 0.1, 0.38), 0x4c1d95);
  footLeft.position.set(-0.28, 0.07, 0.1);

  const footRight = mesh(new THREE.BoxGeometry(0.28, 0.1, 0.38), 0x4c1d95);
  footRight.position.set(0.28, 0.07, 0.1);

  group.add(
    body,
    chestCore,
    head,
    crownBase,
    crownShard1,
    crownShard2,
    crownShard3,
    shoulderLeft,
    shoulderRight,
    handLeft,
    handRight,
    footLeft,
    footRight
  );

  group.userData.core = chestCore;
  group.userData.body = body;
  group.userData.head = head;
  group.userData.leftArm = shoulderLeft;
  group.userData.rightArm = shoulderRight;
  group.userData.leftHand = handLeft;
  group.userData.rightHand = handRight;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;
  group.userData.floatingParts = [crownShard1, crownShard2, crownShard3, handLeft, handRight];

  markAllBaseTransforms(group);

  return group;
}

function createCrusherBoss(config) {
  const group = new THREE.Group();

  const body = mesh(
    new THREE.CylinderGeometry(0.68, 0.84, 1.14, 18),
    config.color
  );
  body.position.y = 0.76;

  const bellyPlate = mesh(new THREE.BoxGeometry(0.76, 0.46, 0.12), 0x450a0a);
  bellyPlate.position.set(0, 0.72, 0.58);

  const head = mesh(new THREE.BoxGeometry(0.62, 0.36, 0.52), 0x991b1b);
  head.position.set(0, 1.42, 0.08);

  const jaw = mesh(new THREE.BoxGeometry(0.5, 0.12, 0.16), 0x450a0a);
  jaw.position.set(0, 1.22, 0.34);

  const shoulderLeft = mesh(new THREE.BoxGeometry(0.38, 0.34, 0.5), 0x450a0a);
  shoulderLeft.position.set(-0.72, 1.04, 0);

  const shoulderRight = mesh(new THREE.BoxGeometry(0.38, 0.34, 0.5), 0x450a0a);
  shoulderRight.position.set(0.72, 1.04, 0);

  const fistLeft = mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), 0x7f1d1d);
  fistLeft.position.set(-0.86, 0.55, 0.26);

  const fistRight = mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), 0x7f1d1d);
  fistRight.position.set(0.86, 0.55, 0.26);

  const armorTop = mesh(
    new THREE.CylinderGeometry(0.72, 0.72, 0.18, 18),
    0x450a0a
  );
  armorTop.position.y = 1.25;

  const spikes = new THREE.Group();
  spikes.position.y = 1.55;

  for (let i = 0; i < 7; i++) {
    const spike = mesh(new THREE.ConeGeometry(0.08, 0.3, 8), 0xfca5a5, true);
    const x = -0.42 + i * 0.14;

    spike.position.set(x, 0, -0.18 - Math.abs(i - 3) * 0.02);
    spike.rotation.z = Math.PI;

    spikes.add(spike);
  }

  const kneeLeft = mesh(new THREE.BoxGeometry(0.22, 0.18, 0.24), 0x991b1b);
  kneeLeft.position.set(-0.35, 0.3, 0.34);

  const kneeRight = mesh(new THREE.BoxGeometry(0.22, 0.18, 0.24), 0x991b1b);
  kneeRight.position.set(0.35, 0.3, 0.34);

  const footLeft = mesh(new THREE.BoxGeometry(0.34, 0.12, 0.48), 0x450a0a);
  footLeft.position.set(-0.34, 0.07, 0.1);

  const footRight = mesh(new THREE.BoxGeometry(0.34, 0.12, 0.48), 0x450a0a);
  footRight.position.set(0.34, 0.07, 0.1);

  group.add(
    body,
    bellyPlate,
    head,
    jaw,
    shoulderLeft,
    shoulderRight,
    fistLeft,
    fistRight,
    armorTop,
    spikes,
    kneeLeft,
    kneeRight,
    footLeft,
    footRight
  );

  group.userData.core = armorTop;
  group.userData.body = body;
  group.userData.head = head;
  group.userData.extraSpin = spikes;
  group.userData.leftArm = shoulderLeft;
  group.userData.rightArm = shoulderRight;
  group.userData.leftHand = fistLeft;
  group.userData.rightHand = fistRight;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markAllBaseTransforms(group);

  return group;
}

function createRunnerBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.CapsuleGeometry(0.36, 0.75, 8, 18), config.color, true);
  body.position.y = 0.82;
  body.scale.z = 1.7;
  body.rotation.x = Math.PI / 2;

  const nose = mesh(new THREE.ConeGeometry(0.32, 0.72, 18), 0xfacc15, true);
  nose.position.set(0, 0.82, 0.78);
  nose.rotation.x = Math.PI / 2;

  const cockpit = mesh(new THREE.SphereGeometry(0.18, 14, 14), 0xffedd5, true);
  cockpit.position.set(0, 1.05, 0.3);

  const engineMain = mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.35, 16), 0x9a3412);
  engineMain.position.set(0, 0.82, -0.82);
  engineMain.rotation.x = Math.PI / 2;

  const engineLeft = mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.36, 12), 0x7c2d12);
  engineLeft.position.set(-0.38, 0.72, -0.6);
  engineLeft.rotation.x = Math.PI / 2;

  const engineRight = mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.36, 12), 0x7c2d12);
  engineRight.position.set(0.38, 0.72, -0.6);
  engineRight.rotation.x = Math.PI / 2;

  const wingLeft = mesh(new THREE.BoxGeometry(0.14, 0.18, 0.75), 0xffedd5);
  wingLeft.position.set(-0.5, 0.8, -0.08);
  wingLeft.rotation.z = 0.2;

  const wingRight = mesh(new THREE.BoxGeometry(0.14, 0.18, 0.75), 0xffedd5);
  wingRight.position.set(0.5, 0.8, -0.08);
  wingRight.rotation.z = -0.2;

  const flame = mesh(new THREE.ConeGeometry(0.25, 0.7, 16), 0xfb923c, true);
  flame.position.set(0, 0.82, -1.12);
  flame.rotation.x = -Math.PI / 2;

  const footLeft = mesh(new THREE.BoxGeometry(0.22, 0.08, 0.34), 0x9a3412);
  footLeft.position.set(-0.28, 0.06, 0.08);

  const footRight = mesh(new THREE.BoxGeometry(0.22, 0.08, 0.34), 0x9a3412);
  footRight.position.set(0.28, 0.06, 0.08);

  group.add(
    body,
    nose,
    cockpit,
    engineMain,
    engineLeft,
    engineRight,
    wingLeft,
    wingRight,
    flame,
    footLeft,
    footRight
  );

  group.userData.core = cockpit;
  group.userData.body = body;
  group.userData.engine = engineMain;
  group.userData.flame = flame;
  group.userData.extraSpin = flame;
  group.userData.leftWing = wingLeft;
  group.userData.rightWing = wingRight;
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markAllBaseTransforms(group);

  return group;
}

function createShieldBoss(config) {
  const group = new THREE.Group();

  const body = mesh(
    new THREE.CylinderGeometry(0.54, 0.68, 1.04, 20),
    config.color,
    true
  );
  body.position.y = 0.72;

  const chestGem = mesh(new THREE.OctahedronGeometry(0.22), 0xbbf7d0, true);
  chestGem.position.set(0, 0.78, 0.46);

  const head = mesh(new THREE.BoxGeometry(0.46, 0.32, 0.42), 0x16a34a, true);
  head.position.set(0, 1.36, 0.04);

  const shieldPanelFront = mesh(new THREE.BoxGeometry(0.9, 0.74, 0.08), 0x86efac, true);
  shieldPanelFront.position.set(0, 0.78, 0.66);
  shieldPanelFront.material.transparent = true;
  shieldPanelFront.material.opacity = 0.55;

  const shieldPanelLeft = mesh(new THREE.BoxGeometry(0.08, 0.56, 0.58), 0xbbf7d0, true);
  shieldPanelLeft.position.set(-0.62, 0.78, 0.12);
  shieldPanelLeft.material.transparent = true;
  shieldPanelLeft.material.opacity = 0.45;

  const shieldPanelRight = mesh(new THREE.BoxGeometry(0.08, 0.56, 0.58), 0xbbf7d0, true);
  shieldPanelRight.position.set(0.62, 0.78, 0.12);
  shieldPanelRight.material.transparent = true;
  shieldPanelRight.material.opacity = 0.45;

    const generatorLeft = mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.34, 12), 0xdcfce7, true);
  generatorLeft.position.set(-0.42, 1.13, -0.24);
  generatorLeft.rotation.x = Math.PI / 2;

  const generatorRight = mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.34, 12), 0xdcfce7, true);
  generatorRight.position.set(0.42, 1.13, -0.24);
  generatorRight.rotation.x = Math.PI / 2;

  const footLeft = mesh(new THREE.BoxGeometry(0.28, 0.1, 0.38), 0x14532d);
  footLeft.position.set(-0.3, 0.06, 0.08);

  const footRight = mesh(new THREE.BoxGeometry(0.28, 0.1, 0.38), 0x14532d);
  footRight.position.set(0.3, 0.06, 0.08);

  group.add(
    body,
    chestGem,
    head,
    shieldPanelFront,
    shieldPanelLeft,
    shieldPanelRight,
    generatorLeft,
    generatorRight,
    footLeft,
    footRight
  );

  group.userData.core = chestGem;
  group.userData.body = body;
  group.userData.head = head;
  group.userData.secondarySpin = chestGem;
  group.userData.shieldPanels = [shieldPanelFront, shieldPanelLeft, shieldPanelRight];
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markAllBaseTransforms(group);

  return group;
}

function createSplitterBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.SphereGeometry(0.58, 18, 18), config.color, true);
  body.position.y = 0.78;
  body.scale.set(1.05, 1, 0.95);

  const shellFront = mesh(new THREE.BoxGeometry(0.42, 0.28, 0.14), 0x713f12);
  shellFront.position.set(0, 0.76, 0.54);

  const pod1 = createSplitterPod(-0.45, 0.9, 0.18, 0xfde047);
  const pod2 = createSplitterPod(0.42, 0.64, -0.12, 0xfacc15);
  const pod3 = createSplitterPod(0.1, 1.24, 0.18, 0xeab308);
  const pod4 = createSplitterPod(-0.16, 0.56, -0.42, 0xfef08a);

  const backSpine = new THREE.Group();
  backSpine.position.set(0, 0.95, -0.42);

  for (let i = 0; i < 4; i++) {
    const spike = mesh(new THREE.ConeGeometry(0.055, 0.24, 6), 0xfef08a, true);
    spike.position.set(-0.24 + i * 0.16, i % 2 === 0 ? 0.08 : 0, 0);
    spike.rotation.z = Math.PI;
    backSpine.add(spike);
  }

  const footLeft = mesh(new THREE.BoxGeometry(0.24, 0.08, 0.34), 0x713f12);
  footLeft.position.set(-0.3, 0.06, 0.08);

  const footRight = mesh(new THREE.BoxGeometry(0.24, 0.08, 0.34), 0x713f12);
  footRight.position.set(0.3, 0.06, 0.08);

  group.add(
    body,
    shellFront,
    pod1,
    pod2,
    pod3,
    pod4,
    backSpine,
    footLeft,
    footRight
  );

  group.userData.core = body;
  group.userData.body = body;
  group.userData.extraSpin = pod3;
  group.userData.floatingParts = [pod1, pod2, pod3, pod4];
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markAllBaseTransforms(group);

  return group;
}

function createDisruptorBoss(config) {
  const group = new THREE.Group();

  const body = mesh(new THREE.BoxGeometry(0.82, 0.92, 0.82), config.color, true);
  body.position.y = 0.72;

  const offsetPanelLeft = mesh(new THREE.BoxGeometry(0.24, 0.58, 0.08), 0x67e8f9, true);
  offsetPanelLeft.position.set(-0.56, 0.78, 0.16);

  const offsetPanelRight = mesh(new THREE.BoxGeometry(0.24, 0.38, 0.08), 0x22d3ee, true);
  offsetPanelRight.position.set(0.52, 0.58, 0.2);

  const head = mesh(new THREE.BoxGeometry(0.46, 0.34, 0.42), 0x0891b2, true);
  head.position.set(0, 1.34, 0.02);

  const antenna = mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.76, 8),
    0x67e8f9,
    true
  );
  antenna.position.y = 1.72;

  const orb = mesh(new THREE.SphereGeometry(0.16, 14, 14), 0x22d3ee, true);
  orb.position.y = 2.14;

  const sideOrbLeft = mesh(
    new THREE.SphereGeometry(0.09, 10, 10),
    0x67e8f9,
    true
  );
  sideOrbLeft.position.set(-0.58, 0.92, -0.1);

  const sideOrbRight = mesh(
    new THREE.SphereGeometry(0.09, 10, 10),
    0x67e8f9,
    true
  );
  sideOrbRight.position.set(0.58, 0.92, -0.1);

  const cableLeft = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 6), 0x155e75);
  cableLeft.position.set(-0.38, 0.46, -0.28);
  cableLeft.rotation.z = 0.45;

  const cableRight = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 6), 0x155e75);
  cableRight.position.set(0.38, 0.46, -0.28);
  cableRight.rotation.z = -0.45;

  const footLeft = mesh(new THREE.BoxGeometry(0.26, 0.08, 0.36), 0x155e75);
  footLeft.position.set(-0.3, 0.06, 0.08);

  const footRight = mesh(new THREE.BoxGeometry(0.26, 0.08, 0.36), 0x155e75);
  footRight.position.set(0.3, 0.06, 0.08);

  group.add(
    body,
    offsetPanelLeft,
    offsetPanelRight,
    head,
    antenna,
    orb,
    sideOrbLeft,
    sideOrbRight,
    cableLeft,
    cableRight,
    footLeft,
    footRight
  );

  group.userData.core = orb;
  group.userData.body = body;
  group.userData.head = head;
  group.userData.secondarySpin = orb;
  group.userData.glitchPanels = [offsetPanelLeft, offsetPanelRight, sideOrbLeft, sideOrbRight];
  group.userData.leftFoot = footLeft;
  group.userData.rightFoot = footRight;

  markAllBaseTransforms(group);

  return group;
}

function createTankTread(x) {
  const group = new THREE.Group();
  group.position.set(x, 0.18, 0);

  const base = mesh(new THREE.BoxGeometry(0.16, 0.18, 0.86), 0x111827);
  const frontWheel = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 12), 0x78716c);
  const backWheel = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 12), 0x78716c);
  const midWheel = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12), 0x57534e);

  frontWheel.rotation.z = Math.PI / 2;
  backWheel.rotation.z = Math.PI / 2;
  midWheel.rotation.z = Math.PI / 2;

  frontWheel.position.set(0, 0, 0.3);
  backWheel.position.set(0, 0, -0.3);
  midWheel.position.set(0, 0, 0);

  group.add(base, frontWheel, backWheel, midWheel);

  group.userData.wheels = [frontWheel, backWheel, midWheel];

  markBaseTransform(group);
  markBaseTransform(base);
  markBaseTransform(frontWheel);
  markBaseTransform(backWheel);
  markBaseTransform(midWheel);

  return group;
}

function createSplitterPod(x, y, z, color) {
  const pod = new THREE.Group();

  const blob = mesh(new THREE.SphereGeometry(0.19, 12, 12), color, true);
  const ring = mesh(new THREE.TorusGeometry(0.2, 0.022, 8, 22), 0xfef08a, true);

  ring.rotation.x = Math.PI / 2;

  pod.position.set(x, y, z);
  pod.add(blob, ring);

  pod.userData.blob = blob;
  pod.userData.ring = ring;

  markBaseTransform(pod);
  markBaseTransform(blob);
  markBaseTransform(ring);

  return pod;
}

function mesh(geometry, color, emissive = false, role = "enemy") {
  const material = createGameMaterial(color, role);

  if (material.emissive?.set) {
    material.emissive.set(emissive ? color : 0x000000);
  }

  if (typeof material.emissiveIntensity === "number") {
    material.emissiveIntensity = emissive ? 0.4 : 0;
  }

  const object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  object.receiveShadow = true;

  object.userData.baseColor = color;
  object.userData.shaderRole = role;

  return object;
}

export function updateEnemies(scene) {
  for (const enemy of state.enemies) {
    if (enemy.userData.dead || enemy.userData.reachedGoal) continue;

    updateEnemySlowState(enemy);

    const next = state.currentPath[enemy.userData.index + 1];

    if (!next) {
      enemy.userData.reachedGoal = true;
      enemy.userData.dead = true;

      damageBase(enemy.userData.baseDamage ?? 1);

      removeHealthBar(scene, enemy);
      scene.remove(enemy);
      continue;
    }

    const flatNext = new THREE.Vector3(
      next.x,
      enemy.position.y,
      next.z
    );

    const dir = new THREE.Vector3().subVectors(flatNext, enemy.position);
    const horizontalDistance = Math.hypot(
      next.x - enemy.position.x,
      next.z - enemy.position.z
    );

    if (horizontalDistance < 0.08) {
      enemy.userData.index++;
    } else {
      const finalSpeed =
        enemy.userData.speed * (enemy.userData.speedMultiplier ?? 1);

      const angle = Math.atan2(dir.x, dir.z);
      enemy.rotation.y = angle;

      enemy.position.add(dir.normalize().multiplyScalar(finalSpeed));

      animateEnemy(enemy, finalSpeed);
      maybeSpawnFootstepDust(scene, enemy);
      maybeSpawnSpeedTrail(scene, enemy, finalSpeed);
    }
  }

  cleanupEnemies(scene);
}

function updateEnemySlowState(enemy) {
  if (enemy.userData.freezeFlashTimer > 0) {
    enemy.userData.freezeFlashTimer--;
  }

  if (enemy.userData.slowTimer > 0) {
    enemy.userData.slowTimer--;

    const stageSlowBonus = enemy.userData.stageSlowBonus ?? 1;

    enemy.userData.speed =
      enemy.userData.baseSpeed *
      enemy.userData.slowMultiplier /
      stageSlowBonus;

    enemy.userData.isSlowed = true;

    if (enemy.userData.slowVisual) {
      enemy.userData.slowVisual.visible = true;

      const pulse = 1 + Math.sin(Date.now() * 0.012) * 0.08;
      enemy.userData.slowVisual.scale.set(pulse, 1, pulse);
    }

    const freezeColor =
      enemy.userData.freezeFlashTimer > 0 ? 0x5eead4 : 0x164e63;

    setEnemyEmissive(enemy, freezeColor, 0.72);
    return;
  }

  enemy.userData.speed = enemy.userData.baseSpeed;
  enemy.userData.isSlowed = false;

  if (enemy.userData.slowVisual) {
    enemy.userData.slowVisual.visible = false;
  }

  setEnemyEmissive(enemy, 0x000000, 0);
}
function animateEnemy(enemy, finalSpeed) {
  const core = enemy.userData.core;
  const body = enemy.userData.body;
  const head = enemy.userData.head;
  const extraSpin = enemy.userData.extraSpin;
  const secondarySpin = enemy.userData.secondarySpin;
  const leftFoot = enemy.userData.leftFoot;
  const rightFoot = enemy.userData.rightFoot;
  const leftArm = enemy.userData.leftArm;
  const rightArm = enemy.userData.rightArm;
  const leftHand = enemy.userData.leftHand;
  const rightHand = enemy.userData.rightHand;
  const flame = enemy.userData.flame;
  const engine = enemy.userData.engine;
  const leftWing = enemy.userData.leftWing;
  const rightWing = enemy.userData.rightWing;
  const floatingParts = enemy.userData.floatingParts ?? [];
  const shieldPanels = enemy.userData.shieldPanels ?? [];
  const glitchPanels = enemy.userData.glitchPanels ?? [];
  const leftTread = enemy.userData.leftTread;
  const rightTread = enemy.userData.rightTread;

  const type = enemy.userData.type;
  const isBoss = type?.startsWith("boss");
  const isElite = type === "elite";
  const isFast = type === "fast";
  const isRunnerBoss = type === "boss_runner";
  const isTank = type === "tank" || type === "boss_crusher";
  const isShieldBoss = type === "boss_shield";
  const isSplitterBoss = type === "boss_splitter";
  const isDisruptorBoss = type === "boss_disruptor";
  const isCrusherBoss = type === "boss_crusher";
  const isPurpleBoss = type === "boss_purple";

  enemy.userData.specialAnimTimer++;

  enemy.userData.walkPhase += finalSpeed * (
    isFast || isRunnerBoss
      ? 95
      : isTank
        ? 34
        : isBoss
          ? 30
          : 58
  );

  const phase = enemy.userData.walkPhase;
  const step = Math.sin(phase);
  const counterStep = Math.sin(phase + Math.PI);

  const bobStrength = isBoss ? 0.025 : isElite ? 0.03 : isTank ? 0.018 : 0.026;
  const baseY = isBoss ? 0.12 : 0.08;
  const bob = Math.abs(step) * bobStrength;

  enemy.position.y = baseY + bob;

  if (body) {
    body.rotation.z = step * (isBoss ? 0.025 : isTank ? 0.018 : 0.055);
    body.rotation.x = isFast
      ? -0.22 + step * 0.045
      : isRunnerBoss
        ? -0.14 + step * 0.06
        : step * 0.018;
  }

  if (head) {
    head.rotation.z = counterStep * (isBoss ? 0.015 : 0.035);
    head.position.y =
      (head.userData.baseY ?? head.position.y) +
      Math.abs(step) * (isBoss ? 0.015 : 0.025);
  }

  if (core) {
    core.rotation.y += isBoss ? 0.045 : isElite ? 0.04 : 0.03;
    core.rotation.z += isBoss ? 0.024 : 0.018;
  }

  if (extraSpin) {
    extraSpin.rotation.y += isBoss ? 0.035 : 0.026;
    extraSpin.rotation.z += isRunnerBoss ? 0.08 : isBoss ? 0.03 : 0.018;
  }

  if (secondarySpin) {
    secondarySpin.rotation.y -= isBoss ? 0.028 : 0.02;
    secondarySpin.rotation.z += isShieldBoss ? 0.045 : 0.02;
  }

  if (leftArm) {
    leftArm.rotation.x = step * (isBoss ? 0.18 : 0.28);
    leftArm.rotation.z =
      (leftArm.userData.baseRotZ ?? leftArm.rotation.z) + step * 0.08;
  }

  if (rightArm) {
    rightArm.rotation.x = counterStep * (isBoss ? 0.18 : 0.28);
    rightArm.rotation.z =
      (rightArm.userData.baseRotZ ?? rightArm.rotation.z) - step * 0.08;
  }

  if (leftHand) {
    leftHand.position.y =
      (leftHand.userData.baseY ?? leftHand.position.y) +
      Math.max(0, counterStep) * 0.08;
  }

  if (rightHand) {
    rightHand.position.y =
      (rightHand.userData.baseY ?? rightHand.position.y) +
      Math.max(0, step) * 0.08;
  }

  if (leftFoot) {
    leftFoot.position.z =
      (leftFoot.userData.baseZ ?? leftFoot.position.z) + step * 0.08;
    leftFoot.position.y =
      (leftFoot.userData.baseY ?? leftFoot.position.y) + Math.max(0, step) * 0.07;
    leftFoot.rotation.x = step * 0.22;
  }

  if (rightFoot) {
    rightFoot.position.z =
      (rightFoot.userData.baseZ ?? rightFoot.position.z) + counterStep * 0.08;
    rightFoot.position.y =
      (rightFoot.userData.baseY ?? rightFoot.position.y) +
      Math.max(0, counterStep) * 0.07;
    rightFoot.rotation.x = counterStep * 0.22;
  }

  if (leftTread) animateTread(leftTread, finalSpeed);
  if (rightTread) animateTread(rightTread, finalSpeed);

  if (flame) {
    const flamePulse = 1 + Math.sin(Date.now() * 0.028) * 0.18;
    flame.scale.set(flamePulse, flamePulse, flamePulse);
    flame.rotation.z += isRunnerBoss ? 0.2 : 0.12;
  }

  if (engine) {
    engine.rotation.z += isRunnerBoss ? 0.12 : 0.08;
  }

  if (leftWing) {
    leftWing.rotation.z =
      (leftWing.userData.baseRotZ ?? leftWing.rotation.z) +
      Math.sin(Date.now() * 0.018) * 0.08;
  }

  if (rightWing) {
    rightWing.rotation.z =
      (rightWing.userData.baseRotZ ?? rightWing.rotation.z) -
      Math.sin(Date.now() * 0.018) * 0.08;
  }

  floatingParts.forEach((part, index) => {
    part.position.y =
      (part.userData.baseY ?? part.position.y) +
      Math.sin(Date.now() * 0.004 + index) * (isBoss ? 0.035 : 0.025);

    part.rotation.y += 0.012 + index * 0.004;
    part.rotation.z += 0.008;
  });

  if (isBoss) {
    const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.012;
    enemy.scale.setScalar(pulse * (enemy.userData.modelScale ?? 1));
  }

  if (isShieldBoss) {
    const shieldPulse = 1 + Math.sin(Date.now() * 0.012) * 0.06;

    shieldPanels.forEach((panel, index) => {
      panel.scale.set(shieldPulse, shieldPulse, 1);

      panel.position.y =
        (panel.userData.baseY ?? panel.position.y) +
        Math.sin(Date.now() * 0.006 + index) * 0.025;
    });
  }

  if (isSplitterBoss) {
    floatingParts.forEach((part, index) => {
      part.scale.setScalar(1 + Math.sin(Date.now() * 0.007 + index) * 0.06);
    });
  }

  if (isDisruptorBoss) {
    const glitch = Math.sin(Date.now() * 0.04) * 0.025;
    const glitch2 = Math.sin(Date.now() * 0.071) * 0.018;

    if (body) {
      body.position.x = (body.userData.baseX ?? 0) + glitch;
      body.position.z = (body.userData.baseZ ?? 0) - glitch2;
    }

    if (head) {
      head.position.x = (head.userData.baseX ?? 0) - glitch * 1.5;
    }

    glitchPanels.forEach((panel, index) => {
      panel.position.x =
        (panel.userData.baseX ?? panel.position.x) +
        Math.sin(Date.now() * (0.035 + index * 0.011)) * 0.04;

      panel.rotation.z += index % 2 === 0 ? 0.012 : -0.015;
    });
  }

  if (isCrusherBoss) {
    enemy.rotation.z = step * 0.012;
  }

  if (isPurpleBoss && core) {
    const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
    core.scale.setScalar(pulse);
  }
}

function animateTread(tread, finalSpeed) {
  const wheels = tread.userData.wheels ?? [];

  for (const wheel of wheels) {
    wheel.rotation.y += finalSpeed * 24;
  }
}

function maybeSpawnFootstepDust(scene, enemy) {
  if (enemy.userData.isSlowed) return;

  const type = enemy.userData.type;
  const isBoss = type?.startsWith("boss");
  const isFast = type === "fast" || type === "boss_runner";
  const isTank = type === "tank" || type === "boss_crusher";

  enemy.userData.stepTimer++;

  const threshold = isFast ? 7 : isTank ? 17 : isBoss ? 20 : 12;

  if (enemy.userData.stepTimer < threshold) return;

  enemy.userData.stepTimer = 0;

  const dustColor = isTank
    ? 0x78716c
    : isFast
      ? 0xfbbf24
      : isBoss
        ? 0xa78bfa
        : 0x9ca3af;

  spawnFootstepDust(scene, enemy.position, dustColor);

  if (isBoss || isTank) {
    addCameraShake(isBoss ? 0.025 : 0.012, isBoss ? 5 : 3);
  }
}

function maybeSpawnSpeedTrail(scene, enemy, finalSpeed) {
  if (enemy.userData.isSlowed) return;

  const type = enemy.userData.type;
  const isFast = type === "fast";
  const isRunnerBoss = type === "boss_runner";
  const isDisruptorBoss = type === "boss_disruptor";

  if (!isFast && !isRunnerBoss && !isDisruptorBoss) return;

  enemy.userData.trailTimer++;

  const threshold = isRunnerBoss ? 3 : isFast ? 4 : 7;

  if (enemy.userData.trailTimer < threshold) return;

  enemy.userData.trailTimer = 0;

  const backward = new THREE.Vector3(0, 0, -1)
    .applyEuler(enemy.rotation)
    .normalize();

  const trailPosition = new THREE.Vector3(
    enemy.position.x + backward.x * 0.45,
    enemy.position.y + (isRunnerBoss ? 0.62 : 0.34),
    enemy.position.z + backward.z * 0.45
  );

  const color = isDisruptorBoss
    ? 0x67e8f9
    : isRunnerBoss
      ? 0xfb923c
      : 0xfacc15;

  const size = isRunnerBoss
    ? 0.115
    : finalSpeed > 0.05
      ? 0.085
      : 0.065;

  spawnProjectileTrailEffect(scene, trailPosition, color, size);
}

function setEnemyEmissive(enemy, color, intensity = 0.65) {
  enemy.traverse((child) => {
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

export function cleanupEnemies(scene) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];

    const shouldRemove =
      !enemy ||
      enemy.userData?.dead === true ||
      enemy.userData?.removed === true ||
      enemy.userData?.reachedGoal === true ||
      enemy.userData?.reachedBase === true ||
      enemy.userData?.finished === true ||
      enemy.userData?.escaped === true ||
      enemy.health <= 0 ||
      enemy.userData?.health <= 0 ||
      enemy.parent === null;

    if (!shouldRemove) continue;

    if (enemy) {
      enemy.userData.removed = true;

      if (state.selectedObject === enemy) {
        state.selectedObject = null;
      }

      if (state.hoveredObject === enemy) {
        state.hoveredObject = null;
      }

      removeHealthBar(scene, enemy);

      if (enemy.parent) {
        enemy.parent.remove(enemy);
      } else {
        scene.remove(enemy);
      }
    }

    state.enemies.splice(i, 1);
  }
}

function markBaseTransform(object) {
  object.userData.baseX = object.position.x;
  object.userData.baseY = object.position.y;
  object.userData.baseZ = object.position.z;
  object.userData.baseRotX = object.rotation.x;
  object.userData.baseRotY = object.rotation.y;
  object.userData.baseRotZ = object.rotation.z;
}

function markAllBaseTransforms(group) {
  group.traverse((child) => {
    markBaseTransform(child);
  });
}

function formatBossType(type) {
  if (type === "boss_crusher") return "Crusher Boss";
  if (type === "boss_runner") return "Runner Boss";
  if (type === "boss_shield") return "Shield Boss";
  if (type === "boss_splitter") return "Splitter Boss";
  if (type === "boss_disruptor") return "Disruptor Boss";
  return "Purple Boss";
}

function getBossAuraColor(type) {
  if (type === "boss_crusher") return 0xef4444;
  if (type === "boss_runner") return 0xfb923c;
  if (type === "boss_shield") return 0x22c55e;
  if (type === "boss_splitter") return 0xeab308;
  if (type === "boss_disruptor") return 0x06b6d4;

  return 0xa855f7;
}