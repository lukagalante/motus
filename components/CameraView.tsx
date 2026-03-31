'use client';

import { useEffect, useRef, useState } from 'react';
import SkeletonOverlay from './SkeletonOverlay';
import Visualizer from './Visualizer';
import { Point } from '@/lib/poseUtils';
import type { ActiveZones } from './SkeletonOverlay';
import type { Analyser } from 'tone';

interface CameraViewProps {
  landmarks: Point[] | null;
  prevLandmarks?: Point[] | null;
  activeZones?: ActiveZones;
  skeletonColor: string;
  isRecording: boolean;
  isLive: boolean;
  analyser: Analyser | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  demoMode: boolean;
  facingMode: 'user' | 'environment';
  onFlipCamera?: () => void;
}

export default function CameraView({
  landmarks,
  prevLandmarks,
  activeZones,
  skeletonColor,
  isRecording,
  isLive,
  analyser,
  videoRef,
  demoMode,
  facingMode,
  onFlipCamera,
}: CameraViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full camera-frame scanlines md:rounded-lg">
      {/* Video */}
      {!demoMode && (
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none', zIndex: 1 }}
        />
      )}

      {/* Demo mode */}
      {demoMode && (
        <div className="absolute inset-0 flex items-center justify-center z-[1] bg-black">
          <span className="label-mono text-white/15">SYNTHETIC INPUT</span>
        </div>
      )}

      {/* Skeleton */}
      <SkeletonOverlay
        landmarks={landmarks}
        prevLandmarks={prevLandmarks}
        color={skeletonColor}
        width={dimensions.width}
        height={dimensions.height}
        activeZones={activeZones}
      />

      {/* Status */}
      <div className="absolute top-3 left-3 flex items-center gap-3 z-10">
        {isLive && (
          <div className="flex items-center gap-1.5">
            <div className="w-[4px] h-[4px] rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #34d399' }} />
            <span className="text-[7px] tracking-[0.2em] text-white/40 font-mono">LIVE</span>
          </div>
        )}
        {isRecording && (
          <div className="flex items-center gap-1.5">
            <div className="w-[5px] h-[5px] rounded-full bg-red-500 animate-pulse" />
            <span className="text-[7px] tracking-[0.2em] text-red-400/60 font-mono">REC</span>
          </div>
        )}
      </div>

      {/* Flip camera button */}
      {isLive && onFlipCamera && (
        <button
          onClick={onFlipCamera}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
          title={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3h5v5" />
            <path d="M8 21H3v-5" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
        </button>
      )}

      {/* Visualizer */}
      {analyser && (
        <div className="absolute bottom-0 left-0 right-0 h-8 z-10">
          <Visualizer analyser={analyser} color={skeletonColor} />
        </div>
      )}
    </div>
  );
}
