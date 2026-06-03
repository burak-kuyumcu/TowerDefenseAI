import { getCurrentStage } from "../game/stages.js";

import {
  createForestInterior,
  createForestHeroProps
} from "./forestInteriorSetup.js";

import {
  createCanyonInterior,
  createCanyonHeroProps
} from "./canyonInteriorSetup.js";

import {
  createFrozenInterior,
  createFrozenHeroProps
} from "./frozenInteriorSetup.js";

import {
  createRuinsInterior,
  createRuinsHeroProps
} from "./ruinsInteriorSetup.js";

import {
  createVolcanicInterior,
  createVolcanicHeroProps
} from "./volcanicInteriorSetup.js";

import {
  createSwampInterior,
  createSwampHeroProps
} from "./swampInteriorSetup.js";

import {
  createCrystalInterior,
  createCrystalHeroProps
} from "./crystalInteriorSetup.js";

export function addMapDecorations(scene) {
  const stage = getCurrentStage();

  if (stage.id === 1) {
    createForestInterior(scene);
    return;
  }

  if (stage.id === 2) {
    createCanyonInterior(scene);
    return;
  }

  if (stage.id === 3) {
    createFrozenInterior(scene);
    return;
  }

  if (stage.id === 4) {
    createRuinsInterior(scene);
    return;
  }

  if (stage.id === 5) {
    createVolcanicInterior(scene);
    return;
  }

  if (stage.id === 6) {
    createSwampInterior(scene);
    return;
  }

  createCrystalInterior(scene);
}

export function addStageDecorations(scene) {
  const stage = getCurrentStage();

  if (stage.id === 1) {
    createForestHeroProps(scene);
    return;
  }

  if (stage.id === 2) {
    createCanyonHeroProps(scene);
    return;
  }

  if (stage.id === 3) {
    createFrozenHeroProps(scene);
    return;
  }

  if (stage.id === 4) {
    createRuinsHeroProps(scene);
    return;
  }

  if (stage.id === 5) {
    createVolcanicHeroProps(scene);
    return;
  }

  if (stage.id === 6) {
    createSwampHeroProps(scene);
    return;
  }

  createCrystalHeroProps(scene);
}