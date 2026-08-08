import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const CognitiveContextLogo: React.FC<LogoProps> = ({ 
  className = "h-9", 
  showText = true 
}) => {
  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* Shield & Circuit Hexagon Symbol */}
      <div className="relative flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10">
        <svg 
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(6,182,212,0.45)]"
        >
          <defs>
            <linearGradient id="shieldGrad" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00d2ff" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>

            <linearGradient id="hexGrad" x1="50" y1="50" x2="150" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Left Circuit Traces */}
          <path d="M 50 100 L 15 100 M 50 75 L 25 75 L 10 75 M 50 125 L 25 125 L 10 125" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
          <circle cx="10" cy="75" r="4" fill="#38bdf8" />
          <circle cx="10" cy="125" r="4" fill="#a855f7" />
          <rect x="2" y="96" width="8" height="8" fill="#38bdf8" rx="1" />

          {/* Right Circuit Traces */}
          <path d="M 150 100 L 185 100 M 150 75 L 175 75 L 190 75 M 150 125 L 175 125 L 190 125" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
          <circle cx="190" cy="75" r="4" fill="#38bdf8" />
          <circle cx="190" cy="125" r="4" fill="#a855f7" />
          <rect x="190" y="96" width="8" height="8" fill="#a855f7" rx="1" />

          {/* Outer Shield Border */}
          <path 
            d="M 100 22 L 165 48 C 165 110 140 155 100 178 C 60 155 35 110 35 48 Z" 
            stroke="url(#shieldGrad)" 
            strokeWidth="9" 
            strokeLinejoin="round"
            fill="none"
          />

          {/* Inner Hexagon Network */}
          <path 
            d="M 100 52 L 138 74 L 138 118 L 100 140 L 62 118 L 62 74 Z" 
            stroke="url(#hexGrad)" 
            strokeWidth="5" 
            fill="#060913" 
            fillOpacity="0.8"
          />

          {/* Hexagon Connector Lines to Center */}
          <line x1="100" y1="52" x2="100" y2="96" stroke="#38bdf8" strokeWidth="3" opacity="0.7" />
          <line x1="138" y1="74" x2="100" y2="96" stroke="#38bdf8" strokeWidth="3" opacity="0.7" />
          <line x1="138" y1="118" x2="100" y2="96" stroke="#8b5cf6" strokeWidth="3" opacity="0.7" />
          <line x1="100" y1="140" x2="100" y2="96" stroke="#8b5cf6" strokeWidth="3" opacity="0.7" />
          <line x1="62" y1="118" x2="100" y2="96" stroke="#38bdf8" strokeWidth="3" opacity="0.7" />
          <line x1="62" y1="74" x2="100" y2="96" stroke="#38bdf8" strokeWidth="3" opacity="0.7" />

          {/* Hexagon Corner Nodes */}
          <circle cx="100" cy="52" r="7" fill="#00d2ff" />
          <circle cx="138" cy="74" r="7" fill="#38bdf8" />
          <circle cx="138" cy="118" r="7" fill="#3b82f6" />
          <circle cx="100" cy="140" r="7" fill="#8b5cf6" />
          <circle cx="62" cy="118" r="7" fill="#00d2ff" />
          <circle cx="62" cy="74" r="7" fill="#38bdf8" />

          {/* Center Circle Badge with Checkmark */}
          <circle cx="100" cy="96" r="16" fill="#030712" stroke="#38bdf8" strokeWidth="3.5" />
          <path 
            d="M 92 96 L 97 101 L 109 89" 
            stroke="#22d3ee" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex items-center space-x-2">
          <div className="flex flex-col leading-none">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-black tracking-wider text-white uppercase font-sans">
                COGNITIVE
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-black tracking-widest bg-gradient-to-r from-cyan-400 via-indigo-200 to-purple-300 bg-clip-text text-transparent bg-indigo-950/90 border border-indigo-500/50 rounded-md font-mono uppercase shadow-sm">
                CC AI
              </span>
            </div>
            <span className="text-[11px] font-bold tracking-widest text-slate-300 uppercase font-sans mt-0.5">
              CONTEXT
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
