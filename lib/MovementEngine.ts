import { Point, velocity } from './poseUtils';
import { KEYPOINTS, SoundSlot } from './constants';

export type { SoundSlot };

export interface TriggerEvent {
  slot: SoundSlot;
  velocity: number;       // 0–1 normalized intensity
  direction?: 'up' | 'down' | 'left' | 'right'; // movement direction
}

export interface BodyState {
  globalActivity: number;
  rightArmFlow: number;
  leftArmFlow: number;
  rightLegFlow: number;
  leftLegFlow: number;
  torsoFlow: number;
  headFlow: number;
  handsHeight: number;
  bodyExpansion: number;
  lean: number;
  isStill: boolean;
  /** Acceleration — rate of change of velocity. Positive = speeding up */
  acceleration: number;
  /** Symmetry — how similar left/right movement is. 1 = mirror, 0 = asymmetric */
  symmetry: number;
  /** Vertical energy — upward vs downward tendency */
  verticalEnergy: number;
}

export type TriggerCallback = (event: TriggerEvent) => void;
export type BodyStateCallback = (state: BodyState) => void;

// ─── MULTI-FRAME RING BUFFER ────────────────────────────

class VelocityBuffer {
  private buffer: number[];
  private size: number;
  private idx: number = 0;
  private count: number = 0;

  constructor(size: number = 4) {
    this.size = size;
    this.buffer = new Array(size).fill(0);
  }

  push(val: number): void {
    this.buffer[this.idx] = val;
    this.idx = (this.idx + 1) % this.size;
    if (this.count < this.size) this.count++;
  }

  /** Weighted average — recent frames matter more */
  average(): number {
    if (this.count === 0) return 0;
    let sum = 0;
    let weightSum = 0;
    for (let i = 0; i < this.count; i++) {
      const age = (this.idx - 1 - i + this.size) % this.size;
      const weight = 1 + (this.count - 1 - i) * 0.5; // newer = heavier
      sum += this.buffer[age] * weight;
      weightSum += weight;
    }
    return sum / weightSum;
  }

  /** Most recent value */
  latest(): number {
    if (this.count === 0) return 0;
    return this.buffer[(this.idx - 1 + this.size) % this.size];
  }

  /** Previous value (for acceleration) */
  prev(): number {
    if (this.count < 2) return 0;
    return this.buffer[(this.idx - 2 + this.size) % this.size];
  }

  reset(): void {
    this.buffer.fill(0);
    this.idx = 0;
    this.count = 0;
  }
}

class EMA {
  private value: number = 0;
  private alpha: number;
  constructor(smoothing: number = 0.3) { this.alpha = smoothing; }
  update(raw: number): number {
    this.value = this.alpha * raw + (1 - this.alpha) * this.value;
    return this.value;
  }
  get(): number { return this.value; }
  reset(): void { this.value = 0; }
}

// ─── TUNING CONSTANTS ─────────────────────────────────
// These control how sensitive and responsive the system is.
// Lower = more sensitive. Higher = less false triggers.

// Noise floor: below this velocity the body is "still".
// MediaPipe jitter is ~0.001-0.002 normalized.
// 0.002 catches micro-movements, 0.005 ignores them.
const NOISE_FLOOR = 0.002;

// Percussive trigger thresholds — lower = triggers on smaller movements
const PERCUSSIVE_THRESHOLDS = {
  wrist: 0.012,   // hands — most sensitive, dancers use hands a lot
  hip: 0.007,     // hip sway — subtle groove detection
  nose: 0.008,    // head nod — catches subtle nods
  jump: 0.012,    // full body up — medium threshold
  kick: 0.006,    // knee raise — catches footwork
};

// Cooldown between same-slot triggers (ms)
// 100ms = very responsive, can trigger 10x/sec
// 200ms = more musical, max 5x/sec
const COOLDOWN_MS = 100;

// ─── MOVEMENT ENGINE ───────────────────────────────────

