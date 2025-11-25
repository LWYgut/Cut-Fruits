import React from 'react';
import { GameResult, GameState } from '../types';

interface GameOverlayProps {
  gameState: GameState;
  score: number;
  timeLeft: number;
  gameResult: GameResult | null;
  onStart: () => void;
  isAnalyzing: boolean;
  hasHand?: boolean;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ 
  gameState, 
  score, 
  timeLeft, 
  gameResult, 
  onStart,
  isAnalyzing,
  hasHand = false
}) => {
  // HUD during Gameplay
  if (gameState === GameState.PLAYING) {
    return (
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-10">
        <div className="flex flex-col gap-1">
            <span className="text-slate-400 text-sm font-bold tracking-widest uppercase shadow-black drop-shadow-md">得分</span>
            <span className="text-5xl font-black text-yellow-400 neon-text drop-shadow-lg">{score}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
            <span className="text-slate-400 text-sm font-bold tracking-widest uppercase shadow-black drop-shadow-md">时间</span>
            <span className={`text-5xl font-black neon-text drop-shadow-lg ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>
                {timeLeft}
            </span>
        </div>
      </div>
    );
  }

  // Menu and Game Over Overlay
  return (
    <div className="absolute inset-0 flex flex-col justify-between items-center z-20 pointer-events-none p-6 md:p-12">
      
      {/* TOP SECTION */}
      <div className="w-full flex flex-col items-center">
        {gameState === GameState.MENU && (
          <div className="text-center animate-fade-in-down">
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-600 filter drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] pb-4">
              霓虹<br/>切水果
            </h1>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md transition-colors duration-300 ${hasHand ? 'border-green-500/50 bg-green-900/40 text-green-400' : 'border-yellow-500/50 bg-yellow-900/40 text-yellow-400'}`}>
              <span className={`w-3 h-3 rounded-full shadow-[0_0_10px] ${hasHand ? 'bg-green-500 shadow-green-500' : 'bg-yellow-500 shadow-yellow-500'}`}></span>
              <span className="text-base font-bold uppercase tracking-wide">
                {hasHand ? "食指已识别" : "正在寻找食指..."}
              </span>
            </div>
          </div>
        )}

        {gameState === GameState.GAME_OVER && (
          <div className="text-center w-full max-w-2xl animate-fade-in-down">
             <h2 className="text-5xl md:text-6xl font-black text-white mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">时间到！</h2>
             
             <div className="flex justify-center gap-4 md:gap-8 w-full">
                <div className="bg-slate-900/80 border border-slate-700 p-4 md:p-6 rounded-2xl backdrop-blur-md shadow-xl flex-1 max-w-[200px]">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">最终得分</div>
                    <div className="text-4xl font-black text-yellow-400">{gameResult?.score}</div>
                </div>
                <div className="bg-slate-900/80 border border-slate-700 p-4 md:p-6 rounded-2xl backdrop-blur-md shadow-xl flex-1 max-w-[200px]">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">命中率</div>
                    <div className="text-4xl font-black text-white">
                        {Math.round(((gameResult?.fruitsSliced || 0) / ((gameResult?.fruitsSliced || 1) + (gameResult?.bombsHit || 0))) * 100)}%
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* CENTER SECTION IS LEFT EMPTY FOR CANVAS BUTTONS */}
      <div className="flex-grow"></div>

      {/* BOTTOM SECTION */}
      <div className="w-full flex flex-col items-center justify-end pb-8">
        {gameState === GameState.MENU && (
           <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center max-w-md shadow-2xl animate-fade-in-up">
              <p className="text-slate-300 text-lg leading-relaxed">
                举起<span className="text-purple-400 font-bold mx-1">食指</span>控制光标
                <br />
                触碰屏幕中央的<span className="text-white font-bold mx-1">开始</span>按钮
              </p>
           </div>
        )}

        {gameState === GameState.GAME_OVER && (
          <div className="w-full max-w-lg animate-fade-in-up">
            {isAnalyzing ? (
                <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-purple-500/30 text-center">
                   <div className="animate-pulse text-purple-400 font-mono text-lg">
                      正在请求大师评价...
                   </div>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-purple-900/90 to-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-purple-500/40 text-left shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🥷</span>
                        <div className="text-xs text-purple-400 uppercase font-bold tracking-widest">忍者等级</div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{gameResult?.rankTitle || "未知忍者"}</h3>
                    <p className="text-base text-slate-300 italic border-l-4 border-purple-500 pl-3">
                      "{gameResult?.rankDescription}"
                    </p>
                </div>
            )}
             <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm font-medium animate-pulse drop-shadow-md">
                   使用食指触碰上方按钮以重新开始
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameOverlay;