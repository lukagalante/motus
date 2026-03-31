'use client';

import { useEffect, useRef } from 'react';
import type { Analyser } from 'tone';

interface VisualizerProps {
  analyser: Analyser;
  color: string;
}

export default function Visualizer({ analyser, color }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const values = analyser.getValue() as Float32Array;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Waveform — organic oscilloscope
      ctx.strokeStyle = color + '60';
      ctx.lineWidth = 1;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      const step = Math.floor(values.length / w) || 1;
      for (let x = 0; x < w; x++) {
        const val = values[x * step] || 0;
        const y = h / 2 + val * h * 1.5;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Center reference line
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser, color]);

  return <canvas ref={canvasRef} width={640} height={32} className="w-full h-full" />;
}