export class MovementEngine {
  private prevLandmarks: Point[] | null = null;
  private prev2Landmarks: Point[] | null = null; // 2 frames back for acceleration
  private cooldowns: Map<SoundSlot, number> = new Map();
  private sensitivity: number = 0.5;
  private onTrigger: TriggerCallback | null = null;
  private onBodyState: BodyStateCallback | null = null;

  // Multi-frame velocity buffers per keypoint group
  private rWristBuf = new VelocityBuffer(4);
  private lWristBuf = new VelocityBuffer(4);
  private rElbowBuf = new VelocityBuffer(3);
  private lElbowBuf = new VelocityBuffer(3);
  private rKneeBuf = new VelocityBuffer(3);
  private lKneeBuf = new VelocityBuffer(3);
  private hipBuf = new VelocityBuffer(3);
  private noseBuf = new VelocityBuffer(3);

  // EMA smoothers for continuous body state
  // Higher alpha = faster response, less smoothing
  // Lower alpha = smoother, more lag
  private rightArmEma = new EMA(0.55);  // arms need fast response
  private leftArmEma = new EMA(0.55);
  private rightLegEma = new EMA(0.5);   // legs slightly smoother
  private leftLegEma = new EMA(0.5);
  private torsoEma = new EMA(0.4);      // torso smoother (less jitter)
  private headEma = new EMA(0.5);       // head fast for spins
  private globalEma = new EMA(0.35);    // global activity
  private accelEma = new EMA(0.45);     // acceleration fast

  // Dynamic range normalization
  // peakVelocity adapts to the user's movement intensity
  private peakVelocity: number = 0.03;  // lower start = more sensitive initially
  private peakDecay: number = 0.995;    // faster decay = adapts quicker to quieter movement

  setOnTrigger(fn: TriggerCallback): void { this.onTrigger = fn; }
  setOnBodyState(fn: BodyStateCallback): void { this.onBodyState = fn; }
  setSensitivity(value: number): void { this.sensitivity = Math.max(0.05, Math.min(1, value)); }
  getSensitivity(): number { return this.sensitivity; }

