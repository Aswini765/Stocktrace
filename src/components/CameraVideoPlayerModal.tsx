import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Camera,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Eye,
  Film,
  Clock,
} from 'lucide-react';
import { CameraFrameGraphic } from './CameraFrameGraphic';

export interface CameraFootageItem {
  id: string;
  cameraName: string;
  date?: string;          // e.g. "16 Sep 2026"
  timestamp: string;      // e.g. "2:32 PM"
  timeWindow?: string;    // e.g. "2:32 PM – 2:37 PM"
  zone: string;
  description: string;
  type: 'a12' | 'aisle3' | 'b07' | 'c03' | 'empty';
  movementPath?: string;  // e.g. "A12 → B07"
  sourceLocation?: string; // e.g. "A12"
  targetLocation?: string; // e.g. "B07"
  sku?: string;
}

interface CameraVideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  footage: CameraFootageItem | null;
  onSelectNextFootage?: (item: CameraFootageItem) => void;
  allFootage?: CameraFootageItem[];
}

export const CameraVideoPlayerModal: React.FC<CameraVideoPlayerModalProps> = ({
  isOpen,
  onClose,
  footage,
  onSelectNextFootage,
  allFootage = [],
}) => {
  // Available sequence clips
  const clips: CameraFootageItem[] =
    allFootage.length > 0
      ? allFootage
      : footage
      ? [footage]
      : [];

  const [activeClipIndex, setActiveClipIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  // Overall timeline progress (0 to 100) representing 2:32 PM – 2:37 PM
  const [overallProgress, setOverallProgress] = useState<number>(10);
  const [volume, setVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      if (footage && clips.length > 0) {
        const foundIdx = clips.findIndex((c) => c.id === footage.id || c.cameraName === footage.cameraName);
        if (foundIdx >= 0) {
          setActiveClipIndex(foundIdx);
          setOverallProgress(foundIdx === 0 ? 10 : foundIdx === 1 ? 45 : 78);
        } else {
          setActiveClipIndex(0);
          setOverallProgress(10);
        }
      } else {
        setActiveClipIndex(0);
        setOverallProgress(10);
      }
    }
  }, [isOpen, footage?.id]);

  // Overall timeline scrubber logic
  // Clip 0: 0% – 33.3%  (Bay A12, 2:32 PM)
  // Clip 1: 33.3% – 66.6% (Aisle 3, 2:34 PM)
  // Clip 2: 66.6% – 100%  (Bay B07, 2:35 PM)
  const getIndexFromProgress = (p: number, count: number): number => {
    if (count <= 1) return 0;
    if (count === 3) {
      if (p < 33.33) return 0;
      if (p < 66.66) return 1;
      return 2;
    }
    const segment = 100 / count;
    return Math.min(count - 1, Math.floor(p / segment));
  };

  // Synchronize activeClipIndex as user scrubs or playback advances
  const handleProgressChange = (newProgress: number) => {
    setOverallProgress(newProgress);
    const newIdx = getIndexFromProgress(newProgress, clips.length);
    if (newIdx !== activeClipIndex) {
      setActiveClipIndex(newIdx);
      if (onSelectNextFootage && clips[newIdx]) {
        onSelectNextFootage(clips[newIdx]);
      }
    }
  };

  // Jump directly to a specific clip observation
  const jumpToClip = (index: number) => {
    const targetIdx = Math.max(0, Math.min(clips.length - 1, index));
    setActiveClipIndex(targetIdx);
    if (clips.length === 3) {
      if (targetIdx === 0) setOverallProgress(10);
      else if (targetIdx === 1) setOverallProgress(45);
      else setOverallProgress(78);
    } else {
      const step = 100 / clips.length;
      setOverallProgress(targetIdx * step + step * 0.3);
    }
    if (onSelectNextFootage && clips[targetIdx]) {
      onSelectNextFootage(clips[targetIdx]);
    }
  };

  // Continuous playback loop: traverses chronologically through all 3 clips
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setOverallProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          const next = prev + 0.65; // ~7.7 seconds to replay the entire 3-clip investigation window
          const nextIdx = getIndexFromProgress(next, clips.length);
          if (nextIdx !== activeClipIndex) {
            setActiveClipIndex(nextIdx);
            if (onSelectNextFootage && clips[nextIdx]) {
              onSelectNextFootage(clips[nextIdx]);
            }
          }
          return next;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, clips, activeClipIndex, onSelectNextFootage]);

  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen?.().catch(() => {
        setIsFullscreen(!isFullscreen);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  const currentClip: CameraFootageItem =
    clips[activeClipIndex] ||
    footage || {
      id: 'cam-0',
      cameraName: 'Bay A12',
      date: '16 Sep 2026',
      timestamp: '2:32 PM',
      timeWindow: '2:32 PM – 2:37 PM',
      zone: 'Bay A12',
      description: 'Possible movement leaving A12',
      type: 'a12',
      sourceLocation: 'A12',
      targetLocation: 'B07',
      sku: 'SKU-1042',
    };

  // Calculate in-clip progress (0 to 100%) for animation inside current clip
  let inClipProgress = 50;
  if (clips.length <= 1) {
    inClipProgress = overallProgress;
  } else if (clips.length === 3) {
    if (activeClipIndex === 0) inClipProgress = Math.min(100, Math.max(0, (overallProgress / 33.33) * 100));
    else if (activeClipIndex === 1) inClipProgress = Math.min(100, Math.max(0, ((overallProgress - 33.33) / 33.33) * 100));
    else inClipProgress = Math.min(100, Math.max(0, ((overallProgress - 66.66) / 33.34) * 100));
  } else {
    const seg = 100 / clips.length;
    inClipProgress = Math.min(100, Math.max(0, ((overallProgress - activeClipIndex * seg) / seg) * 100));
  }

  const displayDate = (currentClip.date || '16 Sep 2026').toUpperCase();
  const displayTime = currentClip.timestamp;
  const sourceLoc = currentClip.sourceLocation || 'A12';
  const targetLoc = currentClip.targetLocation || 'B07';

  // Overall timeline labels
  const startTimeDisplay = '2:32 PM';
  const endTimeDisplay = '2:37 PM';

  return (
    <div
      id="camera-video-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalContainerRef}
        className={`bg-slate-900 border border-slate-700/80 rounded-2xl w-full overflow-hidden shadow-2xl flex flex-col text-white transition-all my-auto max-h-[95vh] ${
          isFullscreen ? 'max-w-none h-full rounded-none' : 'max-w-4xl'
        }`}
      >
        {/* ========================================================================= */}
        {/* MODAL HEADER: CURRENT CAMERA, DATE/TIME, BACK BTN                        */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center space-x-3">
            {/* Back button returns safely to recommendation without losing state */}
            <button
              id="btn-back-from-camera"
              onClick={onClose}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700 active:scale-95 shadow-xs"
              title="Return to investigation case"
            >
              <ChevronLeft className="w-4 h-4 text-amber-400" />
              <span>BACK</span>
            </button>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            {/* Current Camera & Location Header */}
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1.5">
                <Camera className="w-3 h-3 text-amber-400" />
                <span>
                  CAMERA EVIDENCE REPLAY · OBSERVATION {activeClipIndex + 1} OF {clips.length}
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-slate-400 hidden xs:inline">SEPARATE CCTV RECORDINGS</span>
              </div>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="font-mono font-black text-sm sm:text-base text-white tracking-wide">
                  {currentClip.cameraName}
                </span>
                <span className="text-slate-500 font-mono text-xs">&bull;</span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {displayDate} &bull; {displayTime}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              id="btn-fullscreen-toggle"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              id="btn-close-video-modal"
              onClick={onClose}
              title="Close and return to recommendation"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CAMERA SEQUENCE SWITCHER (A12 → Aisle 3 → B07)                            */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Observation Sequence:
            </span>
            <div className="flex items-center space-x-1.5">
              {clips.map((clip, idx) => (
                <React.Fragment key={clip.id || idx}>
                  <button
                    id={`btn-select-clip-${idx}`}
                    onClick={() => jumpToClip(idx)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer border ${
                      activeClipIndex === idx
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                    title={`Jump to ${clip.cameraName} (${clip.timestamp})`}
                  >
                    <span className="text-[10px] opacity-75">{idx + 1}.</span>
                    <span>{clip.cameraName}</span>
                  </button>
                  {idx < clips.length - 1 && (
                    <span className="text-slate-600 font-mono">&rarr;</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 hidden md:flex items-center space-x-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Window: 2:32 PM – 2:37 PM</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN BODY: CCTV GRAPHIC & ACTIVE OBSERVATION FOOTAGE                     */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-neutral-950 shadow-2xl">
            <CameraFrameGraphic
              type={currentClip.type}
              cameraName={currentClip.cameraName}
              timestamp={currentClip.timestamp}
              date={currentClip.date || '16 Sep 2026'}
              eventNote={currentClip.description}
              playProgress={inClipProgress}
              isPlaying={isPlaying}
              sourceLocation={sourceLoc}
              targetLocation={targetLoc}
              sku={currentClip.sku || 'SKU-1042'}
            />

            {/* Top Overlay Badge: Discrete Observation Notice */}
            <div className="absolute top-3 left-3 flex items-center space-x-2 z-10 pointer-events-none">
              <span className="bg-slate-950/80 border border-slate-700 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-xs">
                CLIP {activeClipIndex + 1} OF {clips.length}: {currentClip.cameraName.toUpperCase()}
              </span>
              <span className="bg-slate-900/80 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded hidden sm:inline">
                {currentClip.description}
              </span>
            </div>

            {/* Center Play Overlay Button if Paused */}
            {!isPlaying && (
              <div
                onClick={() => {
                  if (overallProgress >= 100) setOverallProgress(0);
                  setIsPlaying(true);
                }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/30 transition-colors group z-20"
                title="Click to play continuous evidence replay"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />
                </div>
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* OVERALL TIMELINE / SCRUBBER & CAMERA EVENT MARKERS (2:32 PM – 2:37 PM)  */}
          {/* ======================================================================= */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-3">
            {/* Scrubber with Distinct Clickable Event Markers */}
            <div className="space-y-2">
              <div className="relative flex items-center group">
                <input
                  id="video-progress-scrubber"
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={overallProgress}
                  onChange={(e) => handleProgressChange(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 focus:outline-hidden relative z-10"
                />

                {/* Event Marker 1: Bay A12 (2:32 PM) at 10% */}
                <button
                  type="button"
                  id="marker-clip-0"
                  onClick={() => jumpToClip(0)}
                  className={`absolute left-[10%] -top-1 w-4 h-4 rounded-full border-2 border-slate-950 shadow-md cursor-pointer hover:scale-125 transition-transform z-20 ${
                    activeClipIndex === 0 ? 'bg-amber-400 ring-2 ring-amber-300' : 'bg-amber-500'
                  }`}
                  title="Clip 1: Bay A12 · 2:32 PM (Possible movement leaving A12)"
                />

                {/* Event Marker 2: Aisle 3 (2:34 PM) at 45% */}
                <button
                  type="button"
                  id="marker-clip-1"
                  onClick={() => jumpToClip(1)}
                  className={`absolute left-[45%] -top-1 w-4 h-4 rounded-full border-2 border-slate-950 shadow-md cursor-pointer hover:scale-125 transition-transform z-20 ${
                    activeClipIndex === 1 ? 'bg-amber-400 ring-2 ring-amber-300' : 'bg-slate-300'
                  }`}
                  title="Clip 2: Aisle 3 · 2:34 PM (Movement observed toward B07)"
                />

                {/* Event Marker 3: Bay B07 (2:35 PM) at 78% */}
                <button
                  type="button"
                  id="marker-clip-2"
                  onClick={() => jumpToClip(2)}
                  className={`absolute left-[78%] -top-1 w-4 h-4 rounded-full border-2 border-slate-950 shadow-md cursor-pointer hover:scale-125 transition-transform z-20 ${
                    activeClipIndex === 2 ? 'bg-emerald-400 ring-2 ring-emerald-300' : 'bg-emerald-500'
                  }`}
                  title="Clip 3: Bay B07 · 2:35 PM (Activity observed near B07)"
                />
              </div>

              {/* Timeline Labeling beneath markers */}
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400 font-bold">{startTimeDisplay}</span>

                {/* Three Clickable Event Observation Labels */}
                <div className="flex items-center space-x-3 sm:space-x-6 text-[11px]">
                  <button
                    type="button"
                    onClick={() => jumpToClip(0)}
                    className={`flex items-center space-x-1 cursor-pointer transition-colors ${
                      activeClipIndex === 0 ? 'text-amber-400 font-bold underline' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>A12 (2:32 PM)</span>
                  </button>

                  <span className="text-slate-600">&bull;</span>

                  <button
                    type="button"
                    onClick={() => jumpToClip(1)}
                    className={`flex items-center space-x-1 cursor-pointer transition-colors ${
                      activeClipIndex === 1 ? 'text-amber-400 font-bold underline' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span>Aisle 3 (2:34 PM)</span>
                  </button>

                  <span className="text-slate-600">&bull;</span>

                  <button
                    type="button"
                    onClick={() => jumpToClip(2)}
                    className={`flex items-center space-x-1 cursor-pointer transition-colors ${
                      activeClipIndex === 2 ? 'text-emerald-400 font-bold underline' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>B07 (2:35 PM)</span>
                  </button>
                </div>

                <span className="text-slate-400 font-bold">{endTimeDisplay}</span>
              </div>
            </div>

            {/* Playback Controls & Video Timecode */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
              <div className="flex items-center space-x-2">
                <button
                  id="btn-toggle-video-play"
                  onClick={() => {
                    if (overallProgress >= 100) setOverallProgress(0);
                    setIsPlaying(!isPlaying);
                  }}
                  className="py-1.5 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>{overallProgress >= 100 ? 'Replay Sequence' : 'Play Sequence'}</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-replay-video"
                  onClick={() => {
                    setOverallProgress(0);
                    setActiveClipIndex(0);
                    setIsPlaying(true);
                  }}
                  title="Restart playback from Clip 1 (2:32 PM)"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 transition-colors cursor-pointer border border-slate-700 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Restart</span>
                </button>

                {/* Step Between Clips Buttons */}
                <button
                  disabled={activeClipIndex === 0}
                  onClick={() => jumpToClip(activeClipIndex - 1)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:text-slate-600 disabled:hover:bg-slate-800 text-xs cursor-pointer disabled:cursor-not-allowed border border-slate-700"
                  title="Previous Observation Clip"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  disabled={activeClipIndex === clips.length - 1}
                  onClick={() => jumpToClip(activeClipIndex + 1)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:text-slate-600 disabled:hover:bg-slate-800 text-xs cursor-pointer disabled:cursor-not-allowed border border-slate-700"
                  title="Next Observation Clip"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Volume & Audio Slider */}
              <div className="flex items-center space-x-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                <button
                  id="btn-toggle-volume"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </button>
                <input
                  id="video-volume-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  title={`Volume: ${isMuted ? 0 : volume}%`}
                />
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* CURRENT OBSERVATION DETAILS & TRUST MANDATES                            */}
          {/* ======================================================================= */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <span>Current Observation:</span>
                <span className="text-amber-400 font-mono">
                  Clip {activeClipIndex + 1} of {clips.length} ({currentClip.cameraName})
                </span>
              </div>
              <div className="text-base font-black text-white">
                {currentClip.description}
              </div>
              <p className="text-xs text-slate-300">
                Camera evidence suggests movement from A12 toward B07.
              </p>
            </div>

            {/* Mandatory Trust Guardrail */}
            <div className="sm:max-w-xs text-left sm:text-right space-y-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
              <div className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-amber-300 bg-amber-950/50 px-2.5 py-1 rounded border border-amber-800/60">
                <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Visual evidence &bull; Worker verification required</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Camera observations do not confirm physical inventory presence. Physical verification required at {targetLoc}.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer with Safe Return */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400 truncate mr-2">
            Timeline represents overall evidence window (approx. 2:32 PM – 2:37 PM).
          </p>
          <button
            id="btn-dismiss-video-modal"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-700 active:scale-95 shrink-0"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
