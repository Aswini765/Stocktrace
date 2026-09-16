import React from 'react';
import { Camera, ArrowRight, CheckCircle2, Clock, MapPin, AlertTriangle, Radio } from 'lucide-react';
import { ScenarioType } from '../types';

interface CameraPathTimelineProps {
  currentStepIndex: number; // 1, 2, or 3
  scenario: ScenarioType;
  onSelectNode?: (index: number) => void;
}

export const CameraPathTimeline: React.FC<CameraPathTimelineProps> = ({
  currentStepIndex,
  scenario,
  onSelectNode,
}) => {
  const isNoCamera = scenario === 'no-camera';
  const isConflict = scenario === 'conflict';

  const timelineSteps = [
    {
      id: 'a12',
      name: 'A12-CAM',
      timestamp: '2:34 PM',
      window: '2:32 – 2:36 PM',
      zone: 'Bay A12',
      role: 'Where it was',
      event: isNoCamera ? 'No movement seen' : 'Movement seen leaving A12',
      status: isNoCamera ? 'no-event' : 'detected',
      highlight: 'Movement seen leaving A12',
    },
    {
      id: 'aisle3',
      name: 'AISLE-3-CAM',
      timestamp: '2:35 PM',
      window: '2:34 – 2:36 PM',
      zone: 'Aisle 3',
      role: 'In transit',
      event: isNoCamera ? 'No footage' : 'Heading toward B07',
      status: isNoCamera ? 'pending' : currentStepIndex >= 2 ? 'detected' : 'in-progress',
      highlight: 'Movement appears to be heading toward B07',
    },
    {
      id: 'b07',
      name: isConflict ? 'B07 vs C03' : 'B07-CAM',
      timestamp: '2:36 PM',
      window: '2:35 – 2:37 PM',
      zone: isConflict ? 'Different bays' : 'Bay B07',
      role: 'Where it went',
      event: isNoCamera
        ? 'No signal'
        : isConflict
        ? 'Conflicting camera feeds'
        : 'Activity seen near B07',
      status: isNoCamera
        ? 'pending'
        : isConflict
        ? 'conflict'
        : currentStepIndex >= 3
        ? 'detected'
        : 'pending',
      highlight: isConflict ? 'Different cameras disagree' : 'Activity seen near B07',
    },
  ];

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 shadow-md space-y-4">
      {/* Top Header of the Timeline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Movement Path
          </span>
          <span className="text-slate-500 text-xs">•</span>
          <span className="text-xs text-slate-300 font-mono">
            A12 → Aisle 3 → B07
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Time window: 2:32 PM – 2:37 PM</span>
        </div>
      </div>

      {/* Linked Camera Flow Visualization */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
          {timelineSteps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = currentStepIndex >= stepNum;
            const isCurrent = currentStepIndex === stepNum;

            let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
            let dotColor = 'bg-slate-600';
            let cardBorder = 'border-slate-800 bg-slate-800/60';

            if (step.status === 'detected') {
              badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
              dotColor = 'bg-emerald-400 ring-4 ring-emerald-400/20';
              cardBorder = isCurrent
                ? 'border-amber-400/80 bg-slate-800 shadow-lg shadow-amber-500/5'
                : 'border-emerald-500/30 bg-slate-800/80';
            } else if (step.status === 'conflict') {
              badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
              dotColor = 'bg-rose-400 ring-4 ring-rose-400/20';
              cardBorder = 'border-rose-500/40 bg-slate-800/90';
            } else if (step.status === 'no-event') {
              badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              dotColor = 'bg-amber-400';
              cardBorder = 'border-amber-500/30 bg-slate-800/80';
            }

            return (
              <div
                key={step.id}
                id={`timeline-node-${step.id}`}
                onClick={() => onSelectNode && onSelectNode(stepNum)}
                className={`relative rounded-lg p-3.5 border transition-all duration-300 cursor-pointer ${cardBorder}`}
              >
                {/* Node Connector Line for Desktop */}
                {idx < timelineSteps.length - 1 && (
                  <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 items-center justify-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border shadow-xs transition-colors ${
                        currentStepIndex > stepNum
                          ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                      }`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}

                {/* Header of Node: Camera Name + Time */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                    <span className="font-mono text-xs font-bold text-white flex items-center space-x-1">
                      <Camera className="w-3.5 h-3.5 text-slate-400" />
                      <span>{step.name}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 font-mono text-[11px] text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 font-semibold">
                    <Clock className="w-3 h-3" />
                    <span>{step.timestamp}</span>
                  </div>
                </div>

                {/* Subtitle / Zone Info */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-200 font-medium">{step.zone}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {step.role}
                  </span>
                </div>

                {/* Event Activity & Key Moment */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}
                    >
                      {step.event}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{step.window}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium pt-0.5 flex items-start space-x-1">
                    <span className="text-amber-400 font-bold">Key moment:</span>
                    <span className="text-slate-200">{step.highlight}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trajectory Summary Footer */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-lg px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong className="text-white">Movement seen: </strong>
            Bay A12 (2:34 PM) <span className="text-amber-400 font-bold">➔</span> Aisle 3 (2:35 PM) <span className="text-amber-400 font-bold">➔</span> Bay B07 (2:36 PM)
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Cameras match recent activity</span>
        </div>
      </div>
    </div>
  );
};
