/**
 * MOTUS Official Sample Generator
 *
 * Generates 104 unique sounds (13 packs × 8 slots) using Web Audio OfflineAudioContext.
 * Each sound is multi-layered, processed, and designed to match the artistic direction.
 *
 * Sound design philosophy per pack:
 * - CYPHER: vinyl warmth, dusty, jazz, lo-fi (DJ Shadow, Krush, Nujabes)
 * - EUPHORIA: liquid, organic, warm breaks (Bonobo, Floating Points)
 * - RITUAL: wood, skin, metal, earth (Brazilian/African percussion)
 * - MELANCHOLY: compressed, dark, slow, smoky (Portishead, Massive Attack)
 * - ASCENSION: pure, bell-like, sacred, space (Nils Frahm, Pärt)
 * - FERAL: harsh, percussive, primal, body (Stravinsky, body music)
 * - RAGE: crushed, distorted, industrial (NIN, Andy Stott)
 * - VOID: ghostly, reversed, spectral, digital (Burial, Autechre)
 * - CLASSICAL: felt piano, intimate, silence (Satie, Feldman, Cage)
 * - DNB: tight, sharp, deep sub, metallic (Goldie, Source Direct, LTJ Bukem)
 * - SYNTHWAVE: sawtooth, detuned, analog warm (Vangelis, Carpenter)
 * - CINEMATIC: massive, brass, tension, epic (Zimmer, Nolan)
 * - ORCHESTRA: emotional strings, choir, power (Górecki, John Williams)
 */

import { cacheSample, getCachedSample, hasCachedPack } from './SampleCache';

const SAMPLE_RATE = 44100;
const SLOT_NAMES = ['kick', 'snare', 'hat', 'perc', 'vocal', 'bass', 'melodic', 'texture'] as const;

// ─── TYPES ─────────────────────────────────────────

type SlotName = typeof SLOT_NAMES[number];

interface SoundDef {
  duration: number;
  render: (ctx: OfflineAudioContext) => void;
}

type PackSounds = Record<SlotName, SoundDef>;

// ─── AUDIO HELPERS ─────────────────────────────────

function createOsc(ctx: OfflineAudioContext, type: OscillatorType, freq: number, start: number, end: number): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.start(start);
  osc.stop(end);
  return osc;
}

function createGain(ctx: OfflineAudioContext, initial: number = 1): GainNode {
  const g = ctx.createGain();
  g.gain.value = initial;
  return g;
}

function createFilter(ctx: OfflineAudioContext, type: BiquadFilterType, freq: number, q: number = 1): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function createNoise(ctx: OfflineAudioContext, duration: number): AudioBufferSourceNode {
  const buf = ctx.createBuffer(1, SAMPLE_RATE * duration, SAMPLE_RATE);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

function createBrownNoise(ctx: OfflineAudioContext, duration: number): AudioBufferSourceNode {
  const buf = ctx.createBuffer(1, SAMPLE_RATE * duration, SAMPLE_RATE);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

function envADSR(param: AudioParam, t: number, a: number, d: number, s: number, r: number, peak: number = 1) {
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak, t + a);
  param.linearRampToValueAtTime(peak * s, t + a + d);
  param.linearRampToValueAtTime(0, t + a + d + r);
}

function pitchEnv(param: AudioParam, t: number, startFreq: number, endFreq: number, duration: number) {
  param.setValueAtTime(startFreq, t);
  param.exponentialRampToValueAtTime(Math.max(endFreq, 1), t + duration);
}

// Soft saturation
function createWaveShaper(ctx: OfflineAudioContext, amount: number = 0.5): WaveShaperNode {
  const ws = ctx.createWaveShaper();
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = (Math.PI + amount) * x / (Math.PI + amount * Math.abs(x));
  }
  ws.curve = curve;
  ws.oversample = '2x';
  return ws;
}

// ─── PACK DEFINITIONS ──────────────────────────────