  processFrame(landmarks: Point[]): void {
    if (!landmarks || landmarks.length < 33) return;

    if (!this.prevLandmarks) {
      this.prevLandmarks = landmarks;
      return;
    }

    const prev = this.prevLandmarks;

    // ─── VELOCITY per keypoint ────────────────────────
    const vel = (idx: number): number => {
      const p = prev[idx];
      const c = landmarks[idx];
      if (!p || !c) return 0;
      if ((c.visibility ?? 1) < 0.35) return 0;
      return velocity(p, c);
    };

    const dirY = (idx: number): number => {
      return prev[idx].y - landmarks[idx].y; // positive = moving up
    };
    const dirX = (idx: number): number => {
      return landmarks[idx].x - prev[idx].x; // positive = moving right
    };

    // Track velocities in multi-frame buffers
    const rWristVel = vel(KEYPOINTS.RIGHT_WRIST);
    const lWristVel = vel(KEYPOINTS.LEFT_WRIST);
    this.rWristBuf.push(rWristVel);
    this.lWristBuf.push(lWristVel);

    const rElbowVel = vel(KEYPOINTS.RIGHT_ELBOW);
    const lElbowVel = vel(KEYPOINTS.LEFT_ELBOW);
    this.rElbowBuf.push(rElbowVel);
    this.lElbowBuf.push(lElbowVel);

    const rShoulderVel = vel(KEYPOINTS.RIGHT_SHOULDER);
    const lShoulderVel = vel(KEYPOINTS.LEFT_SHOULDER);

    const rKneeVel = vel(KEYPOINTS.RIGHT_KNEE);
    const lKneeVel = vel(KEYPOINTS.LEFT_KNEE);
    this.rKneeBuf.push(rKneeVel);
    this.lKneeBuf.push(lKneeVel);

    const rAnkleVel = vel(KEYPOINTS.RIGHT_ANKLE);
    const lAnkleVel = vel(KEYPOINTS.LEFT_ANKLE);

    const rHipVel = vel(KEYPOINTS.RIGHT_HIP);
    const lHipVel = vel(KEYPOINTS.LEFT_HIP);
    this.hipBuf.push((rHipVel + lHipVel) / 2);

    const noseVel = vel(KEYPOINTS.NOSE);
    this.noseBuf.push(noseVel);

    // Also use fingers/pinky for wrist precision when available
    const rPinkyVel = vel(KEYPOINTS.RIGHT_PINKY);
    const lPinkyVel = vel(KEYPOINTS.LEFT_PINKY);
    const rIndexVel = vel(KEYPOINTS.RIGHT_INDEX);
    const lIndexVel = vel(KEYPOINTS.LEFT_INDEX);

    // ─── LIMB GROUP VELOCITIES (multi-point weighted) ──
    const rightArmRaw = (
      rWristVel * 2 +
      Math.max(rPinkyVel, rIndexVel) * 1.5 +
      rElbowVel * 1 +
      rShoulderVel * 0.3
    ) / 4.8;

    const leftArmRaw = (
      lWristVel * 2 +
      Math.max(lPinkyVel, lIndexVel) * 1.5 +
      lElbowVel * 1 +
      lShoulderVel * 0.3
    ) / 4.8;

    const rightLegRaw = (rKneeVel * 1.2 + rAnkleVel) / 2.2;
    const leftLegRaw = (lKneeVel * 1.2 + lAnkleVel) / 2.2;
    const torsoRaw = (rHipVel + lHipVel + rShoulderVel + lShoulderVel) / 4;
    const headRaw = noseVel;

    // ─── DYNAMIC PEAK ──────────────────────────────────
    const allVel = [rightArmRaw, leftArmRaw, rightLegRaw, leftLegRaw, torsoRaw, headRaw];
    const frameMax = Math.max(...allVel);
    if (frameMax > this.peakVelocity) {
      this.peakVelocity = frameMax;
    } else {
      this.peakVelocity *= this.peakDecay;
      this.peakVelocity = Math.max(this.peakVelocity, 0.01);
    }

    // Normalize raw velocity to 0–1 range
    // Sensitivity slider makes a BIG difference here:
    //   sensitivity 0.1 → range multiplier 1.3 → need big movements
    //   sensitivity 0.5 → range multiplier 0.9 → balanced
    //   sensitivity 1.0 → range multiplier 0.4 → micro-movements trigger
    const normalize = (raw: number): number => {
      if (raw < NOISE_FLOOR) return 0;
      const denoised = raw - NOISE_FLOOR;
      const rangeMult = 1.4 - this.sensitivity; // 0.4–1.35
      const range = this.peakVelocity * rangeMult;
      // Apply sqrt curve so small movements are more audible
      const linear = Math.min(1, denoised / Math.max(range, 0.005));
      return Math.sqrt(linear); // sqrt = small movements become louder
    };

    // ─── SMOOTHED CONTINUOUS BODY STATE ────────────────
    const rightArmFlow = this.rightArmEma.update(normalize(rightArmRaw));
    const leftArmFlow = this.leftArmEma.update(normalize(leftArmRaw));
    const rightLegFlow = this.rightLegEma.update(normalize(rightLegRaw));
    const leftLegFlow = this.leftLegEma.update(normalize(leftLegRaw));
    const torsoFlow = this.torsoEma.update(normalize(torsoRaw));
    const headFlow = this.headEma.update(normalize(headRaw));

    const globalRaw = (rightArmFlow + leftArmFlow + rightLegFlow + leftLegFlow + torsoFlow + headFlow) / 6;
    const globalActivity = this.globalEma.update(globalRaw);

    // ─── ACCELERATION ──────────────────────────────────
    // Rate of change in global velocity
    const prevGlobal = this.globalEma.get();
    const accelRaw = globalActivity - prevGlobal;
    const acceleration = this.accelEma.update(accelRaw);

    // ─── SYMMETRY ──────────────────────────────────────
    const armSymmetry = 1 - Math.abs(rightArmFlow - leftArmFlow) / Math.max(rightArmFlow + leftArmFlow, 0.01);
    const legSymmetry = 1 - Math.abs(rightLegFlow - leftLegFlow) / Math.max(rightLegFlow + leftLegFlow, 0.01);
    const symmetry = (armSymmetry + legSymmetry) / 2;

    // ─── POSITIONAL EXPRESSION ─────────────────────────
    const rWrist = landmarks[KEYPOINTS.RIGHT_WRIST];
    const lWrist = landmarks[KEYPOINTS.LEFT_WRIST];
    const rShoulder = landmarks[KEYPOINTS.RIGHT_SHOULDER];
    const lShoulder = landmarks[KEYPOINTS.LEFT_SHOULDER];
    const rHip = landmarks[KEYPOINTS.RIGHT_HIP];
    const lHip = landmarks[KEYPOINTS.LEFT_HIP];
    const nose = landmarks[KEYPOINTS.NOSE];

    const hipY = (rHip.y + lHip.y) / 2;
    const headY = nose.y;
    const handAvgY = (rWrist.y + lWrist.y) / 2;
    const rangeY = Math.max(0.01, hipY - headY);
    const handsHeight = Math.max(0, Math.min(1, (hipY - handAvgY) / rangeY));

    const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x);
    const armSpan = Math.abs(rWrist.x - lWrist.x);
    const bodyExpansion = Math.min(1, armSpan / Math.max(shoulderWidth * 3, 0.01));

