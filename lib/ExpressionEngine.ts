import * as Tone from 'tone';
import { PACKS } from '@/data/packs';
import type { BodyState } from './MovementEngine';

/**
 * ExpressionEngine — continuous sound controlled by body movement.
 *
 * 5 voices, one per body zone:
 *   HEAD   → controlled by headFlow, nose velocity/direction
 *   R.ARM  → controlled by rightArmFlow
 *   L.ARM  → controlled by leftArmFlow
 *   TORSO  → controlled by torsoFlow, lean, expansion
 *   LEGS   → controlled by legFlow, verticalEnergy
 *
 * Each voice:
 *   - Volume follows flow intensity (still = silent)
 *   - Pitch bends with velocity (faster = higher pitch)
 *   - Filter opens with intensity
 *   - Reverb responds to expansion
 *
 * The result: movement IS the music. Every gesture shapes the sound.
 *
 * Each pack creates a UNIQUE set of synth voices matched to its sonic identity.
 */

interface Voice {
  synth: Tone.FMSynth | Tone.AMSynth | Tone.MonoSynth | Tone.Synth;
  gain: Tone.Gain;
  filter: Tone.Filter;
  active: boolean;
  baseNote: number; // MIDI note
  currentNote: number;
}

interface VoiceConfig {
  id: string;
  type: 'fm' | 'am' | 'mono' | 'synth';
  midiNote: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: any;
  filterBase?: number;
}

export class ExpressionEngine {
  private voices: Map<string, Voice> = new Map();
  private masterGain: Tone.Gain;
  private reverb: Tone.Reverb;
  private enabled: boolean = true;

  // Smoothed values to avoid clicks
  private smoothGains: Map<string, number> = new Map();

  constructor(outputNode: Tone.InputNode) {
    this.masterGain = new Tone.Gain(0.35); // expression layer is subtle
    this.reverb = new Tone.Reverb({ decay: 3, wet: 0.4 });
    this.masterGain.chain(this.reverb, outputNode as unknown as Tone.ToneAudioNode);
  }

  /** Load expression voices matched to the current pack character */
  loadForPack(packIndex: number): void {
    this.disposeVoices();

    const pack = PACKS[packIndex];
    if (!pack) return;

    const configs = this.getPackVoices(packIndex);
    for (const cfg of configs) {
      this.createVoice(cfg.id, cfg.type, cfg.midiNote, cfg.options, cfg.filterBase);
    }
  }