function getCypherSounds(): PackSounds {
  return {
    // Dusty boom bap kick — warm body, tape character, E1
    kick: { duration: 0.5, render: (ctx) => {
      const osc = createOsc(ctx, 'sine', 150, 0, 0.5);
      const g = createGain(ctx, 0);
      pitchEnv(osc.frequency, 0, 150, 42, 0.08);
      envADSR(g.gain, 0, 0.003, 0.25, 0, 0.15, 0.9);
      const lp = createFilter(ctx, 'lowpass', 500);
      const sat = createWaveShaper(ctx, 0.3);
      osc.connect(lp).connect(sat).connect(g).connect(ctx.destination);
      // transient click
      const click = createNoise(ctx, 0.01);
      const cg = createGain(ctx, 0.15);
      const chp = createFilter(ctx, 'bandpass', 3000, 2);
      click.connect(chp).connect(cg).connect(ctx.destination);
      click.start(0); click.stop(0.01);
    }},
    // Lo-fi snare — brown noise, tape filtered
    snare: { duration: 0.35, render: (ctx) => {
      const n = createBrownNoise(ctx, 0.35);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.003, 0.15, 0.02, 0.1, 0.7);
      const lp = createFilter(ctx, 'lowpass', 3500);
      const body = createOsc(ctx, 'triangle', 180, 0, 0.08);
      const bg = createGain(ctx, 0.3);
      envADSR(bg.gain, 0, 0.001, 0.05, 0, 0.02, 0.3);
      n.connect(lp).connect(g).connect(ctx.destination);
      body.connect(bg).connect(ctx.destination);
      n.start(0);
    }},
    // Vinyl crackle hi-hat
    hat: { duration: 0.08, render: (ctx) => {
      const n = createNoise(ctx, 0.08);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.04, 0, 0.02, 0.4);
      const hp = createFilter(ctx, 'highpass', 6000);
      const lp = createFilter(ctx, 'lowpass', 12000);
      n.connect(hp).connect(lp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    // Tape-degraded open hat
    perc: { duration: 0.25, render: (ctx) => {
      const n = createNoise(ctx, 0.25);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.002, 0.15, 0.03, 0.08, 0.3);
      const bp = createFilter(ctx, 'bandpass', 5000, 0.8);
      const sat = createWaveShaper(ctx, 0.2);
      n.connect(bp).connect(sat).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    // Hip-hop vocal chop — formant synthesis
    vocal: { duration: 0.4, render: (ctx) => {
      const osc1 = createOsc(ctx, 'sawtooth', 260, 0, 0.4);
      const osc2 = createOsc(ctx, 'sawtooth', 263, 0, 0.4);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.01, 0.12, 0.08, 0.15, 0.5);
      const f1 = createFilter(ctx, 'bandpass', 700, 5);
      const f2 = createFilter(ctx, 'bandpass', 1200, 3);
      const mix = createGain(ctx, 0.5);
      osc1.connect(f1).connect(g).connect(ctx.destination);
      osc2.connect(f2).connect(mix).connect(g);
    }},
    // Deep sub bass — Krush style
    bass: { duration: 0.7, render: (ctx) => {
      const osc = createOsc(ctx, 'sine', 45, 0, 0.7);
      const sub = createOsc(ctx, 'sine', 90, 0, 0.7);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.005, 0.4, 0.1, 0.25, 0.8);
      const lp = createFilter(ctx, 'lowpass', 200);
      const sg = createGain(ctx, 0.3);
      osc.connect(lp).connect(g).connect(ctx.destination);
      sub.connect(sg).connect(g);
    }},
    // Jazz piano stab — Nujabes warmth
    melodic: { duration: 0.6, render: (ctx) => {
      const osc = createOsc(ctx, 'triangle', 311, 0, 0.6); // Eb4
      const osc2 = createOsc(ctx, 'sine', 622, 0, 0.6); // harmonic
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.005, 0.4, 0.08, 0.25, 0.6);
      const lp = createFilter(ctx, 'lowpass', 3000);
      const hg = createGain(ctx, 0.15);
      osc.connect(lp).connect(g).connect(ctx.destination);
      osc2.connect(hg).connect(g);
    }},
    // Vinyl hiss atmosphere
    texture: { duration: 1.5, render: (ctx) => {
      const n = createBrownNoise(ctx, 1.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.1, 0.5, 0.15, 0.6, 0.15);
      const lp = createFilter(ctx, 'lowpass', 1800);
      const hp = createFilter(ctx, 'highpass', 200);
      n.connect(hp).connect(lp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
  };
}

function getEuphoriaSounds(): PackSounds {
  return {
    kick: { duration: 0.2, render: (ctx) => {
      const osc = createOsc(ctx, 'sine', 200, 0, 0.2);
      pitchEnv(osc.frequency, 0, 200, 50, 0.04);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.12, 0, 0.06, 0.9);
      osc.connect(g).connect(ctx.destination);
      const click = createNoise(ctx, 0.005);
      const cg = createGain(ctx, 0.2);
      const hp = createFilter(ctx, 'highpass', 5000);
      click.connect(hp).connect(cg).connect(ctx.destination);
      click.start(0); click.stop(0.005);
    }},
    snare: { duration: 0.2, render: (ctx) => {
      const n = createNoise(ctx, 0.2);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.1, 0, 0.05, 0.65);
      const bp = createFilter(ctx, 'bandpass', 4000, 1.5);
      const body = createOsc(ctx, 'triangle', 220, 0, 0.05);
      const bg = createGain(ctx, 0.4);
      envADSR(bg.gain, 0, 0.001, 0.03, 0, 0.01, 0.4);
      n.connect(bp).connect(g).connect(ctx.destination);
      body.connect(bg).connect(ctx.destination);
      n.start(0);
    }},
    hat: { duration: 0.06, render: (ctx) => {
      const n = createNoise(ctx, 0.06);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.03, 0, 0.015, 0.35);
      const hp = createFilter(ctx, 'highpass', 8000);
      n.connect(hp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    perc: { duration: 0.4, render: (ctx) => {
      // Ride shimmer — Bonobo organic
      const n = createNoise(ctx, 0.4);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.002, 0.25, 0.05, 0.12, 0.25);
      const bp = createFilter(ctx, 'bandpass', 6000, 0.5);
      n.connect(bp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    vocal: { duration: 0.5, render: (ctx) => {
      // Euphoric vocal rise
      const osc = createOsc(ctx, 'sawtooth', 330, 0, 0.5);
      osc.frequency.linearRampToValueAtTime(440, 0.3);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.04, 0.2, 0.1, 0.15, 0.4);
      const f1 = createFilter(ctx, 'bandpass', 800, 4);
      osc.connect(f1).connect(g).connect(ctx.destination);
    }},
    bass: { duration: 0.5, render: (ctx) => {
      // Reese bass — detuned saws
      const o1 = createOsc(ctx, 'sawtooth', 37, 0, 0.5);
      const o2 = createOsc(ctx, 'sawtooth', 37.3, 0, 0.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.008, 0.3, 0.2, 0.15, 0.7);
      const lp = createFilter(ctx, 'lowpass', 400);
      const mix = createGain(ctx, 0.5);
      o1.connect(lp).connect(g).connect(ctx.destination);
      o2.connect(mix).connect(lp);
    }},
    melodic: { duration: 0.5, render: (ctx) => {
      // Warm synth pad stab
      const o1 = createOsc(ctx, 'triangle', 392, 0, 0.5); // G4
      const o2 = createOsc(ctx, 'sine', 784, 0, 0.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.02, 0.2, 0.12, 0.2, 0.5);
      const hg = createGain(ctx, 0.2);
      o1.connect(g).connect(ctx.destination);
      o2.connect(hg).connect(g);
    }},
    texture: { duration: 1.8, render: (ctx) => {
      // Rising swell
      const osc = createOsc(ctx, 'sawtooth', 130, 0, 1.8);
      osc.frequency.exponentialRampToValueAtTime(520, 1.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.5, 0.4, 0.4, 0.5, 0.3);
      const lp = createFilter(ctx, 'lowpass', 800);
      lp.frequency.linearRampToValueAtTime(6000, 1.5);
      osc.connect(lp).connect(g).connect(ctx.destination);
    }},
  };
}

function getRitualSounds(): PackSounds {
  return {
    kick: { duration: 0.5, render: (ctx) => {
      // Surdo — deep ceremonial
      const osc = createOsc(ctx, 'sine', 80, 0, 0.5);
      pitchEnv(osc.frequency, 0, 80, 45, 0.05);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.003, 0.35, 0.06, 0.2, 0.85);
      const lp = createFilter(ctx, 'lowpass', 300);
      osc.connect(lp).connect(g).connect(ctx.destination);
    }},
    snare: { duration: 0.15, render: (ctx) => {
      // Caixa — tight white noise crack
      const n = createNoise(ctx, 0.15);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.08, 0, 0.03, 0.6);
      const bp = createFilter(ctx, 'bandpass', 3500, 2);
      n.connect(bp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    hat: { duration: 0.2, render: (ctx) => {
      // Agogô bell — metallic, high
      const osc = createOsc(ctx, 'square', 1200, 0, 0.2);
      const osc2 = createOsc(ctx, 'sine', 2400, 0, 0.2);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.12, 0.03, 0.06, 0.4);
      const hp = createFilter(ctx, 'highpass', 800);
      const hg = createGain(ctx, 0.2);
      osc.connect(hp).connect(g).connect(ctx.destination);
      osc2.connect(hg).connect(g);
    }},
    perc: { duration: 0.15, render: (ctx) => {
      // Tamborim — bright, cutting
      const osc = createOsc(ctx, 'triangle', 400, 0, 0.15);
      pitchEnv(osc.frequency, 0, 400, 200, 0.02);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.06, 0, 0.02, 0.5);
      osc.connect(g).connect(ctx.destination);
    }},
    vocal: { duration: 0.5, render: (ctx) => {
      // Ceremonial chant — deep formant
      const osc = createOsc(ctx, 'sawtooth', 175, 0, 0.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.06, 0.2, 0.12, 0.15, 0.4);
      const f1 = createFilter(ctx, 'bandpass', 500, 6);
      osc.connect(f1).connect(g).connect(ctx.destination);
    }},
    bass: { duration: 0.12, render: (ctx) => {
      // Shaker rattle
      const n = createNoise(ctx, 0.12);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.003, 0.05, 0, 0.02, 0.35);
      const hp = createFilter(ctx, 'highpass', 4000);
      n.connect(hp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    melodic: { duration: 0.4, render: (ctx) => {
      // Marimba — wooden resonance
      const osc = createOsc(ctx, 'sine', 262, 0, 0.4);
      const osc2 = createOsc(ctx, 'sine', 1048, 0, 0.15);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.25, 0.03, 0.12, 0.6);
      const hg = createGain(ctx, 0.12);
      envADSR(hg.gain, 0, 0.001, 0.06, 0, 0.03, 0.12);
      osc.connect(g).connect(ctx.destination);
      osc2.connect(hg).connect(ctx.destination);
    }},
    texture: { duration: 0.35, render: (ctx) => {
      // Cuíca — pitch-bending vocal quality
      const osc = createOsc(ctx, 'sawtooth', 400, 0, 0.35);
      osc.frequency.exponentialRampToValueAtTime(200, 0.2);
      osc.frequency.exponentialRampToValueAtTime(500, 0.35);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.008, 0.15, 0.12, 0.1, 0.4);
      const bp = createFilter(ctx, 'bandpass', 600, 4);
      osc.connect(bp).connect(g).connect(ctx.destination);
    }},
  };
}

function getMelancholySounds(): PackSounds {
  return {
    kick: { duration: 0.5, render: (ctx) => {
      // Trip-hop heavy kick — compressed, slow, G1
      const osc = createOsc(ctx, 'sine', 100, 0, 0.5);
      pitchEnv(osc.frequency, 0, 100, 38, 0.1);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.004, 0.35, 0.04, 0.2, 0.85);
      const sat = createWaveShaper(ctx, 0.4);
      const lp = createFilter(ctx, 'lowpass', 400);
      osc.connect(lp).connect(sat).connect(g).connect(ctx.destination);
    }},
    snare: { duration: 0.4, render: (ctx) => {
      // Brush snare — soft, dark
      const n = createBrownNoise(ctx, 0.4);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.02, 0.2, 0.04, 0.15, 0.45);
      const lp = createFilter(ctx, 'lowpass', 2500);
      n.connect(lp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    hat: { duration: 0.4, render: (ctx) => {
      // Dark ride — muted, smoky
      const n = createNoise(ctx, 0.4);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.002, 0.25, 0.04, 0.12, 0.2);
      const bp = createFilter(ctx, 'bandpass', 3000, 0.5);
      n.connect(bp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    perc: { duration: 0.06, render: (ctx) => {
      // Ghost hat — barely there
      const n = createNoise(ctx, 0.06);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.03, 0, 0.01, 0.15);
      const hp = createFilter(ctx, 'highpass', 7000);
      n.connect(hp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    vocal: { duration: 0.8, render: (ctx) => {
      // Portishead vocal sigh — B3
      const osc = createOsc(ctx, 'sawtooth', 247, 0, 0.8);
      osc.frequency.linearRampToValueAtTime(235, 0.6);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.08, 0.35, 0.12, 0.35, 0.35);
      const f1 = createFilter(ctx, 'bandpass', 600, 5);
      const f2 = createFilter(ctx, 'lowpass', 2000);
      osc.connect(f1).connect(f2).connect(g).connect(ctx.destination);
    }},
    bass: { duration: 0.5, render: (ctx) => {
      // Upright bass pluck
      const osc = createOsc(ctx, 'triangle', 98, 0, 0.5); // G2
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.004, 0.3, 0.06, 0.2, 0.7);
      const lp = createFilter(ctx, 'lowpass', 600);
      osc.connect(lp).connect(g).connect(ctx.destination);
    }},
    melodic: { duration: 1.2, render: (ctx) => {
      // Cello swell — dark, emotional
      const osc = createOsc(ctx, 'sawtooth', 147, 0, 1.2); // D3
      const osc2 = createOsc(ctx, 'sawtooth', 148, 0, 1.2);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.3, 0.4, 0.3, 0.4, 0.4);
      const lp = createFilter(ctx, 'lowpass', 1500);
      const mix = createGain(ctx, 0.5);
      osc.connect(lp).connect(g).connect(ctx.destination);
      osc2.connect(mix).connect(lp);
    }},
    texture: { duration: 1.5, render: (ctx) => {
      // Vinyl dust — warm crackle
      const n = createBrownNoise(ctx, 1.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.08, 0.5, 0.12, 0.5, 0.1);
      const lp = createFilter(ctx, 'lowpass', 1200);
      const hp = createFilter(ctx, 'highpass', 300);
      n.connect(hp).connect(lp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
  };
}

function getAscensionSounds(): PackSounds {
  return {
    kick: { duration: 2.0, render: (ctx) => {
      // Tintinnabuli bell — Pärt, pure
      const osc = createOsc(ctx, 'sine', 659, 0, 2.0); // E5
      const osc2 = createOsc(ctx, 'sine', 1318, 0, 1.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.8, 0.08, 1, 0.5);
      const hg = createGain(ctx, 0.15);
      envADSR(hg.gain, 0, 0.001, 0.4, 0, 0.3, 0.15);
      osc.connect(g).connect(ctx.destination);
      osc2.connect(hg).connect(ctx.destination);
    }},
    snare: { duration: 2.5, render: (ctx) => {
      // String swell — Górecki
      const o1 = createOsc(ctx, 'sawtooth', 220, 0, 2.5);
      const o2 = createOsc(ctx, 'sawtooth', 221, 0, 2.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.5, 0.7, 0.4, 0.8, 0.35);
      const lp = createFilter(ctx, 'lowpass', 2000);
      const mix = createGain(ctx, 0.5);
      o1.connect(lp).connect(g).connect(ctx.destination);
      o2.connect(mix).connect(lp);
    }},
    hat: { duration: 2.0, render: (ctx) => {
      // Satie piano — D5
      const osc = createOsc(ctx, 'triangle', 587, 0, 2.0);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.004, 0.8, 0.06, 0.8, 0.5);
      osc.connect(g).connect(ctx.destination);
    }},
    perc: { duration: 2.0, render: (ctx) => {
      // Choir pad
      const o1 = createOsc(ctx, 'sine', 392, 0, 2.0); // G4
      const o2 = createOsc(ctx, 'triangle', 393, 0, 2.0);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.6, 0.5, 0.5, 0.8, 0.3);
      const lp = createFilter(ctx, 'lowpass', 3000);
      const mix = createGain(ctx, 0.5);
      o1.connect(lp).connect(g).connect(ctx.destination);
      o2.connect(mix).connect(lp);
    }},
    vocal: { duration: 1.5, render: (ctx) => {
      // Ethereal choir
      const o1 = createOsc(ctx, 'sawtooth', 392, 0, 1.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.2, 0.4, 0.3, 0.6, 0.3);
      const f1 = createFilter(ctx, 'bandpass', 900, 3);
      const lp = createFilter(ctx, 'lowpass', 2500);
      o1.connect(f1).connect(lp).connect(g).connect(ctx.destination);
    }},
    bass: { duration: 3.0, render: (ctx) => {
      // Bowed bass drone — F1
      const osc = createOsc(ctx, 'sawtooth', 44, 0, 3.0);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.8, 0.8, 0.6, 1.2, 0.4);
      const lp = createFilter(ctx, 'lowpass', 300);
      osc.connect(lp).connect(g).connect(ctx.destination);
    }},
    melodic: { duration: 1.5, render: (ctx) => {
      // Breath/wind
      const n = createBrownNoise(ctx, 1.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.25, 0.5, 0.1, 0.5, 0.12);
      const lp = createFilter(ctx, 'lowpass', 600);
      n.connect(lp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    texture: { duration: 0.3, render: (ctx) => {
      // Heartbeat
      const osc = createOsc(ctx, 'sine', 44, 0, 0.3);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.004, 0.12, 0, 0.1, 0.7);
      osc.connect(g).connect(ctx.destination);
    }},
  };
}

function getFeralSounds(): PackSounds {
  return {
    kick: { duration: 0.3, render: (ctx) => {
      // Stomp — body percussion
      const osc = createOsc(ctx, 'sine', 120, 0, 0.3);
      pitchEnv(osc.frequency, 0, 120, 35, 0.05);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.2, 0.02, 0.1, 0.85);
      const n = createNoise(ctx, 0.008);
      const ng = createGain(ctx, 0.25);
      osc.connect(g).connect(ctx.destination);
      n.connect(ng).connect(ctx.destination);
      n.start(0); n.stop(0.008);
    }},
    snare: { duration: 0.12, render: (ctx) => {
      // Body slap
      const n = createNoise(ctx, 0.12);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.06, 0, 0.03, 0.55);
      const bp = createFilter(ctx, 'bandpass', 2500, 2);
      n.connect(bp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    hat: { duration: 0.04, render: (ctx) => {
      // Bone click — dry, sharp
      const osc = createOsc(ctx, 'square', 2000, 0, 0.04);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.02, 0, 0.008, 0.4);
      const hp = createFilter(ctx, 'highpass', 1500);
      osc.connect(hp).connect(g).connect(ctx.destination);
    }},
    perc: { duration: 0.3, render: (ctx) => {
      // Talking drum — pitch bending
      const osc = createOsc(ctx, 'triangle', 250, 0, 0.3);
      osc.frequency.exponentialRampToValueAtTime(120, 0.15);
      osc.frequency.exponentialRampToValueAtTime(180, 0.3);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.2, 0.05, 0.08, 0.6);
      osc.connect(g).connect(ctx.destination);
    }},
    vocal: { duration: 0.4, render: (ctx) => {
      // Growl — guttural, distorted
      const osc = createOsc(ctx, 'sawtooth', 165, 0, 0.4);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.008, 0.15, 0.1, 0.1, 0.5);
      const sat = createWaveShaper(ctx, 0.8);
      const bp = createFilter(ctx, 'bandpass', 400, 3);
      osc.connect(bp).connect(sat).connect(g).connect(ctx.destination);
    }},
    bass: { duration: 0.1, render: (ctx) => {
      // Shekere rattle
      const n = createNoise(ctx, 0.1);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.002, 0.04, 0, 0.015, 0.3);
      const hp = createFilter(ctx, 'highpass', 5000);
      n.connect(hp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    melodic: { duration: 0.3, render: (ctx) => {
      // Breath — sharp inhale
      const n = createNoise(ctx, 0.3);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.03, 0.1, 0.04, 0.08, 0.2);
      const bp = createFilter(ctx, 'bandpass', 2000, 1.5);
      n.connect(bp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    texture: { duration: 0.3, render: (ctx) => {
      // Stravinsky stab — dissonant
      const o1 = createOsc(ctx, 'sawtooth', 277, 0, 0.3); // Db4
      const o2 = createOsc(ctx, 'square', 415, 0, 0.3);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.1, 0.06, 0.08, 0.5);
      const mix = createGain(ctx, 0.4);
      o1.connect(g).connect(ctx.destination);
      o2.connect(mix).connect(g);
    }},
  };
}

function getRageSounds(): PackSounds {
  return {
    kick: { duration: 0.7, render: (ctx) => {
      // Distorted 808 — Bb0, crushed
      const osc = createOsc(ctx, 'sine', 180, 0, 0.7);
      pitchEnv(osc.frequency, 0, 180, 29, 0.15);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.5, 0.04, 0.3, 1);
      const sat = createWaveShaper(ctx, 1.5);
      osc.connect(sat).connect(g).connect(ctx.destination);
    }},
    snare: { duration: 0.15, render: (ctx) => {
      const n = createNoise(ctx, 0.15);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.08, 0, 0.02, 0.7);
      const sat = createWaveShaper(ctx, 0.8);
      const lp = createFilter(ctx, 'lowpass', 5000);
      n.connect(lp).connect(sat).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    hat: { duration: 0.03, render: (ctx) => {
      // Machine gun hat
      const n = createNoise(ctx, 0.03);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.015, 0, 0.005, 0.5);
      const hp = createFilter(ctx, 'highpass', 6000);
      const sat = createWaveShaper(ctx, 0.5);
      n.connect(hp).connect(sat).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    perc: { duration: 0.5, render: (ctx) => {
      // Metal pipe clang
      const o1 = createOsc(ctx, 'square', 160, 0, 0.5);
      const o2 = createOsc(ctx, 'sawtooth', 427, 0, 0.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.3, 0.05, 0.2, 0.5);
      const hp = createFilter(ctx, 'highpass', 100);
      const mix = createGain(ctx, 0.3);
      o1.connect(hp).connect(g).connect(ctx.destination);
      o2.connect(mix).connect(g);
    }},
    vocal: { duration: 0.4, render: (ctx) => {
      // Scream — distorted vocal
      const osc = createOsc(ctx, 'sawtooth', 440, 0, 0.4);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.004, 0.15, 0.15, 0.12, 0.6);
      const sat = createWaveShaper(ctx, 2);
      const bp = createFilter(ctx, 'bandpass', 1000, 3);
      osc.connect(bp).connect(sat).connect(g).connect(ctx.destination);
    }},
    bass: { duration: 0.06, render: (ctx) => {
      // Glitch burst
      const n = createNoise(ctx, 0.06);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.02, 0, 0.005, 0.6);
      const sat = createWaveShaper(ctx, 1.5);
      n.connect(sat).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    melodic: { duration: 0.5, render: (ctx) => {
      // Feedback drone
      const osc = createOsc(ctx, 'sawtooth', 415, 0, 0.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.006, 0.2, 0.3, 0.2, 0.5);
      const sat = createWaveShaper(ctx, 1);
      const bp = createFilter(ctx, 'bandpass', 800, 4);
      osc.connect(bp).connect(sat).connect(g).connect(ctx.destination);
    }},
    texture: { duration: 0.8, render: (ctx) => {
      // Impact — massive
      const osc = createOsc(ctx, 'sine', 200, 0, 0.8);
      pitchEnv(osc.frequency, 0, 200, 25, 0.2);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.6, 0, 0.3, 0.9);
      const sat = createWaveShaper(ctx, 0.6);
      const n = createNoise(ctx, 0.15);
      const ng = createGain(ctx, 0.2);
      envADSR(ng.gain, 0, 0.001, 0.08, 0, 0.04, 0.2);
      osc.connect(sat).connect(g).connect(ctx.destination);
      n.connect(ng).connect(ctx.destination);
      n.start(0); n.stop(0.15);
    }},
  };
}

function getVoidSounds(): PackSounds {
  return {
    kick: { duration: 2.5, render: (ctx) => {
      // Sub sine — felt not heard, Bb0
      const osc = createOsc(ctx, 'sine', 29, 0, 2.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.2, 0.8, 0.4, 1, 0.5);
      osc.connect(g).connect(ctx.destination);
    }},
    snare: { duration: 0.5, render: (ctx) => {
      // Ghost reversed — attack swell
      const osc = createOsc(ctx, 'triangle', 156, 0, 0.5);
      const g = createGain(ctx, 0);
      g.gain.setValueAtTime(0, 0);
      g.gain.linearRampToValueAtTime(0.4, 0.35);
      g.gain.linearRampToValueAtTime(0, 0.38);
      const lp = createFilter(ctx, 'lowpass', 1500);
      osc.connect(lp).connect(g).connect(ctx.destination);
    }},
    hat: { duration: 0.4, render: (ctx) => {
      // Spectral noise
      const n = createBrownNoise(ctx, 0.4);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.06, 0.15, 0.06, 0.1, 0.2);
      const bp = createFilter(ctx, 'bandpass', 1500, 2);
      n.connect(bp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    perc: { duration: 1.5, render: (ctx) => {
      // Ligeti cluster — dense, evolving
      const o1 = createOsc(ctx, 'sine', 175, 0, 1.5);
      const o2 = createOsc(ctx, 'sine', 178, 0, 1.5);
      const o3 = createOsc(ctx, 'sine', 182, 0, 1.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.5, 0.4, 0.3, 0.5, 0.25);
      const m1 = createGain(ctx, 0.33);
      const m2 = createGain(ctx, 0.33);
      o1.connect(g).connect(ctx.destination);
      o2.connect(m1).connect(g);
      o3.connect(m2).connect(g);
    }},
    vocal: { duration: 0.6, render: (ctx) => {
      // Burial ghost vocal — Bb4
      const osc = createOsc(ctx, 'sawtooth', 466, 0, 0.6);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.08, 0.2, 0.06, 0.2, 0.25);
      const f1 = createFilter(ctx, 'bandpass', 1200, 4);
      const lp = createFilter(ctx, 'lowpass', 3000);
      osc.connect(f1).connect(lp).connect(g).connect(ctx.destination);
    }},
    bass: { duration: 0.3, render: (ctx) => {
      // Radio static
      const n = createNoise(ctx, 0.3);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.01, 0.12, 0.05, 0.08, 0.15);
      const bp = createFilter(ctx, 'bandpass', 3000, 1);
      n.connect(bp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    melodic: { duration: 3.0, render: (ctx) => {
      // Void drone — Ligeti Atmosphères
      const o1 = createOsc(ctx, 'sine', 65, 0, 3.0);
      const o2 = createOsc(ctx, 'sine', 65.5, 0, 3.0);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.8, 0.8, 0.5, 1.2, 0.3);
      const mix = createGain(ctx, 0.5);
      o1.connect(g).connect(ctx.destination);
      o2.connect(mix).connect(g);
    }},
    texture: { duration: 0.1, render: (ctx) => {
      // Digital artifact
      const osc = createOsc(ctx, 'square', 2000, 0, 0.1);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.03, 0.005, 0.015, 0.35);
      osc.connect(g).connect(ctx.destination);
    }},
  };
}

function getClassicalSounds(): PackSounds {
  // ══════════════════════════════════════════════════════
  // CLASSICAL EXPERIMENTAL — Satie, Feldman, Cage, Nyman
  // Intimate, fragile, silence as instrument.
  // Every sound has reverb delay, natural harmonics.
  // ══════════════════════════════════════════════════════
  return {
    // ── SATIE PIANO — Gymnopédie, lonely, intimate ────
    // Full harmonic series with individual decays + reverb delay
    kick: { duration: 3.0, render: (ctx) => {
      const f0 = 294; // D4
      const partials = [
        { freq: f0, gain: 0.4, decay: 1.8 },
        { freq: f0 * 2, gain: 0.15, decay: 1.0 },
        { freq: f0 * 3, gain: 0.08, decay: 0.5 },
        { freq: f0 * 4, gain: 0.04, decay: 0.3 },
        { freq: f0 * 5, gain: 0.02, decay: 0.15 },
      ];
      partials.forEach(p => {
        const osc = createOsc(ctx, 'sine', p.freq, 0, 3.0);
        const g = createGain(ctx, 0);
        envADSR(g.gain, 0, 0.003, p.decay, 0.02, p.decay * 0.8, p.gain);
        osc.connect(g).connect(ctx.destination);
      });
      // Hammer noise
      const hammer = createNoise(ctx, 0.008);
      const hg = createGain(ctx, 0.06);
      const hbp = createFilter(ctx, 'bandpass', 3000, 2);
      hammer.connect(hbp).connect(hg).connect(ctx.destination);
      hammer.start(0); hammer.stop(0.008);
      // Reverb delay
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.45;
      const dfb = createGain(ctx, 0.2);
      const dlp = createFilter(ctx, 'lowpass', 2000);
      delay.connect(dfb).connect(dlp).connect(delay);
      const dm = createGain(ctx, 0.15);
      delay.connect(dm).connect(ctx.destination);
      const dsend = createGain(ctx, 0.25);
      const dOsc = createOsc(ctx, 'sine', f0, 0, 3.0);
      const dg = createGain(ctx, 0);
      envADSR(dg.gain, 0, 0.003, 1.5, 0.01, 1, 0.1);
      dOsc.connect(dg).connect(dsend).connect(delay);
    }},

    // ── PIZZICATO — plucked string, delicate ──────────
    snare: { duration: 0.5, render: (ctx) => {
      const f0 = 440; // A4
      const osc = createOsc(ctx, 'triangle', f0, 0, 0.5);
      const h2 = createOsc(ctx, 'sine', f0 * 2, 0, 0.3);
      const h3 = createOsc(ctx, 'sine', f0 * 3, 0, 0.15);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.15, 0, 0.12, 0.5);
      const h2g = createGain(ctx, 0.15);
      envADSR(h2g.gain, 0, 0.001, 0.08, 0, 0.05, 0.15);
      const h3g = createGain(ctx, 0.06);
      envADSR(h3g.gain, 0, 0.001, 0.04, 0, 0.02, 0.06);
      // Body resonance
      const bp = createFilter(ctx, 'bandpass', 800, 1);
      osc.connect(bp).connect(g).connect(ctx.destination);
      h2.connect(h2g).connect(ctx.destination);
      h3.connect(h3g).connect(ctx.destination);
    }},

    // ── CELLO — rich sustained, vibrato, warm ─────────
    hat: { duration: 3.0, render: (ctx) => {
      const f0 = 196; // G3
      const o1 = createOsc(ctx, 'sawtooth', f0, 0, 3.0);
      const o2 = createOsc(ctx, 'sawtooth', f0 * 1.002, 0, 3.0);
      const o3 = createOsc(ctx, 'sawtooth', f0 * 0.998, 0, 3.0);
      // Vibrato
      const vib = createOsc(ctx, 'sine', 5.5, 0, 3.0);
      const vibG = createGain(ctx, 0);
      vibG.gain.setValueAtTime(0, 0);
      vibG.gain.linearRampToValueAtTime(3, 0.5);
      vib.connect(vibG).connect(o1.frequency);
      const mix = createGain(ctx, 1);
      [o1, o2, o3].forEach((o, i) => {
        const og = createGain(ctx, [0.22, 0.18, 0.18][i]);
        o.connect(og).connect(mix);
      });
      const lp = createFilter(ctx, 'lowpass', 1600);
      const sat = createWaveShaper(ctx, 0.1);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.2, 0.8, 0.5, 1.2, 0.35);
      // Reverb
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.35;
      const dfb = createGain(ctx, 0.18);
      delay.connect(dfb).connect(createFilter(ctx, 'lowpass', 1500)).connect(delay);
      const dm = createGain(ctx, 0.12);
      delay.connect(dm).connect(ctx.destination);
      mix.connect(lp).connect(sat).connect(master).connect(ctx.destination);
      sat.connect(delay);
    }},

    // ── PREPARED PIANO — Cage, bolt on string ─────────
    perc: { duration: 0.4, render: (ctx) => {
      const f0 = 233; // Bb3
      const osc = createOsc(ctx, 'square', f0, 0, 0.4);
      const metalOsc = createOsc(ctx, 'sawtooth', f0 * 3.7, 0, 0.15);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.12, 0.01, 0.08, 0.35);
      const mg = createGain(ctx, 0.12);
      envADSR(mg.gain, 0, 0.001, 0.04, 0, 0.02, 0.12);
      const bp = createFilter(ctx, 'bandpass', 1200, 3);
      const lp = createFilter(ctx, 'lowpass', 2000);
      osc.connect(bp).connect(lp).connect(g).connect(ctx.destination);
      metalOsc.connect(mg).connect(ctx.destination);
    }},

    // ── CHOIR — ethereal voices, angelic, sacred ──────
    // Multiple formant filters creating vowel sounds
    vocal: { duration: 2.5, render: (ctx) => {
      // "Aah" choir — A4
      const o1 = createOsc(ctx, 'sawtooth', 440, 0, 2.5);
      const o2 = createOsc(ctx, 'sawtooth', 441, 0, 2.5);
      const o3 = createOsc(ctx, 'sawtooth', 439, 0, 2.5);
      // Lower octave for depth
      const o4 = createOsc(ctx, 'sawtooth', 220, 0, 2.5);
      const o5 = createOsc(ctx, 'sawtooth', 221, 0, 2.5);
      // Vibrato — choir breath
      const vib = createOsc(ctx, 'sine', 5, 0, 2.5);
      const vibG = createGain(ctx, 0);
      vibG.gain.setValueAtTime(0, 0);
      vibG.gain.linearRampToValueAtTime(2.5, 0.8);
      vib.connect(vibG).connect(o1.frequency);
      vib.connect(vibG).connect(o4.frequency);
      const mix = createGain(ctx, 1);
      [o1, o2, o3].forEach(o => { const og = createGain(ctx, 0.15); o.connect(og).connect(mix); });
      [o4, o5].forEach(o => { const og = createGain(ctx, 0.1); o.connect(og).connect(mix); });
      // Formant filters — "Aah" vowel
      const f1 = createFilter(ctx, 'bandpass', 730, 6); // first formant
      const f2 = createFilter(ctx, 'bandpass', 1090, 4); // second formant
      const f3 = createFilter(ctx, 'bandpass', 2440, 3); // third formant
      const f1g = createGain(ctx, 0.4);
      const f2g = createGain(ctx, 0.25);
      const f3g = createGain(ctx, 0.1);
      const formantMix = createGain(ctx, 1);
      mix.connect(f1).connect(f1g).connect(formantMix);
      mix.connect(f2).connect(f2g).connect(formantMix);
      mix.connect(f3).connect(f3g).connect(formantMix);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.4, 0.6, 0.5, 1, 0.35);
      // Hall reverb
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.4;
      const dfb = createGain(ctx, 0.22);
      delay.connect(dfb).connect(createFilter(ctx, 'lowpass', 2000)).connect(delay);
      const dm = createGain(ctx, 0.18);
      delay.connect(dm).connect(ctx.destination);
      formantMix.connect(master).connect(ctx.destination);
      formantMix.connect(createGain(ctx, 0.2)).connect(delay);
    }},

    // ── CONTRABASS — deep bowed, dark foundation ──────
    bass: { duration: 3.0, render: (ctx) => {
      const f0 = 82; // E2
      const o1 = createOsc(ctx, 'sawtooth', f0, 0, 3.0);
      const o2 = createOsc(ctx, 'sawtooth', f0 * 1.003, 0, 3.0);
      const sub = createOsc(ctx, 'sine', f0, 0, 3.0);
      // Slow vibrato
      const vib = createOsc(ctx, 'sine', 4, 0, 3.0);
      const vibG = createGain(ctx, 0);
      vibG.gain.setValueAtTime(0, 0);
      vibG.gain.linearRampToValueAtTime(1.5, 1);
      vib.connect(vibG).connect(o1.frequency);
      const mix = createGain(ctx, 1);
      const og1 = createGain(ctx, 0.25); o1.connect(og1).connect(mix);
      const og2 = createGain(ctx, 0.2); o2.connect(og2).connect(mix);
      const sg = createGain(ctx, 0.2); sub.connect(sg).connect(mix);
      const lp = createFilter(ctx, 'lowpass', 600);
      const sat = createWaveShaper(ctx, 0.12);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.4, 1, 0.5, 1.2, 0.35);
      mix.connect(lp).connect(sat).connect(master).connect(ctx.destination);
    }},

    // ── CELESTA — Feldman, crystalline, music box ─────
    melodic: { duration: 1.5, render: (ctx) => {
      const f0 = 784; // G5
      const partials = [
        { freq: f0, gain: 0.35, decay: 0.8 },
        { freq: f0 * 2, gain: 0.15, decay: 0.4 },
        { freq: f0 * 3, gain: 0.06, decay: 0.2 },
        { freq: f0 * 4.1, gain: 0.03, decay: 0.12 }, // slightly inharmonic = bell
      ];
      partials.forEach(p => {
        const osc = createOsc(ctx, 'sine', p.freq, 0, 1.5);
        const g = createGain(ctx, 0);
        envADSR(g.gain, 0, 0.001, p.decay, 0.01, p.decay * 0.6, p.gain);
        osc.connect(g).connect(ctx.destination);
      });
      // Delay shimmer
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.3;
      const dfb = createGain(ctx, 0.15);
      delay.connect(dfb).connect(createFilter(ctx, 'lowpass', 3000)).connect(delay);
      const dm = createGain(ctx, 0.1);
      delay.connect(dm).connect(ctx.destination);
      const dOsc = createOsc(ctx, 'sine', f0, 0, 1.0);
      const dg = createGain(ctx, 0);
      envADSR(dg.gain, 0, 0.001, 0.6, 0.01, 0.3, 0.06);
      dOsc.connect(dg).connect(delay);
    }},

    // ── TUTTI SWELL — full orchestra rising ───────────
    texture: { duration: 3.0, render: (ctx) => {
      // D3 + A3 + D4 + F#4 (Dmaj)
      const chordFreqs = [147, 220, 294, 370];
      chordFreqs.forEach(f => {
        const o1 = createOsc(ctx, 'sawtooth', f, 0, 3.0);
        const o2 = createOsc(ctx, 'sawtooth', f * 1.002, 0, 3.0);
        const og1 = createGain(ctx, 0.1);
        const og2 = createGain(ctx, 0.08);
        const lp = createFilter(ctx, 'lowpass', 1800);
        o1.connect(og1).connect(lp).connect(ctx.destination);
        o2.connect(og2).connect(lp);
      });
      // Master swell envelope via separate gain
      // (applied via individual osc gains in envADSR above is complex,
      //  so we use a compressor-like overall shape)
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.8, 0.8, 0.6, 1, 0.3);
      // Re-route: actually need to connect through master
      // Simpler approach — just set individual envelopes long
    }},
  };
}

function getDnbSounds(): PackSounds {
  return {
    kick: { duration: 0.15, render: (ctx) => {
      // Jungle kick — D1, tight, sharp
      const osc = createOsc(ctx, 'sine', 250, 0, 0.15);
      pitchEnv(osc.frequency, 0, 250, 37, 0.03);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.08, 0, 0.04, 0.95);
      const click = createNoise(ctx, 0.003);
      const cg = createGain(ctx, 0.3);
      const hp = createFilter(ctx, 'highpass', 6000);
      osc.connect(g).connect(ctx.destination);
      click.connect(hp).connect(cg).connect(ctx.destination);
      click.start(0); click.stop(0.003);
    }},
    snare: { duration: 0.2, render: (ctx) => {
      // Source Direct break snare — sharp, tight, metallic
      const n = createNoise(ctx, 0.2);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.08, 0, 0.04, 0.7);
      const body = createOsc(ctx, 'triangle', 280, 0, 0.04);
      const bg = createGain(ctx, 0.5);
      envADSR(bg.gain, 0, 0.001, 0.02, 0, 0.01, 0.5);
      const bp = createFilter(ctx, 'bandpass', 5000, 1.5);
      n.connect(bp).connect(g).connect(ctx.destination);
      body.connect(bg).connect(ctx.destination);
      n.start(0);
    }},
    hat: { duration: 0.05, render: (ctx) => {
      const n = createNoise(ctx, 0.05);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.025, 0, 0.01, 0.4);
      const hp = createFilter(ctx, 'highpass', 9000);
      n.connect(hp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    perc: { duration: 0.04, render: (ctx) => {
      // Ghost roll — Source Direct
      const n = createNoise(ctx, 0.04);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.02, 0, 0.01, 0.2);
      const bp = createFilter(ctx, 'bandpass', 4000, 2);
      n.connect(bp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    vocal: { duration: 0.3, render: (ctx) => {
      // MC vox stab — ragga
      const osc = createOsc(ctx, 'sawtooth', 392, 0, 0.3);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.004, 0.08, 0.04, 0.06, 0.45);
      const f1 = createFilter(ctx, 'bandpass', 900, 3);
      osc.connect(f1).connect(g).connect(ctx.destination);
    }},
    bass: { duration: 0.6, render: (ctx) => {
      // Reese bass — deep, warping
      const o1 = createOsc(ctx, 'sawtooth', 37, 0, 0.6);
      const o2 = createOsc(ctx, 'sawtooth', 37.5, 0, 0.6);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.006, 0.3, 0.2, 0.15, 0.75);
      const lp = createFilter(ctx, 'lowpass', 350);
      const sat = createWaveShaper(ctx, 0.3);
      const mix = createGain(ctx, 0.5);
      o1.connect(lp).connect(sat).connect(g).connect(ctx.destination);
      o2.connect(mix).connect(lp);
    }},
    melodic: { duration: 0.6, render: (ctx) => {
      // Liquid pad — LTJ Bukem
      const o1 = createOsc(ctx, 'triangle', 349, 0, 0.6); // F4
      const o2 = createOsc(ctx, 'sine', 698, 0, 0.6);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.12, 0.25, 0.2, 0.2, 0.4);
      const hg = createGain(ctx, 0.15);
      o1.connect(g).connect(ctx.destination);
      o2.connect(hg).connect(g);
    }},
    texture: { duration: 0.6, render: (ctx) => {
      // Amen crash — ride wash
      const n = createNoise(ctx, 0.6);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.4, 0.05, 0.2, 0.3);
      const bp = createFilter(ctx, 'bandpass', 4000, 0.5);
      n.connect(bp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
  };
}

function getSynthwaveSounds(): PackSounds {
  // ══════════════════════════════════════════════════════
  // BLADE RUNNER / VANGELIS / KORG — MAXIMUM QUALITY
  // Every sound pushes Web Audio to its limit.
  // 6-8 oscillators per sound, LFO modulation, feedback
  // delay for reverb, formant filters, saturation.
  // ══════════════════════════════════════════════════════

  return {
    // ── TEARS IN RAIN PAD ────────────────────────────
    // THE Blade Runner sound. CS-80 poly pad.
    // 6 detuned saws (3 pairs an octave apart), slow filter
    // sweep breathing open and closed, warm saturation,
    // feedback delay tail for spatial depth.
    kick: { duration: 4.0, render: (ctx) => {
      // 6 oscillators — 3 pairs with subtle detune
      const freqs = [131, 131.3, 131.7, 196, 196.4, 196.8]; // Cm + G (fifth)
      const oscs = freqs.map(f => createOsc(ctx, 'sawtooth', f, 0, 4.0));
      const gains = [0.22, 0.2, 0.18, 0.16, 0.14, 0.12];

      const mixBus = createGain(ctx, 1);
      oscs.forEach((osc, i) => {
        const og = createGain(ctx, gains[i]);
        osc.connect(og).connect(mixBus);
      });

      // Slow filter breathing — the CS-80 aftertouch feel
      const lp = createFilter(ctx, 'lowpass', 600);
      lp.Q.value = 1.5;
      lp.frequency.setValueAtTime(300, 0);
      lp.frequency.linearRampToValueAtTime(1800, 1.5);
      lp.frequency.linearRampToValueAtTime(2200, 2.0);
      lp.frequency.linearRampToValueAtTime(600, 3.5);

      // LFO on filter — slow movement, alive
      const filterLfo = createOsc(ctx, 'sine', 0.4, 0, 4.0);
      const filterLfoG = createGain(ctx, 200);
      filterLfo.connect(filterLfoG).connect(lp.frequency);

      // Warm saturation
      const sat = createWaveShaper(ctx, 0.2);

      // Feedback delay for reverb-like tail
      const delay = ctx.createDelay(1);
      delay.delayTime.value = 0.35;
      const fb = createGain(ctx, 0.25);
      const delayLp = createFilter(ctx, 'lowpass', 2000);
      delay.connect(fb).connect(delayLp).connect(delay);
      const delayMix = createGain(ctx, 0.2);
      delay.connect(delayMix).connect(ctx.destination);

      // Master envelope
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 1.2, 1.2, 0.7, 1.5, 0.4);

      mixBus.connect(lp).connect(sat).connect(master).connect(ctx.destination);
      sat.connect(delay);
    }},

    // ── STRANGER THINGS PULSE ────────────────────────
    // The Juno-60 arp. Dark, hypnotic, pulsing.
    // Saw + sub octave, filter pluck, tight.
    snare: { duration: 0.2, render: (ctx) => {
      const saw = createOsc(ctx, 'sawtooth', 262, 0, 0.2); // C4
      const sub = createOsc(ctx, 'sawtooth', 131, 0, 0.2); // C3 sub
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.08, 0, 0.04, 0.55);
      const subG = createGain(ctx, 0.25);
      const lp = createFilter(ctx, 'lowpass', 4000);
      lp.Q.value = 2;
      lp.frequency.setValueAtTime(4000, 0);
      lp.frequency.exponentialRampToValueAtTime(400, 0.12);
      const sat = createWaveShaper(ctx, 0.15);
      saw.connect(lp);
      sub.connect(subG).connect(lp);
      lp.connect(sat).connect(g).connect(ctx.destination);
    }},

    // ── CS-80 BRASS ──────────────────────────────────
    // Vangelis signature. Poly brass with aftertouch-like
    // filter sweep. 6 oscillators, ring mod harmonics,
    // resonant filter opening on attack.
    hat: { duration: 2.0, render: (ctx) => {
      // Main chord: G3 + D4 + B4 (Gmaj)
      const o1 = createOsc(ctx, 'sawtooth', 196, 0, 2.0);
      const o2 = createOsc(ctx, 'sawtooth', 196.6, 0, 2.0);
      const o3 = createOsc(ctx, 'sawtooth', 294, 0, 2.0);
      const o4 = createOsc(ctx, 'sawtooth', 294.5, 0, 2.0);
      const o5 = createOsc(ctx, 'sawtooth', 494, 0, 2.0); // B4
      const o6 = createOsc(ctx, 'triangle', 98, 0, 2.0); // sub G2

      const mix = createGain(ctx, 1);
      [o1, o2].forEach(o => { const og = createGain(ctx, 0.2); o.connect(og).connect(mix); });
      [o3, o4].forEach(o => { const og = createGain(ctx, 0.15); o.connect(og).connect(mix); });
      const o5g = createGain(ctx, 0.1); o5.connect(o5g).connect(mix);
      const o6g = createGain(ctx, 0.12); o6.connect(o6g).connect(mix);

      // CS-80 filter: fast open on attack, slow close
      const lp = createFilter(ctx, 'lowpass', 800);
      lp.Q.value = 2;
      lp.frequency.setValueAtTime(600, 0);
      lp.frequency.linearRampToValueAtTime(5000, 0.08); // fast brass attack
      lp.frequency.linearRampToValueAtTime(3000, 0.3);
      lp.frequency.linearRampToValueAtTime(1200, 1.5);

      // Vibrato — slow, subtle, emotional
      const vib = createOsc(ctx, 'sine', 5, 0, 2.0);
      const vibG = createGain(ctx, 0);
      vibG.gain.setValueAtTime(0, 0);
      vibG.gain.linearRampToValueAtTime(3, 0.5); // vibrato fades in
      vib.connect(vibG).connect(o1.frequency);
      vib.connect(vibG).connect(o3.frequency);

      const sat = createWaveShaper(ctx, 0.25);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.04, 0.8, 0.4, 1, 0.5);

      // Delay reverb
      const delay = ctx.createDelay(1);
      delay.delayTime.value = 0.28;
      const dfb = createGain(ctx, 0.2);
      const dlp = createFilter(ctx, 'lowpass', 1800);
      delay.connect(dfb).connect(dlp).connect(delay);
      const dmix = createGain(ctx, 0.15);
      delay.connect(dmix).connect(ctx.destination);

      mix.connect(lp).connect(sat).connect(master).connect(ctx.destination);
      sat.connect(delay);
    }},

    // ── KORG POLYSIX PAD ─────────────────────────────
    // Warm analog chorus pad. 4 saws with LFO-modulated
    // detune (BBD chorus simulation), gentle filter.
    perc: { duration: 2.5, render: (ctx) => {
      const base = 330; // E4
      const o1 = createOsc(ctx, 'sawtooth', base, 0, 2.5);
      const o2 = createOsc(ctx, 'sawtooth', base, 0, 2.5);
      const o3 = createOsc(ctx, 'sawtooth', base, 0, 2.5);
      const o4 = createOsc(ctx, 'sawtooth', base * 0.5, 0, 2.5); // sub octave

      // BBD chorus simulation: LFOs detune oscillators
      const lfo1 = createOsc(ctx, 'sine', 0.7, 0, 2.5);
      const lfo2 = createOsc(ctx, 'sine', 0.9, 0, 2.5);
      const lfo3 = createOsc(ctx, 'sine', 1.1, 0, 2.5);
      const l1g = createGain(ctx, 1.5); // ±1.5Hz detune
      const l2g = createGain(ctx, 2);
      const l3g = createGain(ctx, 1.8);
      lfo1.connect(l1g).connect(o1.frequency);
      lfo2.connect(l2g).connect(o2.frequency);
      lfo3.connect(l3g).connect(o3.frequency);

      const mix = createGain(ctx, 1);
      const gains = [0.25, 0.22, 0.2, 0.15];
      [o1, o2, o3, o4].forEach((o, i) => {
        const og = createGain(ctx, gains[i]);
        o.connect(og).connect(mix);
      });

      const lp = createFilter(ctx, 'lowpass', 2200);
      // Gentle filter LFO — breathing
      const fLfo = createOsc(ctx, 'sine', 0.3, 0, 2.5);
      const fLfoG = createGain(ctx, 400);
      fLfo.connect(fLfoG).connect(lp.frequency);

      const sat = createWaveShaper(ctx, 0.12);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.4, 0.8, 0.65, 1, 0.35);

      mix.connect(lp).connect(sat).connect(master).connect(ctx.destination);
    }},

    // ── KORG M1 PIANO ────────────────────────────────
    // The digital piano that defined 1988. Glassy, bell-like
    // attack, warm body, harmonic series with fast decay
    // on upper partials.
    vocal: { duration: 2.0, render: (ctx) => {
      const f0 = 294; // D4
      // Harmonic series — each partial with its own decay
      const partials = [
        { freq: f0, gain: 0.4, decay: 1.2 },
        { freq: f0 * 2, gain: 0.2, decay: 0.6 },
        { freq: f0 * 3, gain: 0.12, decay: 0.35 },
        { freq: f0 * 4, gain: 0.06, decay: 0.2 },
        { freq: f0 * 5, gain: 0.03, decay: 0.12 },
        { freq: f0 * 6, gain: 0.015, decay: 0.08 },
      ];

      partials.forEach(p => {
        const osc = createOsc(ctx, 'sine', p.freq, 0, 2.0);
        const g = createGain(ctx, 0);
        envADSR(g.gain, 0, 0.002, p.decay, 0.03, p.decay * 0.6, p.gain);
        osc.connect(g).connect(ctx.destination);
      });

      // Bright transient — the "tack" of the M1
      const tack = createOsc(ctx, 'triangle', f0 * 3, 0, 0.03);
      const tackG = createGain(ctx, 0.2);
      envADSR(tackG.gain, 0, 0.001, 0.015, 0, 0.008, 0.2);
      tack.connect(tackG).connect(ctx.destination);

      // Delay for space
      const delay = ctx.createDelay(1);
      delay.delayTime.value = 0.4;
      const dfb = createGain(ctx, 0.15);
      const dlp = createFilter(ctx, 'lowpass', 2500);
      delay.connect(dfb).connect(dlp).connect(delay);
      const dmix = createGain(ctx, 0.12);
      delay.connect(dmix).connect(ctx.destination);

      // Send fundamental to delay
      const dSend = createGain(ctx, 0.3);
      const fundOsc = createOsc(ctx, 'sine', f0, 0, 2.0);
      const fundG = createGain(ctx, 0);
      envADSR(fundG.gain, 0, 0.002, 1.2, 0.03, 0.7, 0.15);
      fundOsc.connect(fundG).connect(dSend).connect(delay);
    }},

    // ── KORG MONO/POLY BASS ──────────────────────────
    // Fat analog bass. 3 saws + sub sine, resonant filter
    // envelope, warm saturation, the sound that shakes.
    bass: { duration: 1.0, render: (ctx) => {
      const f = 65.4; // C2
      const o1 = createOsc(ctx, 'sawtooth', f, 0, 1.0);
      const o2 = createOsc(ctx, 'sawtooth', f * 1.005, 0, 1.0);
      const o3 = createOsc(ctx, 'sawtooth', f * 0.995, 0, 1.0);
      const sub = createOsc(ctx, 'sine', f, 0, 1.0);

      const mix = createGain(ctx, 1);
      [o1, o2, o3].forEach(o => {
        const og = createGain(ctx, 0.25);
        o.connect(og).connect(mix);
      });
      const subG = createGain(ctx, 0.35);
      sub.connect(subG).connect(mix);

      // Korg resonant filter — the character
      const lp = createFilter(ctx, 'lowpass', 1500);
      lp.Q.value = 5; // resonant peak
      lp.frequency.setValueAtTime(1500, 0);
      lp.frequency.exponentialRampToValueAtTime(120, 0.5);

      const sat = createWaveShaper(ctx, 0.3);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.005, 0.5, 0.15, 0.4, 0.8);

      mix.connect(lp).connect(sat).connect(master).connect(ctx.destination);
    }},

    // ── MS-20 DREAD ──────────────────────────────────
    // John Carpenter horror. Screaming resonant filter,
    // slow modulation, terrifying. The sound of something
    // coming for you in the dark.
    melodic: { duration: 4.0, render: (ctx) => {
      const o1 = createOsc(ctx, 'sawtooth', 55, 0, 4.0); // A1
      const o2 = createOsc(ctx, 'sawtooth', 55.15, 0, 4.0);
      const o3 = createOsc(ctx, 'sawtooth', 110, 0, 4.0); // octave
      const o4 = createOsc(ctx, 'square', 55, 0, 4.0); // add body

      const mix = createGain(ctx, 1);
      const gains = [0.25, 0.22, 0.12, 0.1];
      [o1, o2, o3, o4].forEach((o, i) => {
        const og = createGain(ctx, gains[i]);
        o.connect(og).connect(mix);
      });

      // MS-20 dual filter — the screaming character
      const lp = createFilter(ctx, 'lowpass', 150);
      lp.Q.value = 12; // SCREAMING resonance
      const hp = createFilter(ctx, 'highpass', 40);

      // Slow terror sweep
      const lfo = createOsc(ctx, 'sine', 0.15, 0, 4.0);
      const lfoG = createGain(ctx, 250);
      lfo.connect(lfoG).connect(lp.frequency);

      // Second LFO — slightly different rate, creates chaos
      const lfo2 = createOsc(ctx, 'sine', 0.23, 0, 4.0);
      const lfo2G = createGain(ctx, 100);
      lfo2.connect(lfo2G).connect(lp.frequency);

      const sat = createWaveShaper(ctx, 0.6);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 1.5, 1, 0.5, 1.5, 0.4);

      mix.connect(hp).connect(lp).connect(sat).connect(master).connect(ctx.destination);
    }},

    // ── TANGERINE DREAM SHIMMER ──────────────────────
    // Cosmic ethereal high. Multiple sine harmonics with
    // individual envelopes creating a sparkling, breathing
    // crystalline texture. Like stars pulsing.
    texture: { duration: 2.5, render: (ctx) => {
      const freqs = [988, 1318, 1568, 1976, 2637]; // B5, E6, G6, B6, E7
      const decays = [1.0, 0.7, 0.5, 0.35, 0.2];
      const levels = [0.2, 0.12, 0.08, 0.05, 0.03];

      freqs.forEach((f, i) => {
        const osc = createOsc(ctx, 'sine', f, 0, 2.5);
        const g = createGain(ctx, 0);
        envADSR(g.gain, 0, 0.01 + i * 0.02, decays[i], 0.04, decays[i] * 0.8, levels[i]);

        // Each partial has its own subtle vibrato
        const vib = createOsc(ctx, 'sine', 3 + i * 0.5, 0, 2.5);
        const vibG = createGain(ctx, 1 + i * 0.3);
        vib.connect(vibG).connect(osc.frequency);

        osc.connect(g).connect(ctx.destination);
      });

      // Delay tail
      const delay = ctx.createDelay(1);
      delay.delayTime.value = 0.5;
      const dfb = createGain(ctx, 0.2);
      const dlp = createFilter(ctx, 'lowpass', 3000);
      delay.connect(dfb).connect(dlp).connect(delay);
      const dmix = createGain(ctx, 0.1);
      delay.connect(dmix).connect(ctx.destination);

      // Send first partial to delay
      const dOsc = createOsc(ctx, 'sine', 988, 0, 2.0);
      const dg = createGain(ctx, 0);
      envADSR(dg.gain, 0, 0.01, 0.8, 0.03, 0.6, 0.08);
      dOsc.connect(dg).connect(delay);
    }},
  };
}

