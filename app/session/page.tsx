'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CameraView from '@/components/CameraView';
import SoundPadGrid from '@/components/SoundPadGrid';
import AudioControls from '@/components/AudioControls';
import PackSelector from '@/components/PackSelector';
import SaveModal from '@/components/SaveModal';
import { MoodId, MOODS, MOOD_LIST } from '@/data/moods';
import type { RecordingResult } from '@/lib/SessionRecorder';
import { SoundSlot } from '@/lib/constants';
import { Point } from '@/lib/poseUtils';

// Lazy-load Tone.js only after user gesture (critical for iOS)
type ToneType = typeof import('tone');
let ToneModule: ToneType | null = null;

export default function SessionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMood = (searchParams.get('mood') as MoodId) || 'void';

  // Refs for persistent objects — engine types imported lazily
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const moodEngineRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const soundBankRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const movementEngineRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionRecorderRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poseDetectorRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const demoAnimRef = useRef<number>(0);

  // State
  const [phase, setPhase] = useState<'tap' | 'loading' | 'ready'>('tap');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [currentMood, setCurrentMood] = useState<MoodId>(initialMood);
  const [landmarks, setLandmarks] = useState<Point[] | null>(null);
  const [prevLandmarks, setPrevLandmarks] = useState<Point[] | null>(null);
  const [activeZones, setActiveZones] = useState({ head: 0, rarm: 0, larm: 0, torso: 0, legs: 0 });
  const [activeSlot, setActiveSlot] = useState<SoundSlot | null>(null);
  const [packIndex, setPackIndex] = useState(MOODS[initialMood].defaultPackIndex);
  const [bpm, setBpm] = useState(MOODS[initialMood].defaultBpm);
  const [reverb, setReverb] = useState(MOODS[initialMood].defaultReverb);
  const [delayOn, setDelayOn] = useState(MOODS[initialMood].defaultDelay);
  const [quantize, setQuantize] = useState(MOODS[initialMood].defaultQuantize);
  const [volume, setVolume] = useState(0.8);
  const [sensitivity, setSensitivity] = useState(0.5);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [glitchOn, setGlitchOn] = useState(false);
  const [stutterOn, setStutterOn] = useState(false);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [metronomeBeat, setMetronomeBeat] = useState(-1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metronomeRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);
  const [recordTimer, setRecordTimer] = useState('00:00');
  const [isLive, setIsLive] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analyserNode, setAnalyserNode] = useState<any>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  // ─── PHASE 1: TAP TO BEGIN ───────────────────────────
  // Everything is initialized here, on user gesture, to satisfy iOS policies
  const handleTapToBegin = async () => {
    setPhase('loading');

    try {
      // Step 1: Unlock iOS audio + load Tone.js
      setLoadingMsg('Starting...');
      const { unlockIOSAudio } = await import('@/lib/iosAudio');
      unlockIOSAudio(); // fire-and-forget, never blocks
      ToneModule = await import('tone');
      await ToneModule.start();

      // Step 2: Initialize all engines
      const { MoodEngine } = await import('@/lib/MoodEngine');
      const { SoundBank } = await import('@/lib/SoundBank');
      const { MovementEngine } = await import('@/lib/MovementEngine');
      const { SessionRecorder } = await import('@/lib/SessionRecorder');

      const moodEngine = new MoodEngine(initialMood);
      const soundBank = new SoundBank();
      const movementEngine = new MovementEngine();
      const recorder = new SessionRecorder();

      moodEngineRef.current = moodEngine;
      soundBankRef.current = soundBank;
      movementEngineRef.current = movementEngine;
      sessionRecorderRef.current = recorder;

      // Load default pack
      const moodConfig = MOODS[initialMood];
      soundBank.loadPack(moodConfig.defaultPackIndex);
      soundBank.setBpm(moodConfig.defaultBpm);
      soundBank.setReverb(moodConfig.defaultReverb / 100);
      soundBank.setDelay(moodConfig.defaultDelay);
      soundBank.setQuantize(moodConfig.defaultQuantize);

      setAnalyserNode(soundBank.getAnalyser());

      // Wire percussive triggers (velocity-aware)
      movementEngine.setOnTrigger((event) => {
        soundBank.triggerSlot(event);
        setActiveSlot(event.slot);
      });

      // Wire continuous body state → expression engine + visual zones
      movementEngine.setOnBodyState((state) => {
        soundBank.updateBodyState(state);
        setActiveZones({
          head: state.headFlow,
          rarm: state.rightArmFlow,
          larm: state.leftArmFlow,
          torso: state.torsoFlow,
          legs: Math.max(state.rightLegFlow, state.leftLegFlow),
        });
      });

      // Timer callback
      recorder.setTimerCallback(setRecordTimer);

      // Metronome — separate audio path, not recorded
      const { Metronome } = await import('@/lib/Metronome');
      const metro = new Metronome();
      metro.setBpm(moodConfig.defaultBpm);
      metro.setOnBeat((beat) => setMetronomeBeat(beat));
      metronomeRef.current = metro;

      // Apply theme
      moodEngine.applyTheme();

      // Step 3: Start camera
      await startCameraFlow();

      setPhase('ready');
    } catch (err) {
      console.error('Init error:', err);
      // Even on error, show the session — user can use DEMO mode
      setPhase('ready');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundBankRef.current?.dispose();
      metronomeRef.current?.dispose();
      cancelAnimationFrame(animFrameRef.current);
      cancelAnimationFrame(demoAnimRef.current);
      videoStreamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    };
  }, []);

  // ─── CAMERA ──────────────────────────────────────────
  const startCameraFlow = async (facing?: 'user' | 'environment') => {
    const mode = facing || facingMode;

    // Stop existing stream if switching cameras
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      videoStreamRef.current = stream;
      if (facing) setFacingMode(mode);
      assignVideoStream(stream);
      setIsLive(true);
      initPoseDetection();
    } catch (err) {
      console.error('Camera denied:', err);
      startDemoMode();
    }
  };

  const handleFlipCamera = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    startCameraFlow(next);
  };

  const assignVideoStream = (stream: MediaStream) => {
    // Try immediately; also set up a retry for when videoRef mounts
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  // When videoRef mounts and we have a stream, assign it
  useEffect(() => {
    if (videoRef.current && videoStreamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = videoStreamRef.current;
    }
  });

  // ─── POSE DETECTION ──────────────────────────────────
  const initPoseDetection = async () => {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const { PoseLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });

      poseDetectorRef.current = poseLandmarker;
      startDetectionLoop(poseLandmarker);
    } catch (err) {
      console.error('MediaPipe failed, trying TF.js:', err);
      try {
        await initTFPoseDetection();
      } catch (err2) {
        console.error('TF.js also failed:', err2);
        // Pose detection not available, but camera still works
      }
    }
  };

  const initTFPoseDetection = async () => {
    const poseDetection = await import('@tensorflow-models/pose-detection');
    await import('@tensorflow/tfjs-backend-webgl');
    const tf = await import('@tensorflow/tfjs-core');
    await tf.ready();

    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    );

    poseDetectorRef.current = detector;
    startTFDetectionLoop(detector);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startDetectionLoop = (poseLandmarker: any) => {
    let lastTime = -1;

    const detect = () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      const now = performance.now();
      if (now === lastTime) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }
      lastTime = now;

      try {
        const result = poseLandmarker.detectForVideo(videoRef.current, now);
        if (result.landmarks && result.landmarks.length > 0) {
          const lm = result.landmarks[0];
          const shouldMirror = facingMode === 'user';
          const processed = lm.map((p: Point & { z?: number }) => ({
            x: shouldMirror ? 1 - p.x : p.x,
            y: p.y,
            visibility: p.visibility,
          }));
          setPrevLandmarks(landmarks);
          setLandmarks(processed);
          movementEngineRef.current?.processFrame(processed);
        }
      } catch {
        // ignore frame errors
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startTFDetectionLoop = (detector: any) => {
    const detect = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(() => detect());
        return;
      }

      try {
        const poses = await detector.estimatePoses(videoRef.current);
        if (poses.length > 0) {
          const kps = poses[0].keypoints;
          const w = videoRef.current!.videoWidth || 640;
          const h = videoRef.current!.videoHeight || 480;
          const normalized: Point[] = [];
          for (let i = 0; i < 33; i++) {
            if (i < kps.length) {
              normalized.push({
                x: facingMode === 'user' ? 1 - kps[i].x / w : kps[i].x / w,
                y: kps[i].y / h,
                visibility: kps[i].score ?? 1,
              });
            } else {
              normalized.push({ x: 0.5, y: 0.5, visibility: 0 });
            }
          }
          setLandmarks(normalized);
          movementEngineRef.current?.processFrame(normalized);
        }
      } catch {
        // ignore
      }

      animFrameRef.current = requestAnimationFrame(() => detect());
    };

    detect();
  };

  // ─── DEMO MODE ───────────────────────────────────────
  const startDemoMode = () => {
    setDemoMode(true);
    setIsLive(true);

    const animate = () => {
      const t = performance.now() / 1000;
      const pts: Point[] = [];

      for (let i = 0; i < 33; i++) {
        const baseX = 0.5 + Math.sin(t + i * 0.5) * 0.15;
        const baseY = 0.2 + (i / 33) * 0.6 + Math.cos(t * 1.3 + i * 0.3) * 0.05;
        pts.push({ x: baseX, y: baseY, visibility: 0.9 });
      }

      pts[15] = { x: 0.3 + Math.sin(t * 3) * 0.2, y: 0.35 + Math.cos(t * 2) * 0.15, visibility: 0.9 };
      pts[16] = { x: 0.7 + Math.sin(t * 2.5 + 1) * 0.2, y: 0.35 + Math.cos(t * 1.8 + 1) * 0.15, visibility: 0.9 };
      pts[23] = { x: 0.45 + Math.sin(t * 0.8) * 0.05, y: 0.55, visibility: 0.9 };
      pts[24] = { x: 0.55 + Math.sin(t * 0.8) * 0.05, y: 0.55, visibility: 0.9 };
      pts[11] = { x: 0.4, y: 0.3, visibility: 0.9 };
      pts[12] = { x: 0.6, y: 0.3, visibility: 0.9 };
      pts[0] = { x: 0.5, y: 0.15 + Math.sin(t * 1.5) * 0.03, visibility: 0.9 };
      pts[25] = { x: 0.45, y: 0.7 + Math.sin(t * 1.2) * 0.05, visibility: 0.9 };
      pts[26] = { x: 0.55, y: 0.7 + Math.sin(t * 1.2 + 0.5) * 0.05, visibility: 0.9 };
      pts[13] = { x: 0.35 + Math.sin(t * 2.5) * 0.1, y: 0.35 + Math.cos(t * 2) * 0.05, visibility: 0.9 };
      pts[14] = { x: 0.65 + Math.sin(t * 2.2 + 1) * 0.1, y: 0.35 + Math.cos(t * 1.8 + 1) * 0.05, visibility: 0.9 };

      setLandmarks(pts);
      movementEngineRef.current?.processFrame(pts);
      demoAnimRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  // ─── MOOD SWITCHING ──────────────────────────────────
  const switchMood = (moodId: MoodId) => {
    const m = MOODS[moodId];
    moodEngineRef.current?.switchMood(moodId);
    setCurrentMood(moodId);

    soundBankRef.current?.loadPack(m.defaultPackIndex);
    soundBankRef.current?.setBpm(m.defaultBpm);
    soundBankRef.current?.setReverb(m.defaultReverb / 100);
    soundBankRef.current?.setDelay(m.defaultDelay);
    soundBankRef.current?.setQuantize(m.defaultQuantize);

    setPackIndex(m.defaultPackIndex);
    setBpm(m.defaultBpm);
    setReverb(m.defaultReverb);
    setDelayOn(m.defaultDelay);
    setQuantize(m.defaultQuantize);
    setShowMoodPicker(false);
  };

  // ─── CONTROL HANDLERS ────────────────────────────────
  const handleBpmChange = (v: number) => {
    const clamped = Math.max(60, Math.min(180, v));
    setBpm(clamped);
    soundBankRef.current?.setBpm(clamped);
    metronomeRef.current?.setBpm(clamped);
  };

  const handleReverbChange = (v: number) => {
    setReverb(v);
    soundBankRef.current?.setReverb(v / 100);
  };

  const handleDelayToggle = () => {
    const next = !delayOn;
    setDelayOn(next);
    soundBankRef.current?.setDelay(next);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    soundBankRef.current?.setVolume(v);
  };

  const handleQuantizeToggle = () => {
    const next = !quantize;
    setQuantize(next);
    soundBankRef.current?.setQuantize(next);
  };

  const handleSensitivityChange = (v: number) => {
    setSensitivity(v);
    movementEngineRef.current?.setSensitivity(v);
  };

  const handlePackChange = (idx: number) => {
    setPackIndex(idx);
    soundBankRef.current?.loadPack(idx);
  };

  const handleRandomize = () => {
    soundBankRef.current?.loadRandomPack();
    setPackIndex(-1);
  };

  const handleMetronomeToggle = () => {
    const metro = metronomeRef.current;
    if (!metro) return;
    if (metronomeOn) {
      metro.stop();
      setMetronomeOn(false);
      setMetronomeBeat(-1);
    } else {
      metro.setBpm(bpm);
      metro.start();
      setMetronomeOn(true);
    }
  };

  const handleGlitchToggle = () => {
    const next = !glitchOn;
    setGlitchOn(next);
    soundBankRef.current?.setGlitchEnabled(next);
  };

  const handleStutterToggle = () => {
    const next = !stutterOn;
    setStutterOn(next);
    soundBankRef.current?.setStutterEnabled(next);
  };

  // ─── RECORDING ───────────────────────────────────────
  const handleRecordToggle = async () => {
    if (!sessionRecorderRef.current) return;

    if (isRecording) {
      const result = await sessionRecorderRef.current.stop(currentMood);
      setIsRecording(false);
      setRecordTimer('00:00');
      if (result) {
        setRecordingResult(result);
      }
    } else {
      const sb = soundBankRef.current;
      if (!sb) return;

      const audioCtx = sb.getAudioContext();
      const masterGainNode = sb.getMasterGain();
      const stream = videoStreamRef.current;

      let videoStream = stream;
      if (demoMode || !stream) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        videoStream = canvas.captureStream(30);
      }

      await sessionRecorderRef.current.start(
        videoStream!,
        audioCtx,
        masterGainNode as unknown as AudioNode
      );
      setIsRecording(true);
    }
  };

  const mood = MOODS[currentMood];

  // ─── REUSABLE: FX toggle button ─────────────────────
  const FxBtn = ({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) => (
    <button
      onClick={onClick}
      className="px-2 py-1 rounded text-[8px] tracking-[0.15em] border transition-all active:scale-95 font-mono"
      style={{
        borderColor: active ? (color || mood.accentColor) + '30' : 'rgba(0,0,0,0.05)',
        color: active ? (color || mood.accentColor) : 'rgba(0,0,0,0.25)',
        backgroundColor: active ? (color || mood.accentColor) + '06' : 'transparent',
      }}
    >
      {label}
    </button>
  );

  // ─── TAP TO BEGIN ─────────────────────────────────────
  if (phase === 'tap' || phase === 'loading') {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer select-none motus-bg"
        style={{ '--accent-color': mood.accentColor } as React.CSSProperties}
        onClick={phase === 'tap' ? handleTapToBegin : undefined}
      >
        <div className="relative z-10 flex flex-col items-center">
          <h1
            className="text-5xl md:text-8xl font-light text-black/85 tracking-[0.2em] mb-3"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            MOTUS
          </h1>

          <div className="data-bar w-32 mb-6" />

          {phase === 'tap' && (
            <>
              <div className="flex items-center gap-2 mb-10">
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: mood.accentColor, boxShadow: `0 0 6px ${mood.accentColor}` }} />
                <span className="text-[9px] tracking-[0.2em]" style={{ color: mood.accentColor + '80' }}>
                  {mood.name}
                </span>
                <span className="text-[9px] text-black/10">{'//'}</span>
                <span className="text-[9px] tracking-[0.15em] text-black/20">
                  {mood.description}
                </span>
              </div>

              <div
                className="w-16 h-16 rounded-full flex items-center justify-center pulse-ring"
                style={{ border: `1px solid ${mood.accentColor}30` }}
              >
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: mood.accentColor + '40', boxShadow: `0 0 20px ${mood.accentColor}30` }}
                />
              </div>

              <p className="label-mono mt-8 text-black/20 animate-pulse">
                TAP TO BEGIN
              </p>

              <img src="/artluka-logo.png" alt="ARTLUKA" className="mt-12 h-5 opacity-12" />
            </>
          )}

          {phase === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-6 h-6 border border-t-transparent rounded-full animate-spin"
                style={{ borderColor: mood.accentColor + '40', borderTopColor: 'transparent' }}
              />
              <p className="label-mono text-black/20">{loadingMsg}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── MAIN SESSION ─────────────────────────────────────
  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden motus-bg"
      style={{ '--accent-color': mood.accentColor } as React.CSSProperties}
    >
      {/* ── TOP BAR — overlays camera on mobile ─────────── */}
      <div className="flex items-center justify-between px-3 py-2 md:px-5 md:py-2.5 gap-2 relative z-20 md:z-10 md:relative absolute top-0 left-0 right-0 md:static bg-gradient-to-b from-black/30 via-black/10 to-transparent md:from-transparent md:bg-none"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        {/* Left cluster */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/')}
            className="text-[11px] md:text-sm font-light text-white/70 md:text-black/50 tracking-[0.2em] shrink-0 hover:text-white md:hover:text-black/70 transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            MOTUS
          </button>

          <span className="text-black/[0.08] text-[10px]">/</span>

          {/* Mood chip */}
          <div className="relative">
            <button
              onClick={() => setShowMoodPicker(!showMoodPicker)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] tracking-[0.15em] border transition-all"
              style={{
                borderColor: mood.accentColor + '30',
                color: mood.accentColor,
              }}
            >
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: mood.accentColor }} />
              {mood.name}
            </button>

            {showMoodPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMoodPicker(false)} />
                <div className="absolute top-full left-0 mt-1 bg-white border border-black/[0.06] rounded-lg p-1.5 z-50 grid grid-cols-2 gap-0.5 min-w-[180px] shadow-lg shadow-black/5 backdrop-blur-sm">
                  {MOOD_LIST.map((m) => (
                    <button
                      key={m}
                      onClick={() => switchMood(m)}
                      className="flex items-center gap-1.5 px-2 py-2 text-left text-[9px] tracking-[0.12em] rounded hover:bg-black/[0.03] active:bg-black/[0.06] transition-colors"
                      style={{ color: MOODS[m].accentColor }}
                    >
                      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: MOODS[m].accentColor }} />
                      {MOODS[m].name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Desktop: Pack selector + RND */}
          <div className="hidden md:flex md:items-center md:gap-2">
            <PackSelector currentPack={packIndex} onChange={handlePackChange} accentColor={mood.accentColor} />
            <FxBtn label="RND" active={packIndex === -1} onClick={handleRandomize} />
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1">
            <span className="label-mono hidden md:inline">SENS</span>
            <input
              type="range" min={5} max={100}
              value={Math.round(sensitivity * 100)}
              onChange={(e) => handleSensitivityChange(Number(e.target.value) / 100)}
              className="w-12 md:w-16"
            />
          </div>

          {!isLive && !demoMode && (
            <>
              <FxBtn label="CAM" active={false} onClick={() => startCameraFlow()} color={mood.accentColor} />
              <FxBtn label="DEMO" active={false} onClick={startDemoMode} />
            </>
          )}
        </div>
      </div>

      {/* Accent line under top bar */}
      <div className="data-bar" />

      {/* ── MAIN CONTENT ────────────────────────────────── */}
      {/* Mobile: camera fullscreen, pads hidden (they pulse in the top bar area) */}
      {/* Desktop: side by side */}
      <div className="flex-1 flex flex-col md:flex-row gap-0 md:gap-3 p-0 md:p-3 overflow-hidden relative z-10">
        {/* Camera — fullscreen on mobile */}
        <div className="flex-1 min-w-0 min-h-0 md:rounded-lg overflow-hidden">
          <CameraView
            landmarks={landmarks}
            prevLandmarks={prevLandmarks}
            activeZones={activeZones}
            skeletonColor={mood.skeletonColor}
            isRecording={isRecording}
            isLive={isLive}
            analyser={analyserNode}
            videoRef={videoRef}
            demoMode={demoMode}
            facingMode={facingMode}
            onFlipCamera={handleFlipCamera}
          />
        </div>

        {/* Pads — hidden on mobile, visible on desktop */}
        <div className="hidden md:block md:w-56 shrink-0 overflow-y-auto">
          <SoundPadGrid
            packIndex={packIndex}
            activeSlot={activeSlot}
            accentColor={mood.accentColor}
          />
        </div>
      </div>

      {/* ── BOTTOM CONTROLS — floating glass bar ─────────── */}
      <div className="absolute bottom-4 left-4 right-4 z-20 safe-area-bottom">
        <div className="flex items-center justify-center gap-2 p-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06]">
          {/* GLITCH */}
          <button
            onClick={handleGlitchToggle}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all active:scale-95"
            style={{
              background: glitchOn ? 'rgba(255,0,255,0.12)' : 'transparent',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={glitchOn ? '#ff00ff' : 'rgba(255,255,255,0.35)'} strokeWidth="1.5">
              <path d="M4 4h4v4H4zM16 4h4v4h-4zM10 10h4v4h-4zM4 16h4v4H4zM16 16h4v4h-4z" strokeLinecap="round" />
            </svg>
            <span className="text-[8px] tracking-[0.15em] font-mono" style={{ color: glitchOn ? '#ff00ff' : 'rgba(255,255,255,0.3)' }}>
              GLITCH
            </span>
          </button>

          {/* STUTTER */}
          <button
            onClick={handleStutterToggle}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all active:scale-95"
            style={{
              background: stutterOn ? 'rgba(0,255,255,0.12)' : 'transparent',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stutterOn ? '#00ffff' : 'rgba(255,255,255,0.35)'} strokeWidth="1.5">
              <path d="M3 12h2M7 12h2M11 12h2M15 12h2M19 12h2" strokeLinecap="round" />
              <path d="M4 8h1M8 8h1M12 8h1M16 8h1M20 8h1" strokeLinecap="round" />
              <path d="M4 16h1M8 16h1M12 16h1M16 16h1M20 16h1" strokeLinecap="round" />
            </svg>
            <span className="text-[8px] tracking-[0.15em] font-mono" style={{ color: stutterOn ? '#00ffff' : 'rgba(255,255,255,0.3)' }}>
              STUTTER
            </span>
          </button>

          {/* RANDOM */}
          <button
            onClick={handleRandomize}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all active:scale-95 active:bg-white/5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5">
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[8px] tracking-[0.15em] font-mono text-white/30">
              RANDOM
            </span>
          </button>

          {/* Divider */}
          <div className="w-[1px] h-8 bg-white/[0.06] mx-1" />

          {/* REC — larger, prominent */}
          <button
            onClick={handleRecordToggle}
            className="flex flex-col items-center gap-1 px-5 py-2.5 rounded-xl transition-all active:scale-95"
            style={{
              background: isRecording ? 'rgba(239,68,68,0.15)' : 'transparent',
            }}
          >
            <div className="relative">
              {isRecording ? (
                <div className="w-4 h-4 rounded-sm bg-red-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-red-500/60" />
              )}
              {isRecording && (
                <div className="absolute inset-0 w-4 h-4 rounded-sm bg-red-500 animate-ping opacity-30" />
              )}
            </div>
            <span className="text-[8px] tracking-[0.15em] font-mono" style={{ color: isRecording ? '#EF4444' : 'rgba(255,255,255,0.3)' }}>
              {isRecording ? recordTimer : 'REC'}
            </span>
          </button>
        </div>
      </div>

      {/* Save modal after recording */}
      {recordingResult && (
        <SaveModal
          recording={recordingResult}
          onClose={() => {
            if (recordingResult.url) URL.revokeObjectURL(recordingResult.url);
            setRecordingResult(null);
          }}
        />
      )}
    </div>
  );
}
