import * as Tone from 'tone';

/**
 * Metronome that plays an audible click at the current BPM.
 * Routed DIRECTLY to speakers, bypassing the main audio chain,
 * so it is NOT captured by SessionRecorder.
 */
export class Metronome {
  private clickSynth: Tone.MembraneSynth;
  private accentSynth: Tone.MembraneSynth;
  private directOut: Tone.Gain;
  private loopId: number | null = null;
  private _bpm: number = 90;
  private _running: boolean = false;
  private beatCount: number = 0;
  private onBeat: ((beat: number) => void) | null = null;

  constructor() {
    // Direct output — goes straight to speakers, NOT through masterGain
    this.directOut = new Tone.Gain(0.5).toDestination();

    // Normal beat click — short, dry, minimal
    this.clickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.02 },
    }).connect(this.directOut);

    // Accent click (beat 1) — slightly higher pitch
    this.accentSynth = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 3,
      envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 },
    }).connect(this.directOut);
  }

  setOnBeat(fn: (beat: number) => void): void {
    this.onBeat = fn;
  }

  setBpm(bpm: number): void {
    this._bpm = bpm;
    if (this._running) {
      this.stop();
      this.start();
    }
  }

  setVolume(vol: number): void {
    this.directOut.gain.rampTo(vol, 0.05);
  }

  get running(): boolean {
    return this._running;
  }

  start(): void {
    if (this._running) return;
    this._running = true;
    this.beatCount = 0;

    const intervalMs = 60000 / this._bpm;

    const tick = () => {
      if (!this._running) return;

      const isAccent = this.beatCount % 4 === 0;
      try {
        if (isAccent) {
          this.accentSynth.triggerAttackRelease('G4', '32n');
        } else {
          this.clickSynth.triggerAttackRelease('C4', '32n');
        }
      } catch {
        // synth busy
      }

      this.onBeat?.(this.beatCount % 4);
      this.beatCount++;

      this.loopId = window.setTimeout(tick, intervalMs);
    };

    tick();
  }

  stop(): void {
    this._running = false;
    if (this.loopId !== null) {
      clearTimeout(this.loopId);
      this.loopId = null;
    }
    this.beatCount = 0;
  }

  dispose(): void {
    this.stop();
    this.clickSynth.dispose();
    this.accentSynth.dispose();
    this.directOut.dispose();
  }
}
