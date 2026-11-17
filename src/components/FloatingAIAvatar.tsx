import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface FloatingAIAvatarProps {
  onClick: () => void;
}

export const FloatingAIAvatar: React.FC<FloatingAIAvatarProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
      <button
        type="button"
        onClick={onClick}
        className="group relative flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
        title="Ask RRB AI (आपका AI साथी)"
      >
        {/* Glowing Pulsing Outer Ring */}
        <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />

        {/* Circular Avatar Body */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#071329] via-[#0f244e] to-[#1e3a8a] border-2 border-cyan-400 p-1 flex flex-col items-center justify-center text-white shadow-2xl">
          <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-300 group-hover:rotate-12 transition-transform" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white leading-none mt-0.5">
            RRB AI
          </span>

          {/* Sparkle badge */}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-900 rounded-full flex items-center justify-center text-[8px] font-bold shadow-xs">
            <Sparkles className="w-2.5 h-2.5" />
          </span>
        </div>
      </button>
    </div>
  );
};
