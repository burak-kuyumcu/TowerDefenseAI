import { state } from "../game/state.js";
import { getCurrentStageEffect } from "../game/stages.js";

const MUSIC_TRACKS = {
  forest_balance: "/audio/music/forest.mp3",
  canyon_wind: "/audio/music/canyon.mp3",
  frozen_chill: "/audio/music/frozen.mp3",
  ancient_armor: "/audio/music/ancient.mp3",
  lava_pressure: "/audio/music/lava.mp3",
  swamp_mud: "/audio/music/swamp.mp3",
  crystal_resonance: "/audio/music/crystal.mp3"
};

const DEFAULT_TRACK_ID = "forest_balance";

const TARGET_VOLUME = 0.22;
const FADE_SPEED = 0.018;

let initialized = false;
let unlocked = false;

let activeAudio = null;
let nextAudio = null;

let activeTrackId = null;
let nextTrackId = null;

let activeTargetVolume = 0;
let nextTargetVolume = 0;

export function initStageMusic() {
  if (initialized) return;

  initialized = true;

  window.addEventListener("pointerdown", unlockStageMusic, {
    once: true
  });

  window.addEventListener("keydown", unlockStageMusic, {
    once: true
  });

  document.addEventListener("visibilitychange", handleVisibilityChange);
}

export function updateStageMusic() {
  if (!initialized) return;
  if (!unlocked) return;

  const shouldPlay = shouldStageMusicPlay();
  const currentTrackId = getCurrentTrackId();

  if (!shouldPlay) {
    activeTargetVolume = 0;
    nextTargetVolume = 0;
    updateMusicFade();
    return;
  }

  if (!activeAudio) {
    startTrack(currentTrackId);
    return;
  }

  if (currentTrackId !== activeTrackId && currentTrackId !== nextTrackId) {
    crossfadeToTrack(currentTrackId);
  }

  activeTargetVolume = TARGET_VOLUME;

  if (nextAudio) {
    nextTargetVolume = TARGET_VOLUME;
  }

  updateMusicFade();
}

export function stopStageMusicImmediately() {
  stopAudio(activeAudio);
  stopAudio(nextAudio);

  activeAudio = null;
  nextAudio = null;

  activeTrackId = null;
  nextTrackId = null;

  activeTargetVolume = 0;
  nextTargetVolume = 0;
}

export function setStageMusicMuted(isMuted) {
  state.muted = Boolean(isMuted);

  if (state.muted) {
    activeTargetVolume = 0;
    nextTargetVolume = 0;
  }
}

export function toggleStageMusicMuted() {
  state.muted = !state.muted;

  if (state.muted) {
    activeTargetVolume = 0;
    nextTargetVolume = 0;
  } else {
    activeTargetVolume = TARGET_VOLUME;
  }

  return !state.muted;
}

function unlockStageMusic() {
  if (unlocked) return;

  unlocked = true;

  if (shouldStageMusicPlay()) {
    startTrack(getCurrentTrackId());
  }
}

function startTrack(trackId) {
  const audio = createAudioForTrack(trackId);

  activeAudio = audio;
  activeTrackId = trackId;

  activeAudio.volume = 0;
  activeTargetVolume = TARGET_VOLUME;

  safePlay(activeAudio);
}

function crossfadeToTrack(trackId) {
  const audio = createAudioForTrack(trackId);

  nextAudio = audio;
  nextTrackId = trackId;

  nextAudio.volume = 0;
  nextTargetVolume = TARGET_VOLUME;

  activeTargetVolume = 0;

  safePlay(nextAudio);
}

function createAudioForTrack(trackId) {
  const src = MUSIC_TRACKS[trackId] ?? MUSIC_TRACKS[DEFAULT_TRACK_ID];

  const audio = new Audio(src);

  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;

  audio.addEventListener("error", () => {
    console.warn(`Background music could not be loaded: ${src}`);
  });

  return audio;
}

function updateMusicFade() {
  if (activeAudio) {
    activeAudio.volume = moveTowards(
      activeAudio.volume,
      getAllowedVolume(activeTargetVolume),
      FADE_SPEED
    );

    if (activeTargetVolume === 0 && activeAudio.volume <= 0.001) {
      if (nextAudio) {
        stopAudio(activeAudio);

        activeAudio = nextAudio;
        activeTrackId = nextTrackId;

        nextAudio = null;
        nextTrackId = null;

        activeTargetVolume = nextTargetVolume;
        nextTargetVolume = 0;
      } else if (!shouldStageMusicPlay()) {
        activeAudio.pause();
      }
    }
  }

  if (nextAudio) {
    nextAudio.volume = moveTowards(
      nextAudio.volume,
      getAllowedVolume(nextTargetVolume),
      FADE_SPEED
    );

    if (!activeAudio || activeAudio.volume <= 0.001) {
      stopAudio(activeAudio);

      activeAudio = nextAudio;
      activeTrackId = nextTrackId;

      nextAudio = null;
      nextTrackId = null;

      activeTargetVolume = TARGET_VOLUME;
      nextTargetVolume = 0;
    }
  }
}

function shouldStageMusicPlay() {
  if (state.muted) return false;
  if (!state.started) return false;
  if (state.paused) return false;
  if (state.gameOver) return false;

  return true;
}

function getCurrentTrackId() {
  const effect = getCurrentStageEffect();

  return effect?.id ?? DEFAULT_TRACK_ID;
}

function getAllowedVolume(volume) {
  if (!shouldStageMusicPlay()) return 0;

  return volume;
}

function moveTowards(current, target, speed) {
  if (current < target) {
    return Math.min(target, current + speed);
  }

  if (current > target) {
    return Math.max(target, current - speed);
  }

  return current;
}

function safePlay(audio) {
  if (!audio) return;

  const promise = audio.play();

  if (promise && typeof promise.catch === "function") {
    promise.catch(() => {
   
    });
  }
}

function stopAudio(audio) {
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  audio.src = "";
  audio.load();
}

function handleVisibilityChange() {
  if (document.hidden) {
    if (activeAudio) activeAudio.pause();
    if (nextAudio) nextAudio.pause();
    return;
  }

  if (!shouldStageMusicPlay()) return;

  safePlay(activeAudio);
  safePlay(nextAudio);
}