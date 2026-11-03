// Web Audio Engine for The Sentinel Codex
// Pure synthesizer - no external audio files or network requests

let ctx: AudioContext | null = null;
let ambienceOsc: OscillatorNode | null = null;
let noiseNode: AudioBufferSourceNode | null = null;

export function ensureAudio(): boolean {
  if (typeof window === 'undefined') return false;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return false;
  try {
    ctx = ctx || new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return true;
  } catch (e) {
    console.warn('AudioContext initialization failed:', e);
    return false;
  }
}

export function oscillator(
  freq: number,
  duration: number,
  volume = 0.07,
  type: OscillatorType = 'sine',
  delay = 0,
  endFreq: number | null = null
) {
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();

  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (endFreq) {
    o.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), start + duration);
  }

  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  o.connect(g).connect(ctx.destination);
  o.start(start);
  o.stop(start + duration + 0.02);
}

export function noiseBurst(delay = 0, duration = 0.1, volume = 0.12, cutoff = 500) {
  if (!ctx) return;
  const len = Math.max(1, Math.round(ctx.sampleRate * duration));
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const arr = b.getChannelData(0);
  for (let i = 0; i < len; i++) {
    arr[i] = Math.random() * 2 - 1;
  }

  const s = ctx.createBufferSource();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();

  s.buffer = b;
  f.type = 'lowpass';
  f.frequency.value = cutoff;

  const start = ctx.currentTime + delay;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(volume, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  s.connect(f).connect(g).connect(ctx.destination);
  s.start(start);
  s.stop(start + duration);
}

export function stopAmbience() {
  if (ambienceOsc) {
    try {
      ambienceOsc.stop();
    } catch (e) {
      // ignore
    }
    ambienceOsc.disconnect();
    ambienceOsc = null;
  }
  if (noiseNode) {
    try {
      noiseNode.stop();
    } catch (e) {
      // ignore
    }
    noiseNode.disconnect();
    noiseNode = null;
  }
}

export function startAmbience(audioEnabled: boolean) {
  stopAmbience();
  if (!audioEnabled || !ctx) return;

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = 54;
  g.gain.value = 0.012;
  o.connect(g).connect(ctx.destination);
  o.start();
  ambienceOsc = o;

  const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const a = b.getChannelData(0);
  for (let i = 0; i < a.length; i++) {
    a[i] = Math.random() * 2 - 1;
  }

  const n = ctx.createBufferSource();
  const f = ctx.createBiquadFilter();
  const ng = ctx.createGain();
  n.buffer = b;
  n.loop = true;
  f.type = 'lowpass';
  f.frequency.value = 400;
  ng.gain.value = 0.017;
  n.connect(f).connect(ng).connect(ctx.destination);
  n.start();
  noiseNode = n;
}

export function playSceneCue(title = ''): boolean {
  if (!ctx) return false;
  const t = title.toLowerCase();
  if (/observer|codex|memory|weaver|thread|witness/.test(t)) {
    oscillator(523.25, 0.14, 0.035, 'sine');
    oscillator(783.99, 0.2, 0.025, 'sine', 0.12);
  } else if (/correction|order|record|terminal|override|report/.test(t)) {
    oscillator(196, 0.13, 0.035, 'triangle');
    noiseBurst(0.1, 0.07, 0.018, 650);
  } else {
    oscillator(329.63, 0.12, 0.025, 'sine');
  }
  return true;
}