  /** Returns the 5 voice configurations unique to each pack */
  private getPackVoices(packIndex: number): VoiceConfig[] {
    switch (packIndex) {

      // ── Pack 0 — CYPHER / Boom Bap ──────────────────────
      case 0: return [
        // HEAD: vinyl scratch FM sweep — high, scratchy, DJ Shadow
        { id: 'head', type: 'fm', midiNote: 74, options: { // D5
          harmonicity: 5, modulationIndex: 8,
          envelope: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.2 },
        }, filterBase: 500 },
        // RARM: jazz chord stab — warm triangle, Nujabes feel
        { id: 'rarm', type: 'synth', midiNote: 63, options: { // Eb4
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.008, decay: 0.5, sustain: 0.15, release: 0.4 },
        }, filterBase: 600 },
        // LARM: lo-fi pad — slow AM, dusty warmth
        { id: 'larm', type: 'am', midiNote: 58, options: { // Bb3
          harmonicity: 1.5,
          envelope: { attack: 0.4, decay: 0.8, sustain: 0.6, release: 0.7 },
        }, filterBase: 350 },
        // TORSO: sub bass pulse — deep membrane-like FM
        { id: 'torso', type: 'fm', midiNote: 36, options: { // C2
          harmonicity: 0.5, modulationIndex: 3,
          envelope: { attack: 0.02, decay: 0.6, sustain: 0.5, release: 0.5 },
        }, filterBase: 200 },
        // LEGS: dusty percussion — short, gritty FM click
        { id: 'legs', type: 'fm', midiNote: 50, options: { // D3
          harmonicity: 7, modulationIndex: 12,
          envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 },
        }, filterBase: 400 },
      ];

      // ── Pack 1 — EUPHORIA / Breakbeat ───────────────────
      case 1: return [
        // HEAD: liquid synth rise — bright FM swell
        { id: 'head', type: 'fm', midiNote: 76, options: { // E5
          harmonicity: 3, modulationIndex: 2,
          envelope: { attack: 0.15, decay: 0.4, sustain: 0.5, release: 0.4 },
        }, filterBase: 600 },
        // RARM: arp sequence note — sharp sawtooth pluck
        { id: 'rarm', type: 'mono', midiNote: 67, options: { // G4
          oscillator: { type: 'sawtooth' },
          filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.15, baseFrequency: 400, octaves: 3 },
          envelope: { attack: 0.002, decay: 0.18, sustain: 0.05, release: 0.12 },
        }, filterBase: 800 },
        // LARM: euphoric pad — wide AM, festival swell
        { id: 'larm', type: 'am', midiNote: 64, options: { // E4
          harmonicity: 2,
          envelope: { attack: 0.5, decay: 0.7, sustain: 0.7, release: 0.8 },
        }, filterBase: 400 },
        // TORSO: reese bass modulation — warping sub FM
        { id: 'torso', type: 'fm', midiNote: 38, options: { // D2
          harmonicity: 0.5, modulationIndex: 14,
          envelope: { attack: 0.01, decay: 0.5, sustain: 0.4, release: 0.4 },
        }, filterBase: 180 },
        // LEGS: break percussion — tight FM snap
        { id: 'legs', type: 'fm', midiNote: 55, options: { // G3
          harmonicity: 8, modulationIndex: 18,
          envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 },
        }, filterBase: 500 },
      ];

      // ── Pack 2 — RITUAL / Percussion ────────────────────
      case 2: return [
        // HEAD: agogo bell — bright metallic FM ring
        { id: 'head', type: 'fm', midiNote: 82, options: { // Bb5
          harmonicity: 6.5, modulationIndex: 3,
          envelope: { attack: 0.001, decay: 0.25, sustain: 0.05, release: 0.2 },
        }, filterBase: 800 },
        // RARM: marimba melody — warm FM with fast decay
        { id: 'rarm', type: 'fm', midiNote: 60, options: { // C4
          harmonicity: 4, modulationIndex: 1.5,
          envelope: { attack: 0.001, decay: 0.35, sustain: 0.05, release: 0.25 },
        }, filterBase: 600 },
        // LARM: chant drone — vocal-like FM, ceremonial
        { id: 'larm', type: 'fm', midiNote: 57, options: { // A3
          harmonicity: 2, modulationIndex: 3,
          envelope: { attack: 0.08, decay: 0.6, sustain: 0.5, release: 0.5 },
        }, filterBase: 300 },
        // TORSO: surdo pulse — deep, resonant, ceremonial
        { id: 'torso', type: 'fm', midiNote: 41, options: { // F2
          harmonicity: 1, modulationIndex: 2,
          envelope: { attack: 0.005, decay: 0.55, sustain: 0.08, release: 0.35 },
        }, filterBase: 150 },
        // LEGS: shaker rhythm — bright noise-like FM
        { id: 'legs', type: 'fm', midiNote: 85, options: { // Db6
          harmonicity: 11, modulationIndex: 20,
          envelope: { attack: 0.003, decay: 0.05, sustain: 0, release: 0.02 },
        }, filterBase: 600 },
      ];

      // ── Pack 3 — MELANCHOLY / Trip-Hop ──────────────────
      case 3: return [
        // HEAD: cello swell — slow AM, aching, cinematic
        { id: 'head', type: 'am', midiNote: 62, options: { // D4
          harmonicity: 2.5,
          envelope: { attack: 0.4, decay: 0.6, sustain: 0.5, release: 0.8 },
        }, filterBase: 400 },
        // RARM: rhodes chord — warm triangle, Portishead keys
        { id: 'rarm', type: 'synth', midiNote: 65, options: { // F4
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.01, decay: 0.8, sustain: 0.2, release: 0.6 },
        }, filterBase: 500 },
        // LARM: vocal sigh — breathy FM, haunting
        { id: 'larm', type: 'fm', midiNote: 59, options: { // B3
          harmonicity: 2.8, modulationIndex: 4.5,
          envelope: { attack: 0.1, decay: 0.6, sustain: 0.15, release: 0.6 },
        }, filterBase: 300 },
        // TORSO: upright bass — dark, jazzy triangle
        { id: 'torso', type: 'synth', midiNote: 43, options: { // G2
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.005, decay: 0.4, sustain: 0.1, release: 0.3 },
        }, filterBase: 200 },
        // LEGS: brush texture — soft, jazzy mono
        { id: 'legs', type: 'mono', midiNote: 48, options: { // C3
          oscillator: { type: 'sine' },
          filterEnvelope: { attack: 0.02, decay: 0.3, sustain: 0.05, release: 0.2, baseFrequency: 150, octaves: 2 },
          envelope: { attack: 0.025, decay: 0.35, sustain: 0.04, release: 0.25 },
        }, filterBase: 250 },
      ];

      // ── Pack 4 — ASCENSION / Classical ──────────────────
      case 4: return [
        // HEAD: bell tone — Pärt tintinnabuli, pure FM ring
        { id: 'head', type: 'fm', midiNote: 76, options: { // E5
          harmonicity: 6, modulationIndex: 2.5,
          envelope: { attack: 0.001, decay: 0.8, sustain: 0.15, release: 1 },
        }, filterBase: 700 },
        // RARM: string swell — Górecki AM, slow bloom
        { id: 'rarm', type: 'am', midiNote: 69, options: { // A4
          harmonicity: 2,
          envelope: { attack: 0.6, decay: 0.8, sustain: 0.6, release: 1.2 },
        }, filterBase: 500 },
        // LARM: choir pad — ethereal FM, sacred space
        { id: 'larm', type: 'fm', midiNote: 58, options: { // Bb3
          harmonicity: 1.5, modulationIndex: 0.8,
          envelope: { attack: 1, decay: 1.2, sustain: 0.7, release: 2 },
        }, filterBase: 250 },
        // TORSO: organ drone — deep FM, church reverb
        { id: 'torso', type: 'fm', midiNote: 41, options: { // F2
          harmonicity: 1, modulationIndex: 1.5,
          envelope: { attack: 1, decay: 1.5, sustain: 0.8, release: 2 },
        }, filterBase: 150 },
        // LEGS: heartbeat — deep body pulse, human anchor
        { id: 'legs', type: 'synth', midiNote: 41, options: { // F2
          oscillator: { type: 'sine' },
          envelope: { attack: 0.005, decay: 0.18, sustain: 0, release: 0.12 },
        }, filterBase: 120 },
      ];

      // ── Pack 5 — FERAL / Primal ─────────────────────────
      case 5: return [
        // HEAD: growl — animalistic FM, guttural
        { id: 'head', type: 'fm', midiNote: 52, options: { // E3
          harmonicity: 3.5, modulationIndex: 12,
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.15, release: 0.15 },
        }, filterBase: 350 },
        // RARM: bone click pattern — dry wood FM percussion
        { id: 'rarm', type: 'fm', midiNote: 79, options: { // G5
          harmonicity: 9, modulationIndex: 15,
          envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 },
        }, filterBase: 700 },
        // LARM: breath — airy, white noise mono
        { id: 'larm', type: 'mono', midiNote: 60, options: { // C4
          oscillator: { type: 'sine' },
          filterEnvelope: { attack: 0.05, decay: 0.15, sustain: 0.05, release: 0.1, baseFrequency: 100, octaves: 4 },
          envelope: { attack: 0.05, decay: 0.15, sustain: 0.05, release: 0.1 },
        }, filterBase: 200 },
        // TORSO: stomp bass — primal FM body percussion
        { id: 'torso', type: 'fm', midiNote: 40, options: { // E2
          harmonicity: 1, modulationIndex: 4,
          envelope: { attack: 0.001, decay: 0.3, sustain: 0.03, release: 0.2 },
        }, filterBase: 150 },
        // LEGS: talking drum — pitch-bending AM
        { id: 'legs', type: 'am', midiNote: 50, options: { // D3
          harmonicity: 3,
          envelope: { attack: 0.001, decay: 0.3, sustain: 0.08, release: 0.2 },
        }, filterBase: 300 },
      ];

      // ── Pack 6 — RAGE / Industrial ──────────────────────
      case 6: return [
        // HEAD: feedback screech — harsh high AM, NIN
        { id: 'head', type: 'am', midiNote: 80, options: { // Ab5
          harmonicity: 9,
          envelope: { attack: 0.008, decay: 0.35, sustain: 0.5, release: 0.35 },
        }, filterBase: 600 },
        // RARM: metal clang — industrial pipe hit FM
        { id: 'rarm', type: 'fm', midiNote: 57, options: { // A3
          harmonicity: 11, modulationIndex: 35,
          envelope: { attack: 0.001, decay: 0.3, sustain: 0.05, release: 0.2 },
        }, filterBase: 500 },
        // LARM: noise burst — chaotic FM, circuit-bent
        { id: 'larm', type: 'fm', midiNote: 77, options: { // F5
          harmonicity: 13, modulationIndex: 55,
          envelope: { attack: 0.001, decay: 0.08, sustain: 0.02, release: 0.04 },
        }, filterBase: 400 },
        // TORSO: distorted sub — crushed deep FM
        { id: 'torso', type: 'fm', midiNote: 34, options: { // Bb1
          harmonicity: 0.5, modulationIndex: 20,
          envelope: { attack: 0.001, decay: 0.8, sustain: 0.3, release: 0.5 },
        }, filterBase: 120 },
        // LEGS: impact — massive body hit, mono punch
        { id: 'legs', type: 'mono', midiNote: 38, options: { // D2
          oscillator: { type: 'square' },
          filterEnvelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3, baseFrequency: 100, octaves: 5 },
          envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.3 },
        }, filterBase: 180 },
      ];

      // ── Pack 7 — VOID / Spectral ────────────────────────
      case 7: return [
        // HEAD: ghost reverb — Burial-style reversed attack FM
        { id: 'head', type: 'fm', midiNote: 71, options: { // B4
          harmonicity: 2.2, modulationIndex: 4,
          envelope: { attack: 0.5, decay: 0.08, sustain: 0, release: 0.3 },
        }, filterBase: 400 },
        // RARM: spectral shimmer — high crystalline AM
        { id: 'rarm', type: 'am', midiNote: 79, options: { // G5
          harmonicity: 4.7,
          envelope: { attack: 0.3, decay: 0.5, sustain: 0.2, release: 0.6 },
        }, filterBase: 500 },
        // LARM: cluster pad — dense microtonal AM, Ligeti
        { id: 'larm', type: 'am', midiNote: 53, options: { // F3
          harmonicity: 4.7,
          envelope: { attack: 0.7, decay: 0.8, sustain: 0.4, release: 0.8 },
        }, filterBase: 250 },
        // TORSO: void drone — infinite space FM, cold
        { id: 'torso', type: 'fm', midiNote: 36, options: { // C2
          harmonicity: 1.01, modulationIndex: 2,
          envelope: { attack: 1, decay: 1.5, sustain: 0.7, release: 2 },
        }, filterBase: 120 },
        // LEGS: artifact glitch — digital crumble, bit-crushed FM
        { id: 'legs', type: 'fm', midiNote: 67, options: { // G4
          harmonicity: 11, modulationIndex: 30,
          envelope: { attack: 0.001, decay: 0.04, sustain: 0.01, release: 0.02 },
        }, filterBase: 500 },
      ];

      // ── Pack 8 — CLASSICAL / Chamber ────────────────────
      case 8: return [
        // HEAD: violin solo — expressive FM, vibrato-like
        { id: 'head', type: 'fm', midiNote: 76, options: { // E5
          harmonicity: 3, modulationIndex: 0.6,
          envelope: { attack: 0.08, decay: 0.8, sustain: 0.5, release: 1 },
        }, filterBase: 500 },
        // RARM: celesta — crystalline FM, Feldman fragility
        { id: 'rarm', type: 'fm', midiNote: 79, options: { // G5
          harmonicity: 6, modulationIndex: 1.5,
          envelope: { attack: 0.001, decay: 0.4, sustain: 0.03, release: 0.5 },
        }, filterBase: 700 },
        // LARM: cello sustained — warm AM, Górecki depth
        { id: 'larm', type: 'am', midiNote: 55, options: { // G3
          harmonicity: 2.01,
          envelope: { attack: 0.3, decay: 0.8, sustain: 0.6, release: 1.2 },
        }, filterBase: 300 },
        // TORSO: contrabass drone — deep bowed FM
        { id: 'torso', type: 'fm', midiNote: 40, options: { // E2
          harmonicity: 1.5, modulationIndex: 0.5,
          envelope: { attack: 0.6, decay: 1.2, sustain: 0.6, release: 1.8 },
        }, filterBase: 150 },
        // LEGS: pizzicato — plucked string, short synth
        { id: 'legs', type: 'synth', midiNote: 69, options: { // A4
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
        }, filterBase: 600 },
      ];

      // ── Pack 9 — DNB / Broken ───────────────────────────
      case 9: return [
        // HEAD: MC vox — ragga vocal stab FM
        { id: 'head', type: 'fm', midiNote: 67, options: { // G4
          harmonicity: 3, modulationIndex: 6,
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.08, release: 0.08 },
        }, filterBase: 500 },
        // RARM: liquid pad — Calibre/LTJ Bukem atmospheric AM
        { id: 'rarm', type: 'am', midiNote: 65, options: { // F4
          harmonicity: 2,
          envelope: { attack: 0.15, decay: 0.4, sustain: 0.3, release: 0.4 },
        }, filterBase: 450 },
        // LARM: amen hat ride — bright metallic mono
        { id: 'larm', type: 'mono', midiNote: 84, options: { // C6
          oscillator: { type: 'square' },
          filterEnvelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02, baseFrequency: 2000, octaves: 2 },
          envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 },
        }, filterBase: 800 },
        // TORSO: reese bass — deep warping sub FM
        { id: 'torso', type: 'fm', midiNote: 38, options: { // D2
          harmonicity: 0.5, modulationIndex: 16,
          envelope: { attack: 0.008, decay: 0.4, sustain: 0.3, release: 0.25 },
        }, filterBase: 140 },
        // LEGS: jungle kick pulse — short punchy synth
        { id: 'legs', type: 'synth', midiNote: 38, options: { // D2
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.04 },
        }, filterBase: 200 },
      ];

      // ── Pack 10 — SYNTHWAVE ─────────────────────────────
      case 10: return [
        // HEAD: cosmic shimmer — Tangerine Dream sparkle FM
        { id: 'head', type: 'fm', midiNote: 88, options: { // E6
          harmonicity: 6, modulationIndex: 2,
          envelope: { attack: 0.01, decay: 0.6, sustain: 0.1, release: 0.8 },
        }, filterBase: 700 },
        // RARM: CS-80 BRASS — Vangelis signature, rich poly brass
        // The right arm plays the heroic Blade Runner brass melody
        // High harmonicity for brass timbre, slow attack for emotional swell
        { id: 'rarm', type: 'fm', midiNote: 67, options: { // G4
          harmonicity: 1.5, modulationIndex: 2.5,
          envelope: { attack: 0.05, decay: 0.8, sustain: 0.5, release: 1 },
        }, filterBase: 400 },
        // LARM: TEARS IN RAIN PAD — the Vangelis emotional pad
        // Slow attack, deep sustain, the melancholy beauty of Blade Runner
        // AM with near-unison harmonicity = detuned chorus character
        { id: 'larm', type: 'am', midiNote: 48, options: { // C3
          harmonicity: 1.003,
          envelope: { attack: 1, decay: 1.2, sustain: 0.8, release: 2 },
        }, filterBase: 250 },
        // TORSO: Korg Mono/Poly bass — fat analog, pulsing
        { id: 'torso', type: 'mono', midiNote: 36, options: { // C2
          oscillator: { type: 'sawtooth' },
          filterEnvelope: { attack: 0.015, decay: 0.4, sustain: 0.15, release: 0.3, baseFrequency: 120, octaves: 4 },
          envelope: { attack: 0.006, decay: 0.5, sustain: 0.2, release: 0.4 },
        }, filterBase: 120 },
        // LEGS: MS-20 dark pulse — Carpenter horror, resonant
        { id: 'legs', type: 'mono', midiNote: 43, options: { // G2
          oscillator: { type: 'sawtooth' },
          filterEnvelope: { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.15, baseFrequency: 150, octaves: 3 },
          envelope: { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.15 },
        }, filterBase: 200 },
      ];

      // ── Pack 11 — CINEMATIC / Zimmer ────────────────────
      case 11: return [
        // HEAD: tension string — Dark Knight high tremolo AM
        { id: 'head', type: 'am', midiNote: 76, options: { // E5
          harmonicity: 3,
          envelope: { attack: 0.1, decay: 0.6, sustain: 0.5, release: 0.8 },
        }, filterBase: 500 },
        // RARM: time piano — Inception melody, delicate sine
        { id: 'rarm', type: 'synth', midiNote: 65, options: { // F4
          oscillator: { type: 'sine' },
          envelope: { attack: 0.005, decay: 1.5, sustain: 0.04, release: 2 },
        }, filterBase: 600 },
        // LARM: epic choir — massive FM choral
        { id: 'larm', type: 'fm', midiNote: 51, options: { // Eb3
          harmonicity: 2.01, modulationIndex: 4,
          envelope: { attack: 0.15, decay: 0.8, sustain: 0.5, release: 1 },
        }, filterBase: 300 },
        // TORSO: BRAAAM sub — Inception horn, massive low FM
        { id: 'torso', type: 'fm', midiNote: 43, options: { // G2
          harmonicity: 1, modulationIndex: 8,
          envelope: { attack: 0.03, decay: 2, sustain: 0.5, release: 2 },
        }, filterBase: 100 },
        // LEGS: tick pulse — Dunkirk clock tension FM
        { id: 'legs', type: 'fm', midiNote: 79, options: { // G5
          harmonicity: 8, modulationIndex: 1,
          envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 },
        }, filterBase: 600 },
      ];

      // ── Pack 12 — ORCHESTRA / Emotional ─────────────────
      case 12: return [
        // HEAD: soprano voice — soaring high FM vocal
        { id: 'head', type: 'fm', midiNote: 76, options: { // E5
          harmonicity: 2.5, modulationIndex: 3.5,
          envelope: { attack: 0.12, decay: 0.5, sustain: 0.35, release: 0.7 },
        }, filterBase: 500 },
        // RARM: violin solo — expressive FM, Williams soar
        { id: 'rarm', type: 'fm', midiNote: 76, options: { // E5
          harmonicity: 3, modulationIndex: 0.6,
          envelope: { attack: 0.08, decay: 0.8, sustain: 0.5, release: 1 },
        }, filterBase: 550 },
        // LARM: choir — angelic FM pad
        { id: 'larm', type: 'fm', midiNote: 69, options: { // A4
          harmonicity: 2.5, modulationIndex: 3.5,
          envelope: { attack: 0.3, decay: 0.7, sustain: 0.5, release: 1 },
        }, filterBase: 350 },
        // TORSO: cello foundation — warm AM, Górecki depth
        { id: 'torso', type: 'am', midiNote: 43, options: { // G2
          harmonicity: 2.01,
          envelope: { attack: 0.3, decay: 1, sustain: 0.6, release: 1.2 },
        }, filterBase: 180 },
        // LEGS: french horn — noble warm FM, Williams heroism
        { id: 'legs', type: 'fm', midiNote: 53, options: { // F3
          harmonicity: 1.5, modulationIndex: 1.5,
          envelope: { attack: 0.15, decay: 0.7, sustain: 0.5, release: 0.8 },
        }, filterBase: 350 },
      ];

      // Fallback — generic if pack index is somehow out of range
      default: return [
        { id: 'head', type: 'fm', midiNote: 72, options: {
          harmonicity: 2, modulationIndex: 1.5,
          envelope: { attack: 0.3, decay: 0.5, sustain: 0.8, release: 0.5 },
        }},
        { id: 'rarm', type: 'fm', midiNote: 64, options: {
          harmonicity: 3, modulationIndex: 0.8,
          envelope: { attack: 0.1, decay: 0.4, sustain: 0.7, release: 0.4 },
        }},
        { id: 'larm', type: 'am', midiNote: 60, options: {
          harmonicity: 2,
          envelope: { attack: 0.15, decay: 0.5, sustain: 0.7, release: 0.5 },
        }},
        { id: 'torso', type: 'fm', midiNote: 48, options: {
          harmonicity: 1.5, modulationIndex: 1,
          envelope: { attack: 0.4, decay: 0.8, sustain: 0.8, release: 0.8 },
        }},
        { id: 'legs', type: 'fm', midiNote: 36, options: {
          harmonicity: 1, modulationIndex: 2,
          envelope: { attack: 0.2, decay: 0.6, sustain: 0.6, release: 0.6 },
        }},
      ];
    }
  }

  private createVoice(
    id: string,
    type: 'fm' | 'am' | 'mono' | 'synth',
    midiNote: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any,
    filterBase?: number,
  ): void {
    const filter = new Tone.Filter({
      frequency: filterBase ?? 400,
      type: 'lowpass',
      rolloff: -12,
    });
    const gain = new Tone.Gain(0);
    let synth: Tone.FMSynth | Tone.AMSynth | Tone.MonoSynth | Tone.Synth;

    switch (type) {
      case 'fm':
        synth = new Tone.FMSynth(options);
        break;
      case 'am':
        synth = new Tone.AMSynth(options);
        break;
      case 'mono':
        synth = new Tone.MonoSynth(options);
        break;
      case 'synth':
        synth = new Tone.Synth(options);
        break;
    }

    synth.chain(filter, gain, this.masterGain);

    this.voices.set(id, {
      synth,
      gain,
      filter,
      active: false,
      baseNote: midiNote,
      currentNote: midiNote,
    });

    this.smoothGains.set(id, 0);
  }

  /** Called every frame with body state — THIS is where movement becomes music */
  update(state: BodyState): void {
    if (!this.enabled) {
      this.silenceAll();
      return;
    }

    // If body is completely still, fade everything out
    if (state.isStill) {
      this.silenceAll();
      return;
    }

    const now = Tone.now();

    // ─── HEAD VOICE ────────────────────────────────
    // Head spin slow→fast = rising pad sweep
    // Head nod = subtle pitch wobble
    // +24 semitones = 2 octaves range at max
    this.updateVoice('head', state.headFlow, {
      pitchBend: state.headFlow * 18 + Math.max(0, state.acceleration) * 6,
      filterFreq: 200 + state.headFlow * 8000,
      modBoost: Math.max(0, state.acceleration) * 8,
    }, now);

    // ─── RIGHT ARM VOICE ───────────────────────────
    // Melodic lead — hands height = pitch, flow = brightness
    // Raised hand = high note, low hand = low note
    // +14 semitones range
    this.updateVoice('rarm', state.rightArmFlow, {
      pitchBend: state.handsHeight * 10 + state.rightArmFlow * 4,
      filterFreq: 300 + state.rightArmFlow * 10000,
      modBoost: state.rightArmFlow * 5,
    }, now);

    // ─── LEFT ARM VOICE ────────────────────────────
    // Harmonic complement — follows right but offset
    this.updateVoice('larm', state.leftArmFlow, {
      pitchBend: state.handsHeight * 7 + state.leftArmFlow * 4,
      filterFreq: 250 + state.leftArmFlow * 7000,
      modBoost: state.leftArmFlow * 3,
    }, now);

    // ─── TORSO VOICE ───────────────────────────────
    // Foundation — lean shifts pitch, expansion opens sound
    // ±5 semitones with lean, wider filter with expansion
    this.updateVoice('torso', state.torsoFlow, {
      pitchBend: state.lean * 5,
      filterFreq: 150 + state.bodyExpansion * 5000 + state.torsoFlow * 3000,
      modBoost: state.torsoFlow * 4,
    }, now);

    // ─── LEGS VOICE ────────────────────────────────
    // Grounding bass — jumping = pitch up, footwork = filter open
    // +8 semitones with vertical energy
    const legFlow = Math.max(state.rightLegFlow, state.leftLegFlow);
    this.updateVoice('legs', legFlow, {
      pitchBend: Math.max(0, state.verticalEnergy) * 8,
      filterFreq: 100 + legFlow * 4000,
      modBoost: Math.max(0, state.verticalEnergy) * 6,
    }, now);
  }

  private updateVoice(
    id: string,
    flow: number,
    params: { pitchBend: number; filterFreq: number; modBoost: number },
    now: number
  ): void {
    const voice = this.voices.get(id);
    if (!voice) return;

    // Very low threshold — even subtle breathing-like movement activates
    const THRESHOLD = 0.015;

    if (flow < THRESHOLD) {
      // Quick fade out — responsive silence
      if (voice.active) {
        const smoothed = this.lerp(this.smoothGains.get(id) || 0, 0, 0.25);
        this.smoothGains.set(id, smoothed);
        voice.gain.gain.rampTo(smoothed, 0.06);

        if (smoothed < 0.003) {
          try { voice.synth.triggerRelease(now); } catch {}
          voice.active = false;
          this.smoothGains.set(id, 0);
        }
      }
      return;
    }

    // Activate if not active
    if (!voice.active) {
      const noteFreq = Tone.Frequency(voice.baseNote, 'midi').toFrequency();
      try {
        voice.synth.triggerAttack(noteFreq, now);
      } catch {}
      voice.active = true;
    }

    // Volume — sqrt curve so small movements are clearly audible
    const targetGain = Math.min(0.8, Math.sqrt(flow) * 0.85);
    const smoothed = this.lerp(this.smoothGains.get(id) || 0, targetGain, 0.35);
    this.smoothGains.set(id, smoothed);
    voice.gain.gain.rampTo(smoothed, 0.03); // fast ramp = responsive

    // Pitch bend — wider range, faster response
    const targetNote = voice.baseNote + params.pitchBend;
    if (Math.abs(targetNote - voice.currentNote) > 0.05) {
      const freq = Tone.Frequency(Math.max(20, targetNote), 'midi').toFrequency();
      voice.synth.frequency.rampTo(freq, 0.05); // faster pitch follow
      voice.currentNote = targetNote;
    }

    // Filter — fast response, wide range
    voice.filter.frequency.rampTo(params.filterFreq, 0.04);

    // Modulation boost — adds harmonic richness with intensity
    if (voice.synth instanceof Tone.FMSynth) {
      const baseMod = (voice.synth as Tone.FMSynth).modulationIndex.value;
      (voice.synth as Tone.FMSynth).modulationIndex.rampTo(
        baseMod + params.modBoost, 0.06
      );
    }
  }

  private silenceAll(): void {
    const now = Tone.now();
    this.voices.forEach((voice, id) => {
      if (voice.active) {
        const smoothed = this.lerp(this.smoothGains.get(id) || 0, 0, 0.1);
        this.smoothGains.set(id, smoothed);
        voice.gain.gain.rampTo(smoothed, 0.15);

        if (smoothed < 0.005) {
          try { voice.synth.triggerRelease(now); } catch {}
          voice.active = false;
          this.smoothGains.set(id, 0);
        }
      }
    });
  }

  private lerp(current: number, target: number, alpha: number): number {
    return current + (target - current) * alpha;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.silenceAll();
  }

  setVolume(vol: number): void {
    this.masterGain.gain.rampTo(vol, 0.1);
  }

  private disposeVoices(): void {
    this.voices.forEach((voice) => {
      try { voice.synth.triggerRelease(); } catch {}
      voice.synth.dispose();
      voice.gain.dispose();
      voice.filter.dispose();
    });
    this.voices.clear();
    this.smoothGains.clear();
  }

  dispose(): void {
    this.disposeVoices();
    this.masterGain.dispose();
    this.reverb.dispose();
  }
}
