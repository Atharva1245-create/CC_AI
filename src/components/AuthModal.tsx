import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Sparkles, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  KeyRound, 
  AlertCircle,
  Bot,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { CognitiveContextLogo } from './CognitiveContextLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInSuccess: (userData: { email: string; name: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSignInSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    // Password must be exactly 8 numeric or alphabetic characters
    if (password.length !== 8) {
      setError('Password must be exactly 8 numeric or alphabetic characters (e.g. A1b2C3d4).');
      return;
    }

    const isAlphanumeric8 = /^[a-zA-Z0-9]{8}$/.test(password);
    if (!isAlphanumeric8) {
      setError('Password must contain only letters and numbers (A-Z, a-z, 0-9).');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const usernamePart = email.split('@')[0];
      const formattedName = usernamePart
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase()) || 'User';

      onSignInSuccess({
        email,
        name: formattedName
      });
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-xl my-auto p-3 sm:p-5 text-slate-100 flex flex-col items-center"
      >
        {/* Background Glowing Portal Circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/25 rounded-full blur-[110px] pointer-events-none animate-pulse" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/25 rounded-full blur-[90px] pointer-events-none" />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:right-4 z-30 text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 p-2.5 rounded-full border border-slate-700/80 transition-all text-xs font-bold shadow-xl cursor-pointer"
          title="Close Dialog"
        >
          ✕
        </button>

        {/* TOP CENTER ANIMATED PROJECT LOGO */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center mb-5 relative z-30 text-center"
        >
          <div className="relative p-3.5 px-6 rounded-2xl bg-slate-900/90 border-2 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.4)] backdrop-blur-xl">
            <motion.div
              animate={{ 
                scale: [1, 1.04, 1],
                filter: [
                  'drop-shadow(0 0 12px rgba(56, 189, 248, 0.6))',
                  'drop-shadow(0 0 24px rgba(139, 92, 246, 0.9))',
                  'drop-shadow(0 0 12px rgba(56, 189, 248, 0.6))'
                ]
              }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <CognitiveContextLogo className="h-12 sm:h-16" showText={true} />
            </motion.div>
          </div>
          <span className="mt-2.5 text-[11px] font-black tracking-widest text-indigo-300 uppercase bg-indigo-950/90 px-3.5 py-1 rounded-full border border-indigo-500/40 shadow-lg">
            COGNITIVE CONTEXT AI • AUTHORIZATION PORTAL
          </span>
        </motion.div>

        {/* CHATBOT ROBOT CHARACTER HOLDING LOGIN FORM IN HANDS */}
        <div className="relative w-full flex flex-col items-center z-20">
          
          {/* Animated 3D-Styled Chatbot Robot Graphic */}
          <motion.div 
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="relative -mb-10 z-30 flex flex-col items-center pointer-events-none"
          >
            {/* Robot Head & Body SVG */}
            <div className="w-32 h-32 sm:w-36 sm:h-36 relative filter drop-shadow-[0_0_25px_rgba(56,189,248,0.7)]">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Antenna */}
                <line x1="100" y1="20" x2="100" y2="45" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
                <circle cx="100" cy="16" r="8" fill="#00d2ff" className="animate-pulse" />
                <circle cx="100" cy="16" r="12" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.6" />

                {/* Robot Ears */}
                <rect x="35" y="65" width="12" height="24" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <rect x="153" y="65" width="12" height="24" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />

                {/* Head Shell */}
                <rect x="45" y="45" width="110" height="75" rx="22" fill="#0f172a" stroke="#6366f1" strokeWidth="4" />

                {/* Digital Visor / Screen */}
                <rect x="58" y="58" width="84" height="48" rx="14" fill="#020617" stroke="#38bdf8" strokeWidth="2.5" />

                {/* Glowing Robot Eyes */}
                <circle cx="82" cy="80" r="10" fill="#00d2ff" />
                <circle cx="82" cy="80" r="4" fill="#ffffff" />
                <circle cx="118" cy="80" r="10" fill="#00d2ff" />
                <circle cx="118" cy="80" r="4" fill="#ffffff" />

                {/* Friendly Digital Smile / Data Wave */}
                <path d="M 85 93 Q 100 102 115 93" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" />

                {/* Neck & Shoulders */}
                <rect x="85" y="120" width="30" height="15" fill="#334155" rx="3" />

                {/* Robot Torso */}
                <path d="M 55 135 L 145 135 L 135 180 L 65 180 Z" fill="#0f172a" stroke="#6366f1" strokeWidth="3" />
                <circle cx="100" cy="155" r="12" fill="#030712" stroke="#00d2ff" strokeWidth="2" />
                <path d="M 94 155 L 98 159 L 106 151" stroke="#00d2ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Speech Bubble */}
            <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border border-cyan-500/60 px-3.5 py-1.5 rounded-full text-[11px] font-black text-cyan-300 shadow-xl shadow-cyan-500/20 -mt-2 mb-2 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-cyan-400 animate-bounce" />
              <span>Hello! I'm holding your secure login form:</span>
            </div>
          </motion.div>

          {/* THE LOGIN FORM CARD HELD BY THE ROBOT'S MECHANICAL ARMS */}
          <div className="relative w-full max-w-md">
            
            {/* Robot Left Arm / Hand holding the card */}
            <div className="hidden sm:block absolute -left-9 top-12 z-20 pointer-events-none filter drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">
              <svg width="45" height="100" viewBox="0 0 45 100" fill="none">
                <path d="M 5 10 C -12 40, 10 75, 36 80" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" fill="none" />
                <circle cx="36" cy="80" r="8" fill="#020617" stroke="#38bdf8" strokeWidth="3" />
                <path d="M 32 72 C 40 72, 44 80, 38 88" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" fill="none" />
              </svg>
            </div>

            {/* Robot Right Arm / Hand holding the card */}
            <div className="hidden sm:block absolute -right-9 top-12 z-20 pointer-events-none filter drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">
              <svg width="45" height="100" viewBox="0 0 45 100" fill="none">
                <path d="M 40 10 C 57 40, 35 75, 9 80" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" fill="none" />
                <circle cx="9" cy="80" r="8" fill="#020617" stroke="#38bdf8" strokeWidth="3" />
                <path d="M 13 72 C 5 72, 1 80, 7 88" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" fill="none" />
              </svg>
            </div>

            {/* Main Glassmorphism Form Card Container */}
            <div className="bg-[#0A0E1A]/95 border-2 border-indigo-500/60 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(99,102,241,0.3)] backdrop-blur-2xl relative z-10 space-y-5">
              
              {/* Card Header */}
              <div className="text-center space-y-1">
                <h3 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span>Cognitive Context Login</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Enter email & exactly 8 alphanumeric characters password
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 rounded-xl bg-rose-950/90 border border-rose-700 text-rose-200 text-xs flex items-center gap-2 shadow-lg"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-[10px] text-indigo-400">Required</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@cognitivecontext.ai"
                      className="w-full bg-slate-950/90 border border-slate-700/80 text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Password (Exactly 8 Alphanumeric Chars)</span>
                    <span className={`text-[10px] font-mono font-bold ${password.length === 8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {password.length}/8 chars
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      maxLength={8}
                      value={password}
                      onChange={(e) => {
                        // Filter out non-alphanumeric characters and cap length at 8
                        const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
                        setPassword(cleaned);
                      }}
                      placeholder="e.g. Pass1234"
                      className="w-full bg-slate-950/90 border border-slate-700/80 text-xs sm:text-sm rounded-xl pl-10 pr-10 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Strict Security Guard: Password must be exactly 8 letters or numbers.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-600/40 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit & Access Workspace</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-800/80 text-center">
                <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>8-Character Alphanumeric Authentication Guard</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