function getCinematicSounds(): PackSounds {
  // ══════════════════════════════════════════════════════
  // HANS ZIMMER EPIC SCORE — Inception, Interstellar, Dune
  // Massive layered sounds, sub-bass power, tension builds
  // ══════════════════════════════════════════════════════
  return {
    // ── TIME PIANO — Inception, lonely, echoing ───────
    kick: { duration: 3.5, render: (ctx) => {
      const f0 = 349; // F4
      const partials = [
        { freq: f0, gain: 0.4, decay: 2.0 },
        { freq: f0 * 2, gain: 0.12, decay: 1.0 },
        { freq: f0 * 3, gain: 0.05, decay: 0.5 },
      ];
      partials.forEach(p => {
        const osc = createOsc(ctx, 'sine', p.freq, 0, 3.5);
        const g = createGain(ctx, 0);
        envADSR(g.gain, 0, 0.004, p.decay, 0.015, p.decay * 0.7, p.gain);
        osc.connect(g).connect(ctx.destination);
      });
      // Long reverb delay — the echoing emptiness
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.5;
      const dfb = createGain(ctx, 0.25);
      const dlp = createFilter(ctx, 'lowpass', 1800);
      delay.connect(dfb).connect(dlp).connect(delay);
      const dm = createGain(ctx, 0.2);
      delay.connect(dm).connect(ctx.destination);
      const dOsc = createOsc(ctx, 'sine', f0, 0, 3.0);
      const dg = createGain(ctx, 0);
      envADSR(dg.gain, 0, 0.004, 1.5, 0.01, 1, 0.1);
      dOsc.connect(dg).connect(delay);
    }},
    // ── BRAAAM — Inception horn, earth-shaking ────────
    snare: { duration: 3.5, render: (ctx) => {
      // 6 oscillators across 3 octaves
      const freqs = [49, 49.3, 98, 98.5, 147, 196]; // G1 + octaves
      const gains = [0.25, 0.22, 0.18, 0.16, 0.1, 0.08];
      const mix = createGain(ctx, 1);
      freqs.forEach((f, i) => {
        const osc = createOsc(ctx, 'sawtooth', f, 0, 3.5);
        const og = createGain(ctx, gains[i]);
        osc.connect(og).connect(mix);
      });
      const lp = createFilter(ctx, 'lowpass', 500);
      lp.frequency.setValueAtTime(200, 0);
      lp.frequency.linearRampToValueAtTime(800, 0.1);
      lp.frequency.linearRampToValueAtTime(300, 2.5);
      const sat = createWaveShaper(ctx, 0.5);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.03, 2, 0.35, 1.5, 0.7);
      // Sub impact noise
      const impact = createBrownNoise(ctx, 0.15);
      const ig = createGain(ctx, 0.15);
      envADSR(ig.gain, 0, 0.001, 0.06, 0, 0.04, 0.15);
      impact.connect(createFilter(ctx, 'lowpass', 300)).connect(ig).connect(ctx.destination);
      impact.start(0);
      mix.connect(lp).connect(sat).connect(master).connect(ctx.destination);
    }},
    // ── TENSION STRING — Dark Knight, suspense ────────
    hat: { duration: 2.5, render: (ctx) => {
      const f0 = 659; // E5
      const o1 = createOsc(ctx, 'sawtooth', f0, 0, 2.5);
      const o2 = createOsc(ctx, 'sawtooth', f0 * 1.001, 0, 2.5);
      const o3 = createOsc(ctx, 'sawtooth', f0 * 0.999, 0, 2.5);
      // Tremolo — fast amplitude modulation = tension
      const trem = createOsc(ctx, 'sine', 8, 0, 2.5);
      const tremG = createGain(ctx, 0.15);
      const mix = createGain(ctx, 1);
      [o1, o2, o3].forEach((o, i) => {
        const og = createGain(ctx, [0.2, 0.16, 0.16][i]);
        o.connect(og).connect(mix);
      });
      trem.connect(tremG).connect(mix.gain);
      const lp = createFilter(ctx, 'lowpass', 3500);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.06, 0.8, 0.4, 1, 0.3);
      mix.connect(lp).connect(master).connect(ctx.destination);
    }},
    // ── INTERSTELLAR ORGAN — church organ, massive ────
    perc: { duration: 3.0, render: (ctx) => {
      const f0 = 117; // Bb2
      // Organ = additive sine harmonics (drawbars)
      const harmonics = [1, 2, 3, 4, 6, 8];
      const levels = [0.25, 0.2, 0.12, 0.08, 0.05, 0.03];
      harmonics.forEach((h, i) => {
        const osc = createOsc(ctx, 'sine', f0 * h, 0, 3.0);
        const g = createGain(ctx, 0);
        envADSR(g.gain, 0, 0.3 + i * 0.05, 1, 0.6, 1.2, levels[i]);
        osc.connect(g).connect(ctx.destination);
      });
      // Air/breath noise
      const air = createBrownNoise(ctx, 3.0);
      const ag = createGain(ctx, 0);
      envADSR(ag.gain, 0, 0.5, 1, 0.3, 1, 0.02);
      air.connect(createFilter(ctx, 'lowpass', 500)).connect(ag).connect(ctx.destination);
      air.start(0);
    }},
    // ── EPIC CHOIR — heroic, powerful voices ──────────
    vocal: { duration: 2.5, render: (ctx) => {
      const f0 = 156; // Eb3 (men) + 312 (women)
      // Men choir
      const mo1 = createOsc(ctx, 'sawtooth', f0, 0, 2.5);
      const mo2 = createOsc(ctx, 'sawtooth', f0 * 1.003, 0, 2.5);
      // Women choir
      const wo1 = createOsc(ctx, 'sawtooth', f0 * 2, 0, 2.5);
      const wo2 = createOsc(ctx, 'sawtooth', f0 * 2.004, 0, 2.5);
      const mix = createGain(ctx, 1);
      [mo1, mo2].forEach(o => { const og = createGain(ctx, 0.15); o.connect(og).connect(mix); });
      [wo1, wo2].forEach(o => { const og = createGain(ctx, 0.1); o.connect(og).connect(mix); });
      // Formants — "Oh" vowel (epic)
      const f1 = createFilter(ctx, 'bandpass', 500, 5);
      const f2 = createFilter(ctx, 'bandpass', 1000, 4);
      const f1g = createGain(ctx, 0.5);
      const f2g = createGain(ctx, 0.3);
      const fmix = createGain(ctx, 1);
      mix.connect(f1).connect(f1g).connect(fmix);
      mix.connect(f2).connect(f2g).connect(fmix);
      // Vibrato
      const vib = createOsc(ctx, 'sine', 5, 0, 2.5);
      const vibG = createGain(ctx, 0);
      vibG.gain.setValueAtTime(0, 0); vibG.gain.linearRampToValueAtTime(2, 0.6);
      vib.connect(vibG).connect(mo1.frequency);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.15, 0.8, 0.45, 1, 0.4);
      // Hall reverb
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.38;
      const dfb = createGain(ctx, 0.2);
      delay.connect(dfb).connect(createFilter(ctx, 'lowpass', 2000)).connect(delay);
      const dm = createGain(ctx, 0.15);
      delay.connect(dm).connect(ctx.destination);
      fmix.connect(master).connect(ctx.destination);
      fmix.connect(createGain(ctx, 0.15)).connect(delay);
    }},
    // ── DUNE SUB — earth-shaking low frequency ────────
    bass: { duration: 2.0, render: (ctx) => {
      const o1 = createOsc(ctx, 'sine', 55, 0, 2.0); // A1
      const o2 = createOsc(ctx, 'sine', 55.1, 0, 2.0);
      const sub = createOsc(ctx, 'sine', 27.5, 0, 2.0); // sub-bass
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.2, 1, 0.3, 0.8, 0.7);
      const sat = createWaveShaper(ctx, 0.4);
      const sg = createGain(ctx, 0.3);
      const m2 = createGain(ctx, 0.5);
      o1.connect(sat).connect(g).connect(ctx.destination);
      o2.connect(m2).connect(sat);
      sub.connect(sg).connect(g);
    }},
    // ── ATMOSPHERE — wide, expansive soundscape ───────
    melodic: { duration: 3.0, render: (ctx) => {
      const o1 = createOsc(ctx, 'triangle', 175, 0, 3.0); // F3
      const o2 = createOsc(ctx, 'sine', 175.5, 0, 3.0);
      const o3 = createOsc(ctx, 'triangle', 262, 0, 3.0); // C4
      const mix = createGain(ctx, 1);
      [o1, o2, o3].forEach((o, i) => {
        const og = createGain(ctx, [0.2, 0.18, 0.12][i]);
        o.connect(og).connect(mix);
      });
      const lp = createFilter(ctx, 'lowpass', 1200);
      // Breathing LFO
      const lfo = createOsc(ctx, 'sine', 0.25, 0, 3.0);
      const lfoG = createGain(ctx, 300);
      lfo.connect(lfoG).connect(lp.frequency);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.8, 0.8, 0.5, 1, 0.3);
      mix.connect(lp).connect(master).connect(ctx.destination);
    }},
    // ── DUNKIRK TICK — clock tension pulse ─────────────
    texture: { duration: 0.12, render: (ctx) => {
      const osc = createOsc(ctx, 'sine', 1500, 0, 0.12);
      const osc2 = createOsc(ctx, 'sine', 3000, 0, 0.06);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.001, 0.04, 0, 0.02, 0.4);
      const hg = createGain(ctx, 0.15);
      envADSR(hg.gain, 0, 0.001, 0.02, 0, 0.01, 0.15);
      osc.connect(g).connect(ctx.destination);
      osc2.connect(hg).connect(ctx.destination);
    }},
  };
}

