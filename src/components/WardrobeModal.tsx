/**
 * Wardrobe & Closet Customizer for Talking Davi Lucas.
 * Customize hats, shades, outfit color, and room wallpaper themes.
 */

import React, { useState } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { WardrobeHat, WardrobeGlasses } from '../game/character';

interface WardrobeModalProps {
  currentHat: WardrobeHat;
  currentGlasses: WardrobeGlasses;
  currentOutfitColor: string;
  currentRoomTheme: string;
  coins: number;
  onSelectHat: (hat: WardrobeHat) => void;
  onSelectGlasses: (glasses: WardrobeGlasses) => void;
  onSelectOutfitColor: (hex: string) => void;
  onSelectRoomTheme: (theme: string) => void;
  onClose: () => void;
}

export const WardrobeModal: React.FC<WardrobeModalProps> = ({
  currentHat,
  currentGlasses,
  currentOutfitColor,
  currentRoomTheme,
  onSelectHat,
  onSelectGlasses,
  onSelectOutfitColor,
  onSelectRoomTheme,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<'hats' | 'glasses' | 'outfits' | 'room'>('hats');

  const hatsList: { id: WardrobeHat; label: string; icon: string }[] = [
    { id: 'snapback', label: 'Street Snapback', icon: '🧢' },
    { id: 'crown', label: 'Royal Crown', icon: '👑' },
    { id: 'beanie', label: 'Emerald Beanie', icon: '🧶' },
    { id: 'cyber', label: 'Cyber Visor', icon: '🥽' },
    { id: 'bunny', label: 'Bunny Ears', icon: '🐰' },
    { id: 'none', label: 'No Hat', icon: '❌' },
  ];

  const glassesList: { id: WardrobeGlasses; label: string; icon: string }[] = [
    { id: 'none', label: 'No Glasses', icon: '❌' },
    { id: 'thug', label: 'Pixel Thug Shades', icon: '🕶️' },
    { id: 'goggles', label: 'Steampunk Goggles', icon: '🥽' },
    { id: 'heart', label: 'Pink Heart Shades', icon: '💖' },
  ];

  const outfitsList: { color: string; label: string }[] = [
    { color: '#2563eb', label: 'Royal Blue Street' },
    { color: '#dc2626', label: 'Crimson Fire' },
    { color: '#10b981', label: 'Neon Emerald' },
    { color: '#f59e0b', label: 'Golden Luxe' },
    { color: '#9333ea', label: 'Cyber Violet' },
    { color: '#0f172a', label: 'Midnight Stealth' },
  ];

  const roomList: { id: string; label: string; icon: string }[] = [
    { id: 'studio', label: 'Studio Penthouse', icon: '🏢' },
    { id: 'disco', label: 'Neon Disco Lounge', icon: '🪩' },
    { id: 'cyber', label: 'Cyber Tech Lab', icon: '⚡' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧢</span>
            <div>
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider">Davi's Closet</h2>
              <p className="text-xs text-slate-400">Dress up Davi Lucas & customize his room</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-1.5 my-3 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveCategory('hats')}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeCategory === 'hats' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            HATS
          </button>
          <button
            onClick={() => setActiveCategory('glasses')}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeCategory === 'glasses' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            GLASSES
          </button>
          <button
            onClick={() => setActiveCategory('outfits')}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeCategory === 'outfits' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            HOODIE
          </button>
          <button
            onClick={() => setActiveCategory('room')}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeCategory === 'room' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ROOM
          </button>
        </div>

        {/* Scrollable Category Options */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* Hats */}
          {activeCategory === 'hats' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {hatsList.map((hat) => {
                const isSelected = currentHat === hat.id;
                return (
                  <button
                    key={hat.id}
                    onClick={() => onSelectHat(hat.id)}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <span className="text-3xl mb-1.5">{hat.icon}</span>
                    <span className="text-xs font-bold text-center">{hat.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Glasses */}
          {activeCategory === 'glasses' && (
            <div className="grid grid-cols-2 gap-2.5">
              {glassesList.map((glass) => {
                const isSelected = currentGlasses === glass.id;
                return (
                  <button
                    key={glass.id}
                    onClick={() => onSelectGlasses(glass.id)}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <span className="text-3xl mb-1.5">{glass.icon}</span>
                    <span className="text-xs font-bold text-center">{glass.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Hoodie Colors */}
          {activeCategory === 'outfits' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {outfitsList.map((outfit) => {
                const isSelected = currentOutfitColor.toLowerCase() === outfit.color.toLowerCase();
                return (
                  <button
                    key={outfit.color}
                    onClick={() => onSelectOutfitColor(outfit.color)}
                    className={`relative flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-blue-500 shadow-lg'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl border border-white/20 shadow-md shrink-0 flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: outfit.color }}
                    >
                      DL
                    </div>
                    <span className="text-xs font-bold text-slate-200 text-left">{outfit.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-400 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Room Themes */}
          {activeCategory === 'room' && (
            <div className="flex flex-col gap-2.5">
              {roomList.map((room) => {
                const isSelected = currentRoomTheme === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => onSelectRoomTheme(room.id)}
                    className={`relative flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="text-3xl">{room.icon}</span>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold">{room.label}</span>
                      <span className="text-[11px] text-slate-400">Custom wallpapers & dynamic room lighting</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-400 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 mt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
