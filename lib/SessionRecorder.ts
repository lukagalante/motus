import { MoodId } from '@/data/moods';

export interface RecordingResult {
  blob: Blob;
  url: string;
  filename: string;
  duration: string;
}

export class SessionRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private timerInterval: number | null = null;
  private onTimerUpdate: ((elapsed: string) => void) | null = null;
  private _isRecording: boolean = false;
  private _lastDuration: string = '00:00';

  get isRecording(): boolean {
    return this._isRecording;
  }

  setTimerCallback(fn: (elapsed: string) => void): void {
    this.onTimerUpdate = fn;
  }

  async start(
    videoStream: MediaStream,
    audioContext: AudioContext,
    masterGain: AudioNode
  ): Promise<void> {
    if (this._isRecording) return;

    const audioDestination = audioContext.createMediaStreamDestination();
    masterGain.connect(audioDestination);

    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks(),
    ]);

    const mimeTypes = [
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];

    let selectedMime = '';
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    this.mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMime || undefined,
      videoBitsPerSecond: 20_000_000, // 20 Mbps — high quality
    });

    this.chunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.start(1000);
    this._isRecording = true;
    this._lastDuration = '00:00';
    this.startTime = Date.now();

    this.timerInterval = window.setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const mins = Math.floor(elapsed / 60000).toString().padStart(2, '0');
      const secs = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
      this._lastDuration = `${mins}:${secs}`;
      this.onTimerUpdate?.(this._lastDuration);
    }, 250);
  }

  stop(mood: MoodId): Promise<RecordingResult | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this._isRecording) {
        resolve(null);
        return;
      }

      if (this.timerInterval !== null) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      this.mediaRecorder.onstop = () => {
        const mime = this.mediaRecorder?.mimeType || 'video/webm';
        const ext = mime.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(this.chunks, { type: mime });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `MOTUS_${mood}_${timestamp}.${ext}`;
        const url = URL.createObjectURL(blob);

        this._isRecording = false;
        this.chunks = [];

        resolve({ blob, url, filename, duration: this._lastDuration });
      };

      this.mediaRecorder.stop();
    });
  }
}
