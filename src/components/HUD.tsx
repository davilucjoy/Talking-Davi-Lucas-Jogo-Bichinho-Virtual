/**
 * World-Matched, Low-Occlusion HUD & Collapsible Bottom Dock for Talking Davi Lucas.
 * Fully compliant with Three.js & Game Craft directives:
 * - >85% playfield unobstructed, pointer-events: none on wrapper
 * - No backdrop-filter over WebGL viewport (uses solid/rgba surfaces)
 * - Zero pulsating animated dots (static typography & icons)
 * - Collapsible bottom dock with keyboard shortcut 'H'
 */

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Shirt,
  Gamepad2,
  ChevronDown,
  ChevronUp,
  Pizza,
  Flame,
  Coffee,
  Sparkles,
  Music,
  Moon,
  Send,
  Zap,
  Bell,
  BellOff,
  BellRing,
  AlertTriangle,
} from 'lucide-react';
import { soundEngine } from '../game/audio';
import { NotificationStatus } from '../game/notifications';

interface HUDProps {
  coins: number;
  moodJoy: number;
  moodHunger: number;
  moodEnergy: number;
  onFeed: (food: 'pizza' | 'chili' | 'boba' | 'lemon' | 'potion') => void;
  onAction: (act: 'guitar' | 'disco' | 'fart' | 'sleep') => void;
  onOpenWardrobe: () => void;
  onOpenMiniGames: () => void;
  onSpeakText: (text: string) => void;
  isSleeping: boolean;
  isRecording: boolean;
  onToggleRecord: () => void;
  notificationStatus: NotificationStatus;
  onRequestNotification: () => void;
  lowStatAlert: { type: 'hunger' | 'energy'; value: number } | null;
}

