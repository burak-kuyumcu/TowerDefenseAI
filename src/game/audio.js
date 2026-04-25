import { state } from "./state.js";

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playTone({ frequency = 440, duration = 0.08, type = "sine", volume = 0.08 }) {
  if (state.muted) return;

  const context = getAudioContext();

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

export function playShootSound() {
  playTone({
    frequency: 620,
    duration: 0.06,
    type: "square",
    volume: 0.045
  });
}

export function playExplosionSound() {
  playTone({
    frequency: 120,
    duration: 0.18,
    type: "sawtooth",
    volume: 0.08
  });
}

export function playBaseHitSound() {
  playTone({
    frequency: 180,
    duration: 0.16,
    type: "triangle",
    volume: 0.09
  });
}

export function toggleMute() {
  state.muted = !state.muted;
}