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
      <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start pointer-events-none z-10">
        {/* Score Card */}
        <div className="flex flex-col gap-1 bg-slate-900/40 backdrop-blur-xl border border-white/10 p-3 md:p-4 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl">🏆</span>
                <span className="text-slate-300 text-[10px] md:text-xs font-bold tracking-widest uppercase">得分</span>
            </div>
            <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 drop-shadow-sm font-sans tracking-tight ml-1">
                {score}
            </span>
        </div>
        
        {/* Time Card */}
        <div className={`flex flex-col items-end gap-1 bg-slate-900/40 backdrop-blur-xl border border-white/10 p-3 md:p-4 rounded-2xl shadow-lg transition-all duration-500 ${timeLeft <= 10 ? 'shadow-[0_0_20px_rgba(239,68,68,0.6)] border-red-500/50' : 'shadow-[0_0_15px_rgba(56,189,248,0.3)]'}`}>
            <div className="flex items-center gap-2">
                <span className="text-slate-300 text-[10px] md:text-xs font-bold tracking-widest uppercase">时间</span>
                <span className="text-xl md:text-2xl">⏱️</span>
            </div>
            <span className={`text-4xl md:text-5xl font-black font-sans tracking-tight ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                {timeLeft}
            </span>
        </div>
      </div>
    );
  }

  // Menu and Game Over Overlay
  return (
    <div className="absolute inset-0 flex flex-col justify-between items-center z-20 pointer-events-none p-4 md:p-8 h-screen overflow-hidden">
      
      {/* TOP SECTION */}
      <div className="w-full flex flex-col items-center pt-4 md:pt-8">
        {gameState === GameState.MENU && (
          <div className="text-center animate-fade-in-down flex flex-col items-center gap-4 md:gap-6">
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 filter drop-shadow-[0_0_25px_rgba(168,85,247,0.6)] tracking-tight leading-none">
              霓虹<br/>切水果
            </h1>
            
            {/* System Status Pill */}
            <div className={`flex items-center gap-3 px-4 py-2 md:px-6 md:py-3 rounded-full border backdrop-blur-md transition-all duration-500 transform scale-90 md:scale-100 ${hasHand ? 'border-green-500/40 bg-green-950/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-yellow-500/40 bg-yellow-950/30'}`}>
              <div className="relative">
                 <span className={`block w-2 h-2 md:w-3 md:h-3 rounded-full ${hasHand ? 'bg-green-500' : 'bg-yellow-500'} animate-ping absolute opacity-75`}></span>
                 <span className={`block w-2 h-2 md:w-3 md:h-3 rounded-full ${hasHand ? 'bg-green-500' : 'bg-yellow-500'} relative`}></span>
              </div>
              <span className={`text-xs md:text-sm font-mono font-bold uppercase tracking-wider ${hasHand ? 'text-green-400' : 'text-yellow-400'}`}>
                {hasHand ? "系统就绪 :: 食指已锁定" : "系统扫描中 :: 请举起右手"}
              </span>
            </div>
          </div>
        )}

        {gameState === GameState.GAME_OVER && (
          <div className="text-center w-full max-w-4xl animate-fade-in-down">
             <h2 className="text-5xl md:text-6xl font-black text-white mb-4 md:mb-6 drop-shadow-[0_0_25px_rgba(255,255,255,0.5)] tracking-tight">GAME OVER</h2>
             
             <div className="flex justify-center gap-4 w-full px-4">
                {/* Result Stat Card 1 */}
                <div className="bg-slate-900/60 border border-white/10 p-4 rounded-2xl backdrop-blur-xl shadow-2xl flex-1 max-w-[200px] group">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-purple-400 transition-colors">最终得分</div>
                    <div className="text-3xl md:text-4xl font-black text-yellow-400 drop-shadow-md">{gameResult?.score}</div>
                </div>
                {/* Result Stat Card 2 */}
                <div className="bg-slate-900/60 border border-white/10 p-4 rounded-2xl backdrop-blur-xl shadow-2xl flex-1 max-w-[200px] group">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-cyan-400 transition-colors">命中率</div>
                    <div className="text-3xl md:text-4xl font-black text-cyan-400 drop-shadow-md">
                        {Math.round(((gameResult?.fruitsSliced || 0) / ((gameResult?.fruitsSliced || 1) + (gameResult?.bombsHit || 0))) * 100)}%
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* CENTER SECTION IS LEFT EMPTY FOR CANVAS BUTTONS */}
      {/* Visual spacer to ensure we know this area is claimed by the canvas layer */}
      <div className="flex-grow min-h-[160px] md:min-h-[220px]"></div>

      {/* BOTTOM SECTION */}
      <div className="w-full flex flex-col items-center justify-end pb-4 md:pb-8">
        {gameState === GameState.MENU && (
           <div className="bg-slate-900/60 backdrop-blur-md px-6 py-4 md:px-8 md:py-6 rounded-2xl border border-white/10 text-center max-w-lg shadow-2xl animate-float transform scale-90 md:scale-100 origin-bottom">
              <p className="text-slate-300 text-base md:text-lg font-light">
                <span className="text-purple-400 font-bold mx-1 drop-shadow-sm">食指</span>控制光标
                <span className="mx-2 md:mx-3 text-slate-600">|</span>
                触碰<span className="text-white font-bold mx-1 drop-shadow-sm">开始</span>按钮
              </p>
           </div>
        )}

        {gameState === GameState.GAME_OVER && (
          <div className="w-full max-w-xl animate-fade-in-up px-4">
            {isAnalyzing ? (
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-purple-500/20 text-center shadow-lg">
                   <div className="flex items-center justify-center gap-3">
                       <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                       <span className="text-purple-400 font-mono text-base tracking-widest">正在评估战绩...</span>
                   </div>
                </div>
            ) : (
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900/80 to-purple-900/40 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/10 text-left shadow-[0_0_50px_rgba(168,85,247,0.15)] group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-7xl md:text-8xl transform translate-x-1/4 -translate-y-1/4 rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-700">🥷</div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 rounded bg-purple-500/20 border border-purple-500/30 text-[10px] text-purple-300 font-bold tracking-widest uppercase">Rank Evaluation</span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2 md:mb-3">{gameResult?.rankTitle || "未知忍者"}</h3>
                        <p className="text-sm md:text-lg text-slate-300 italic font-light border-l-4 border-purple-500 pl-4 leading-relaxed">
                          "{gameResult?.rankDescription}"
                        </p>
                    </div>
                </div>
            )}
             <div className="mt-4 md:mt-6 text-center">
                <p className="text-slate-500 text-[10px] md:text-xs font-mono tracking-widest animate-pulse opacity-60">
                   SYSTEM :: WAITING FOR REPLAY INPUT
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameOverlay;