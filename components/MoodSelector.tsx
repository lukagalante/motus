'use client';

import { MoodId, MOODS, MOOD_LIST } from '@/data/moods';

interface MoodSelectorProps {
  onSelect: (mood: MoodId) => void;
}

export default function MoodSelector({ onSelect }: MoodSelectorProps) {
  return (
    <div className="fixed inset-0 flex flex-col p-5 md:p-8 motus-bg" style={{ overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div className="relative z-10 w-full max-w-6xl mx-auto pb-8">
        {/* Header — MOTUS left, ARTLUKA logo right, same line */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <div>
            <p className="label-mono mb-2" style={{ color: 'rgba(0,0,0,0.18)' }}>
              FREQUENCY INSTRUMENT
            </p>
            <h1
              className="text-4xl md:text-6xl font-light tracking-[0.12em] text-black/85"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              MOTUS
            </h1>
          </div>
          <img src="/artluka-logo.png" alt="ARTLUKA" className="h-12 md:h-14" />
        </div>

        <div className="mb-8 md:mb-10">
          <div className="flex items-center gap-3 mt-3">
            <div className="w-8 h-[1px] bg-black/10" />
            <span className="label-data">SELECT MOOD</span>
          </div>
        </div>

        {/* Mood grid — dark poster cards like Encoding Landscape */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 flex-1 mb-8 auto-rows-min">
          {MOOD_LIST.map((moodId) => {
            const mood = MOODS[moodId];
            return (
              <button
                key={moodId}
                onClick={() => onSelect(moodId)}
                className="rounded-lg overflow-hidden text-left group transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] flex flex-col"
                style={{ background: '#0A0A0A' }}
              >
                {/* Visual zone — accent color organic form */}
                <div className="relative h-24 md:h-28 overflow-hidden flex items-center justify-center">
                  {/* Organic blob — alive, breathing */}
                  <div
                    className="absolute w-16 h-16 md:w-20 md:h-20 rounded-full opacity-60 group-hover:opacity-90 transition-all duration-700 group-hover:scale-110"
                    style={{
                      background: `radial-gradient(circle at 40% 40%, ${mood.accentColor}, ${mood.accentColor}40 60%, transparent 80%)`,
                      filter: 'blur(8px)',
                      animation: `organic-breathe 4s ease-in-out infinite`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  />
                  {/* Inner bright core */}
                  <div
                    className="absolute w-6 h-6 md:w-8 md:h-8 rounded-full opacity-70 group-hover:opacity-100 transition-all duration-500"
                    style={{
                      background: `radial-gradient(circle, ${mood.accentColor}CC, transparent 70%)`,
                      filter: 'blur(3px)',
                    }}
                  />
                  {/* Year/data tag */}
                  <span className="absolute top-2 left-2.5 text-[7px] tracking-[0.15em] text-white/15 font-mono">
                    2025
                  </span>
                  <span className="absolute top-2 right-2.5 text-[7px] tracking-[0.1em] text-white/15 font-mono">
                    {mood.defaultBpm}
                  </span>
                </div>

                {/* Info zone */}
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="text-[13px] md:text-[15px] font-semibold tracking-[0.06em] text-white/90 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {mood.name}
                  </h3>
                  <p className="text-[8px] leading-relaxed text-white/25 mb-auto">
                    {mood.description}
                  </p>

                  {/* Data specs */}
                  <div className="mt-3 pt-2 border-t border-white/[0.04] space-y-[2px]">
                    <div className="flex justify-between">
                      <span className="text-[6px] tracking-[0.12em] text-white/15 font-mono uppercase">Reverb</span>
                      <span className="text-[6px] tracking-[0.1em] text-white/30 font-mono">{mood.defaultReverb}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[6px] tracking-[0.12em] text-white/15 font-mono uppercase">Mode</span>
                      <span className="text-[6px] tracking-[0.1em] text-white/30 font-mono">{mood.defaultQuantize ? 'GRID' : 'FREE'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[6px] tracking-[0.12em] text-white/15 font-mono uppercase">Pack</span>
                      <span className="text-[6px] tracking-[0.1em] text-white/30 font-mono">{String(mood.defaultPackIndex).padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between py-2">
          <button
            onClick={() => onSelect('void')}
            className="label-mono text-black/12 hover:text-black/25 transition-colors"
          >
            SKIP &mdash; FREE
          </button>
          <span className="label-data text-black/15">MOTUS v1.0</span>
        </div>
      </div>
    </div>
  );
}
