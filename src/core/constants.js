import * as THREE from "three";
import {
  STAGES,
  getCurrentStagePaths,
  getCurrentStagePath,
  getCurrentStagePathTiles,
  getCurrentStagePathSet,
  getCurrentBasePosition,
  getCurrentPortalPosition
} from "../game/stages.js";

export const GRID_MIN = -8;
export const GRID_MAX = 8;
export const MAP_SIZE = 18;

export const PATHS = STAGES[0].paths.map((path) =>
  path.map(([x, z]) => new THREE.Vector3(x, 0.15, z))
);

export const pathPoints = getCurrentStagePath();

export const BASE_POSITION = getCurrentBasePosition();
export const PORTAL_POSITION = getCurrentPortalPosition();

export const pathTiles = getCurrentStagePathTiles();
export const pathSet = getCurrentStagePathSet();

export function getActivePaths() {
  return getCurrentStagePaths();
}

export function getActivePathPoints() {
  return getCurrentStagePath();
}

export function getActivePathTiles() {
  return getCurrentStagePathTiles();
}

export function getActivePathSet() {
  return getCurrentStagePathSet();
}

export function getActiveBasePosition() {
  return getCurrentBasePosition();
}

export function getActivePortalPosition() {
  return getCurrentPortalPosition();
}