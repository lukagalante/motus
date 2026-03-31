import { MoodConfig, MoodId, MOODS } from '@/data/moods';
import { ThemeEngine } from './ThemeEngine';

export class MoodEngine {
  private currentMood: MoodConfig;
  private themeEngine: ThemeEngine;
  private listeners: Array<(mood: MoodConfig) => void> = [];

  constructor(initialMood: MoodId = 'void') {
    this.currentMood = MOODS[initialMood];
    this.themeEngine = new ThemeEngine();
  }

  getMood(): MoodConfig {
    return this.currentMood;
  }

  switchMood(moodId: MoodId): MoodConfig {
    this.currentMood = MOODS[moodId];
    this.themeEngine.apply(this.currentMood);
    this.listeners.forEach((fn) => fn(this.currentMood));
    return this.currentMood;
  }

  onMoodChange(fn: (mood: MoodConfig) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  applyTheme(): void {
    this.themeEngine.apply(this.currentMood);
  }
}
