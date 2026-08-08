import React from 'react';
import { motion } from 'motion/react';
import { Lock, ShieldAlert, CheckCircle2, EyeOff } from 'lucide-react';
import { Message } from '../types';

interface PIIAuditModalProps {
  message: Message | null;
  onClose: () => void;
}

export const PIIAuditModal: React.FC<PIIAuditModalProps> = ({ message, onClose }) => {
  if (!message || !message.piiDetections) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0E131F] border border-rose-800/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-200 relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-rose-400">
            <Lock className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">PII Shielding Audit Report</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold px-2">
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-200 leading-relaxed">
            CC AI's PII Shielding Engine intercepted the user prompt before sending it to the LLM model. Sensitive credentials and personally identifiable information were anonymized with zero-knowledge token placeholders.
          </div>

          <div>
            <span className="font-bold text-slate-300 block mb-2">Anonymized Entities Log ({message.piiDetections.length}):</span>
            <div className="space-y-2">
              {message.piiDetections.map((pii, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] uppercase font-mono text-rose-400 font-bold block">
                      Type: {pii.type}
                    </span>
                    <span className="text-slate-400 line-through mr-2">{pii.original}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-rose-950 text-rose-300 border border-rose-800 rounded-lg font-mono text-xs font-bold">
                    {pii.masked}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {message.piiShieldedText && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="font-bold text-slate-400 block mb-1">Sanitized Prompt Sent to Gemini:</span>
              <p className="text-slate-300 font-mono text-[11px] leading-relaxed bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {message.piiShieldedText}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold"
          >
            Close Audit
          </button>
        </div>
      </motion.div>
    </div>
  );
};
