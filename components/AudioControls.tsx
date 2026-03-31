'use client';

interface AudioControlsProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  reverb: number;
  onReverbChange: (val: number) => void;
  delayOn: boolean;
  onDelayToggle: () => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  quantize: boolean;
  onQuantizeToggle: () => void;
  accentColor: string;
}

export default function AudioControls({
  bpm, onBpmChange, reverb, onReverbChange,
  delayOn, onDelayToggle, volume, onVolumeChange,
  quantize, onQuantizeToggle, accentColor,
}: AudioControlsProps) {
  const FxBtn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`fx-btn ${active ? 'active' : ''}`}
      style={active ? { borderColor: accentColor + '30', color: accentColor, background: accentColor + '06' } : {}}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="label-mono">VOL</span>
        <input type="range" min={0} max={100} value={Math.round(volume * 100)}
          onChange={(e) => onVolumeChange(Number(e.target.value) / 100)} className="w-16" />
      </div>
      <div className="flex items-center gap-2">
        <span className="label-mono">REV</span>
        <input type="range" min={0} max={100} value={reverb}
          onChange={(e) => onReverbChange(Number(e.target.value))} className="w-16" />
      </div>
      <FxBtn label={delayOn ? 'DLY ON' : 'DLY'} active={delayOn} onClick={onDelayToggle} />
      <FxBtn label={quantize ? 'GRID' : 'FREE'} active={quantize} onClick={onQuantizeToggle} />
      <div className="flex items-center gap-2">
        <span className="label-mono">BPM</span>
        <input type="number" min={60} max={180} value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="w-12 bg-black/[0.02] border border-black/[0.04] rounded px-2 py-1 text-[10px] text-black/50 text-center font-mono"
        />
      </div>
    </div>
  );
}
