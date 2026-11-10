/**
 * Arcade Mini-Games Shell Modal for Talking Davi Lucas.
 * Runs Lucas Sky Jump or Snack Catcher in an isolated canvas container
 * with victory/game-over screens and coin payout.
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Play, RotateCcw, Trophy, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import { SkyJumpGame, MiniGameResult } from '../game/skyJumpMiniGame';
import { SnackCatchGame } from '../game/snackCatchMiniGame';

interface MiniGameModalProps {
  onClose: () => void;
  onRewardCoins: (amount: number) => void;
}

export const MiniGameModal: React.FC<MiniGameModalProps> = ({ onClose, onRewardCoins }) => {
  const [selectedGame, setSelectedGame] = useState<'sky_jump' | 'snack_catch' | null>(null);
  const [gameOverResult, setGameOverResult] = useState<MiniGameResult | null>(null);
  const [highScores, setHighScores] = useState<{ sky_jump: number; snack_catch: number }>({
    sky_jump: Number(localStorage.getItem('dl_high_sky') || 0),
    snack_catch: Number(localStorage.getItem('dl_high_snack') || 0),
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeGameInstance = useRef<SkyJumpGame | SnackCatchGame | null>(null);

  // Handle Game Over
  const handleGameOver = (res: MiniGameResult) => {
    setGameOverResult(res);
    onRewardCoins(res.coinsEarned);

    if (selectedGame === 'sky_jump') {
      const newHigh = Math.max(highScores.sky_jump, res.score);
      setHighScores((prev) => ({ ...prev, sky_jump: newHigh }));
      localStorage.setItem('dl_high_sky', String(newHigh));
    } else if (selectedGame === 'snack_catch') {
      const newHigh = Math.max(highScores.snack_catch, res.score);
      setHighScores((prev) => ({ ...prev, snack_catch: newHigh }));
      localStorage.setItem('dl_high_snack', String(newHigh));
    }
  };

  // Launch Game
  useEffect(() => {
    if (!selectedGame || !canvasRef.current) return;
    setGameOverResult(null);

    const canvas = canvasRef.current;
    canvas.width = Math.min(window.innerWidth - 32, 420);
    canvas.height = 540;

    if (selectedGame === 'sky_jump') {
      const game = new SkyJumpGame(canvas, handleGameOver);
      activeGameInstance.current = game;
      game.start();
    } else if (selectedGame === 'snack_catch') {
      const game = new SnackCatchGame(canvas, handleGameOver);
      activeGameInstance.current = game;
      game.start();
    }

    return () => {
      if (activeGameInstance.current) {
        activeGameInstance.current.destroy();
        activeGameInstance.current = null;
      }
    };
  }, [selectedGame]);

  const handleRestart = () => {
    if (!selectedGame) return;
    const curr = selectedGame;
    setSelectedGame(null);
    setTimeout(() => setSelectedGame(curr), 50);
  };

  // On-screen touch controls for Sky Jump
  const handleTouchDown = (dir: 'left' | 'right') => {
    if (activeGameInstance.current instanceof SkyJumpGame) {
      activeGameInstance.current.setTouchMove(dir);
    } else if (activeGameInstance.current instanceof SnackCatchGame) {
      activeGameInstance.current.setMoveDir(dir);
    }
  };

  const handleTouchUp = () => {
    if (activeGameInstance.current instanceof SkyJumpGame) {
      activeGameInstance.current.setTouchMove('none');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎮</span>
            <span className="font-extrabold text-sm text-white uppercase tracking-wider">
              {selectedGame === 'sky_jump'
                ? 'Lucas Sky Jump'
                : selectedGame === 'snack_catch'
                ? 'Snack Catcher'
                : 'Davi Lucas Arcade'}
            </span>
          </div>

          <button
            onClick={() => {
              if (selectedGame) {
                setSelectedGame(null);
              } else {
                onClose();
              }
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Game Menu Selection Screen */}
        {!selectedGame && (
          <div className="flex flex-col gap-4 p-5 w-full">
            <p className="text-xs text-slate-400 text-center">
              Play arcade mini-games with Davi Lucas to earn coins and unlock custom wardrobe items!
            </p>

            {/* Game 1: Lucas Sky Jump */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col gap-2.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🦘</span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Lucas Sky Jump</h3>
                    <p className="text-xs text-slate-400">Bounce up platforms & spring pads!</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-400 font-bold tabular-nums">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{highScores.sky_jump}m</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedGame('sky_jump')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>PLAY SKY JUMP</span>
              </button>
            </div>

            {/* Game 2: Snack Catcher */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-blue-500/30 hover:border-blue-500/60 transition-all flex flex-col gap-2.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🍕</span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Snack Catcher</h3>
                    <p className="text-xs text-slate-400">Catch falling pizzas & burgers, dodge boots!</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-400 font-bold tabular-nums">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{highScores.snack_catch} pts</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedGame('snack_catch')}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>PLAY SNACK CATCHER</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Mini-Game View */}
        {selectedGame && (
          <div className="relative flex flex-col items-center w-full p-2">
            <canvas ref={canvasRef} className="rounded-2xl shadow-xl w-full max-w-[420px] aspect-[420/540]" />

            {/* Touch / Click On-screen Controls */}
            <div className="flex items-center justify-between w-full max-w-[400px] mt-2.5 px-2 gap-4">
              <button
                onPointerDown={() => handleTouchDown('left')}
                onPointerUp={handleTouchUp}
                onPointerLeave={handleTouchUp}
                className="flex-1 py-3 rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center gap-2 font-bold text-xs border border-slate-700 cursor-pointer shadow-lg select-none"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>LEFT</span>
              </button>

              <button
                onPointerDown={() => handleTouchDown('right')}
                onPointerUp={handleTouchUp}
                onPointerLeave={handleTouchUp}
                className="flex-1 py-3 rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center gap-2 font-bold text-xs border border-slate-700 cursor-pointer shadow-lg select-none"
              >
                <span>RIGHT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Game Over Overlay */}
            {gameOverResult && (
              <div className="absolute inset-0 bg-slate-950/85 rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                <span className="text-4xl mb-2">🎉</span>
                <h3 className="text-xl font-black text-white uppercase tracking-wider">GAME OVER!</h3>

                <div className="flex flex-col gap-1.5 my-4 px-6 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-sm">
                  <div className="flex items-center justify-between gap-6 text-slate-300">
                    <span>Score:</span>
                    <span className="font-extrabold text-white tabular-nums">{gameOverResult.score}</span>
                  </div>
                  <div className="flex items-center justify-between gap-6 text-amber-400">
                    <span>Coins Earned:</span>
                    <span className="font-extrabold tabular-nums">+{gameOverResult.coinsEarned} 🪙</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full max-w-[260px]">
                  <button
                    onClick={handleRestart}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>PLAY AGAIN</span>
                  </button>
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    MENU
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
