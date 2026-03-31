// MediaPipe Pose Landmarker keypoint indices
export const KEYPOINTS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

// Skeleton connections for drawing
export const SKELETON_CONNECTIONS: [number, number][] = [
  [KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.RIGHT_SHOULDER],
  [KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.LEFT_ELBOW],
  [KEYPOINTS.LEFT_ELBOW, KEYPOINTS.LEFT_WRIST],
  [KEYPOINTS.RIGHT_SHOULDER, KEYPOINTS.RIGHT_ELBOW],
  [KEYPOINTS.RIGHT_ELBOW, KEYPOINTS.RIGHT_WRIST],
  [KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.LEFT_HIP],
  [KEYPOINTS.RIGHT_SHOULDER, KEYPOINTS.RIGHT_HIP],
  [KEYPOINTS.LEFT_HIP, KEYPOINTS.RIGHT_HIP],
  [KEYPOINTS.LEFT_HIP, KEYPOINTS.LEFT_KNEE],
  [KEYPOINTS.LEFT_KNEE, KEYPOINTS.LEFT_ANKLE],
  [KEYPOINTS.RIGHT_HIP, KEYPOINTS.RIGHT_KNEE],
  [KEYPOINTS.RIGHT_KNEE, KEYPOINTS.RIGHT_ANKLE],
  [KEYPOINTS.NOSE, KEYPOINTS.LEFT_SHOULDER],
  [KEYPOINTS.NOSE, KEYPOINTS.RIGHT_SHOULDER],
];

// Sound slot names mapped to trigger events
export const SOUND_SLOTS = [
  'right_hand',
  'left_hand',
  'right_kick',
  'left_kick',
  'air',
  'bass',
  'snare',
  'crash',
] as const;

export type SoundSlot = (typeof SOUND_SLOTS)[number];

// Slot to pack index mapping
export const SLOT_TO_PACK_INDEX: Record<SoundSlot, number> = {
  right_hand: 0,
  left_hand: 1,
  right_kick: 2,
  left_kick: 3,
  air: 4,
  bass: 5,
  snare: 6,
  crash: 7,
};

// Default thresholds
export const DEFAULT_VELOCITY_THRESHOLD = 15; // pixels/frame
export const DEFAULT_COOLDOWN_MS = 200;
export const DEFAULT_SENSITIVITY = 0.5; // 0–1 scale, maps to threshold multiplier

// Zones (normalized 0–1 coordinates)
export const ZONES = {
  LEFT: { xMin: 0, xMax: 0.4 },
  RIGHT: { xMin: 0.6, xMax: 1 },
  TOP: { yMin: 0, yMax: 0.4 },
  BOTTOM: { yMin: 0.6, yMax: 1 },
  CENTER: { xMin: 0.3, xMax: 0.7, yMin: 0.3, yMax: 0.7 },
} as const;
