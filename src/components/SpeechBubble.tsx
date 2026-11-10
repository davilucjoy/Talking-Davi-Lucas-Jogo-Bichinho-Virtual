/**
 * Comic Speech Bubble for Talking Davi Lucas.
 * Displays when Davi repeats speech, recites quotes, or speaks.
 */

import React from 'react';
import { Volume2 } from 'lucide-react';

interface SpeechBubbleProps {
  text: string;
  isVisible: boolean;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({ text, isVisible }) => {
  if (!isVisible || !text) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none max-w-sm w-full px-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="relative mx-auto bg-white text-slate-900 px-5 py-3 rounded-2xl shadow-2xl border-2 border-slate-900 text-center font-bold text-sm sm:text-base leading-snug">
        <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-0.5 text-xs uppercase tracking-wider font-extrabold">
          <Volume2 className="w-3.5 h-3.5" />
          <span>Davi Lucas</span>
        </div>
        <p className="text-slate-800">"{text}"</p>

        {/* Comic triangle tail pointing down to Davi's head */}
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-slate-900" />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white" />
      </div>
    </div>
  );
};
