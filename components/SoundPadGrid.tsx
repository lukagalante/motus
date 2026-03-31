'use client';

import { useEffect, useState } from 'react';
import { SOUND_SLOTS, SLOT_TO_PACK_INDEX, SoundSlot } from '@/lib/constants';
import { PACKS } from '@/data/packs';

interface SoundPadGridProps {
  packIndex: number;
  activeSlot: SoundSlot | null;
  accentColor: string;
}

export default function SoundPadGrid({ packIndex, activeSlot, accentColor }: SoundPadGridProps) {
  const [flashSlots, setFlashSlots] = useState<Set<SoundSlot>>(new Set());

  useEffect(() => {
    if (!activeSlot) return;
    setFlashSlots((prev) => new Set(prev).add(activeSlot));
    const timer = setTimeout(() => {
      setFlashSlots((prev) => { const n = new Set(prev); n.delete(activeSlot); return n; });
    }, 120);
    return () => clearTimeout(timer);
  }, [activeSlot]);

  const pack = packIndex >= 0 ? PACKS[packIndex] : null;

  return (
    <div className="grid grid-cols-2 gap-1 w-full">
      {SOUND_SLOTS.map((slot, i) => {
        const idx = SLOT_TO_PACK_INDEX[slot];
        const slotConfig = pack?.slots[idx];
        const isActive = flashSlots.has(slot);

        return (
          <div
            key={slot}
            className={`relative rounded-md p-2.5 transition-all duration-75 ${isActive ? 'pad-flash' : ''}`}
            style={{
              backgroundColor: isActive ? accentColor + '08' : 'rgba(0,0,0,0.015)',
              border: `1px solid ${isActive ? accentColor + '20' : 'rgba(0,0,0,0.03)'}`,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="label-data">{String(i + 1).padStart(2, '0')}</span>
              {/* Activity dot */}
              <div
                className="w-[4px] h-[4px] rounded-full transition-all duration-75"
                style={{
                  backgroundColor: isActive ? accentColor : 'rgba(0,0,0,0.06)',
                  boxShadow: isActive ? `0 0 6px ${accentColor}40` : 'none',
                }}
              />
            </div>

            <div className="text-[9px] font-medium text-black/40 mb-0.5" style={{ color: isActive ? accentColor : undefined }}>
              {slotConfig?.name || 'RND'}
            </div>

            <div className="text-[7px] tracking-[0.1em] text-black/15 uppercase">
              {slot.replace('_', ' ')}
            </div>
          </div>
        );
      })}
    </div>
  );
}