export const HUD: React.FC<HUDProps> = ({
  coins,
  moodJoy,
  moodHunger,
  moodEnergy,
  onFeed,
  onAction,
  onOpenWardrobe,
  onOpenMiniGames,
  onSpeakText,
  isSleeping,
  isRecording,
  onToggleRecord,
  notificationStatus,
  onRequestNotification,
  lowStatAlert,
}) => {
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'actions' | 'talk'>('feed');
  const [customText, setCustomText] = useState('');

  // Keyboard shortcut 'H' to toggle dock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'h' || e.key === 'H') {
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleSendCustomText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    onSpeakText(customText.trim());
    setCustomText('');
  };

  const funnyPhrases = [
    "I'm Davi Lucas!",
    'Give me pizza!',
    "Don't touch my belly!",
    "Let's dance disco!",
    'Check out my cool kicks!',
    'That chili was too spicy!',
  ];

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* Top Perimeter Status Cluster */}
      <div className="flex items-start justify-between w-full pointer-events-none">
        {/* Top-Left: Davi Status & Coins */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Brand & Coin cluster */}
          <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-inner">
              DL
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">Davi Lucas</span>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-extrabold tabular-nums">
                <span>🪙</span>
                <span>{coins.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Stat meters */}
          <div className="flex flex-col gap-1.5 px-3 py-2 rounded-xl bg-slate-900/85 border border-slate-800 shadow-lg text-[11px] w-40 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>😄</span> Joy
              </span>
              <span className="font-bold text-sky-400 tabular-nums">{moodJoy}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-sky-400 transition-all duration-300" style={{ width: `${moodJoy}%` }} />
            </div>

            <div className="flex items-center justify-between mt-0.5">
              <span className="flex items-center gap-1">
                <span>🍕</span> Hunger
              </span>
              <span className="font-bold text-amber-400 tabular-nums">{moodHunger}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${moodHunger}%` }} />
            </div>

            <div className="flex items-center justify-between mt-0.5">
              <span className="flex items-center gap-1">
                <span>⚡</span> Energy
              </span>
              <span className="font-bold text-emerald-400 tabular-nums">{moodEnergy}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${moodEnergy}%` }} />
            </div>
          </div>
        </div>

        {/* Top-Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Browser Notification Reminders Bell */}
          <button
            onClick={onRequestNotification}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 border cursor-pointer ${
              notificationStatus === 'granted'
                ? 'bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border-emerald-500/40'
                : notificationStatus === 'denied'
                ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-500 border-slate-700'
                : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/50'
            }`}
            title={
              notificationStatus === 'granted'
                ? 'Notifications Active: Davi will remind you if hunger or energy drops low!'
                : notificationStatus === 'denied'
                ? 'Notifications Blocked in Browser Settings'
                : 'Enable Reminders: Get notified when Davi is hungry or tired!'
            }
          >
            {notificationStatus === 'granted' ? (
              <BellRing className="w-4 h-4 text-emerald-400" />
            ) : notificationStatus === 'denied' ? (
              <BellOff className="w-4 h-4 text-slate-500" />
            ) : (
              <Bell className="w-4 h-4 text-amber-400" />
            )}
            <span className="hidden md:inline">
              {notificationStatus === 'granted'
                ? 'ALERTS ON'
                : notificationStatus === 'denied'
                ? 'ALERTS OFF'
                : 'REMINDERS'}
            </span>
          </button>

          {/* Mini-Games Launcher */}
          <button
            onClick={onOpenMiniGames}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 border border-purple-400/30 cursor-pointer"
            title="Play Mini-Games"
          >
            <Gamepad2 className="w-4 h-4" />
            <span className="hidden sm:inline">ARCADE</span>
          </button>

          {/* Closet / Wardrobe */}
          <button
            onClick={onOpenWardrobe}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-xs shadow-lg transition-all active:scale-95 border border-slate-700 cursor-pointer"
            title="Custom Outfits & Hats"
          >
            <Shirt className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">CLOSET</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 shadow-lg transition-all active:scale-95 border border-slate-700 cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Low Stat Alert Banner (When Hunger or Energy is Critical) */}
      {lowStatAlert && (
        <div className="mx-auto mt-2 pointer-events-auto">
          <button
            onClick={() => {
              if (lowStatAlert.type === 'hunger') {
                setActiveTab('feed');
                onFeed('pizza');
              } else {
                setActiveTab('actions');
                onAction('sleep');
              }
            }}
            className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-950/90 border border-amber-500/60 text-amber-200 text-xs font-bold shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {lowStatAlert.type === 'hunger'
                ? `🍕 Davi's hunger is low (${lowStatAlert.value}%)! Tap to feed him pizza!`
                : `💤 Davi is exhausted (${lowStatAlert.value}%)! Tap to give him a nap!`}
            </span>
          </button>
        </div>
      )}

      {/* Unified Bottom Control Dock */}
      <div
        className={`pointer-events-auto transition-transform duration-300 ease-out flex flex-col items-center mx-auto w-full max-w-xl pb-1 ${
          isCollapsed ? 'translate-y-[calc(100%-38px)]' : 'translate-y-0'
        }`}
      >
        {/* Dock Drawer Collapse / Expand Tab */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-4 py-1 rounded-t-xl bg-slate-900/95 border-t border-x border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white shadow-xl cursor-pointer"
        >
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isCollapsed ? '▴ Show Controls' : '▾ Hide Controls (H)'}</span>
        </button>

        {/* Main Dock Container */}
        <div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 shadow-2xl">
          {/* Tab Selection */}
          <div className="flex items-center justify-between gap-1 mb-2.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'feed'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Pizza className="w-3.5 h-3.5" />
              <span>FEED</span>
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'actions'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>ACTIONS</span>
            </button>

            <button
              onClick={() => setActiveTab('talk')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'talk'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>VOICE</span>
            </button>
          </div>

          {/* Tab 1: Food Tray */}
          {activeTab === 'feed' && (
            <div className="grid grid-cols-5 gap-2">
              <button
                onClick={() => onFeed('pizza')}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-slate-100 transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🍕</span>
                <span className="text-[10px] font-bold mt-1 text-slate-300">Pizza</span>
              </button>

              <button
                onClick={() => onFeed('chili')}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-red-900/60 text-slate-100 transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🌶️</span>
                <span className="text-[10px] font-bold mt-1 text-red-400">Hot Chili</span>
              </button>

              <button
                onClick={() => onFeed('boba')}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-slate-100 transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🧋</span>
                <span className="text-[10px] font-bold mt-1 text-amber-300">Boba Tea</span>
              </button>

              <button
                onClick={() => onFeed('lemon')}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-slate-100 transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🍋</span>
                <span className="text-[10px] font-bold mt-1 text-yellow-300">Sour Lemon</span>
              </button>

              <button
                onClick={() => onFeed('potion')}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-slate-100 transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🧪</span>
                <span className="text-[10px] font-bold mt-1 text-purple-300">Super Potion</span>
              </button>
            </div>
          )}

          {/* Tab 2: Fun Actions */}
          {activeTab === 'actions' && (
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => onAction('guitar')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-purple-500/30 text-slate-100 transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🎸</span>
                <span className="text-[11px] font-bold mt-1 text-purple-300">Rock Solo</span>
              </button>

              <button
                onClick={() => onAction('disco')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-pink-500/30 text-slate-100 transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🕺</span>
                <span className="text-[11px] font-bold mt-1 text-pink-300">Disco Fever</span>
              </button>

              <button
                onClick={() => onAction('fart')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-lime-500/30 text-slate-100 transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">💨</span>
                <span className="text-[11px] font-bold mt-1 text-lime-400">Whoopee Fart</span>
              </button>

              <button
                onClick={() => onAction('sleep')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-slate-100 transition-all active:scale-95 cursor-pointer group ${
                  isSleeping
                    ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                    : 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700 text-slate-300'
                }`}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{isSleeping ? '⏰' : '💤'}</span>
                <span className="text-[11px] font-bold mt-1">{isSleeping ? 'Wake Up!' : 'Nap Time'}</span>
              </button>
            </div>
          )}

          {/* Tab 3: Voice Repeater */}
          {activeTab === 'talk' && (
            <div className="flex flex-col gap-2">
              {/* Push-to-Talk Record Button & Status */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleRecord}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-red-600 text-white border border-red-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-red-400" />}
                  <span>{isRecording ? 'RECORDING... (Tap to Repeat)' : 'TAP TO RECORD VOICE'}</span>
                </button>
              </div>

              {/* Quick Quotes Row */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {funnyPhrases.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSpeakText(phrase)}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-medium text-slate-200 transition-all active:scale-95 cursor-pointer"
                  >
                    "{phrase}"
                  </button>
                ))}
              </div>

              {/* Custom Phrase Form */}
              <form onSubmit={handleSendCustomText} className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Type anything for Davi to say..."
                  maxLength={60}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!customText.trim()}
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-all cursor-pointer"
                  title="Make Davi Speak"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
