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
  AlertCircle,
  Eye,
} from 'lucide-react';
import { CameraFrameGraphic } from './CameraFrameGraphic';

export interface CameraFootageItem {
  id: string;
  cameraName: string;
  date?: string;          // e.g. "16 Sep 2026"
  timestamp: string;      // e.g. "2:35 PM"
  timeWindow: string;     // e.g. "2:32 PM – 2:35 PM"
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
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(25);
  const [volume, setVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when footage changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setProgress(25); // initial keyframe showing movement from source location
    }
  }, [isOpen, footage?.id]);

  // Video progress playback loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 1.25;
        });
      }, 62.5); // ~5 seconds for full pass
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

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

  if (!isOpen || !footage) return null;

  const currentIndex = allFootage.findIndex((f) => f.id === footage.id);
  const prevFootage = currentIndex > 0 ? allFootage[currentIndex - 1] : null;
  const nextFootage = currentIndex < allFootage.length - 1 ? allFootage[currentIndex + 1] : null;

  // Format date and time display strictly as requested:
  // "16 SEP 2026 · 2:35 PM"
  const displayDate = (footage.date || '16 Sep 2026').toUpperCase();
  const displayTime = footage.timestamp;
  const sourceLoc = footage.sourceLocation || 'A12';
  const targetLoc = footage.targetLocation || 'B07';
  const movementEventText = footage.movementPath || `${sourceLoc} → ${targetLoc}`;

  // Time Window parsing for scrubber (e.g. "2:32 PM – 2:35 PM")
  let startTimeDisplay = '2:32 PM';
  let endTimeDisplay = footage.timestamp || '2:35 PM';
  if (footage.timeWindow && footage.timeWindow.includes('–')) {
    const parts = footage.timeWindow.split('–').map((p) => p.trim());
    if (parts[0]) startTimeDisplay = parts[0];
    if (parts[1]) endTimeDisplay = parts[1];
  } else if (footage.timeWindow && footage.timeWindow.includes('-')) {
    const parts = footage.timeWindow.split('-').map((p) => p.trim());
    if (parts[0]) startTimeDisplay = parts[0];
    if (parts[1]) endTimeDisplay = parts[1];
  }

  // Format elapsed time (00:0X / 00:05)
  const currentSec = Math.min(5, Math.floor((progress / 100) * 5));
  const currentMilli = Math.floor(((progress / 100) * 50) % 10);

  return (
    <div
      id="camera-video-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalContainerRef}
        className={`bg-slate-900 border border-slate-700/80 rounded-2xl w-full overflow-hidden shadow-2xl flex flex-col text-white transition-all my-auto ${
          isFullscreen ? 'max-w-none h-full rounded-none' : 'max-w-4xl'
        }`}
      >
        {/* ========================================================================= */}
        {/* MODAL HEADER: CAMERA FEED, AISLE-3-CAM, 16 SEP 2026 · 2:35 PM, BACK BTN  */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            {/* Back button returns safely to recommendation/evidence screen without losing case state */}
            <button
              id="btn-back-from-camera"
              onClick={onClose}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700 active:scale-95 shadow-xs"
              title="Return to recommendation and case view"
            >
              <ChevronLeft className="w-4 h-4 text-amber-400" />
              <span>BACK</span>
            </button>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            {/* Camera Feed Identification & Header Hierarchy */}
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>CAMERA FEED</span>
              </div>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="font-mono font-black text-sm sm:text-base text-white tracking-wide">
                  {footage.cameraName}
                </span>
                <span className="text-slate-500 font-mono text-xs">&bull;</span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {displayDate} &bull; {displayTime}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
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
        {/* MAIN BODY: REALISTIC WAREHOUSE CCTV-STYLE VIEW                           */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-neutral-950 shadow-2xl">
            <CameraFrameGraphic
              type={footage.type}
              cameraName={footage.cameraName}
              timestamp={footage.timestamp}
              date={footage.date || '16 Sep 2026'}
              eventNote={footage.description}
              playProgress={progress}
              isPlaying={isPlaying}
              sourceLocation={sourceLoc}
              targetLocation={targetLoc}
              sku={footage.sku || 'SKU-1042'}
            />

            {/* Center Play Overlay Button if Paused */}
            {!isPlaying && (
              <div
                onClick={() => {
                  if (progress >= 100) setProgress(0);
                  setIsPlaying(true);
                }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/30 transition-colors group"
                title="Click to play CCTV footage"
              >
                <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 fill-current ml-1" />
                </div>
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* TIMELINE / SCRUBBER & CAMERA EVENT MARKERS                              */}
          {/* ======================================================================= */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3.5">
            {/* Scrubber and Visual Event Markers Row */}
            <div className="space-y-2">
              <div className="relative flex items-center group">
                <input
                  id="video-progress-scrubber"
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={progress}
                  onChange={(e) => {
                    setProgress(Number(e.target.value));
                  }}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 focus:outline-hidden relative z-10"
                />

                {/* Subtle Timeline Event Marker 1: Source Location (A12) at 20% */}
                <button
                  type="button"
                  onClick={() => setProgress(20)}
                  className="absolute left-[20%] -top-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-slate-950 shadow-md cursor-pointer hover:scale-125 transition-transform z-20"
                  title={`Jump to ${sourceLoc} departure event`}
                />

                {/* Subtle Timeline Event Marker 2: Destination Location (B07) at 82% */}
                <button
                  type="button"
                  onClick={() => setProgress(82)}
                  className="absolute left-[82%] -top-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 shadow-md cursor-pointer hover:scale-125 transition-transform z-20"
                  title={`Jump to ${targetLoc} arrival event`}
                />
              </div>

              {/* Timeline Labeling with Event Markers Alignment */}
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400 font-bold">{startTimeDisplay}</span>

                {/* Timeline Event Labels beneath the markers */}
                <div className="flex items-center space-x-6 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setProgress(20)}
                    className="flex items-center space-x-1 text-amber-400 hover:underline cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>{sourceLoc} (Departure)</span>
                  </button>

                  <span className="text-slate-600">&bull;</span>

                  <button
                    type="button"
                    onClick={() => setProgress(82)}
                    className="flex items-center space-x-1 text-emerald-400 hover:underline cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{targetLoc} (Arrival)</span>
                  </button>
                </div>

                <span className="text-slate-400 font-bold">{endTimeDisplay}</span>
              </div>
            </div>

            {/* Playback Controls & Video Timecode */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
              <div className="flex items-center space-x-2.5">
                <button
                  id="btn-toggle-video-play"
                  onClick={() => {
                    if (progress >= 100) setProgress(0);
                    setIsPlaying(!isPlaying);
                  }}
                  className="py-1.5 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>{progress >= 100 ? 'Replay' : 'Play'}</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-replay-video"
                  onClick={() => {
                    setProgress(0);
                    setIsPlaying(true);
                  }}
                  title="Restart playback from beginning"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 transition-colors cursor-pointer border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Restart</span>
                </button>

                <div className="text-xs font-mono text-slate-400 pl-2">
                  00:0{currentSec}.{currentMilli} / 00:05.0
                </div>
              </div>

              {/* Volume Controls */}
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
          {/* MOVEMENT EVENT & TRUST REQUIREMENTS (Visual Evidence, Not Confirmation) */}
          {/* ======================================================================= */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Movement event:
              </div>
              <div className="text-lg font-black font-mono text-amber-400 flex items-center space-x-2">
                <span>{movementEventText}</span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                Camera evidence suggests movement from {sourceLoc} toward {targetLoc}.
              </p>
            </div>

            {/* Mandatory Guardrail & Neutral Attribution Notice */}
            <div className="sm:max-w-xs text-left sm:text-right space-y-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
              <div className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-amber-300 bg-amber-950/50 px-2.5 py-1 rounded border border-amber-800/60">
                <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Visual evidence &bull; Worker verification required</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Worker/device associated with movement. Physical presence must be verified at {targetLoc}.
              </p>
            </div>
          </div>

          {/* Camera angle switcher if multiple available */}
          {allFootage.length > 1 && onSelectNextFootage && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <button
                disabled={!prevFootage}
                onClick={() => prevFootage && onSelectNextFootage(prevFootage)}
                className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  prevFootage
                    ? 'border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer'
                    : 'border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Angle ({prevFootage ? prevFootage.cameraName : '—'})</span>
              </button>

              <button
                disabled={!nextFootage}
                onClick={() => nextFootage && onSelectNextFootage(nextFootage)}
                className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  nextFootage
                    ? 'border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer'
                    : 'border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <span>Next Angle ({nextFootage ? nextFootage.cameraName : '—'})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer with Safe Return */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Physical verification at {targetLoc} remains required.
          </p>
          <button
            id="btn-dismiss-video-modal"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-700"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
