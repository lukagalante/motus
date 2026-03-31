/**
 * iOS Audio Unlock — fire and forget, never blocks.
 */

export function unlockIOSAudio(): void {
  try {
    // Play a silent audio element to switch iOS from "ambient" to "playback" category
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    audio.setAttribute('playsinline', 'true');
    audio.volume = 0.01;
    audio.play().catch(() => {});

    // Also pump a silent buffer through a temporary AudioContext
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      setTimeout(() => ctx.close().catch(() => {}), 500);
    }
  } catch {
    // Never block on error
  }
}
