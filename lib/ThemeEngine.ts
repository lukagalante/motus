import { MoodConfig } from '@/data/moods';

export class ThemeEngine {
  apply(mood: MoodConfig): void {
    const root = document.documentElement;
    root.style.setProperty('--accent-color', mood.accentColor);
    root.style.setProperty('--skeleton-color', mood.skeletonColor);
    root.style.setProperty('--skeleton-glow', mood.skeletonGlow);
    root.style.setProperty('--bg-texture', mood.bgGradient);
    root.style.setProperty('--pad-glow', mood.padGlow);
  }
}