    const shoulderCenterX = (rShoulder.x + lShoulder.x) / 2;
    const hipCenterX = (rHip.x + lHip.x) / 2;
    const lean = Math.max(-1, Math.min(1, (shoulderCenterX - hipCenterX) * 10));

    // Vertical energy — are keypoints moving up or down?
    const bodyUpVel = (
      dirY(KEYPOINTS.NOSE) +
      dirY(KEYPOINTS.LEFT_WRIST) + dirY(KEYPOINTS.RIGHT_WRIST) +
      dirY(KEYPOINTS.LEFT_SHOULDER) + dirY(KEYPOINTS.RIGHT_SHOULDER)
    ) / 5;
    const verticalEnergy = Math.max(-1, Math.min(1, bodyUpVel * 20));

    // Still = truly frozen. Even breathing creates micro-movement.
    // 0.01 is very strict — only camera jitter, no real body motion
    const isStill = globalActivity < 0.01;

    // ─── EMIT BODY STATE ───────────────────────────────
    this.onBodyState?.({
      globalActivity, rightArmFlow, leftArmFlow, rightLegFlow, leftLegFlow,
      torsoFlow, headFlow, handsHeight, bodyExpansion, lean, isStill,
      acceleration, symmetry, verticalEnergy,
    });

    // ─── PERCUSSIVE TRIGGERS ───────────────────────────
    const sensScale = 1.4 - this.sensitivity;

    // Use multi-frame averaged velocity for stable triggers
    const rWristAvg = this.rWristBuf.average();
    const lWristAvg = this.lWristBuf.average();

    // Direction detection for wrists
    const rWristDirY = dirY(KEYPOINTS.RIGHT_WRIST);
    const rWristDirX = dirX(KEYPOINTS.RIGHT_WRIST);
    const rDir: TriggerEvent['direction'] =
      Math.abs(rWristDirY) > Math.abs(rWristDirX)
        ? (rWristDirY > 0 ? 'up' : 'down')
        : (rWristDirX > 0 ? 'right' : 'left');

    const lWristDirY = dirY(KEYPOINTS.LEFT_WRIST);
    const lWristDirX = dirX(KEYPOINTS.LEFT_WRIST);
    const lDir: TriggerEvent['direction'] =
      Math.abs(lWristDirY) > Math.abs(lWristDirX)
        ? (lWristDirY > 0 ? 'up' : 'down')
        : (lWristDirX > 0 ? 'right' : 'left');