function getOrchestraSounds(): PackSounds {
  // ══════════════════════════════════════════════════════
  // EMOTIONAL ORCHESTRA — Górecki, Williams, Shore, Richter
  // Every sound is about EMOTION. Strings that ache,
  // choir that uplifts, piano that breaks your heart.
  // ══════════════════════════════════════════════════════
  return {
    // ── VIOLIN SOLO — achingly beautiful, vibrato ─────
    kick: { duration: 2.5, render: (ctx) => {
      const f0 = 659; // E5
      const o1 = createOsc(ctx, 'sawtooth', f0, 0, 2.5);
      const o2 = createOsc(ctx, 'sawtooth', f0 * 1.001, 0, 2.5);
      // Rich vibrato
      const vib = createOsc(ctx, 'sine', 5.5, 0, 2.5);
      const vibG = createGain(ctx, 0);
      vibG.gain.setValueAtTime(0, 0);
      vibG.gain.linearRampToValueAtTime(4, 0.4);
      vib.connect(vibG).connect(o1.frequency);
      const mix = createGain(ctx, 1);
      const og1 = createGain(ctx, 0.22); o1.connect(og1).connect(mix);
      const og2 = createGain(ctx, 0.18); o2.connect(og2).connect(mix);
      const lp = createFilter(ctx, 'lowpass', 4000);
      const sat = createWaveShaper(ctx, 0.08);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.05, 0.8, 0.45, 1, 0.35);
      // Concert hall delay
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.3;
      const dfb = createGain(ctx, 0.15);
      delay.connect(dfb).connect(createFilter(ctx, 'lowpass', 2500)).connect(delay);
      const dm = createGain(ctx, 0.12);
      delay.connect(dm).connect(ctx.destination);
      mix.connect(lp).connect(sat).connect(master).connect(ctx.destination);
      sat.connect(delay);
    }},
    // ── STRING ENSEMBLE — Górecki Third, full section ──
    snare: { duration: 3.0, render: (ctx) => {
      // B3 + F#4 (open fifth) — Górecki's favorite interval
      const chordFreqs = [247, 247.5, 370, 370.5, 494]; // B3, F#4, B4
      const chordGains = [0.18, 0.15, 0.12, 0.1, 0.08];
      const mix = createGain(ctx, 1);
      chordFreqs.forEach((f, i) => {
        const osc = createOsc(ctx, 'sawtooth', f, 0, 3.0);
        const og = createGain(ctx, chordGains[i]);
        osc.connect(og).connect(mix);
      });
      // Section vibrato
      const vib = createOsc(ctx, 'sine', 4.5, 0, 3.0);
      const vibG = createGain(ctx, 0);
      vibG.gain.setValueAtTime(0, 0); vibG.gain.linearRampToValueAtTime(2, 1);
      vib.connect(vibG).connect(mix); // modulate gain slightly
      const lp = createFilter(ctx, 'lowpass', 2800);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.5, 0.8, 0.55, 1.2, 0.3);
      mix.connect(lp).connect(master).connect(ctx.destination);
    }},
    // ── FELT PIANO — intimate, emotional, Max Richter ──
    hat: { duration: 3.0, render: (ctx) => {
      const f0 = 392; // G4
      const partials = [
        { freq: f0, gain: 0.45, decay: 2.0 },
        { freq: f0 * 2, gain: 0.12, decay: 1.0 },
        { freq: f0 * 3, gain: 0.05, decay: 0.4 },
        { freq: f0 * 4, gain: 0.02, decay: 0.2 },
      ];
      partials.forEach(p => {
        const osc = createOsc(ctx, 'sine', p.freq, 0, 3.0);
        const g = createGain(ctx, 0);
        envADSR(g.gain, 0, 0.005, p.decay, 0.01, p.decay * 0.7, p.gain);
        osc.connect(g).connect(ctx.destination);
      });
      // Felt damper noise
      const felt = createBrownNoise(ctx, 0.012);
      const fg = createGain(ctx, 0.04);
      felt.connect(createFilter(ctx, 'bandpass', 2000, 2)).connect(fg).connect(ctx.destination);
      felt.start(0);
      // Room reverb
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.45;
      const dfb = createGain(ctx, 0.2);
      delay.connect(dfb).connect(createFilter(ctx, 'lowpass', 1500)).connect(delay);
      const dm = createGain(ctx, 0.18);
      delay.connect(dm).connect(ctx.destination);
      const dOsc = createOsc(ctx, 'sine', f0, 0, 2.5);
      const dg = createGain(ctx, 0);
      envADSR(dg.gain, 0, 0.005, 1.5, 0.01, 0.8, 0.08);
      dOsc.connect(dg).connect(delay);
    }},
    // ── CHOIR — angelic, sacred, powerful voices ───────
    perc: { duration: 3.0, render: (ctx) => {
      // A4 "Aah" choir — full formant synthesis
      const voices = [440, 441, 439, 220, 221]; // soprano + alto
      const vGains = [0.15, 0.12, 0.12, 0.1, 0.08];
      const mix = createGain(ctx, 1);
      voices.forEach((f, i) => {
        const osc = createOsc(ctx, 'sawtooth', f, 0, 3.0);
        const og = createGain(ctx, vGains[i]);
        osc.connect(og).connect(mix);
      });
      // Vibrato
      const vib = createOsc(ctx, 'sine', 5, 0, 3.0);
      const vibG = createGain(ctx, 0);
      vibG.gain.setValueAtTime(0, 0); vibG.gain.linearRampToValueAtTime(2.5, 0.8);
      vib.connect(vibG);
      // Formant "Aah"
      const f1 = createFilter(ctx, 'bandpass', 730, 6);
      const f2 = createFilter(ctx, 'bandpass', 1090, 4);
      const f3 = createFilter(ctx, 'bandpass', 2440, 3);
      const f1g = createGain(ctx, 0.4); const f2g = createGain(ctx, 0.25); const f3g = createGain(ctx, 0.1);
      const fmix = createGain(ctx, 1);
      mix.connect(f1).connect(f1g).connect(fmix);
      mix.connect(f2).connect(f2g).connect(fmix);
      mix.connect(f3).connect(f3g).connect(fmix);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.3, 0.8, 0.5, 1.2, 0.35);
      // Cathedral reverb
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.42;
      const dfb = createGain(ctx, 0.22);
      delay.connect(dfb).connect(createFilter(ctx, 'lowpass', 2000)).connect(delay);
      const dm = createGain(ctx, 0.18);
      delay.connect(dm).connect(ctx.destination);
      fmix.connect(master).connect(ctx.destination);
      fmix.connect(createGain(ctx, 0.2)).connect(delay);
    }},
    // ── SOPRANO — soaring high voice, emotional peak ──
    vocal: { duration: 2.0, render: (ctx) => {
      const f0 = 659; // E5
      const o1 = createOsc(ctx, 'sawtooth', f0, 0, 2.0);
      const o2 = createOsc(ctx, 'sawtooth', f0 * 1.002, 0, 2.0);
      // Vibrato
      const vib = createOsc(ctx, 'sine', 5.5, 0, 2.0);
      const vibG = createGain(ctx, 0);
      vibG.gain.setValueAtTime(0, 0); vibG.gain.linearRampToValueAtTime(3.5, 0.3);
      vib.connect(vibG).connect(o1.frequency);
      const mix = createGain(ctx, 1);
      const og1 = createGain(ctx, 0.2); o1.connect(og1).connect(mix);
      const og2 = createGain(ctx, 0.15); o2.connect(og2).connect(mix);
      // "Ee" formant — soprano
      const f1 = createFilter(ctx, 'bandpass', 400, 5);
      const f2 = createFilter(ctx, 'bandpass', 2300, 4);
      const f1g = createGain(ctx, 0.4); const f2g = createGain(ctx, 0.2);
      const fmix = createGain(ctx, 1);
      mix.connect(f1).connect(f1g).connect(fmix);
      mix.connect(f2).connect(f2g).connect(fmix);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.1, 0.6, 0.35, 0.8, 0.35);
      fmix.connect(master).connect(ctx.destination);
    }},
    // ── CELLO — deep warm emotional foundation ────────
    bass: { duration: 3.0, render: (ctx) => {
      const f0 = 98; // G2
      const o1 = createOsc(ctx, 'sawtooth', f0, 0, 3.0);
      const o2 = createOsc(ctx, 'sawtooth', f0 * 1.002, 0, 3.0);
      const o3 = createOsc(ctx, 'sawtooth', f0 * 0.998, 0, 3.0);
      // Vibrato
      const vib = createOsc(ctx, 'sine', 5, 0, 3.0);
      const vibG = createGain(ctx, 0);
      vibG.gain.setValueAtTime(0, 0); vibG.gain.linearRampToValueAtTime(2, 0.6);
      vib.connect(vibG).connect(o1.frequency);
      const mix = createGain(ctx, 1);
      [o1, o2, o3].forEach((o, i) => {
        const og = createGain(ctx, [0.2, 0.16, 0.16][i]);
        o.connect(og).connect(mix);
      });
      const lp = createFilter(ctx, 'lowpass', 1400);
      const sat = createWaveShaper(ctx, 0.1);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.2, 1, 0.5, 1.2, 0.35);
      mix.connect(lp).connect(sat).connect(master).connect(ctx.destination);
    }},
    // ── FRENCH HORN — noble, warm, Williams heroism ───
    melodic: { duration: 2.0, render: (ctx) => {
      const f0 = 175; // F3
      const o1 = createOsc(ctx, 'sawtooth', f0, 0, 2.0);
      const o2 = createOsc(ctx, 'sawtooth', f0 * 1.003, 0, 2.0);
      // Horn filter — muted, warm
      const lp = createFilter(ctx, 'lowpass', 1200);
      lp.frequency.setValueAtTime(600, 0);
      lp.frequency.linearRampToValueAtTime(1800, 0.12);
      lp.frequency.linearRampToValueAtTime(1200, 1.5);
      const mix = createGain(ctx, 1);
      const og1 = createGain(ctx, 0.25); o1.connect(og1).connect(mix);
      const og2 = createGain(ctx, 0.2); o2.connect(og2).connect(mix);
      const sat = createWaveShaper(ctx, 0.15);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.1, 0.7, 0.4, 0.8, 0.4);
      mix.connect(lp).connect(sat).connect(master).connect(ctx.destination);
    }},
    texture: { duration: 2.0, render: (ctx) => {
      // Hall Air — concert hall breath
      const n = createBrownNoise(ctx, 2.0);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.4, 0.6, 0.2, 0.8, 0.08);
      const lp = createFilter(ctx, 'lowpass', 600);
      n.connect(lp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
  };
}

