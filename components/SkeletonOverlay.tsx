'use client';

import { useEffect, useRef, useCallback } from 'react';
import { KEYPOINTS } from '@/lib/constants';
import { Point } from '@/lib/poseUtils';

// ── Zone definitions: which keypoint indices belong to each zone ──

const ZONE_KEYPOINTS: Record<string, number[]> = {
  head: [
    KEYPOINTS.NOSE,
    KEYPOINTS.LEFT_EYE_INNER, KEYPOINTS.LEFT_EYE, KEYPOINTS.LEFT_EYE_OUTER,
    KEYPOINTS.RIGHT_EYE_INNER, KEYPOINTS.RIGHT_EYE, KEYPOINTS.RIGHT_EYE_OUTER,
    KEYPOINTS.LEFT_EAR, KEYPOINTS.RIGHT_EAR,
    KEYPOINTS.MOUTH_LEFT, KEYPOINTS.MOUTH_RIGHT,
  ],
  rarm: [
    KEYPOINTS.RIGHT_SHOULDER, KEYPOINTS.RIGHT_ELBOW, KEYPOINTS.RIGHT_WRIST,
    KEYPOINTS.RIGHT_PINKY, KEYPOINTS.RIGHT_INDEX, KEYPOINTS.RIGHT_THUMB,
  ],
  larm: [
    KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.LEFT_ELBOW, KEYPOINTS.LEFT_WRIST,
    KEYPOINTS.LEFT_PINKY, KEYPOINTS.LEFT_INDEX, KEYPOINTS.LEFT_THUMB,
  ],
  torso: [
    KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.RIGHT_SHOULDER,
    KEYPOINTS.LEFT_HIP, KEYPOINTS.RIGHT_HIP,
  ],
  legs: [
    KEYPOINTS.LEFT_HIP, KEYPOINTS.RIGHT_HIP,
    KEYPOINTS.LEFT_KNEE, KEYPOINTS.RIGHT_KNEE,
    KEYPOINTS.LEFT_ANKLE, KEYPOINTS.RIGHT_ANKLE,
    KEYPOINTS.LEFT_HEEL, KEYPOINTS.RIGHT_HEEL,
    KEYPOINTS.LEFT_FOOT_INDEX, KEYPOINTS.RIGHT_FOOT_INDEX,
  ],
};

// ── Connection definitions, grouped by zone ──

type ZoneName = 'head' | 'rarm' | 'larm' | 'torso' | 'legs';

interface ZoneConnection {
  from: number;
  to: number;
  zone: ZoneName;
}

const ZONE_CONNECTIONS: ZoneConnection[] = [
  // Head
  { from: KEYPOINTS.NOSE, to: KEYPOINTS.LEFT_EYE, zone: 'head' },
  { from: KEYPOINTS.NOSE, to: KEYPOINTS.RIGHT_EYE, zone: 'head' },
  { from: KEYPOINTS.LEFT_EYE, to: KEYPOINTS.LEFT_EAR, zone: 'head' },
  { from: KEYPOINTS.RIGHT_EYE, to: KEYPOINTS.RIGHT_EAR, zone: 'head' },

  // Spine (nose → mid-shoulders → mid-hips): drawn as torso zone
  // We handle these as virtual midpoints in the draw function

  // Right arm
  { from: KEYPOINTS.RIGHT_SHOULDER, to: KEYPOINTS.RIGHT_ELBOW, zone: 'rarm' },
  { from: KEYPOINTS.RIGHT_ELBOW, to: KEYPOINTS.RIGHT_WRIST, zone: 'rarm' },
  // Right hand
  { from: KEYPOINTS.RIGHT_WRIST, to: KEYPOINTS.RIGHT_INDEX, zone: 'rarm' },
  { from: KEYPOINTS.RIGHT_WRIST, to: KEYPOINTS.RIGHT_PINKY, zone: 'rarm' },
  { from: KEYPOINTS.RIGHT_WRIST, to: KEYPOINTS.RIGHT_THUMB, zone: 'rarm' },

  // Left arm
  { from: KEYPOINTS.LEFT_SHOULDER, to: KEYPOINTS.LEFT_ELBOW, zone: 'larm' },
  { from: KEYPOINTS.LEFT_ELBOW, to: KEYPOINTS.LEFT_WRIST, zone: 'larm' },
  // Left hand
  { from: KEYPOINTS.LEFT_WRIST, to: KEYPOINTS.LEFT_INDEX, zone: 'larm' },
  { from: KEYPOINTS.LEFT_WRIST, to: KEYPOINTS.LEFT_PINKY, zone: 'larm' },
  { from: KEYPOINTS.LEFT_WRIST, to: KEYPOINTS.LEFT_THUMB, zone: 'larm' },

  // Torso
  { from: KEYPOINTS.LEFT_SHOULDER, to: KEYPOINTS.RIGHT_SHOULDER, zone: 'torso' },
  { from: KEYPOINTS.LEFT_SHOULDER, to: KEYPOINTS.LEFT_HIP, zone: 'torso' },
  { from: KEYPOINTS.RIGHT_SHOULDER, to: KEYPOINTS.RIGHT_HIP, zone: 'torso' },
  { from: KEYPOINTS.LEFT_HIP, to: KEYPOINTS.RIGHT_HIP, zone: 'torso' },

  // Head-to-torso (nose → shoulders) — belongs to head zone
  { from: KEYPOINTS.NOSE, to: KEYPOINTS.LEFT_SHOULDER, zone: 'head' },
  { from: KEYPOINTS.NOSE, to: KEYPOINTS.RIGHT_SHOULDER, zone: 'head' },

  // Legs
  { from: KEYPOINTS.LEFT_HIP, to: KEYPOINTS.LEFT_KNEE, zone: 'legs' },
  { from: KEYPOINTS.LEFT_KNEE, to: KEYPOINTS.LEFT_ANKLE, zone: 'legs' },
  { from: KEYPOINTS.RIGHT_HIP, to: KEYPOINTS.RIGHT_KNEE, zone: 'legs' },
  { from: KEYPOINTS.RIGHT_KNEE, to: KEYPOINTS.RIGHT_ANKLE, zone: 'legs' },
  // Left foot
  { from: KEYPOINTS.LEFT_ANKLE, to: KEYPOINTS.LEFT_HEEL, zone: 'legs' },
  { from: KEYPOINTS.LEFT_ANKLE, to: KEYPOINTS.LEFT_FOOT_INDEX, zone: 'legs' },
  // Right foot
  { from: KEYPOINTS.RIGHT_ANKLE, to: KEYPOINTS.RIGHT_HEEL, zone: 'legs' },
  { from: KEYPOINTS.RIGHT_ANKLE, to: KEYPOINTS.RIGHT_FOOT_INDEX, zone: 'legs' },
];

