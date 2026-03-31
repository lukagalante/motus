'use client';

import { useRouter } from 'next/navigation';
import MoodSelector from '@/components/MoodSelector';
import { MoodId } from '@/data/moods';

export default function Home() {
  const router = useRouter();

  const handleMoodSelect = (mood: MoodId) => {
    router.push(`/session?mood=${mood}`);
  };

  return <MoodSelector onSelect={handleMoodSelect} />;
}
