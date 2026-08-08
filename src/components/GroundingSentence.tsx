import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck, FileText, Info } from 'lucide-react';
import { SentenceGrounding } from '../types';

interface GroundingSentenceProps {
  grounding: SentenceGrounding;
  onSelectSource?: (sourceId: string) => void;
}

export const GroundingSentence: React.FC<GroundingSentenceProps> = ({
  grounding,
  onSelectSource,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);

  const isGrounded = grounding.score >= 70;

  // Highlight style based on overlap score
  const highlightClass = isGrounded
    ? 'bg-emerald-950/60 text-emerald-100 border-b-2 border-emerald-500/80 hover:bg-emerald-900/80 hover:shadow-emerald-500/20'
    : 'bg-amber-950/60 text-amber-100 border-b-2 border-amber-500/80 hover:bg-amber-900/80 hover:shadow-amber-500/20';

  return (
    <span className="relative inline-block my-0.5 mx-0.5 group">
      {/* Highlighted Sentence Span */}
      <span
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsOpenModal(true)}
        className={`px-1.5 py-0.5 rounded transition-all duration-200 cursor-pointer text-sm sm:text-base leading-relaxed ${highlightClass}`}
      >
        {grounding.text}{' '}
        <span
          className={`inline-flex items-center align-middle ml-1 px-1 py-0.2 rounded text-[10px] font-bold ${
            isGrounded
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}
        >
          {grounding.score}%
        </span>
      </span>

      {/* Glassmorphism Hover Card / Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 sm:w-80 p-3.5 bg-[#0D121E]/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl text-xs text-slate-200 pointer-events-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center space-x-1.5">
                {isGrounded ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                <span className="font-bold text-slate-100">
                  {isGrounded ? 'Direct Grounding Match' : 'General Inference'}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isGrounded
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {grounding.score}% Overlap
              </span>
            </div>

            {/* Core Tooltip Text Prompt Requirement */}
            <p className="text-xs font-semibold text-cyan-300 mb-2">
              Verified via Grounding Engine: {grounding.score}% Entity Overlap with Knowledge Base.
            </p>

            {/* Matched Source Name */}
            {grounding.matchedSourceName && (
              <div className="mb-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Source Reference:
                </span>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-slate-200 flex items-center gap-1 min-w-0">
                    <FileText className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="truncate">{grounding.matchedSourceName}</span>
                  </span>
                  {grounding.matchedSourceUrl && (
                    <a
                      href={grounding.matchedSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/80 shrink-0"
                    >
                      <span>Link</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Overlapping Entity Keywords */}
            {grounding.overlappingKeywords && grounding.overlappingKeywords.length > 0 && (
              <div className="mb-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold mb-1">
                  Matched Entity Keywords:
                </span>
                <div className="flex flex-wrap gap-1">
                  {grounding.overlappingKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 text-[10px]"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Snippet quote preview */}
            {grounding.matchedSourceSnippet && (
              <div className="mt-2 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 italic block line-clamp-2">
                  "{grounding.matchedSourceSnippet}"
                </span>
              </div>
            )}

            {/* Pointer arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#0D121E]"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Inspection Modal when sentence clicked */}
      <AnimatePresence>
        {isOpenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0D121E] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-200 relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">Sentence Grounding Inspection</h3>
                </div>
                <button
                  onClick={() => setIsOpenModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold px-2"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Sentence analyzed */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs uppercase text-slate-400 font-bold block mb-1">
                    Analyzed Claim Sentence:
                  </span>
                  <p className="text-sm font-medium text-slate-100">{grounding.text}</p>
                </div>

                {/* Score & Verification */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Overlap Match Score</span>
                    <span className={`text-xl font-bold ${isGrounded ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {grounding.score}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Grounding Status</span>
                    <span className={`text-sm font-semibold ${isGrounded ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isGrounded ? 'Factually Verified' : 'Inferred Context'}
                    </span>
                  </div>
                </div>

                {/* Source details */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 font-bold block">
                      Matched Knowledge Source:
                    </span>
                    {grounding.matchedSourceUrl && (
                      <a
                        href={grounding.matchedSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline bg-blue-950/60 border border-blue-800/60 px-2.5 py-1 rounded-lg"
                      >
                        <span>Open Document</span>
                        <ExternalLink className="w-3 h-3 text-blue-400" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-indigo-300 mb-2">
                    {grounding.matchedSourceName}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    {grounding.matchedSourceSnippet}
                  </p>
                </div>

                {/* Overlapping Entity Keywords */}
                {grounding.overlappingKeywords && grounding.overlappingKeywords.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-400 font-bold block mb-1.5">
                      Intersecting Vocabulary & Entities:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {grounding.overlappingKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-xs font-mono"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </span>
  );
};