// Build a lookup: keypoint index → best (highest) zone activity
function getKeypointZone(idx: number): ZoneName {
  // Priority order — first match wins for the "primary" zone
  for (const zone of ['head', 'rarm', 'larm', 'torso', 'legs'] as ZoneName[]) {
    if (ZONE_KEYPOINTS[zone].includes(idx)) return zone;
  }
  return 'torso';
}

// ── Visible keypoints (all body landmarks we want to draw as dots) ──

const VISIBLE_KEYPOINTS = [
  KEYPOINTS.NOSE,
  KEYPOINTS.LEFT_EYE, KEYPOINTS.RIGHT_EYE,
  KEYPOINTS.LEFT_EAR, KEYPOINTS.RIGHT_EAR,
  KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.RIGHT_SHOULDER,
  KEYPOINTS.LEFT_ELBOW, KEYPOINTS.RIGHT_ELBOW,
  KEYPOINTS.LEFT_WRIST, KEYPOINTS.RIGHT_WRIST,
  KEYPOINTS.LEFT_PINKY, KEYPOINTS.RIGHT_PINKY,
  KEYPOINTS.LEFT_INDEX, KEYPOINTS.RIGHT_INDEX,
  KEYPOINTS.LEFT_THUMB, KEYPOINTS.RIGHT_THUMB,
  KEYPOINTS.LEFT_HIP, KEYPOINTS.RIGHT_HIP,
  KEYPOINTS.LEFT_KNEE, KEYPOINTS.RIGHT_KNEE,
  KEYPOINTS.LEFT_ANKLE, KEYPOINTS.RIGHT_ANKLE,
  KEYPOINTS.LEFT_HEEL, KEYPOINTS.RIGHT_HEEL,
  KEYPOINTS.LEFT_FOOT_INDEX, KEYPOINTS.RIGHT_FOOT_INDEX,
];

// ── Helpers ──

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return { r, g, b };
}

