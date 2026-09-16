import React, { useState } from 'react';
import {
  Server,
  Scan,
  Camera,
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { DataSourceItem } from '../types';
import { gmailConnector, stockTraceNotifier, SendEmailResult } from '../services/email';

interface DataSourcesViewProps {
  dataSources: DataSourceItem[];
}

export const DataSourcesView: React.FC<DataSourcesViewProps> = ({ dataSources }) => {
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<SendEmailResult | null>(null);

  // Normalize system display names as requested: Inventory Data, Scanner Activity, Camera Footage
  const systems = [
    {
      id: 'inv',
      name: 'Inventory Data',
      icon: Server,
      desc: 'Item locations and expected bin positions.',
    },
    {
      id: 'scan',
      name: 'Scanner Activity',
      icon: Scan,
      desc: 'Recent scan movements and barcode scans.',
    },
    {
      id: 'cam',
      name: 'Camera Footage',
      icon: Camera,
      desc: 'Overhead camera feeds covering warehouse aisles.',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          CONNECTED SYSTEMS
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Active data sources connected to StockTrace.
        </p>
      </div>

      {/* 3 Simple Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {systems.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>CONNECTED</span>
                  </span>
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">{s.name}</h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* OUTBOUND ACTION TOOLS (GMAIL) */}
      <div className="pt-2">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-black">
                <Mail className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-900">Gmail Notification Tool</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    OUTBOUND ACTION ONLY
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sends attention-required escalation alerts to warehouse supervisors. Never reads inbox or determines inventory locations.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded text-xs font-bold shrink-0 self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>ACTIVE</span>
            </span>
          </div>

          {/* Recipient & Permissions Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <span className="text-slate-400 block text-[11px] font-medium">Configured Recipient</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-slate-800 text-xs truncate">
                  {gmailConnector.getRecipient()}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">(Supervisor)</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <span className="text-slate-400 block text-[11px] font-medium">Permission Scope</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-emerald-700 text-xs">gmail.send</span>
                <span className="text-[10px] text-slate-500 font-medium">(Send email only · No inbox access)</span>
              </div>
            </div>
          </div>

          {/* Test Email Action & Status Feedback */}
          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {testStatus?.success ? (
                <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Test notification dispatched to {gmailConnector.getRecipient()} at {testStatus.timestamp}</span>
                </span>
              ) : testStatus?.error ? (
                <span className="text-rose-700 font-semibold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{testStatus.error}</span>
                </span>
              ) : (
                <span>Triggers automatically on unresolved failed picks and conflicting evidence.</span>
              )}
            </div>

            <button
              id="btn-send-test-email"
              disabled={isSendingTest}
              onClick={async () => {
                setIsSendingTest(true);
                try {
                  const res = await stockTraceNotifier.sendTestEmail();
                  setTestStatus(res);
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : 'Failed to send test email';
                  setTestStatus({
                    success: false,
                    recipient: gmailConnector.getRecipient(),
                    subject: 'Test Failed',
                    timestamp: new Date().toLocaleTimeString(),
                    error: msg,
                  });
                } finally {
                  setIsSendingTest(false);
                }
              }}
              className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl inline-flex items-center space-x-2 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
            >
              {isSendingTest ? (
                <span>Sending Test...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Send Test Escalation Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Optional Details behind button */}
      <div className="pt-2">
        <button
          id="btn-toggle-connection-details"
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <span>{showConfig ? 'Hide Details' : 'View Details'}</span>
          {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showConfig && (
          <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2 shadow-xs">
            <div className="font-bold text-slate-900 text-xs">System Connection Specifications</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[11px]">DC Node</span>
                <span className="font-mono font-bold text-slate-800">DC-BLR-01</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[11px]">Sync Mode</span>
                <span className="font-mono font-bold text-slate-800">Real-Time Event Stream</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[11px]">Health</span>
                <span className="font-mono font-bold text-emerald-700">All Nodes Active</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
