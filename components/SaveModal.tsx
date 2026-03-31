'use client';

import { useState } from 'react';
import type { RecordingResult } from '@/lib/SessionRecorder';

interface SaveModalProps {
  recording: RecordingResult;
  onClose: () => void;
}

export default function SaveModal({ recording, onClose }: SaveModalProps) {
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const handleSave = async () => {
    // Use ONLY Web Share API — this opens the iOS share sheet
    // where user taps "Save Video" to go to Camera Roll.
    // NO download fallback — we don't want files going to Downloads.
    try {
      const file = new File(
        [recording.blob],
        recording.filename,
        { type: 'video/mp4' } // force mp4 type for iOS compatibility
      );
      await navigator.share({ files: [file] });
      setSaved(true);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      // If share fails completely, show error message
      setSaveError(true);
    }
  };

  const handleDiscard = () => {
    URL.revokeObjectURL(recording.url);
    onClose();
  };

  if (saved) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => { URL.revokeObjectURL(recording.url); onClose(); }} />
        <div className="relative bg-black/70 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-white/90 mb-2 tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
            SAVED
          </h3>
          <p className="text-[10px] text-white/30 mb-6">
            Check your camera roll or downloads
          </p>
          <p className="text-[8px] text-white/15 font-mono tracking-wider mb-6">
            {recording.filename}
          </p>
          <button
            onClick={() => { URL.revokeObjectURL(recording.url); onClose(); }}
            className="w-full py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/70 text-[11px] tracking-[0.15em] font-mono hover:bg-white/10 active:scale-[0.97] transition-all"
          >
            DONE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleDiscard} />
      <div className="relative bg-black/70 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 max-w-sm w-full">
        {/* Preview */}
        <div className="rounded-xl overflow-hidden bg-black/50 mb-4 aspect-video border border-white/[0.04]">
          <video src={recording.url} controls playsInline className="w-full h-full object-contain" />
        </div>

        {/* Error message */}
        {saveError && (
          <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-[9px] text-red-400/80 font-mono text-center">
              Share not available. Long-press the video above → Save to Photos
            </p>
          </div>
        )}

        {/* Info */}
        <div className="mb-5">
          <h3 className="text-sm font-medium text-white/80 mb-1 tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
            Session Recorded
          </h3>
          <p className="text-[9px] text-white/25 font-mono tracking-wider">
            {recording.filename} &middot; {recording.duration}
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-xl bg-white/[0.08] border border-white/[0.1] text-white/80 text-[11px] tracking-[0.15em] font-mono hover:bg-white/12 active:scale-[0.97] transition-all mb-2"
        >
          SAVE TO CAMERA ROLL
        </button>

        {/* Discard */}
        <button
          onClick={handleDiscard}
          className="w-full py-2.5 text-[9px] tracking-[0.15em] text-white/20 hover:text-white/35 transition-colors font-mono"
        >
          DISCARD
        </button>
      </div>
    </div>
  );
}