    // Right hand
    if (rWristAvg > PERCUSSIVE_THRESHOLDS.wrist * sensScale) {
      this.fireTrigger('right_hand', normalize(rWristAvg), rDir);
    }

    // Left hand
    if (lWristAvg > PERCUSSIVE_THRESHOLDS.wrist * sensScale) {
      this.fireTrigger('left_hand', normalize(lWristAvg), lDir);
    }

    // Right kick — knee position + velocity
    const rKnee = landmarks[KEYPOINTS.RIGHT_KNEE];
    if (rKnee.y < rHip.y - 0.035 && this.rKneeBuf.average() > PERCUSSIVE_THRESHOLDS.kick * sensScale) {
      this.fireTrigger('right_kick', normalize(this.rKneeBuf.average()));
    }

    // Left kick
    const lKnee = landmarks[KEYPOINTS.LEFT_KNEE];
    if (lKnee.y < lHip.y - 0.035 && this.lKneeBuf.average() > PERCUSSIVE_THRESHOLDS.kick * sensScale) {
      this.fireTrigger('left_kick', normalize(this.lKneeBuf.average()));
    }

    // Both hands above shoulders → air
    if (rWrist.y < rShoulder.y - 0.04 && lWrist.y < lShoulder.y - 0.04) {
      const armAvg = (rWristAvg + lWristAvg) / 2;
      if (armAvg > NOISE_FLOOR * 2) {
        this.fireTrigger('air', Math.max(normalize(armAvg), handsHeight * 0.8));
      }
    }

    // Hip sway → bass
    const hipSwayVel = Math.abs(
      (rHip.x + lHip.x) / 2 - (prev[KEYPOINTS.RIGHT_HIP].x + prev[KEYPOINTS.LEFT_HIP].x) / 2
    );
    if (hipSwayVel > PERCUSSIVE_THRESHOLDS.hip * sensScale) {
      this.fireTrigger('bass', normalize(hipSwayVel * 3));
    }

    // Head nod → snare
    const noseYVel = Math.abs(nose.y - prev[KEYPOINTS.NOSE].y);
    if (noseYVel > PERCUSSIVE_THRESHOLDS.nose * sensScale) {
      this.fireTrigger('snare', normalize(noseYVel * 4));
    }

    // Full body jump → crash
    let jumpVel = 0;
    const jumpKps = [KEYPOINTS.NOSE, KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.RIGHT_SHOULDER, KEYPOINTS.LEFT_HIP, KEYPOINTS.RIGHT_HIP];
    for (const idx of jumpKps) { jumpVel += prev[idx].y - landmarks[idx].y; }
    jumpVel /= jumpKps.length;
    if (jumpVel > PERCUSSIVE_THRESHOLDS.jump * sensScale) {
      this.fireTrigger('crash', normalize(jumpVel * 5));
    }

    this.prev2Landmarks = this.prevLandmarks;
    this.prevLandmarks = landmarks;
  }

  private fireTrigger(slot: SoundSlot, intensity: number, direction?: TriggerEvent['direction']): void {
    const last = this.cooldowns.get(slot) || 0;
    if (performance.now() - last < COOLDOWN_MS) return;
    this.cooldowns.set(slot, performance.now());
    this.onTrigger?.({ slot, velocity: Math.max(0.1, Math.min(1, intensity)), direction });
  }

  reset(): void {
    this.prevLandmarks = null;
    this.prev2Landmarks = null;
    this.cooldowns.clear();
    this.rWristBuf.reset(); this.lWristBuf.reset();
    this.rElbowBuf.reset(); this.lElbowBuf.reset();
    this.rKneeBuf.reset(); this.lKneeBuf.reset();
    this.hipBuf.reset(); this.noseBuf.reset();
    this.rightArmEma.reset(); this.leftArmEma.reset();
    this.rightLegEma.reset(); this.leftLegEma.reset();
    this.torsoEma.reset(); this.headEma.reset();
    this.globalEma.reset(); this.accelEma.reset();
    this.peakVelocity = 0.04;
  }
}
