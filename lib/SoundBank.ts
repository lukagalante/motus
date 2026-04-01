import * as Tone from 'tone';
import { PACKS, SynthSlotConfig } from '@/data/packs';
import { SLOT_TO_PACK_INDEX } from './constants';
import type { TriggerEvent, BodyState } from './MovementEngine';
import { ExpressionEngine } from './ExpressionEngine';
import { generatePackSamples, getPackIdByIndex, SLOT_NAMES } from './SampleGenerator';

type SynthInstance =
  | Tone.MembraneSynth
  | Tone.MetalSynth
  | Tone.Synth
  | Tone.NoiseSynth
  | Tone.AMSynth
  | Tone.FMSynth
  | Tone.MonoSynth;

export class SoundBank {
  private synths: SynthInstance[] = [];
  private masterGain: Tone.Gain;
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  private analyser: Tone.Analyser;
  private currentPackIndex: number = 0;
  private _bpm: number = 90;
  private _quantize: boolean = false;
  private _delayActive: boolean = false;

  // Continuous drone layer
  private droneSynth: Tone.FMSynth | null = null;
  private droneGain: Tone.Gain;
  private droneActive: boolean = false;

  // Body-controlled expression
  private expressionFilter: Tone.Filter;

  // Glitch FX chain
  private glitchEnabled: boolean = false;
  private bitCrusher: Tone.BitCrusher;
  private glitchGain: Tone.Gain;

  // Per-synth gain for velocity
  private synthGains: Tone.Gain[] = [];

  // Sample players — when loaded, these override synths
  private samplePlayers: (Tone.Player | null)[] = [];
  private samplesLoaded: boolean = false;

  // Stutter FX — BT Stutter Edit style
  private stutterEnabled: boolean = false;
  private stutterLoopId: number | null = null;
  private stutterGain: Tone.Gain;

  // Expression engine — continuous body-controlled sound
  private expressionEngine: ExpressionEngine | null = null;

  // Slow-motion auto FX state
  private slowMoActive: boolean = false;
  private prevGlobalActivity: number = 0;