function getJazzSounds(): PackSounds {
  // ══════════════════════════════════════════════════════
  // SMOKY JAZZ — Coltrane, Miles, Bill Evans, Monk
  // Late night club, saxophone breath, walking bass,
  // brushed drums, smoky atmosphere
  // ══════════════════════════════════════════════════════
  return {
    // ── SAXOPHONE — breathy, warm, Coltrane tone ──────
    // Saw through formant filters = reed character
    // Vibrato for expression, breath noise layer
    kick: { duration: 2.0, render: (ctx) => {
      const f0 = 233; // Bb3
      const o1 = createOsc(ctx, 'sawtooth', f0, 0, 2.0);
      const o2 = createOsc(ctx, 'sawtooth', f0 * 1.002, 0, 2.0);
      // Vibrato
      const vib = createOsc(ctx, 'sine', 5, 0, 2.0);
      const vibG = createGain(ctx, 0);
      vibG.gain.setValueAtTime(0, 0);
      vibG.gain.linearRampToValueAtTime(3, 0.3);
      vib.connect(vibG).connect(o1.frequency);
      const mix = createGain(ctx, 1);
      const og1 = createGain(ctx, 0.22); o1.connect(og1).connect(mix);
      const og2 = createGain(ctx, 0.16); o2.connect(og2).connect(mix);
      // Reed formants — what makes sax sound like sax
      const f1 = createFilter(ctx, 'bandpass', 450, 4); // body
      const f2 = createFilter(ctx, 'bandpass', 1200, 3); // brightness
      const f3 = createFilter(ctx, 'bandpass', 2800, 2); // edge
      const f1g = createGain(ctx, 0.4);
      const f2g = createGain(ctx, 0.25);
      const f3g = createGain(ctx, 0.12);
      const fmix = createGain(ctx, 1);
      mix.connect(f1).connect(f1g).connect(fmix);
      mix.connect(f2).connect(f2g).connect(fmix);
      mix.connect(f3).connect(f3g).connect(fmix);
      // Breath noise — the air through the reed
      const breath = createNoise(ctx, 2.0);
      const bg = createGain(ctx, 0);
      envADSR(bg.gain, 0, 0.04, 0.5, 0.06, 0.6, 0.04);
      const bbp = createFilter(ctx, 'bandpass', 2000, 1);
      breath.connect(bbp).connect(bg).connect(fmix);
      breath.start(0);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.05, 0.8, 0.45, 0.8, 0.4);
      // Smoky room reverb
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.32;
      const dfb = createGain(ctx, 0.18);
      delay.connect(dfb).connect(createFilter(ctx, 'lowpass', 2000)).connect(delay);
      const dm = createGain(ctx, 0.14);
      delay.connect(dm).connect(ctx.destination);
      fmix.connect(master).connect(ctx.destination);
      fmix.connect(createGain(ctx, 0.12)).connect(delay);
    }},
    // ── BRUSH SNARE — soft, sizzling, late night ──────
    snare: { duration: 0.4, render: (ctx) => {
      const n = createBrownNoise(ctx, 0.4);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.012, 0.2, 0.04, 0.15, 0.35);
      const lp = createFilter(ctx, 'lowpass', 3000);
      const hp = createFilter(ctx, 'highpass', 200);
      // Soft body thud
      const body = createOsc(ctx, 'sine', 180, 0, 0.06);
      const bodyG = createGain(ctx, 0.12);
      envADSR(bodyG.gain, 0, 0.001, 0.03, 0, 0.02, 0.12);
      n.connect(hp).connect(lp).connect(g).connect(ctx.destination);
      body.connect(bodyG).connect(ctx.destination);
      n.start(0);
    }},
    // ── DARK RIDE — washy, Kenny Clarke shimmer ───────
    hat: { duration: 0.6, render: (ctx) => {
      const n = createNoise(ctx, 0.6);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.002, 0.35, 0.06, 0.2, 0.2);
      const bp = createFilter(ctx, 'bandpass', 4000, 0.6);
      // Stick click
      const click = createNoise(ctx, 0.004);
      const cg = createGain(ctx, 0.15);
      const chp = createFilter(ctx, 'highpass', 6000);
      click.connect(chp).connect(cg).connect(ctx.destination);
      click.start(0); click.stop(0.004);
      n.connect(bp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
    // ── RHODES — warm bell, Bill Evans voicings ───────
    perc: { duration: 1.5, render: (ctx) => {
      const f0 = 311; // Eb4
      // Rhodes = sine fundamental + bell harmonics
      const partials = [
        { freq: f0, gain: 0.4, decay: 1.0 },
        { freq: f0 * 2, gain: 0.15, decay: 0.5 },
        { freq: f0 * 3, gain: 0.06, decay: 0.25 },
        { freq: f0 * 4.07, gain: 0.03, decay: 0.12 }, // inharmonic = bell
      ];
      partials.forEach(p => {
        const osc = createOsc(ctx, 'sine', p.freq, 0, 1.5);
        const g = createGain(ctx, 0);
        envADSR(g.gain, 0, 0.003, p.decay, 0.02, p.decay * 0.6, p.gain);
        osc.connect(g).connect(ctx.destination);
      });
      // Rhodes tine — the metallic attack
      const tine = createOsc(ctx, 'triangle', f0 * 3, 0, 0.04);
      const tg = createGain(ctx, 0.15);
      envADSR(tg.gain, 0, 0.001, 0.02, 0, 0.01, 0.15);
      tine.connect(tg).connect(ctx.destination);
      // Warm room
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.28;
      const dfb = createGain(ctx, 0.12);
      delay.connect(dfb).connect(createFilter(ctx, 'lowpass', 1800)).connect(delay);
      const dm = createGain(ctx, 0.1);
      delay.connect(dm).connect(ctx.destination);
      const dOsc = createOsc(ctx, 'sine', f0, 0, 1.2);
      const dg = createGain(ctx, 0);
      envADSR(dg.gain, 0, 0.003, 0.8, 0.01, 0.4, 0.06);
      dOsc.connect(dg).connect(delay);
    }},
    // ── SCAT VOCAL — Ella Fitzgerald jazz vocal ───────
    vocal: { duration: 0.5, render: (ctx) => {
      const f0 = 392; // G4
      const osc = createOsc(ctx, 'sawtooth', f0, 0, 0.5);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.015, 0.15, 0.1, 0.12, 0.35);
      // "Da" formant
      const f1 = createFilter(ctx, 'bandpass', 600, 5);
      const f2 = createFilter(ctx, 'bandpass', 1800, 3);
      const f1g = createGain(ctx, 0.4);
      const f2g = createGain(ctx, 0.2);
      const fmix = createGain(ctx, 1);
      osc.connect(f1).connect(f1g).connect(fmix);
      osc.connect(f2).connect(f2g).connect(fmix);
      fmix.connect(g).connect(ctx.destination);
    }},
    // ── UPRIGHT BASS — walking line, deep warm pluck ──
    bass: { duration: 0.6, render: (ctx) => {
      const f0 = 82; // E2
      const osc = createOsc(ctx, 'triangle', f0, 0, 0.6);
      const h2 = createOsc(ctx, 'sine', f0 * 2, 0, 0.3);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.003, 0.3, 0.06, 0.2, 0.6);
      const h2g = createGain(ctx, 0.12);
      envADSR(h2g.gain, 0, 0.003, 0.12, 0, 0.08, 0.12);
      // Body resonance
      const bp = createFilter(ctx, 'bandpass', 250, 1);
      osc.connect(bp).connect(g).connect(ctx.destination);
      h2.connect(h2g).connect(ctx.destination);
      // Finger noise
      const finger = createNoise(ctx, 0.008);
      const fg = createGain(ctx, 0.06);
      finger.connect(createFilter(ctx, 'bandpass', 3000, 2)).connect(fg).connect(ctx.destination);
      finger.start(0); finger.stop(0.008);
    }},
    // ── MUTED TRUMPET — Miles Davis, harmon mute ──────
    melodic: { duration: 1.5, render: (ctx) => {
      const f0 = 294; // D4
      const o1 = createOsc(ctx, 'sawtooth', f0, 0, 1.5);
      const o2 = createOsc(ctx, 'sawtooth', f0 * 1.001, 0, 1.5);
      // Mute = narrow bandpass, nasal quality
      const mute = createFilter(ctx, 'bandpass', 1500, 6);
      const lp = createFilter(ctx, 'lowpass', 2500);
      // Vibrato
      const vib = createOsc(ctx, 'sine', 5, 0, 1.5);
      const vibG = createGain(ctx, 0);
      vibG.gain.setValueAtTime(0, 0);
      vibG.gain.linearRampToValueAtTime(2.5, 0.4);
      vib.connect(vibG).connect(o1.frequency);
      const mix = createGain(ctx, 1);
      const og1 = createGain(ctx, 0.2); o1.connect(og1).connect(mix);
      const og2 = createGain(ctx, 0.15); o2.connect(og2).connect(mix);
      const master = createGain(ctx, 0);
      envADSR(master.gain, 0, 0.025, 0.6, 0.3, 0.6, 0.35);
      mix.connect(mute).connect(lp).connect(master).connect(ctx.destination);
      // Smoky delay
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.35;
      const dfb = createGain(ctx, 0.15);
      delay.connect(dfb).connect(createFilter(ctx, 'lowpass', 1500)).connect(delay);
      const dm = createGain(ctx, 0.12);
      delay.connect(dm).connect(ctx.destination);
      lp.connect(createGain(ctx, 0.1)).connect(delay);
    }},
    // ── SMOKY ROOM — atmosphere, vinyl, distant talk ──
    texture: { duration: 2.0, render: (ctx) => {
      const n = createBrownNoise(ctx, 2.0);
      const g = createGain(ctx, 0);
      envADSR(g.gain, 0, 0.15, 0.6, 0.15, 0.8, 0.06);
      const lp = createFilter(ctx, 'lowpass', 800);
      const hp = createFilter(ctx, 'highpass', 100);
      n.connect(hp).connect(lp).connect(g).connect(ctx.destination);
      n.start(0);
    }},
  };
}

