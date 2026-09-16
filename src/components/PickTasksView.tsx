import React from 'react';
import {
  ClipboardList,
  MapPin,
  ArrowRight,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';
import { PickTask, PickTaskStatus } from '../types';

interface PickTasksViewProps {
  pickTasks: PickTask[];
  onStartPick: (task: PickTask) => void;
}

const getStatusBadge = (status: PickTaskStatus) => {
  switch (status) {
    case 'PENDING':
    case 'Ready':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span>PENDING</span>
        </span>
      );
    case 'PICKING':
    case 'In Progress':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>PICKING</span>
        </span>
      );
    case 'NOT FOUND':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>NOT FOUND</span>
        </span>
      );
    case 'INVESTIGATING':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-900 border border-indigo-300">
          <Search className="w-3 h-3 text-indigo-600 animate-spin" />
          <span>INVESTIGATING</span>
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>RESOLVED</span>
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white border border-emerald-700">
          <CheckCircle2 className="w-3 h-3 text-white" />
          <span>COMPLETED</span>
        </span>
      );
    case 'ESCALATED':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-300">
          <AlertCircle className="w-3 h-3 text-purple-700" />
          <span>ESCALATED</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          <span>{status}</span>
        </span>
      );
  }
};

export const PickTasksView: React.FC<PickTasksViewProps> = ({ pickTasks, onStartPick }) => {
  const activeTasks = pickTasks.filter((t) => t.status !== 'COMPLETED');
  const completedTasks = pickTasks.filter((t) => t.status === 'COMPLETED');

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* Primary Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <ClipboardList className="w-4 h-4" />
            <span>Warehouse Workspace</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Warehouse Pick Tasks</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Select an active task and click <strong>[ START PICK ]</strong> to begin warehouse picking.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Shift 01 &bull; Zone A &amp; B
          </span>
          <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-300">
            {activeTasks.length} Active / Queued
          </span>
          {completedTasks.length > 0 && (
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300">
              {completedTasks.length} Completed
            </span>
          )}
        </div>
      </div>

      {/* Task Lifecycle Presentation */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Task Lifecycle Workflow
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Normal flow */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
              Normal Pick Task
            </span>
            <div className="flex items-center flex-wrap gap-1.5 font-mono text-[11px] font-semibold text-slate-700">
              <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded">PENDING</span>
              <span className="text-slate-400">→</span>
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded">PICKING</span>
              <span className="text-slate-400">→</span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">COMPLETED</span>
            </div>
          </div>

          {/* Failed-pick flow */}
          <div className="p-3 bg-amber-50/40 border border-amber-200/80 rounded-lg">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide block mb-1.5">
              Failed-Pick Investigation Task
            </span>
            <div className="flex items-center flex-wrap gap-1.5 font-mono text-[10px] font-semibold">
              <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">PENDING</span>
              <span className="text-slate-400">→</span>
              <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">PICKING</span>
              <span className="text-slate-400">→</span>
              <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">NOT FOUND</span>
              <span className="text-slate-400">→</span>
              <span className="bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded">INVESTIGATING</span>
              <span className="text-slate-400">→</span>
              <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded">RESOLVED</span>
              <span className="text-slate-400">→</span>
              <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded">COMPLETED</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: ACTIVE / QUEUED TASKS */}
      <div id="section-active-queued-tasks" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                ACTIVE / QUEUED TASKS
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tasks waiting for picker assignment or actively in progress.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded border border-amber-200">
            {activeTasks.length} {activeTasks.length === 1 ? 'task' : 'tasks'} queued
          </span>
        </div>

        {activeTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-semibold text-slate-800">All assigned pick tasks completed!</p>
            <p className="text-xs text-slate-400">Great work. Check Completed Tasks below for resolution history.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeTasks.map((task) => {
              const isHero = task.sku === 'SKU-1042';

              return (
                <div
                  key={task.id}
                  id={`pick-list-${task.sku.toLowerCase()}`}
                  className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors ${
                    isHero
                      ? 'bg-amber-50/20 hover:bg-amber-50/40 border-l-4 border-l-amber-500'
                      : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Task ID, SKU, Order, and Current Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {task.id}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                        SKU: {task.sku}
                      </span>
                      {task.orderNumber && (
                        <span className="text-xs text-slate-400 font-mono">
                          ({task.orderNumber})
                        </span>
                      )}
                      {isHero && (
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded uppercase tracking-wider">
                          Primary Scenario (A12 → B07)
                        </span>
                      )}

                      {/* Current Status Badge */}
                      <div className="ml-auto md:ml-2">
                        {getStatusBadge(task.status)}
                      </div>
                    </div>

                    {/* Item Name */}
                    <div className="text-xl font-black text-slate-900 tracking-tight">
                      {task.item}
                    </div>

                    {/* Quantity and Expected Location */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                        <span className="text-slate-400">Quantity:</span>
                        <strong className="text-slate-900 font-bold">{task.qty} units</strong>
                      </div>

                      <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-slate-400">Expected Location:</span>
                        <strong className="font-mono font-black text-slate-900 text-sm">
                          {task.expectedLocation}
                        </strong>
                      </div>

                      {task.destinationBin && (
                        <div className="flex items-center space-x-1.5 text-slate-500">
                          <span className="text-slate-400">Staging Bin:</span>
                          <span className="font-mono font-medium text-slate-700">
                            {task.destinationBin}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* START / RESUME PICK action */}
                  <div className="shrink-0 flex items-center">
                    <button
                      id={`btn-task-start-${task.sku.toLowerCase()}`}
                      onClick={() => onStartPick(task)}
                      className={`py-3 px-6 rounded-lg font-bold text-xs flex items-center space-x-2 shadow-xs transition-colors cursor-pointer ${
                        task.status === 'RESOLVED'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : task.status === 'INVESTIGATING' || task.status === 'NOT FOUND'
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                          : task.status === 'PICKING'
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>
                        {task.status === 'PICKING'
                          ? '[ RESUME PICK ]'
                          : task.status === 'NOT FOUND' || task.status === 'INVESTIGATING'
                          ? '[ CONTINUE INVESTIGATION ]'
                          : task.status === 'RESOLVED'
                          ? '[ VIEW RESOLUTION & COMPLETE ]'
                          : task.status === 'ESCALATED'
                          ? '[ VIEW ESCALATION ]'
                          : '[ START PICK ]'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: COMPLETED TASKS */}
      <div id="section-completed-tasks" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                COMPLETED TASKS
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tasks resolved and fulfilled during this shift.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200">
            {completedTasks.length} {completedTasks.length === 1 ? 'task' : 'tasks'} completed
          </span>
        </div>

        {completedTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No completed tasks yet. Completed picks will appear here once fulfilled.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                id={`completed-task-${task.id.toLowerCase()}`}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-50/20 hover:bg-emerald-50/30 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                      {task.id}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      SKU: {task.sku}
                    </span>
                    {getStatusBadge(task.status)}
                    {task.isFailedPick && (
                      <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                        RESOLVED VIA STOCKTRACE
                      </span>
                    )}
                    {task.investigationId && (
                      <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                        Log: {task.investigationId}
                      </span>
                    )}
                    {task.discrepancyId && (
                      <span className="font-mono text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                        Audit: {task.discrepancyId}
                      </span>
                    )}
                  </div>

                  <div className="text-lg font-bold text-slate-900">
                    {task.item}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">Quantity: </span>
                      <strong className="text-slate-900 font-bold">{task.qty} units</strong>
                    </div>

                    <div>
                      <span className="text-slate-400">Expected: </span>
                      <span className={`font-mono font-bold ${task.foundLocation && task.foundLocation !== task.expectedLocation ? 'line-through text-rose-600' : 'text-slate-900'}`}>
                        {task.expectedLocation}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400">Found Location: </span>
                      <strong className="font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                        {task.foundLocation || task.expectedLocation}
                      </strong>
                    </div>

                    {task.resolutionTime && (
                      <div className="flex items-center space-x-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Resolution Time: <strong className="text-slate-800">{task.resolutionTime}</strong></span>
                      </div>
                    )}

                    <div className="flex items-center space-x-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Completed: <strong>{task.completedAt || 'Recently'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>VERIFIED &amp; COMPLETED</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
