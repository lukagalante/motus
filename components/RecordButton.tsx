'use client';

interface RecordButtonProps {
  isRecording: boolean;
  timer: string;
  onToggle: () => void;
  accentColor: string;
}

export default function RecordButton({ isRecording, timer, onToggle }: RecordButtonProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggle}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 border ${
          isRecording
            ? 'border-red-400/30 bg-red-50 rec-glow'
            : 'border-black/[0.06] bg-black/[0.02] hover:border-black/10'
        }`}
      >
        {isRecording ? (
          <div className="w-3 h-3 bg-red-500 rounded-sm" />
        ) : (
          <div className="w-2.5 h-2.5 bg-red-400/60 rounded-full" />
        )}
      </button>
      {isRecording && (
        <span className="text-red-400 text-[9px] font-mono tracking-wider">{timer}</span>
      )}
    </div>
  );
}