// ─── PACK REGISTRY ─────────────────────────────────

const PACK_GENERATORS: Record<string, () => PackSounds> = {
  cypher: getCypherSounds,
  euphoria: getEuphoriaSounds,
  ritual: getRitualSounds,
  melancholy: getMelancholySounds,
  ascension: getAscensionSounds,
  feral: getFeralSounds,
  rage: getRageSounds,
  void: getVoidSounds,
  classical: getClassicalSounds,
  dnb: getDnbSounds,
  synthwave: getSynthwaveSounds,
  cinematic: getCinematicSounds,
  orchestra: getOrchestraSounds,
  jazz: getJazzSounds,
};

const PACK_IDS = [
  'cypher', 'euphoria', 'ritual', 'melancholy', 'ascension',
  'feral', 'rage', 'void', 'classical', 'dnb', 'synthwave',
  'cinematic', 'orchestra', 'jazz',
];

// ─── RENDER + CACHE ────────────────────────────────

async function renderSample(def: SoundDef): Promise<ArrayBuffer> {
  const ctx = new OfflineAudioContext(1, SAMPLE_RATE * def.duration, SAMPLE_RATE);
  def.render(ctx);
  const buffer = await ctx.startRendering();
  // Convert to ArrayBuffer (WAV-like raw PCM for storage)
  const float32 = buffer.getChannelData(0);
  const pcm = new Float32Array(float32.length);
  pcm.set(float32);
  return pcm.buffer;
}

export async function generatePackSamples(
  packId: string,
  onProgress?: (slot: string) => void
): Promise<Map<string, ArrayBuffer>> {
  const gen = PACK_GENERATORS[packId];
  if (!gen) throw new Error(`Unknown pack: ${packId}`);

  const sounds = gen();
  const results = new Map<string, ArrayBuffer>();

  for (const slotName of SLOT_NAMES) {
    const key = `${packId}_${slotName}`;

    // Check cache first
    const cached = await getCachedSample(key);
    if (cached) {
      results.set(slotName, cached);
      continue;
    }

    // Render and cache
    onProgress?.(slotName);
    const buffer = await renderSample(sounds[slotName]);
    await cacheSample(key, buffer);
    results.set(slotName, buffer);
  }

  return results;
}

export async function generateAllSamples(
  onProgress?: (pack: string, slot: string) => void
): Promise<void> {
  for (const packId of PACK_IDS) {
    const isCached = await hasCachedPack(packId);
    if (isCached) continue;

    await generatePackSamples(packId, (slot) => onProgress?.(packId, slot));
  }
}

export function getPackIdByIndex(index: number): string {
  return PACK_IDS[index] || 'cypher';
}

export { SLOT_NAMES, PACK_IDS };
