export interface SynthSlotConfig {
  name: string;
  type: 'membrane' | 'metal' | 'synth' | 'noise' | 'am' | 'fm' | 'mono';
  note?: string;
  duration?: string;
  options?: Record<string, unknown>;
}

export interface SoundPackConfig {
  name: string;
  slots: SynthSlotConfig[];
}

export const PACKS: SoundPackConfig[] = [
  // ─────────────────────────────────────────────────────
  // Pack 0 — CYPHER / Boom Bap Kit
  // DJ Shadow dusty breaks, DJ Krush murky low end,
  // Nujabes warmth, classic boom bap grit
  // ─────────────────────────────────────────────────────
  {
    name: 'Boom Bap Kit',
    slots: [
      // Dusty boom bap kick — warm, rounded, vinyl thump (E1 = higher, punchier than standard)
      { name: 'Dusty Kick', type: 'membrane', note: 'E1', duration: '8n', options: { pitchDecay: 0.05, octaves: 4, envelope: { attack: 0.003, decay: 0.3, sustain: 0, release: 0.12 } } },
      // Lo-fi snare — soft attack, brown noise body like a brushed crate-dig snare
      { name: 'Lo-Fi Snare', type: 'noise', duration: '8n', options: { noise: { type: 'brown' }, envelope: { attack: 0.005, decay: 0.18, sustain: 0.02, release: 0.12 } } },
      // Vinyl crackle hat — short, filtered, Krush-style
      { name: 'Crackle HH', type: 'metal', note: 'C6', duration: '32n', options: { frequency: 320, envelope: { attack: 0.001, decay: 0.04, release: 0.02 }, harmonicity: 4.7, modulationIndex: 24, resonance: 3200, octaves: 1.2 } },
      // Open hat — longer decay, washy, like tape-degraded cymbal
      { name: 'Tape Hat', type: 'metal', note: 'C6', duration: '8n', options: { frequency: 280, envelope: { attack: 0.002, decay: 0.25, release: 0.15 }, harmonicity: 4.2, modulationIndex: 18, resonance: 2800, octaves: 1 } },
      // Vocal chop — hip-hop vocal stab, formant-like
      { name: 'Vocal Chop', type: 'fm', note: 'C4', duration: '8n', options: { harmonicity: 2.5, modulationIndex: 5, envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.12 } } },
      // Deep sub bass — Krush-style sub, dark and long
      { name: 'Sub Bass', type: 'membrane', note: 'D1', duration: '2n', options: { pitchDecay: 0.04, octaves: 3.5, envelope: { attack: 0.002, decay: 0.6, sustain: 0.15, release: 0.4 } } },
      // Jazz piano stab — Nujabes warmth, triangle wave soft
      { name: 'Piano Stab', type: 'synth', note: 'Eb4', duration: '4n', options: { oscillator: { type: 'triangle' }, envelope: { attack: 0.008, decay: 0.5, sustain: 0.15, release: 0.4 } } },
      // Vinyl hiss texture — ambient crackle, constant atmosphere
      { name: 'Vinyl Hiss', type: 'noise', duration: '2n', options: { noise: { type: 'pink' }, envelope: { attack: 0.08, decay: 0.6, sustain: 0.15, release: 0.4 } } },
    ],
  },
  // ─────────────────────────────────────────────────────
  // Pack 1 — EUPHORIA / Breakbeat Ecstasy
  // Bonobo live energy, DnB breaks, liquid bass,
  // festival-meets-warehouse euphoria
  // ─────────────────────────────────────────────────────
  {
    name: 'Breakbeat Ecstasy',
    slots: [
      // Jungle break kick — punchy, tight, amen-style
      { name: 'Break Kick', type: 'membrane', note: 'F1', duration: '16n', options: { pitchDecay: 0.02, octaves: 8, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 } } },
      // DnB snare — sharp crack with body
      { name: 'DnB Snare', type: 'noise', duration: '16n', options: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.14, sustain: 0, release: 0.06 } } },
      // Liquid hi-hat — Bonobo organic shimmer
      { name: 'Liquid HH', type: 'metal', note: 'C6', duration: '32n', options: { frequency: 520, envelope: { attack: 0.001, decay: 0.06, release: 0.03 }, harmonicity: 5.3, modulationIndex: 28, resonance: 5500, octaves: 1.3 } },
      // Ride shimmer — long, washy, live drum kit feel
      { name: 'Ride', type: 'metal', note: 'D6', duration: '4n', options: { frequency: 480, envelope: { attack: 0.001, decay: 0.5, release: 0.3 }, harmonicity: 3.8, modulationIndex: 16, resonance: 4500, octaves: 0.8 } },
      // Vocal riser — euphoric pitched vocal hit
      { name: 'Vocal Rise', type: 'fm', note: 'E4', duration: '4n', options: { harmonicity: 3, modulationIndex: 4, envelope: { attack: 0.05, decay: 0.2, sustain: 0.15, release: 0.2 } } },
      // Synth pad stab — euphoric chord hit
      { name: 'Pad Stab', type: 'am', note: 'G4', duration: '4n', options: { harmonicity: 2, envelope: { attack: 0.02, decay: 0.25, sustain: 0.2, release: 0.3 } } },
      // Amen ghost snare — soft roll texture
      { name: 'Ghost Snare', type: 'noise', duration: '32n', options: { noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 } } },
      // Riser — festival build, long attack swell
      { name: 'Riser', type: 'fm', note: 'C3', duration: '1n', options: { harmonicity: 2.5, modulationIndex: 12, envelope: { attack: 0.6, decay: 0.4, sustain: 0.7, release: 0.5 } } },
    ],
  },
  // ─────────────────────────────────────────────────────
  // Pack 2 — RITUAL / Percussion & Chant
  // Brazilian percussion, African polyrhythm,
  // prepared piano, ceremonial, Steve Reich repetition
  // ─────────────────────────────────────────────────────
  {
    name: 'Percussion & Chant',
    slots: [
      // Surdo — deep ceremonial bass drum
      { name: 'Surdo', type: 'membrane', note: 'F1', duration: '4n', options: { pitchDecay: 0.035, octaves: 3, envelope: { attack: 0.002, decay: 0.55, sustain: 0.08, release: 0.35 } } },
      // Caixa — tight snare, processional
      { name: 'Caixa', type: 'noise', duration: '16n', options: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.04 } } },
      // Agogô — bell tone, Steve Reich phase pattern
      { name: 'Agogô', type: 'metal', note: 'E6', duration: '8n', options: { frequency: 850, envelope: { attack: 0.001, decay: 0.18, release: 0.12 }, harmonicity: 2.1, modulationIndex: 7, resonance: 6000, octaves: 0.4 } },
      // Prepared piano — muted, percussive, John Cage style
      { name: 'Prep Piano', type: 'fm', note: 'Bb3', duration: '8n', options: { harmonicity: 5.5, modulationIndex: 3, envelope: { attack: 0.001, decay: 0.12, sustain: 0.02, release: 0.08 } } },
      // Chant — ceremonial vocal drone, sacred
      { name: 'Chant', type: 'fm', note: 'A3', duration: '4n', options: { harmonicity: 2, modulationIndex: 3, envelope: { attack: 0.08, decay: 0.3, sustain: 0.2, release: 0.25 } } },
      // Tamborim — bright, cutting
      { name: 'Tamborim', type: 'membrane', note: 'A3', duration: '32n', options: { pitchDecay: 0.01, octaves: 2, envelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.02 } } },
      // Cuíca — vocal-like pitch bend, ceremonial cry
      { name: 'Cuíca', type: 'fm', note: 'D4', duration: '8n', options: { harmonicity: 7.5, modulationIndex: 35, envelope: { attack: 0.008, decay: 0.22, sustain: 0.25, release: 0.18 } } },
      // Marimba tone — warm wooden resonance, Reich-inspired
      { name: 'Marimba', type: 'fm', note: 'C4', duration: '4n', options: { harmonicity: 4, modulationIndex: 1.5, envelope: { attack: 0.001, decay: 0.35, sustain: 0.05, release: 0.25 } } },
    ],
  },
  // ─────────────────────────────────────────────────────
  // Pack 3 — MELANCHOLY / Trip-Hop Nocturne
  // Portishead darkness, Massive Attack weight,
  // Nujabes late-night melancholy, jazz noir
  // ─────────────────────────────────────────────────────
  {
    name: 'Trip-Hop Nocturne',
    slots: [
      // Trip-hop kick — slow, heavy, Portishead-style compressed thud
      { name: 'Heavy Kick', type: 'membrane', note: 'G1', duration: '4n', options: { pitchDecay: 0.08, octaves: 3.5, envelope: { attack: 0.005, decay: 0.5, sustain: 0.06, release: 0.3 } } },
      // Brush snare — soft, jazzy, late-night session feel
      { name: 'Brush Snare', type: 'noise', duration: '8n', options: { noise: { type: 'brown' }, envelope: { attack: 0.025, decay: 0.35, sustain: 0.04, release: 0.25 } } },
      // Ride cymbal — dark, muted, smoky club
      { name: 'Dark Ride', type: 'metal', note: 'C6', duration: '4n', options: { frequency: 420, envelope: { attack: 0.002, decay: 0.45, release: 0.3 }, harmonicity: 3.5, modulationIndex: 14, resonance: 3500, octaves: 0.8 } },
      // Ghost hat — barely there, Portishead machine feel
      { name: 'Ghost Hat', type: 'metal', note: 'C6', duration: '32n', options: { frequency: 300, envelope: { attack: 0.001, decay: 0.035, release: 0.015 }, harmonicity: 4.8, modulationIndex: 20, resonance: 2500, octaves: 1 } },
      // Vocal sigh — Portishead haunting vocal, B3 darker register
      { name: 'Vocal Sigh', type: 'fm', note: 'B3', duration: '2n', options: { harmonicity: 2.8, modulationIndex: 4.5, envelope: { attack: 0.1, decay: 0.6, sustain: 0.15, release: 0.6 } } },
      // Upright bass — dark pluck, jazz noir
      { name: 'Upright Bass', type: 'synth', note: 'G2', duration: '4n', options: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.4, sustain: 0.1, release: 0.3 } } },
      // Cello swell — slow, aching, cinematic
      { name: 'Cello Swell', type: 'am', note: 'D3', duration: '1n', options: { harmonicity: 2.5, envelope: { attack: 0.4, decay: 0.6, sustain: 0.5, release: 0.8 } } },
      // Vinyl crackle — constant texture, warmth of the record
      { name: 'Vinyl Dust', type: 'noise', duration: '2n', options: { noise: { type: 'pink' }, envelope: { attack: 0.1, decay: 0.5, sustain: 0.2, release: 0.5 } } },
    ],
  },
  // ─────────────────────────────────────────────────────
  // Pack 4 — ASCENSION / Classical Ether
  // Arvo Pärt tintinnabuli, Górecki strings,
  // Satie fragility, Debussy shimmer, sacred minimalism
  // ─────────────────────────────────────────────────────
  {
    name: 'Classical Ether',
    slots: [
      // Tintinnabuli bell — Pärt, pure, clear, sacred
      { name: 'Tin Bell', type: 'fm', note: 'E5', duration: '2n', options: { harmonicity: 6, modulationIndex: 2.5, envelope: { attack: 0.001, decay: 0.8, sustain: 0.15, release: 1 } } },
      // String tremolo — Górecki-style swelling orchestra
      { name: 'String Swell', type: 'am', note: 'A3', duration: '1n', options: { harmonicity: 2, envelope: { attack: 0.6, decay: 0.8, sustain: 0.6, release: 1.2 } } },
      // Satie piano — soft, lonely, single note beauty
      { name: 'Satie Piano', type: 'synth', note: 'D5', duration: '2n', options: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 1, sustain: 0.1, release: 1 } } },
      // Choir pad — ethereal, distant, sacred space (Bb3 = darker than Pack 12)
      { name: 'Choir Pad', type: 'fm', note: 'Bb3', duration: '1n', options: { harmonicity: 1.5, modulationIndex: 0.8, envelope: { attack: 1, decay: 1.2, sustain: 0.7, release: 2 } } },
      // Debussy shimmer — high harmonic sparkle
      { name: 'Shimmer', type: 'fm', note: 'B6', duration: '4n', options: { harmonicity: 8, modulationIndex: 3, envelope: { attack: 0.01, decay: 0.5, sustain: 0.05, release: 0.6 } } },
      // Bowed bass drone — deep, organ-like sustain
      { name: 'Bass Drone', type: 'fm', note: 'F1', duration: '1n', options: { harmonicity: 1, modulationIndex: 1.5, envelope: { attack: 1, decay: 1.5, sustain: 0.8, release: 2 } } },
      // Breath/wind — natural, spacious
      { name: 'Breath', type: 'noise', duration: '2n', options: { noise: { type: 'brown' }, envelope: { attack: 0.3, decay: 0.8, sustain: 0.15, release: 0.8 } } },
      // Heartbeat — deep body pulse, human anchor
      { name: 'Heartbeat', type: 'membrane', note: 'F1', duration: '8n', options: { pitchDecay: 0.02, octaves: 2.5, envelope: { attack: 0.005, decay: 0.18, sustain: 0, release: 0.12 } } },
    ],
  },
  // ─────────────────────────────────────────────────────
  // Pack 5 — FERAL / Primal Body Music
  // Body percussion, tribal, stomp, breath,
  // Stravinsky Rite of Spring chaos, Bartók folk violence
  // ─────────────────────────────────────────────────────
  {
    name: 'Primal Body Music',
    slots: [
      // Stomp — body percussion, floor hit, chest thump
      { name: 'Stomp', type: 'membrane', note: 'E1', duration: '8n', options: { pitchDecay: 0.06, octaves: 4, envelope: { attack: 0.001, decay: 0.3, sustain: 0.03, release: 0.2 } } },
      // Body slap — skin percussion, clap variant
      { name: 'Body Slap', type: 'noise', duration: '16n', options: { noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.04 } } },
      // Bone click — Bartók folk percussion, dry wood
      { name: 'Bone Click', type: 'fm', note: 'G5', duration: '32n', options: { harmonicity: 9, modulationIndex: 15, envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 } } },
      // Talking drum — pitch bending, voice-like, African
      { name: 'Talk Drum', type: 'membrane', note: 'D3', duration: '8n', options: { pitchDecay: 0.1, octaves: 4, envelope: { attack: 0.001, decay: 0.3, sustain: 0.08, release: 0.2 } } },
      // Growl vocal — animalistic voice, guttural
      { name: 'Growl Vox', type: 'fm', note: 'E3', duration: '4n', options: { harmonicity: 3.5, modulationIndex: 12, envelope: { attack: 0.01, decay: 0.2, sustain: 0.15, release: 0.15 } } },
      // Shekere — rattle, organic, frenetic
      { name: 'Shekere', type: 'noise', duration: '32n', options: { noise: { type: 'brown' }, envelope: { attack: 0.003, decay: 0.05, sustain: 0, release: 0.02 } } },
      // Breath — sharp inhale/exhale, human
      { name: 'Breath', type: 'noise', duration: '4n', options: { noise: { type: 'white' }, envelope: { attack: 0.05, decay: 0.15, sustain: 0.05, release: 0.1 } } },
      // Stravinsky stab — dissonant orchestral hit, violent chord
      { name: 'Rite Stab', type: 'fm', note: 'Db4', duration: '8n', options: { harmonicity: 7, modulationIndex: 22, envelope: { attack: 0.001, decay: 0.15, sustain: 0.1, release: 0.1 } } },
    ],
  },
  // ─────────────────────────────────────────────────────
  // Pack 6 — RAGE / Industrial Noise
  // Nine Inch Nails weight, Burial's dark garage undertow,
  // Portishead distortion, Massive Attack's Mezzanine
  // ─────────────────────────────────────────────────────
  {
    name: 'Industrial Noise',
    slots: [
      // Distorted 808 — crushed, saturated sub, chest-caving
      { name: 'Dist 808', type: 'membrane', note: 'Bb0', duration: '4n', options: { pitchDecay: 0.15, octaves: 12, envelope: { attack: 0.001, decay: 0.8, sustain: 0.05, release: 0.5 } } },
      // Industrial snare — metal + noise layered, brutal
      { name: 'Metal Snare', type: 'noise', duration: '16n', options: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.03 } } },
      // Machine gun hat — rapid, mechanical, relentless
      { name: 'Machine HH', type: 'metal', note: 'C6', duration: '64n', options: { frequency: 250, envelope: { attack: 0.001, decay: 0.02, release: 0.005 }, harmonicity: 6, modulationIndex: 45, resonance: 2000, octaves: 2 } },
      // Metal clang — industrial pipe hit, factory floor
      { name: 'Pipe Clang', type: 'metal', note: 'A3', duration: '4n', options: { frequency: 160, envelope: { attack: 0.001, decay: 0.45, release: 0.35 }, harmonicity: 11, modulationIndex: 55, resonance: 1800, octaves: 3.5 } },
      // Scream vox — distorted vocal scream texture
      { name: 'Scream Vox', type: 'fm', note: 'A4', duration: '4n', options: { harmonicity: 5, modulationIndex: 18, envelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.2 } } },
      // Glitch burst — digital destruction, circuit bent
      { name: 'Glitch Burst', type: 'fm', note: 'F5', duration: '32n', options: { harmonicity: 13, modulationIndex: 55, envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.008 } } },
      // Feedback drone — screeching, painful, alive
      { name: 'Feedback', type: 'am', note: 'Ab4', duration: '4n', options: { harmonicity: 9, envelope: { attack: 0.008, decay: 0.35, sustain: 0.5, release: 0.35 } } },
      // Concrete impact — massive body hit, cinematic violence
      { name: 'Impact', type: 'membrane', note: 'D1', duration: '2n', options: { pitchDecay: 0.18, octaves: 9, envelope: { attack: 0.001, decay: 0.9, sustain: 0, release: 0.6 } } },
    ],
  },
  // ─────────────────────────────────────────────────────
  // Pack 7 — VOID / Spectral Glitch
  // Burial's ghost frequencies, Autechre abstraction,
  // Ligeti micropolyphony, Xenakis stochastic, deep space
  // ─────────────────────────────────────────────────────
  {
    name: 'Spectral Glitch',
    slots: [
      // Sub sine — Burial's deepest frequency, barely audible, felt
      { name: 'Sub Sine', type: 'synth', note: 'Bb0', duration: '1n', options: { oscillator: { type: 'sine' }, envelope: { attack: 0.25, decay: 1.2, sustain: 0.5, release: 1.5 } } },
      // Reversed ghost — Burial crackle-into-sound, attack swell
      { name: 'Ghost Rev', type: 'fm', note: 'Eb3', duration: '4n', options: { harmonicity: 3.2, modulationIndex: 9, envelope: { attack: 0.5, decay: 0.08, sustain: 0, release: 0.02 } } },
      // Spectral noise — Xenakis cloud, granular texture
      { name: 'Spectral', type: 'noise', duration: '4n', options: { noise: { type: 'pink' }, envelope: { attack: 0.08, decay: 0.2, sustain: 0.08, release: 0.15 } } },
      // Ligeti cluster — dense, microtonal, slow evolving
      { name: 'Cluster', type: 'am', note: 'F3', duration: '1n', options: { harmonicity: 4.7, envelope: { attack: 0.7, decay: 0.8, sustain: 0.4, release: 0.8 } } },
      // Ghost vocal — Burial-style pitched vocal fragment
      { name: 'Ghost Vox', type: 'fm', note: 'Bb4', duration: '4n', options: { harmonicity: 2.2, modulationIndex: 4, envelope: { attack: 0.1, decay: 0.3, sustain: 0.1, release: 0.3 } } },
      // Radio static — between stations, white noise wash
      { name: 'Static', type: 'noise', duration: '4n', options: { noise: { type: 'white' }, envelope: { attack: 0.015, decay: 0.18, sustain: 0.08, release: 0.12 } } },
      // Void drone — infinite space, cold, Ligeti Atmosphères
      { name: 'Void Drone', type: 'fm', note: 'C2', duration: '1n', options: { harmonicity: 1.01, modulationIndex: 2, envelope: { attack: 1, decay: 1.5, sustain: 0.7, release: 2 } } },
      // Artifact — digital crumble, bit-crushed silence break
      { name: 'Artifact', type: 'fm', note: 'G4', duration: '16n', options: { harmonicity: 11, modulationIndex: 30, envelope: { attack: 0.001, decay: 0.04, sustain: 0.01, release: 0.02 } } },
    ],
  },
  // ─────────────────────────────────────────────────────
  // Pack 8 — CLASSICAL / Experimental Chamber
  // Piano, violin, cello, prepared piano, Satie, Cage,
  // Feldman, Nyman, Richter — intimate, fragile, profound
  // ─────────────────────────────────────────────────────
  {
    name: 'Experimental Chamber',
    slots: [
      // Piano — soft felt hammer, Satie Gymnopédie touch
      { name: 'Piano', type: 'synth', note: 'D4', duration: '2n', options: { oscillator: { type: 'triangle' }, envelope: { attack: 0.003, decay: 1.2, sustain: 0.08, release: 1.5 } } },
      // Violin pizzicato — plucked string, delicate
      { name: 'Pizzicato', type: 'fm', note: 'A4', duration: '8n', options: { harmonicity: 3, modulationIndex: 0.8, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 } } },
      // Cello sustained — rich, warm, Górecki Third Symphony feel
      { name: 'Cello', type: 'am', note: 'G3', duration: '1n', options: { harmonicity: 2.01, envelope: { attack: 0.3, decay: 0.8, sustain: 0.6, release: 1.2 } } },
      // Prepared piano — John Cage, muted metallic, bolt-on-string
      { name: 'Prep Piano', type: 'fm', note: 'Bb3', duration: '4n', options: { harmonicity: 7, modulationIndex: 2, envelope: { attack: 0.001, decay: 0.15, sustain: 0.01, release: 0.1 } } },
      // Opera vocal — soprano hit, dramatic, Richter-style
      { name: 'Soprano', type: 'fm', note: 'A4', duration: '2n', options: { harmonicity: 2, modulationIndex: 2.5, envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 0.6 } } },
      // Contrabass — deep bowed drone, orchestral floor
      { name: 'Contrabass', type: 'fm', note: 'E2', duration: '1n', options: { harmonicity: 1.5, modulationIndex: 0.5, envelope: { attack: 0.6, decay: 1.2, sustain: 0.6, release: 1.8 } } },
      // Celesta — music box, Feldman crystalline fragility
      { name: 'Celesta', type: 'fm', note: 'G5', duration: '4n', options: { harmonicity: 6, modulationIndex: 1.5, envelope: { attack: 0.001, decay: 0.4, sustain: 0.03, release: 0.5 } } },
      // Orchestral swell — tutti chord, Max Richter climax
      { name: 'Tutti Swell', type: 'am', note: 'D3', duration: '1n', options: { harmonicity: 2, envelope: { attack: 0.8, decay: 1, sustain: 0.7, release: 1.5 } } },
    ],
  },
  // ─────────────────────────────────────────────────────
  // Pack 9 — DNB / Broken Beat
  // Drum & Bass, broken beat, jungle, liquid, Goldie,
  // Roni Size, LTJ Bukem, Calibre, Amen break energy
  // ─────────────────────────────────────────────────────
  {
    name: 'Broken Beat',
    slots: [
      // Jungle kick — punchy, short, amen-style
      { name: 'Jungle Kick', type: 'membrane', note: 'D1', duration: '16n', options: { pitchDecay: 0.02, octaves: 9, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.04 } } },
      // DnB snare — sharp crack, tight, snappy
      { name: 'Break Snare', type: 'noise', duration: '16n', options: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 } } },
      // Amen hi-hat — rapid, metallic, rides the groove
      { name: 'Amen HH', type: 'metal', note: 'C6', duration: '32n', options: { frequency: 550, envelope: { attack: 0.001, decay: 0.04, release: 0.02 }, harmonicity: 5.5, modulationIndex: 30, resonance: 5500, octaves: 1.4 } },
      // Ghost snare roll — soft, rapid fills between beats
      { name: 'Ghost Roll', type: 'noise', duration: '32n', options: { noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 } } },
      // MC vocal stab — ragga/jungle vocal texture
      { name: 'MC Vox', type: 'fm', note: 'G4', duration: '8n', options: { harmonicity: 3, modulationIndex: 6, envelope: { attack: 0.005, decay: 0.1, sustain: 0.08, release: 0.08 } } },
      // Reese bass — deep warping sub, the DnB signature
      { name: 'Reese', type: 'fm', note: 'D1', duration: '4n', options: { harmonicity: 0.5, modulationIndex: 16, envelope: { attack: 0.008, decay: 0.4, sustain: 0.3, release: 0.25 } } },
      // Liquid pad — Calibre/LTJ Bukem atmospheric
      { name: 'Liquid Pad', type: 'am', note: 'F4', duration: '2n', options: { harmonicity: 2, envelope: { attack: 0.15, decay: 0.4, sustain: 0.3, release: 0.4 } } },
      // Amen crash — ride cymbal wash, punctuation
      { name: 'Amen Crash', type: 'metal', note: 'C5', duration: '4n', options: { frequency: 400, envelope: { attack: 0.001, decay: 0.6, release: 0.4 }, harmonicity: 3.5, modulationIndex: 15, resonance: 3500, octaves: 0.8 } },
    ],
  },
  // ─────────────────────────────────────────────────────
  // Pack 10 — SYNTHWAVE / 80's Blade Runner + Stranger Things
  // Vangelis, John Carpenter, Tangerine Dream, S U R V I V E
  // Analog warmth, epic arpeggios, neon pads, gated reverb
  // ─────────────────────────────────────────────────────
  {
    name: 'Synthwave',
    slots: [
      // Tears in Rain — massive Vangelis pad, 3 detuned saws, slow filter sweep
      // The sound of neon rain on dark streets, melancholy beauty
      { name: 'Tears Pad', type: 'am', note: 'Cm3', duration: '1n', options: { harmonicity: 1.003, envelope: { attack: 1.2, decay: 1.5, sustain: 0.8, release: 2.5 } } },
      // Stranger Things main theme — pulsing Juno arp, repetitive, hypnotic
      { name: 'ST Pulse', type: 'synth', note: 'C4', duration: '16n', options: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.04 } } },
      // CS-80 Main Title — Blade Runner opening swell, slow cry, Bb3
      { name: 'CS-80 Swell', type: 'fm', note: 'Bb3', duration: '1n', options: { harmonicity: 1.5, modulationIndex: 3, envelope: { attack: 0.5, decay: 1, sustain: 0.7, release: 1.5 } } },
      // Korg Polysix — the 80's analog poly, warm detuned, chorus pad
      { name: 'Polysix', type: 'am', note: 'E4', duration: '1n', options: { harmonicity: 1.004, envelope: { attack: 0.4, decay: 0.8, sustain: 0.7, release: 1.5 } } },
      // Korg M1 Piano — the most iconic digital piano of the 80's, glassy, emotional
      { name: 'M1 Piano', type: 'fm', note: 'D4', duration: '2n', options: { harmonicity: 3.5, modulationIndex: 0.8, envelope: { attack: 0.003, decay: 0.8, sustain: 0.12, release: 0.6 } } },
      // Korg Mono/Poly bass — fat analog mono, aggressive filter sweep
      { name: 'MonoPoly', type: 'mono', note: 'C2', duration: '2n', options: { oscillator: { type: 'sawtooth' }, filterEnvelope: { attack: 0.015, decay: 0.4, sustain: 0.12, release: 0.3, baseFrequency: 120, octaves: 4 }, envelope: { attack: 0.006, decay: 0.5, sustain: 0.2, release: 0.4 } } },
      // Carpenter dread — Halloween/The Thing, terrifying Korg MS-20 style
      { name: 'MS-20 Dread', type: 'fm', note: 'A1', duration: '1n', options: { harmonicity: 1.01, modulationIndex: 8, envelope: { attack: 1.5, decay: 2, sustain: 0.6, release: 2.5 } } },
      // Tangerine Dream shimmer — high ethereal delay, cosmic sparkle, Risky Business
      { name: 'TD Shimmer', type: 'fm', note: 'B5', duration: '2n', options: { harmonicity: 5, modulationIndex: 1.5, envelope: { attack: 0.02, decay: 0.8, sustain: 0.1, release: 1.2 } } },
    ],
  },
  // ─────────────────────────────────────────────────────
  // Pack 11 — CINEMATIC / Hans Zimmer Epic Score
  // Inception BRAAAM, Interstellar organ, Time piano,
  // Dark Knight tension, Dune sandworm sub, massive builds
  // ─────────────────────────────────────────────────────
  {
    name: 'Zimmer Score',
    slots: [
      // Time piano — the Inception melody feel, delicate single note
      { name: 'Time Piano', type: 'synth', note: 'F4', duration: '2n', options: { oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 1.5, sustain: 0.04, release: 2 } } },
      // BRAAAM — the Inception horn, massive low brass
      { name: 'BRAAAM', type: 'fm', note: 'G1', duration: '1n', options: { harmonicity: 1, modulationIndex: 8, envelope: { attack: 0.03, decay: 2, sustain: 0.5, release: 2 } } },
      // Tension string — Dark Knight high tremolo, suspense
      { name: 'Tension', type: 'am', note: 'E5', duration: '2n', options: { harmonicity: 3, envelope: { attack: 0.1, decay: 0.6, sustain: 0.5, release: 0.8 } } },
      // Interstellar organ — church organ swell, massive reverb
      { name: 'Organ', type: 'fm', note: 'Bb2', duration: '1n', options: { harmonicity: 2, modulationIndex: 1.5, envelope: { attack: 0.5, decay: 1.2, sustain: 0.8, release: 2 } } },
      // Epic vocal — choir stab, heroic moment
      { name: 'Epic Choir', type: 'fm', note: 'Eb3', duration: '2n', options: { harmonicity: 2.01, modulationIndex: 4, envelope: { attack: 0.15, decay: 0.8, sustain: 0.5, release: 1 } } },
      // Dune sub — deep earth-shaking sub bass, sandworm
      { name: 'Dune Sub', type: 'fm', note: 'A1', duration: '1n', options: { harmonicity: 0.5, modulationIndex: 8, envelope: { attack: 0.3, decay: 1.2, sustain: 0.4, release: 1 } } },
      // Atmospheric pad — wide soundscape, expansive
      { name: 'Atmosphere', type: 'am', note: 'F3', duration: '1n', options: { harmonicity: 1.5, envelope: { attack: 0.8, decay: 1, sustain: 0.7, release: 1.5 } } },
      // Ticking pulse — Dunkirk clock tension, rhythmic
      { name: 'Tick Pulse', type: 'fm', note: 'G5', duration: '16n', options: { harmonicity: 8, modulationIndex: 1, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 } } },
    ],
  },
  // ─────────────────────────────────────────────────────
  // Pack 12 — ORCHESTRA / Emotional Cinematic
  // Górecki strings, Howard Shore depth, John Williams soar,
  // Choir of angels, heartbreak violin, sunrise brass
  // ─────────────────────────────────────────────────────
  {
    name: 'Emotional Orchestra',
    slots: [
      // Violin solo — achingly beautiful, vibrato, solo line
      { name: 'Violin', type: 'fm', note: 'E5', duration: '2n', options: { harmonicity: 3, modulationIndex: 0.6, envelope: { attack: 0.08, decay: 0.8, sustain: 0.5, release: 1 } } },
      // String ensemble — full section, warm, Górecki Third Symphony
      { name: 'Strings', type: 'am', note: 'B3', duration: '1n', options: { harmonicity: 2.005, envelope: { attack: 0.6, decay: 1.2, sustain: 0.65, release: 1.8 } } },
      // Piano — emotional single note, felt hammer, intimate
      { name: 'Felt Piano', type: 'synth', note: 'G4', duration: '2n', options: { oscillator: { type: 'triangle' }, envelope: { attack: 0.006, decay: 2, sustain: 0.03, release: 2.5 } } },
      // Choir voices — angelic, A4 higher register, sacred beauty
      { name: 'Choir', type: 'fm', note: 'A4', duration: '1n', options: { harmonicity: 2.5, modulationIndex: 3.5, envelope: { attack: 0.3, decay: 0.7, sustain: 0.5, release: 1 } } },
      // Soprano vocal — soaring high voice, emotional peak
      { name: 'Soprano', type: 'fm', note: 'E5', duration: '2n', options: { harmonicity: 2.5, modulationIndex: 3.5, envelope: { attack: 0.12, decay: 0.5, sustain: 0.35, release: 0.7 } } },
      // Cello — deep, warm, emotional foundation
      { name: 'Cello', type: 'am', note: 'G2', duration: '1n', options: { harmonicity: 2.01, envelope: { attack: 0.3, decay: 1, sustain: 0.6, release: 1.2 } } },
      // French horn — noble, warm, John Williams heroism
      { name: 'Horn', type: 'fm', note: 'F3', duration: '2n', options: { harmonicity: 1.5, modulationIndex: 1.5, envelope: { attack: 0.15, decay: 0.7, sustain: 0.5, release: 0.8 } } },
      // Ambient air — breath of the concert hall, space
      { name: 'Hall Air', type: 'noise', duration: '1n', options: { noise: { type: 'brown' }, envelope: { attack: 0.5, decay: 1, sustain: 0.3, release: 1.5 } } },
    ],
  },
  // ─────────────────────────────────────────────────────
  // Pack 13 — JAZZ / Smoky Club
  // Coltrane, Miles Davis, Bill Evans, Thelonious Monk
  // Late night, saxophone breath, upright bass walk,
  // brushed drums, Rhodes keys, smoky atmosphere
  // ─────────────────────────────────────────────────────
  {
    name: 'Smoky Jazz',
    slots: [
      // Saxophone — breathy, warm, Coltrane tone. FM with formant for reed character
      { name: 'Saxophone', type: 'fm', note: 'Bb3', duration: '2n', options: { harmonicity: 2, modulationIndex: 4, envelope: { attack: 0.06, decay: 0.8, sustain: 0.5, release: 0.8 } } },
      // Brush snare — soft, sizzling, late night kit
      { name: 'Brush', type: 'noise', duration: '4n', options: { noise: { type: 'brown' }, envelope: { attack: 0.015, decay: 0.25, sustain: 0.04, release: 0.18 } } },
      // Ride cymbal — washy, dark, Kenny Clarke touch
      { name: 'Dark Ride', type: 'noise', duration: '2n', options: { noise: { type: 'pink' }, envelope: { attack: 0.002, decay: 0.4, sustain: 0.06, release: 0.25 } } },
      // Rhodes electric piano — warm, bell-like, Bill Evans voicings
      { name: 'Rhodes', type: 'fm', note: 'Eb4', duration: '4n', options: { harmonicity: 3.5, modulationIndex: 0.8, envelope: { attack: 0.004, decay: 0.6, sustain: 0.15, release: 0.5 } } },
      // Scat vocal — jazz vocal texture, Ella Fitzgerald
      { name: 'Scat Vox', type: 'fm', note: 'G4', duration: '4n', options: { harmonicity: 2.5, modulationIndex: 5, envelope: { attack: 0.02, decay: 0.2, sustain: 0.12, release: 0.15 } } },
      // Upright bass — walking bass line, deep warm pluck
      { name: 'Upright', type: 'synth', note: 'E2', duration: '4n', options: { oscillator: { type: 'triangle' }, envelope: { attack: 0.004, decay: 0.35, sustain: 0.08, release: 0.25 } } },
      // Muted trumpet — Miles Davis, harmon mute, intimate
      { name: 'Mute Trpt', type: 'fm', note: 'D4', duration: '4n', options: { harmonicity: 3, modulationIndex: 2, envelope: { attack: 0.03, decay: 0.4, sustain: 0.3, release: 0.4 } } },
      // Smoky room — atmosphere, vinyl warmth, distant chatter
      { name: 'Smoke', type: 'noise', duration: '1n', options: { noise: { type: 'brown' }, envelope: { attack: 0.2, decay: 0.6, sustain: 0.2, release: 0.8 } } },
    ],
  },
];
