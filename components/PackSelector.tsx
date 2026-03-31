'use client';

import { PACKS } from '@/data/packs';

interface PackSelectorProps {
  currentPack: number;
  onChange: (index: number) => void;
  accentColor: string;
}

export default function PackSelector({ currentPack, onChange }: PackSelectorProps) {
  return (
    <select
      value={currentPack}
      onChange={(e) => onChange(Number(e.target.value))}
      className="bg-black/[0.02] border border-black/[0.04] rounded px-2 py-1 text-black/40 cursor-pointer"
    >
      {currentPack === -1 && <option value={-1} className="bg-white">RANDOM</option>}
      {PACKS.map((pack, i) => (
        <option key={i} value={i} className="bg-white text-black/60">
          {pack.name}
        </option>
      ))}
    </select>
  );
}