function rgba(
  rgb: { r: number; g: number; b: number },
  alpha: number,
): string {
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.min(1, Math.max(0, alpha))})`;
}

function midpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
  };
}

// ── Props ──

export interface ActiveZones {
  head: number;
  rarm: number;
  larm: number;
  torso: number;
  legs: number;
}

interface SkeletonOverlayProps {
  landmarks: Point[] | null;
  prevLandmarks?: Point[] | null;
  color: string;
  width: number;
  height: number;
  activeZones?: ActiveZones;
}

const DEFAULT_ZONES: ActiveZones = {
  head: 0,
  rarm: 0,
  larm: 0,
  torso: 0,
  legs: 0,
};

// ── Component ──

export default function SkeletonOverlay({
  landmarks,
  prevLandmarks,
  color,
  width,
  height,
  activeZones = DEFAULT_ZONES,
}: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    if (!landmarks || landmarks.length === 0) return;

    const rgb = hexToRgb(color);
    const VIS_THRESHOLD = 0.3;

    const isVisible = (p: Point | undefined): p is Point =>
      !!p && (p.visibility ?? 1) >= VIS_THRESHOLD;

    // ── Helper: activity value for a zone ──
    const zoneActivity = (zone: ZoneName): number => activeZones[zone] ?? 0;
    // isActive used implicitly via zoneActivity > threshold checks

    // ── Helper: lerp ──
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    // ── Draw a connection line with zone-based styling ──
    const drawLine = (
      ax: number,
      ay: number,
      bx: number,
      by: number,
      zone: ZoneName,
    ) => {
      const act = zoneActivity(zone);
      const active = act > 0.1;

      // Outer glow pass
      ctx.save();
      const lineW = active ? lerp(1.5, 3, act) : 1.5;
      const blur = active ? lerp(4, 20, act) : 4;
      const alpha = active ? lerp(0.4, 1, act) : 0.35;

      ctx.strokeStyle = rgba(rgb, alpha);
      ctx.lineWidth = lineW;
      ctx.lineCap = 'round';
      ctx.shadowColor = rgba(rgb, alpha);
      ctx.shadowBlur = blur;

      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();

      // Inner bright core for active lines
      if (active) {
        ctx.strokeStyle = rgba(rgb, Math.min(1, alpha + 0.3));
        ctx.lineWidth = lineW * 0.5;
        ctx.shadowBlur = blur * 0.4;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      ctx.restore();
    };

    // ── 1. Draw zone connections ──
    for (const conn of ZONE_CONNECTIONS) {
      const a = landmarks[conn.from];
      const b = landmarks[conn.to];
      if (!isVisible(a) || !isVisible(b)) continue;

      drawLine(
        a.x * width,
        a.y * height,
        b.x * width,
        b.y * height,
        conn.zone,
      );
    }

    // ── 2. Draw spine (virtual midpoints) ──
    const lShoulder = landmarks[KEYPOINTS.LEFT_SHOULDER];
    const rShoulder = landmarks[KEYPOINTS.RIGHT_SHOULDER];
    const lHip = landmarks[KEYPOINTS.LEFT_HIP];
    const rHip = landmarks[KEYPOINTS.RIGHT_HIP];
    const nose = landmarks[KEYPOINTS.NOSE];

    if (isVisible(lShoulder) && isVisible(rShoulder)) {
      const midShoulders = midpoint(lShoulder, rShoulder);

      // Nose → mid-shoulders
      if (isVisible(nose)) {
        drawLine(
          nose.x * width,
          nose.y * height,
          midShoulders.x * width,
          midShoulders.y * height,
          'torso',
        );
      }

      // Mid-shoulders → mid-hips
      if (isVisible(lHip) && isVisible(rHip)) {
        const midHips = midpoint(lHip, rHip);
        drawLine(
          midShoulders.x * width,
          midShoulders.y * height,
          midHips.x * width,
          midHips.y * height,
          'torso',
        );
      }
    }

    // ── 3. Draw keypoints ──
    for (const idx of VISIBLE_KEYPOINTS) {
      const kp = landmarks[idx];
      if (!isVisible(kp)) continue;

      const zone = getKeypointZone(idx);
      const act = zoneActivity(zone);
      const active = act > 0.1;
      const px = kp.x * width;
      const py = kp.y * height;

      ctx.save();
      ctx.shadowColor = rgba(rgb, active ? lerp(0.4, 1, act) : 0.3);
      ctx.shadowBlur = active ? lerp(6, 24, act) : 4;

      if (active) {
        // Outer glow ring
        const outerR = lerp(3, 7, act);
        ctx.fillStyle = rgba(rgb, lerp(0.1, 0.3, act));
        ctx.beginPath();
        ctx.arc(px, py, outerR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner dot
      const dotR = active ? lerp(2, 5, act) : 2;
      ctx.fillStyle = rgba(rgb, active ? lerp(0.6, 1, act) : 0.5);
      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // ── 4. Particle trails for fast-moving joints ──
    if (prevLandmarks && prevLandmarks.length > 0) {
      const SPEED_THRESHOLD = 0.02; // normalized units per frame
      const TRAIL_DOTS = 4;

      for (const idx of VISIBLE_KEYPOINTS) {
        const curr = landmarks[idx];
        const prev = prevLandmarks[idx];
        if (!isVisible(curr) || !isVisible(prev)) continue;

        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const speed = Math.sqrt(dx * dx + dy * dy);

        if (speed < SPEED_THRESHOLD) continue;

        const zone = getKeypointZone(idx);
        const act = Math.max(zoneActivity(zone), 0.3);

        ctx.save();
        for (let t = 1; t <= TRAIL_DOTS; t++) {
          const frac = t / (TRAIL_DOTS + 1);
          // Trail dots along the motion vector, behind the current position
          const tx = (curr.x - dx * frac * 2.5) * width;
          const ty = (curr.y - dy * frac * 2.5) * height;
          const alpha = (1 - frac) * 0.6 * act;
          const radius = (1 - frac) * 2.5;

          ctx.shadowColor = rgba(rgb, alpha * 0.5);
          ctx.shadowBlur = 6;
          ctx.fillStyle = rgba(rgb, alpha);
          ctx.beginPath();
          ctx.arc(tx, ty, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    ctx.shadowBlur = 0;
  }, [landmarks, prevLandmarks, color, width, height, activeZones]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 2 }}
    />
  );
}
