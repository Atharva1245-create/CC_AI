import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Trash2, 
  ArrowRight, 
  X, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  Database, 
  Search,
  BookOpen
} from 'lucide-react';
import { SavedSession } from '../types';

interface SavedSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSessions: SavedSession[];
  onRestoreSession: (session: SavedSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAllSessions: () => void;
}

export const SavedSessionsModal: React.FC<SavedSessionsModalProps> = ({
  isOpen,
  onClose,
  savedSessions,
  onRestoreSession,
  onDeleteSession,
  onClearAllSessions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredSessions = savedSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-[#0F1420] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-900/60">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-950/80 border border-indigo-500/40 rounded-xl text-indigo-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Chat History & Saved Sessions</span>
                  <span className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                    {savedSessions.length} Archived
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Past conversations, retrieved context ledger sources, and AI reasoning logs
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-800/60 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search past questions or saved context..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {savedSessions.length > 0 && (
              <button
                onClick={onClearAllSessions}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/50 border border-rose-900/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300">
                  {savedSessions.length === 0 ? "No Saved Chat Sessions Yet" : "No Sessions Match Search"}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When you click "Clear Chat", your current chat and its context ledger sources are automatically saved here so you can revisit them anytime.
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isExpanded = expandedSessionId === session.id;
                const assistantMsgs = session.messages.filter(m => m.role === 'assistant');
                const lastAssistantMsg = assistantMsgs[assistantMsgs.length - 1];

                return (
                  <div
                    key={session.id}
                    className="border border-slate-800/90 rounded-2xl bg-slate-900/50 hover:bg-slate-900/90 transition-all p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{session.messages.length} Messages</span>
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{session.timestamp}</span>
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white line-clamp-2">
                          {session.title}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-2">
                        {session.groundingScore !== undefined && (
                          <div className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/40 rounded-full text-xs text-emerald-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{session.groundingScore}% Verified</span>
                          </div>
                        )}

                        <button
                          onClick={() => onRestoreSession(session)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
                        >
                          <span>Restore</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteSession(session.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Preview Snippet */}
                    {lastAssistantMsg && (
                      <p className="text-xs text-slate-300 bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5 line-clamp-2">
                        <strong className="text-indigo-400">AI Summary: </strong>
                        {lastAssistantMsg.text}
                      </p>
                    )}

                    {/* Context Ledger Sources Preview Toggle */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <button
                        onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                        className="flex items-center space-x-1.5 text-slate-400 hover:text-indigo-300 transition-colors font-medium"
                      >
                        <Database className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {session.knowledgeArticles?.length || 0} Knowledge Sources Saved
                        </span>
                        <span className="text-[10px] underline ml-1">
                          {isExpanded ? "(Hide details)" : "(View sources)"}
                        </span>
                      </button>

                      <span className="text-[11px] text-slate-500">
                        ID: {session.id.slice(-8)}
                      </span>
                    </div>

                    {/* Expanded Article Sources */}
                    {isExpanded && session.knowledgeArticles && session.knowledgeArticles.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-2 space-y-2 border-t border-slate-800/60"
                      >
                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-indigo-400" />
                          <span>Saved Context Ledger Articles</span>
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {session.knowledgeArticles.map((art) => (
                            <div key={art.id} className="p-2 bg-slate-950 border border-slate-800/80 rounded-lg text-xs space-y-1">
                              <p className="font-semibold text-slate-200 line-clamp-1">{art.title}</p>
                              <p className="text-[11px] text-slate-400 line-clamp-2">{art.snippet}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
