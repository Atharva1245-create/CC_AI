import React from 'react';
import { 
  Trash2, 
  GitCommit, 
  Database, 
  LogOut, 
  UserCheck, 
  History
} from 'lucide-react';
import { UserProfile } from '../types';
import { CognitiveContextLogo } from './CognitiveContextLogo';

interface HeaderProps {
  onClearChat: () => void;
  onOpenHistory?: () => void;
  savedSessionsCount?: number;
  showReasoningFlow: boolean;
  setShowReasoningFlow: (val: boolean | ((prev: boolean) => boolean)) => void;
  showContextLedger: boolean;
  setShowContextLedger: (val: boolean | ((prev: boolean) => boolean)) => void;
  user: UserProfile;
  onToggleAuth: () => void;
  activeDomain: string;
  setActiveDomain: (domain: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onClearChat,
  onOpenHistory,
  savedSessionsCount = 0,
  showReasoningFlow,
  setShowReasoningFlow,
  showContextLedger,
  setShowContextLedger,
  user,
  onToggleAuth,
  activeDomain,
  setActiveDomain,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0A0D14]/90 backdrop-blur-md px-4 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Project Logo & Title */}
        <div className="flex items-center space-x-3">
          <CognitiveContextLogo className="h-9 sm:h-10" showText={true} />
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full ml-1">
            XAI v2.4
          </span>
        </div>

        {/* Center: Action Bar Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80 shadow-inner overflow-x-auto max-w-full shrink-0">
          <button
            onClick={() => setShowReasoningFlow((prev: boolean) => !prev)}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shrink-0 ${
              showReasoningFlow
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/40'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Toggle Visual XAI Reasoning Flowchart"
          >
            <GitCommit className="w-4 h-4" />
            <span className="hidden sm:inline">AI Reasoning Flow</span>
            {showReasoningFlow && (
              <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setShowContextLedger((prev: boolean) => !prev)}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shrink-0 ${
              showContextLedger
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/40'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Toggle Grounding Context Ledger Panel"
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Context Ledger</span>
          </button>

          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 hover:bg-indigo-950/60 border border-indigo-800/40 transition-all shrink-0"
              title="View Chat History & Saved Sessions"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span className="hidden md:inline">Saved Sessions</span>
              {savedSessionsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-indigo-500/30 text-indigo-200 rounded-full font-bold">
                  {savedSessionsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onClearChat}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition-all border border-transparent hover:border-rose-800/40 shrink-0"
            title="Clear active chat & reset context ledger (saves chat to history)"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Clear Chat</span>
          </button>
        </div>

        {/* Right: Domain Filter Indicator & Auth State */}
        <div className="flex items-center space-x-2">
          {/* Domain selector badge set to All Domains */}
          <div className="flex items-center space-x-2 bg-slate-900/90 text-slate-200 border border-slate-700/80 text-xs rounded-xl px-3 py-1.5 font-medium shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>All Domains</span>
          </div>

          {/* User Sign In / Profile status */}
          <div className="flex items-center pl-2 border-l border-slate-800 space-x-2">
            {user.isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 bg-indigo-950/40 border border-indigo-800/40 px-2.5 py-1 rounded-full text-xs text-indigo-200">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium hidden sm:inline">{user.name}</span>
                </div>
                <button
                  onClick={onToggleAuth}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onToggleAuth}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