  constructor() {
    this.masterGain = new Tone.Gain(0.8);
    this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 });
    this.delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 0 });
    this.expressionFilter = new Tone.Filter({ frequency: 8000, type: 'lowpass', rolloff: -12 });
    this.analyser = new Tone.Analyser('waveform', 256);

    // Glitch FX — bit crusher
    this.bitCrusher = new Tone.BitCrusher({ bits: 8 });
    this.bitCrusher.wet.value = 0;
    this.glitchGain = new Tone.Gain(1);

    // Stutter gate gain
    this.stutterGain = new Tone.Gain(1);

    // Chain: expressionFilter → bitCrusher → stutterGain → glitchGain → master → reverb → delay → analyser → out
    this.expressionFilter.chain(
      this.bitCrusher,
      this.stutterGain,
      this.glitchGain,
      this.masterGain,
      this.reverb,
      this.delay,
      this.analyser,
      Tone.getDestination()
    );

    // Expression engine — continuous body-to-sound
    this.expressionEngine = new ExpressionEngine(this.expressionFilter);

    // Drone layer
    this.droneGain = new Tone.Gain(0).connect(this.expressionFilter);
  }

  getAnalyser(): Tone.Analyser { return this.analyser; }
  getMasterGain(): Tone.Gain { return this.masterGain; }
  getAudioContext(): AudioContext {
    return Tone.getContext().rawContext as unknown as AudioContext;
  }

  // ─── GLITCH MODE TOGGLE ──────────────────────────────

  setGlitchEnabled(on: boolean): void {
    this.glitchEnabled = on;
    if (!on) {
      this.bitCrusher.wet.rampTo(0, 0.1);
    }
  }

  get glitchActive(): boolean { return this.glitchEnabled; }

  // ─── STUTTER FX — BT Stutter Edit style ──────────────
  // Rapid gate on/off creating rhythmic glitch stutter

  setStutterEnabled(on: boolean): void {
    this.stutterEnabled = on;
    if (!on) this.stopStutter();
  }

  get stutterActive(): boolean { return this.stutterEnabled; }

  /** Trigger a stutter burst — called by body state when jerk is detected */
  triggerStutter(intensity: number): void {
    if (!this.stutterEnabled) return;
    if (this.stutterLoopId !== null) return; // already stuttering

    // intensity 0–1 controls speed: 0.2 = slow stutter, 1.0 = machine gun
    const rateMs = Math.max(20, 120 - intensity * 100); // 20ms–120ms per gate
    let count = 0;
    const maxGates = Math.floor(4 + intensity * 12); // 4–16 gates

    const gate = () => {
      if (count >= maxGates || !this.stutterEnabled) {
        this.stutterGain.gain.rampTo(1, 0.02);
        this.stutterLoopId = null;
        return;
      }

      // Alternate on/off
      const isOn = count % 2 === 0;
      this.stutterGain.gain.cancelScheduledValues(Tone.now());
      this.stutterGain.gain.setValueAtTime(isOn ? 1 : 0, Tone.now());

      // Also pitch-shift the bit crusher during stutter for extra chaos
      if (this.glitchEnabled && isOn) {
        this.bitCrusher.wet.setValueAtTime(0.5, Tone.now());
        this.bitCrusher.bits.value = Math.max(1, 8 - Math.floor(intensity * 5));
      } else {
        this.bitCrusher.wet.setValueAtTime(0, Tone.now());
      }

      count++;
      this.stutterLoopId = window.setTimeout(gate, rateMs);
    };

    gate();
  }

  private stopStutter(): void {
    if (this.stutterLoopId !== null) {
      clearTimeout(this.stutterLoopId);
      this.stutterLoopId = null;
    }
    this.stutterGain.gain.rampTo(1, 0.02);
  }

  // ─── SYNTH CREATION ──────────────────────────────────

  private createSynth(config: SynthSlotConfig, gainNode: Tone.Gain): SynthInstance {
    const opts = (config.options || {}) as Record<string, unknown>;
    let synth: SynthInstance;
    switch (config.type) {
      case 'membrane':
        synth = new Tone.MembraneSynth(opts as Partial<Tone.MembraneSynthOptions>); break;
      case 'metal':
        synth = new Tone.MetalSynth(opts as Partial<Tone.MetalSynthOptions>); break;
      case 'noise':
        synth = new Tone.NoiseSynth(opts as Partial<Tone.NoiseSynthOptions>); break;
      case 'synth':
        synth = new Tone.Synth(opts as Partial<Tone.SynthOptions>); break;
      case 'am':
        synth = new Tone.AMSynth(opts as Partial<Tone.AMSynthOptions>); break;
      case 'fm':
        synth = new Tone.FMSynth(opts as Partial<Tone.FMSynthOptions>); break;
      case 'mono':
        synth = new Tone.MonoSynth(opts as Partial<Tone.MonoSynthOptions>); break;
      default:
        synth = new Tone.Synth();
    }
    synth.connect(gainNode);
    return synth;
  }

  // ─── PACK LOADING ────────────────────────────────────

  loadPack(packIndex: number): void {
    // Dispose old synths and players
    this.synths.forEach((s) => s.dispose());
    this.synthGains.forEach((g) => g.dispose());
    this.samplePlayers.forEach((p) => p?.dispose());
    this.synths = [];
    this.synthGains = [];
    this.samplePlayers = [];
    this.samplesLoaded = false;

    const pack = PACKS[packIndex];
    if (!pack) return;
    this.currentPackIndex = packIndex;

    // Load synths immediately (instant sound)
    for (const slotConfig of pack.slots) {
      const gain = new Tone.Gain(0.8).connect(this.expressionFilter);
      this.synthGains.push(gain);
      this.synths.push(this.createSynth(slotConfig, gain));
      this.samplePlayers.push(null);
    }

    this.initDrone();
    this.expressionEngine?.loadForPack(packIndex);

    // Generate and load samples in background (upgrades sound quality)
    this.loadSamplesForPack(packIndex);
  }

  private async loadSamplesForPack(packIndex: number): Promise<void> {
    try {
      const packId = getPackIdByIndex(packIndex);
      const samples = await generatePackSamples(packId);

      // Check we're still on the same pack
      if (this.currentPackIndex !== packIndex) return;

      const audioCtx = Tone.getContext().rawContext as unknown as AudioContext;

      for (let i = 0; i < SLOT_NAMES.length; i++) {
        const slotName = SLOT_NAMES[i];
        const pcmBuffer = samples.get(slotName);
        if (!pcmBuffer) continue;

        // Convert Float32 PCM back to AudioBuffer
        const float32 = new Float32Array(pcmBuffer);
        const audioBuf = audioCtx.createBuffer(1, float32.length, 44100);
        audioBuf.getChannelData(0).set(float32);

        // Create Tone.Player with the buffer
        const toneBuffer = new Tone.ToneAudioBuffer().fromArray(audioBuf.getChannelData(0));
        const player = new Tone.Player(toneBuffer);

        // Connect through the same gain node as the synth
        if (this.synthGains[i]) {
          player.connect(this.synthGains[i]);
        }

        this.samplePlayers[i] = player;
      }

      this.samplesLoaded = true;
    } catch (err) {
      console.warn('Sample generation failed, using synth fallback:', err);
    }
  }

  // ─── DRONE LAYER ─────────────────────────────────────

  private initDrone(): void {
    this.droneSynth?.dispose();
    this.droneActive = false;
    this.droneSynth = new Tone.FMSynth({
      harmonicity: 1.5,
      modulationIndex: 1,
      envelope: { attack: 2, decay: 1, sustain: 0.8, release: 3 },
      modulation: { type: 'sine' },
      oscillator: { type: 'sine' },
    }).connect(this.droneGain);
  }

  // ─── PERCUSSIVE TRIGGER ──────────────────────────────

  triggerSlot(event: TriggerEvent): void {
    const index = SLOT_TO_PACK_INDEX[event.slot];
    const gainNode = this.synthGains[index];
    if (!gainNode) return;

    // Velocity → volume with musical curve
    const vol = Math.pow(event.velocity, 0.7) * 0.9;
    gainNode.gain.cancelScheduledValues(Tone.now());
    gainNode.gain.setValueAtTime(vol, Tone.now());

    const now = this._quantize ? this.quantizedTime() : Tone.now();

    // Try sample player first (higher quality)
    const player = this.samplePlayers[index];
    if (player && this.samplesLoaded) {
      try {
        if (player.state === 'started') player.stop();
        player.start(now);
        return;
      } catch {
        // fall through to synth
      }
    }

    // Fallback: synth trigger
    const synth = this.synths[index];
    if (!synth) return;
    const pack = PACKS[this.currentPackIndex];
    const config = pack?.slots[index];

    try {
      if (synth instanceof Tone.NoiseSynth) {
        synth.triggerAttackRelease(config?.duration || '16n', now);
      } else {
        (synth as Tone.Synth).triggerAttackRelease(
          config?.note || 'C4',
          config?.duration || '8n',
          now
        );
      }
    } catch {
      // synth busy
    }
  }

  // ─── BODY STATE → EXPRESSION (every frame) ───────────

  updateBodyState(state: BodyState): void {
    // ─── SILENCE WHEN STILL ────────────────────────
    if (state.isStill) {
      if (this.droneActive) {
        this.droneGain.gain.rampTo(0, 0.8);
        setTimeout(() => {
          if (this.droneActive) {
            try { this.droneSynth?.triggerRelease(); } catch {}
            this.droneActive = false;
          }
        }, 800);
      }
      this.expressionFilter.frequency.rampTo(200, 0.5);
      this.prevGlobalActivity = 0;

      // Fade out slow-mo FX
      if (this.slowMoActive) {
        this.delay.wet.rampTo(this._delayActive ? 0.4 : 0, 1);
        this.reverb.wet.rampTo(0.3, 1);
        this.slowMoActive = false;
      }
      return;
    }

    // ─── FILTER: activity opens spectrum ───────────
    const filterFreq = 200 + state.globalActivity * 11800;
    this.expressionFilter.frequency.rampTo(filterFreq, 0.1);

    // ─── SLOW-MOTION AUTO-FX ──────────────────────
    // Detect slow, flowing movement: activity between 0.05–0.25
    const isSlow = state.globalActivity > 0.04 && state.globalActivity < 0.25;
    const flowLevel = Math.max(state.rightArmFlow, state.leftArmFlow, state.torsoFlow);

    if (isSlow && flowLevel > 0.08 && flowLevel < 0.4) {
      if (!this.slowMoActive) {
        this.slowMoActive = true;
      }
      // Ramp delay and reverb up proportional to slowness
      const intensity = 1 - (state.globalActivity / 0.25); // 1 = very slow, 0 = fast
      this.delay.wet.rampTo(0.3 + intensity * 0.4, 0.3);
      this.delay.feedback.rampTo(0.3 + intensity * 0.3, 0.3);
      this.reverb.wet.rampTo(0.4 + intensity * 0.5, 0.3);
    } else if (this.slowMoActive && state.globalActivity > 0.3) {
      // Snap out of slow-mo when movement gets energetic
      this.delay.wet.rampTo(this._delayActive ? 0.4 : 0, 0.5);
      this.delay.feedback.rampTo(0.3, 0.3);
      this.reverb.wet.rampTo(0.3, 0.5);
      this.slowMoActive = false;
    }

    // ─── GLITCH FX: jerky movement ────────────────
    const jerk = Math.abs(state.globalActivity - this.prevGlobalActivity);

    if (this.glitchEnabled) {
      if (jerk > 0.08) {
        const glitchIntensity = Math.min(1, jerk * 5);
        this.bitCrusher.wet.rampTo(glitchIntensity * 0.8, 0.02);
        this.bitCrusher.bits.value = Math.max(1, 8 - Math.floor(glitchIntensity * 6));
        setTimeout(() => { this.bitCrusher.wet.rampTo(0, 0.15); }, 80);
      }
      if (state.globalActivity > 0.6) {
        this.bitCrusher.wet.rampTo(0.2, 0.1);
        this.bitCrusher.bits.value = 6;
      }
    }

    // ─── STUTTER FX: rapid jerky movement ─────────
    if (this.stutterEnabled && jerk > 0.06) {
      this.triggerStutter(Math.min(1, jerk * 6));
    }

    // ─── DRONE ────────────────────────────────────
    if (flowLevel > 0.15 && !this.droneActive && this.droneSynth) {
      this.droneActive = true;
      const droneNotes = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'Bb2', 'C2', 'D2', 'E2', 'A2', 'D2', 'G2'];
      const note = droneNotes[this.currentPackIndex] || 'C2';
      try { this.droneSynth.triggerAttack(note, Tone.now()); } catch {}
    }

    if (this.droneActive) {
      const droneVol = Math.min(0.25, flowLevel * 0.35);
      this.droneGain.gain.rampTo(droneVol, 0.3);
      if (this.droneSynth) {
        this.droneSynth.harmonicity.rampTo(1 + state.handsHeight * 3, 0.5);
      }
    }

    if (flowLevel < 0.05 && this.droneActive) {
      this.droneGain.gain.rampTo(0, 1.5);
      setTimeout(() => {
        if (this.droneActive) {
          try { this.droneSynth?.triggerRelease(); } catch {}
          this.droneActive = false;
        }
      }, 1500);
    }

    // ─── REVERB: expansion + proximity ─────────────
    // Far away = more reverb (spacious), close = less reverb (intimate)
    if (!this.slowMoActive) {
      const prox = state.proximity || 0;
      const reverbWet = (0.1 + state.bodyExpansion * 0.6) * (1 - prox * 0.4);
      this.reverb.wet.rampTo(reverbWet, 0.3);
    }

    // ─── DELAY: lean ─────────────────────────────
    if (this._delayActive && !this.slowMoActive) {
      const fb = 0.15 + Math.abs(state.lean) * 0.35;
      this.delay.feedback.rampTo(fb, 0.2);
    }

    this.prevGlobalActivity = state.globalActivity;

    // ─── EXPRESSION ENGINE: continuous body-to-sound ──
    this.expressionEngine?.update(state);
  }

  // ─── QUANTIZATION ────────────────────────────────────

  private quantizedTime(): number {
    const transport = Tone.getTransport();
    if (transport.state !== 'started') {
      transport.bpm.value = this._bpm;
      transport.start();
    }
    const sixteenth = 60 / (this._bpm * 4);
    const now = Tone.now();
    return Math.max(Math.ceil(now / sixteenth) * sixteenth, now + 0.01);
  }

  // ─── CONTROLS ────────────────────────────────────────

  setVolume(value: number): void { this.masterGain.gain.rampTo(value, 0.05); }

  setReverb(wet: number): void { this.reverb.wet.rampTo(wet, 0.1); }

  setDelay(active: boolean): void {
    this._delayActive = active;
    this.delay.wet.rampTo(active ? 0.4 : 0, 0.1);
  }

  get delayActive(): boolean { return this._delayActive; }

  setBpm(bpm: number): void {
    this._bpm = bpm;
    Tone.getTransport().bpm.value = bpm;
  }

  get bpm(): number { return this._bpm; }

  setQuantize(on: boolean): void {
    this._quantize = on;
    if (!on) Tone.getTransport().stop();
  }

  get quantize(): boolean { return this._quantize; }

  get packIndex(): number { return this.currentPackIndex; }

  /** Randomize: pick random sounds from ALL packs for each slot */
  loadRandomPack(): void {
    this.synths.forEach((s) => s.dispose());
    this.synthGains.forEach((g) => g.dispose());
    this.synths = [];
    this.synthGains = [];

    for (let slotIdx = 0; slotIdx < 8; slotIdx++) {
      const randomPackIdx = Math.floor(Math.random() * PACKS.length);
      const config = PACKS[randomPackIdx].slots[slotIdx];
      const gain = new Tone.Gain(0.8).connect(this.expressionFilter);
      this.synthGains.push(gain);
      this.synths.push(this.createSynth(config, gain));
    }

    this.currentPackIndex = -1; // indicates random
    this.initDrone();
    this.expressionEngine?.loadForPack(Math.floor(Math.random() * PACKS.length));
  }

  dispose(): void {
    this.synths.forEach((s) => s.dispose());
    this.synthGains.forEach((g) => g.dispose());
    this.droneSynth?.dispose();
    this.droneGain.dispose();
    this.samplePlayers.forEach((p) => p?.dispose());
    this.expressionEngine?.dispose();
    this.expressionFilter.dispose();
    this.bitCrusher.dispose();
    this.glitchGain.dispose();
    this.stopStutter();
    this.stutterGain.dispose();
    this.masterGain.dispose();
    this.reverb.dispose();
    this.delay.dispose();
    this.analyser.dispose();
  }
}
