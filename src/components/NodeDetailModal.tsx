import React from 'react';
import { motion } from 'motion/react';
import { Terminal, Clock, ShieldCheck, Cpu, Database, CheckCircle, FileText } from 'lucide-react';
import { PipelineLog } from '../types';

interface CustomDetail {
  title: string;
  parentBranch?: string;
  description?: string;
  latencyMs?: number;
  status?: string;
  metrics?: { label: string; value: string; color?: string }[];
  payload?: any;
}

interface NodeDetailModalProps {
  log: PipelineLog | null;
  customDetail?: CustomDetail;
  onClose: () => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({ log, customDetail, onClose }) => {
  if (!log && !customDetail) return null;

  const title = customDetail?.title || log?.nodeTitle || 'Process Telemetry';
  const parentBranch = customDetail?.parentBranch;
  const description = customDetail?.description;
  const latencyMs = customDetail?.latencyMs ?? log?.latencyMs ?? 0;
  const status = customDetail?.status || log?.status || 'completed';
  const payload = customDetail?.payload || log?.details;
  const metrics = customDetail?.metrics;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#0E131F] border border-indigo-500/40 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl text-slate-200 relative my-auto max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3.5 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              {parentBranch && (
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
                  {parentBranch} Branch Process
                </span>
              )}
              <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                {title} Detail Page
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white bg-slate-900 p-2 rounded-full border border-slate-800 transition-all text-xs font-bold shrink-0"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
          {description && (
            <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                Process Objective & Scope
              </span>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Latency</span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-400 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> {latencyMs} ms
              </span>
            </div>

            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Status</span>
              <span className="text-sm sm:text-base font-extrabold text-indigo-300 uppercase mt-1 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-400" /> {status}
              </span>
            </div>

            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Verification</span>
              <span className="text-sm sm:text-base font-extrabold text-cyan-300 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Pass Audit
              </span>
            </div>
          </div>

          {metrics && metrics.length > 0 && (
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Telemetry Key Metrics
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {metrics.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-medium">{m.label}:</span>
                    <span className={`text-xs font-mono font-extrabold ${m.color || 'text-indigo-300'}`}>
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Payload Output */}
          {payload && (
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Raw Operational Payload & Audit Logs
                </span>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                  JSON Telemetry
                </span>
              </div>
              <pre className="text-[11px] font-mono text-cyan-300 overflow-x-auto p-3 bg-slate-900 rounded-xl border border-slate-800/80 max-h-56 leading-snug">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Close Detail Page
          </button>
        </div>
      </motion.div>
    </div>
  );
};
