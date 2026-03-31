export type MoodId =
  | 'rage'
  | 'euphoria'
  | 'melancholy'
  | 'ritual'
  | 'void'
  | 'ascension'
  | 'cypher'
  | 'feral'
  | 'classical'
  | 'dnb'
  | 'synthwave'
  | 'cinematic'
  | 'orchestra';

export interface MoodConfig {
  id: MoodId;
  name: string;
  description: string;
  accentColor: string;
  skeletonColor: string;
  skeletonGlow: string;
  bgGradient: string;
  padGlow: string;
  defaultPackIndex: number;
  defaultBpm: number;
  defaultReverb: number;
  defaultDelay: boolean;
  defaultQuantize: boolean;
}

export const MOODS: Record<MoodId, MoodConfig> = {
  rage: {
    id: 'rage',
    name: 'RAGE',
    description: 'Aggressive, primal, unfiltered',
    accentColor: '#DC2626',
    skeletonColor: '#EF4444',
    skeletonGlow: '0 0 20px #DC2626, 0 0 40px #991B1B',
    bgGradient: 'radial-gradient(ellipse at center, #1a0505 0%, #0a0000 100%)',
    padGlow: '#DC2626',
    defaultPackIndex: 6,
    defaultBpm: 140,
    defaultReverb: 60,
    defaultDelay: false,
    defaultQuantize: false,
  },
  euphoria: {
    id: 'euphoria',
    name: 'EUPHORIA',
    description: 'Ecstatic, celebratory, electric',
    accentColor: '#FACC15',
    skeletonColor: '#FDE047',
    skeletonGlow: '0 0 20px #FACC15, 0 0 40px #CA8A04',
    bgGradient: 'radial-gradient(ellipse at center, #1a1800 0%, #0a0900 100%)',
    padGlow: '#FACC15',
    defaultPackIndex: 1,
    defaultBpm: 128,
    defaultReverb: 30,
    defaultDelay: true,
    defaultQuantize: true,
  },
  melancholy: {
    id: 'melancholy',
    name: 'MELANCHOLY',
    description: 'Introspective, slow, aching',
    accentColor: '#3B82F6',
    skeletonColor: '#60A5FA',
    skeletonGlow: '0 0 20px #3B82F6, 0 0 40px #1E40AF',
    bgGradient: 'radial-gradient(ellipse at center, #050a1a 0%, #000005 100%)',
    padGlow: '#3B82F6',
    defaultPackIndex: 3,
    defaultBpm: 72,
    defaultReverb: 80,
    defaultDelay: true,
    defaultQuantize: false,
  },
  ritual: {
    id: 'ritual',
    name: 'RITUAL',
    description: 'Ceremonial, ancestral, sacred',
    accentColor: '#D97706',
    skeletonColor: '#F59E0B',
    skeletonGlow: '0 0 20px #D97706, 0 0 40px #92400E',
    bgGradient: 'radial-gradient(ellipse at center, #1a1005 0%, #0a0800 100%)',
    padGlow: '#D97706',
    defaultPackIndex: 2,
    defaultBpm: 100,
    defaultReverb: 40,
    defaultDelay: false,
    defaultQuantize: true,
  },
  void: {
    id: 'void',
    name: 'VOID',
    description: 'Abstract, alien, disconnected',
    accentColor: '#9CA3AF',
    skeletonColor: '#D1D5DB',
    skeletonGlow: '0 0 20px #9CA3AF, 0 0 40px #4B5563',
    bgGradient: 'radial-gradient(ellipse at center, #0f0f0f 0%, #000000 100%)',
    padGlow: '#9CA3AF',
    defaultPackIndex: 7,
    defaultBpm: 90,
    defaultReverb: 70,
    defaultDelay: true,
    defaultQuantize: false,
  },
  ascension: {
    id: 'ascension',
    name: 'ASCENSION',
    description: 'Spiritual, rising, expansive',
    accentColor: '#06B6D4',
    skeletonColor: '#22D3EE',
    skeletonGlow: '0 0 20px #06B6D4, 0 0 40px #0E7490',
    bgGradient: 'radial-gradient(ellipse at center, #051a1a 0%, #000a0a 100%)',
    padGlow: '#06B6D4',
    defaultPackIndex: 4,
    defaultBpm: 68,
    defaultReverb: 90,
    defaultDelay: true,
    defaultQuantize: false,
  },
  cypher: {
    id: 'cypher',
    name: 'CYPHER',
    description: 'Street, competitive, raw',
    accentColor: '#F97316',
    skeletonColor: '#FB923C',
    skeletonGlow: '0 0 20px #F97316, 0 0 40px #C2410C',
    bgGradient: 'radial-gradient(ellipse at center, #1a0f05 0%, #0a0500 100%)',
    padGlow: '#F97316',
    defaultPackIndex: 0,
    defaultBpm: 95,
    defaultReverb: 20,
    defaultDelay: false,
    defaultQuantize: true,
  },
  feral: {
    id: 'feral',
    name: 'FERAL',
    description: 'Primal movement, animalistic, unpredictable',
    accentColor: '#22C55E',
    skeletonColor: '#4ADE80',
    skeletonGlow: '0 0 20px #22C55E, 0 0 40px #15803D',
    bgGradient: 'radial-gradient(ellipse at center, #051a0a 0%, #000a05 100%)',
    padGlow: '#22C55E',
    defaultPackIndex: 5,
    defaultBpm: 110,
    defaultReverb: 30,
    defaultDelay: false,
    defaultQuantize: false,
  },
  classical: {
    id: 'classical',
    name: 'CLASSICAL',
    description: 'Piano, strings, experimental chamber',
    accentColor: '#A78BFA',
    skeletonColor: '#C4B5FD',
    skeletonGlow: '0 0 20px #A78BFA, 0 0 40px #7C3AED',
    bgGradient: 'radial-gradient(ellipse at center, #0a0515 0%, #020008 100%)',
    padGlow: '#A78BFA',
    defaultPackIndex: 8,
    defaultBpm: 60,
    defaultReverb: 85,
    defaultDelay: true,
    defaultQuantize: false,
  },
  dnb: {
    id: 'dnb',
    name: 'DNB',
    description: 'Broken beats, jungle energy, liquid bass',
    accentColor: '#E879F9',
    skeletonColor: '#F0ABFC',
    skeletonGlow: '0 0 20px #E879F9, 0 0 40px #A21CAF',
    bgGradient: 'radial-gradient(ellipse at center, #150520 0%, #05010a 100%)',
    padGlow: '#E879F9',
    defaultPackIndex: 9,
    defaultBpm: 170,
    defaultReverb: 25,
    defaultDelay: false,
    defaultQuantize: true,
  },
  synthwave: {
    id: 'synthwave',
    name: 'SYNTHWAVE',
    description: 'Blade Runner neon, Stranger Things analog',
    accentColor: '#F472B6',
    skeletonColor: '#F9A8D4',
    skeletonGlow: '0 0 20px #F472B6, 0 0 40px #BE185D',
    bgGradient: 'radial-gradient(ellipse at center, #1a0818 0%, #080010 100%)',
    padGlow: '#F472B6',
    defaultPackIndex: 10,
    defaultBpm: 108,
    defaultReverb: 55,
    defaultDelay: true,
    defaultQuantize: true,
  },
  cinematic: {
    id: 'cinematic',
    name: 'CINEMATIC',
    description: 'Hans Zimmer, epic score, time, inception',
    accentColor: '#B45309',
    skeletonColor: '#D97706',
    skeletonGlow: '0 0 20px #B45309, 0 0 40px #78350F',
    bgGradient: 'radial-gradient(ellipse at center, #1a1008 0%, #0a0800 100%)',
    padGlow: '#B45309',
    defaultPackIndex: 11,
    defaultBpm: 80,
    defaultReverb: 70,
    defaultDelay: true,
    defaultQuantize: false,
  },
  orchestra: {
    id: 'orchestra',
    name: 'ORCHESTRA',
    description: 'Emotional strings, choir, powerful soundscapes',
    accentColor: '#7C3AED',
    skeletonColor: '#A78BFA',
    skeletonGlow: '0 0 20px #7C3AED, 0 0 40px #4C1D95',
    bgGradient: 'radial-gradient(ellipse at center, #0f0520 0%, #050010 100%)',
    padGlow: '#7C3AED',
    defaultPackIndex: 12,
    defaultBpm: 66,
    defaultReverb: 90,
    defaultDelay: true,
    defaultQuantize: false,
  },
};

export const MOOD_LIST: MoodId[] = [
  'rage',
  'euphoria',
  'melancholy',
  'ritual',
  'void',
  'ascension',
  'cypher',
  'feral',
  'classical',
  'dnb',
  'synthwave',
  'cinematic',
  'orchestra',
];
