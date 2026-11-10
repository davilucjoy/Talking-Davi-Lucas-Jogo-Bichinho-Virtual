/**
 * Title Screen for Talking Davi Lucas.
 * Features bespoke inline SVG title lockup, 30-40% negative space,
 * primary start CTA (Space/Enter to start), and flat control-hint line.
 */

import React, { useEffect } from 'react';
import { Play, Sparkles, Volume2, Mic, Bell, BellRing } from 'lucide-react';
import { NotificationStatus } from '../game/notifications';

interface TitleScreenProps {
  onStart: () => void;
  coins: number;
  notificationStatus: NotificationStatus;
  onRequestNotification: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  coins,
  notificationStatus,
  onRequestNotification,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 md:p-10 pointer-events-none select-none text-white">
      {/* Top Header Cluster */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">Virtual 3D Character</span>
          </div>

          <button
            onClick={onRequestNotification}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-lg active:scale-95 ${
              notificationStatus === 'granted'
                ? 'bg-slate-900/80 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50'
            }`}
            title="Enable hunger and energy reminders"
          >
            {notificationStatus === 'granted' ? (
              <BellRing className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Bell className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{notificationStatus === 'granted' ? 'Reminders Active' : 'Enable Reminders'}</span>
          </button>
        </div>

        {coins > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/40 shadow-lg text-amber-400 font-bold text-sm tabular-nums">
            <span>🪙</span>
            <span>{coins}</span>
          </div>
        )}
      </div>

      {/* Hero Center Title Lockup */}
      <div className="flex flex-col items-center justify-center my-auto text-center">
        {/* Bespoke Inline SVG Title Lockup */}
        <div className="w-full max-w-xl mx-auto drop-shadow-2xl">
          <svg viewBox="0 0 600 160" className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.6" />
              </filter>
            </defs>

            {/* Sub-banner: TALKING */}
            <text
              x="300"
              y="48"
              textAnchor="middle"
              fill="url(#goldGrad)"
              fontSize="34"
              fontWeight="900"
              fontFamily="Impact, sans-serif"
              letterSpacing="6"
              filter="url(#glow)"
            >
              ★ TALKING ★
            </text>

            {/* Main title: DAVI LUCAS */}
            <text
              x="300"
              y="126"
              textAnchor="middle"
              fill="url(#titleGrad)"
              stroke="#0f172a"
              strokeWidth="10"
              paintOrder="stroke fill"
              fontSize="82"
              fontWeight="900"
              fontFamily="'Arial Black', sans-serif"
              letterSpacing="3"
              filter="url(#glow)"
            >
              DAVI LUCAS
            </text>
          </svg>
        </div>

        <p className="mt-3 text-slate-300 text-sm md:text-base max-w-md mx-auto font-medium drop-shadow">
          Your interactive virtual buddy. Poke, tickle, feed spicy chili, dance, and repeat your voice in real time!
        </p>

        {/* Start Game CTA Button */}
        <div className="mt-8 pointer-events-auto">
          <button
            onClick={onStart}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 text-white font-extrabold text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
          >
            <Play className="w-6 h-6 fill-white text-white group-hover:translate-x-0.5 transition-transform" />
            <span>START PLAYING</span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs bg-black/30 rounded-md font-mono border border-white/10">
              SPACE
            </span>
          </button>
        </div>
      </div>

      {/* Flat Control-Hint Line & Footer */}
      <div className="flex flex-col items-center justify-center gap-2 text-center pb-2">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-4 py-2 rounded-xl bg-slate-900/85 border border-slate-700/60 text-xs sm:text-sm text-slate-300 shadow-md">
          <span className="inline-flex items-center gap-1 font-semibold text-sky-400">
            <span>🖱️</span> Click & Drag to Interact
          </span>
          <span className="text-slate-600">·</span>
          <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
            <Mic className="w-3.5 h-3.5" /> Mic / Quotes to Talk
          </span>
          <span className="text-slate-600">·</span>
          <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
            <span>🍕</span> Feed & Mini-Games
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Tip: Tap Davi's head to slap, belly to tickle, or feet to make him hop!
        </span>
      </div>
    </div>
  );
};
