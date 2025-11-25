import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GameResult, Entity, Particle, Point, SlicedFruit, FloatingText } from './types';
import MotionEngine from './components/MotionEngine';
import GameOverlay from './components/GameOverlay';
import { generateGameFeedback } from './services/geminiService';

// Constants
const GRAVITY = 0.25;
const GAME_DURATION = 60;
const FRUIT_RADIUS = 70; 
const FRUIT_FONT_SIZE = "110px serif"; 
const FRUITS = [
  { emoji: '🍉', color: '#ff5555' },
  { emoji: '🍌', color: '#facc15' },
  { emoji: '🥝', color: '#84cc16' },
  { emoji: '🍍', color: '#fbbf24' },
  { emoji: '🍇', color: '#a855f7' },
  { emoji: '🍊', color: '#fb923c' },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHandDetected, setIsHandDetected] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Game State Refs
  const entities = useRef<Entity[]>([]);
  const slicedFruits = useRef<SlicedFruit[]>([]);
  const particles = useRef<Particle[]>([]);
  const floatingTexts = useRef<FloatingText[]>([]);
  const bladeTrail = useRef<Point[]>([]);
  const lastMousePos = useRef<Point>({ x: 0, y: 0 });
  const scoreRef = useRef(0);
  const statsRef = useRef({ fruits: 0, bombs: 0 });
  const gameStateRef = useRef<GameState>(GameState.MENU);
  
  // Animation Loop Ref
  const frameId = useRef<number>(0);
  const lastSpawnTime = useRef<number>(0);
  const gameStartTime = useRef<number>(0);
  const menuTimeRef = useRef<number>(0); 
  const gameOverTimeRef = useRef<number>(0); 

  // Sync state ref
  useEffect(() => {
    gameStateRef.current = gameState;
    if (gameState === GameState.MENU) {
        menuTimeRef.current = Date.now();
    } else if (gameState === GameState.GAME_OVER) {
        gameOverTimeRef.current = Date.now();
    }
  }, [gameState]);

  // --- MATH HELPERS ---
  
  // Helper: Create Explosion (Optimized count)
  const createExplosion = (x: number, y: number, color: string) => {
    // Reduced from 30 to 15 for performance
    for (let i = 0; i < 15; i++) {
      particles.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: (Math.random() - 0.5) * 15, // Slightly reduced spread speed
        vy: (Math.random() - 0.5) * 15,
        life: 1.0,
        color: color,
        size: Math.random() * 8 + 4
      });
    }
    
    // Add a "Slash Flash" line particle
    particles.current.push({
        id: "flash-" + Math.random(),
        x,
        y,
        vx: 0,
        vy: 0,
        life: 0.2, // Faster flash fade
        color: 'white',
        size: 100 // Flag for flash rendering
    });
  };

  // Helper: Spawn Floating Text
  const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
    floatingTexts.current.push({
      id: Math.random().toString(),
      x,
      y: y - 20,
      text,
      color,
      life: 1.0,
      vy: -2 
    });
  };

  // Helper: Create Sliced Fruit Parts
  const spawnSlicedFruit = (entity: Entity, cutAngle: number) => {
    const splitForce = 12; 
    
    const nx = Math.cos(cutAngle + Math.PI / 2);
    const ny = Math.sin(cutAngle + Math.PI / 2);

    slicedFruits.current.push({
      id: Math.random().toString(),
      x: entity.x,
      y: entity.y,
      vx: entity.vx - nx * splitForce,
      vy: entity.vy - ny * splitForce,
      rotation: entity.rotation,
      rotationSpeed: -0.2 - Math.random() * 0.2,
      cutAngle: cutAngle,
      side: 'left',
      emoji: entity.emoji,
      color: entity.color,
      radius: entity.radius,
      life: 1.0
    });

    slicedFruits.current.push({
      id: Math.random().toString(),
      x: entity.x,
      y: entity.y,
      vx: entity.vx + nx * splitForce,
      vy: entity.vy + ny * splitForce,
      rotation: entity.rotation,
      rotationSpeed: 0.2 + Math.random() * 0.2,
      cutAngle: cutAngle,
      side: 'right',
      emoji: entity.emoji,
      color: entity.color,
      radius: entity.radius,
      life: 1.0
    });
  };

  // Helper: Spawn Entity
  const spawnEntity = (width: number, height: number) => {
    const isBomb = Math.random() < 0.15;
    const x = Math.random() * (width - 100) + 50;
    const y = height + FRUIT_RADIUS; 
    
    const targetX = width / 2 + (Math.random() - 0.5) * (width / 2);
    
    // Constant random flight time (horizontal speed control)
    // 55 to 65 frames to reach center height. Consistent pace.
    const flightTime = 55 + Math.random() * 10;
    
    // Vertical Velocity (Upwards is negative)
    // Range: -15 (mid-screen) to -21 (high screen)
    // Increased from previous values to ensure fruits don't stay at the bottom.
    const vy = -15 - Math.random() * 6; 
    
    const vx = (targetX - x) / flightTime;

    const fruitData = FRUITS[Math.floor(Math.random() * FRUITS.length)];

    entities.current.push({
      id: Math.random().toString(),
      x,
      y,
      vx,
      vy,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      type: isBomb ? 'bomb' : 'fruit',
      emoji: isBomb ? '💣' : fruitData.emoji,
      color: isBomb ? '#ffffff' : fruitData.color,
      radius: FRUIT_RADIUS, 
      isSliced: false
    });
  };

  // Logic: Start Game
  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    scoreRef.current = 0;
    statsRef.current = { fruits: 0, bombs: 0 };
    entities.current = [];
    slicedFruits.current = [];
    particles.current = [];
    floatingTexts.current = [];
    bladeTrail.current = [];
    gameStartTime.current = Date.now();
    setGameState(GameState.PLAYING);
    createExplosion(window.innerWidth/2, window.innerHeight/2, '#a855f7');
  };

  // Core Render & Game Loop
  const update = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true }); 
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear Canvas with transparency to show CSS background
    ctx.clearRect(0, 0, width, height);

    // Current Finger Position
    const fingerX = lastMousePos.current.x;
    const fingerY = lastMousePos.current.y;
    const fingerRadius = 20;

    // Calculate cut angle
    let cutAngle = 0;
    if (bladeTrail.current.length >= 2) {
        const p1 = bladeTrail.current[bladeTrail.current.length - 2];
        const p2 = bladeTrail.current[bladeTrail.current.length - 1];
        cutAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    }

    // Common Button Drawer
    const drawTouchButton = (label: string, timeRef: number, yOffset: number = 0) => {
        const cx = width / 2;
        const cy = height / 2 + yOffset; // Use dynamic offset
        const radius = 80;
        const pulse = 1 + Math.sin(time / 200) * 0.1;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(pulse, pulse);
        
        // Glow effect
        ctx.shadowBlur = 30;
        ctx.shadowColor = isHandDetected ? '#c084fc' : '#475569';
        
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        // Gradient fill for button
        const grad = ctx.createRadialGradient(0,0,0, 0,0, radius);
        grad.addColorStop(0, isHandDetected ? '#7e22ce' : '#1e293b');
        grad.addColorStop(1, isHandDetected ? '#581c87' : '#0f172a');
        ctx.fillStyle = grad;
        ctx.fill();
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = isHandDetected ? '#d8b4fe' : '#334155';
        ctx.stroke();

        ctx.shadowBlur = 0; // Turn off shadow for text to save perf
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px "Exo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);
        ctx.restore();

        if (isHandDetected && (Date.now() - timeRef > 1500)) {
            const dx = fingerX - cx;
            const dy = fingerY - cy;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < radius + fingerRadius) {
                return true;
            }
        }
        return false;
    };

    // --- GAME STATE LOGIC ---
    if (gameStateRef.current === GameState.MENU) {
        // Start button low (+60)
        if (drawTouchButton("开始", menuTimeRef.current, 60)) {
            startGame();
        }
    } else if (gameStateRef.current === GameState.GAME_OVER) {
        // Play Again button adjusted (-30) to center between stats (top) and rank (bottom)
        if (drawTouchButton("再玩一次", gameOverTimeRef.current, -30)) {
            startGame();
        }
    } else if (gameStateRef.current === GameState.PLAYING) {
        // Spawning Logic (Optimized for performance)
        // Hard limit on active entities to prevent lag (Max 6 entities)
        if (entities.current.length < 6) {
             // Slower spawn rate: Start at 1.5s, fastest at 0.6s
            const spawnInterval = 1500 - Math.min(scoreRef.current * 10, 900);
            if (time - lastSpawnTime.current > spawnInterval) {
                spawnEntity(width, height);
                lastSpawnTime.current = time;
            }
        }

        // Update Entities
        entities.current.forEach(e => {
            e.x += e.vx;
            e.y += e.vy;
            e.vy += GRAVITY;
            e.rotation += e.rotationSpeed;
        });
        entities.current = entities.current.filter(e => e.y < height + FRUIT_RADIUS * 2);

        // Collision
        if (isHandDetected) {
            entities.current.forEach(e => {
                if (e.isSliced) return;
                const dx = fingerX - e.x;
                const dy = fingerY - e.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < e.radius + fingerRadius) {
                    e.isSliced = true;
                    if (e.type === 'bomb') {
                        scoreRef.current = Math.max(0, scoreRef.current - 10);
                        statsRef.current.bombs++;
                        createExplosion(e.x, e.y, '#ef4444');
                        spawnFloatingText(e.x, e.y, "-10", "#ef4444");
                        const flash = document.getElementById('flash-overlay');
                        if (flash) {
                           flash.style.opacity = '0.8';
                           setTimeout(() => { flash.style.opacity = '0'; }, 100);
                        }
                    } else {
                        scoreRef.current += 5;
                        statsRef.current.fruits++;
                        createExplosion(e.x, e.y, e.color);
                        spawnSlicedFruit(e, cutAngle); 
                        spawnFloatingText(e.x, e.y, "+5", "#facc15");
                    }
                    setScore(scoreRef.current);
                }
            });
        }
        entities.current = entities.current.filter(e => !e.isSliced);
    } 

    if (gameStateRef.current !== GameState.PLAYING && gameStateRef.current !== GameState.GAME_OVER) {
         entities.current = [];
    }

    // --- UPDATES ---
    
    // Sliced Fruits (Fast Fade)
    slicedFruits.current.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += GRAVITY;
        s.rotation += s.rotationSpeed;
        s.life -= 0.05; 
    });
    slicedFruits.current = slicedFruits.current.filter(s => s.life > 0);

    // Floating Text
    floatingTexts.current.forEach(t => {
        t.y += t.vy;
        t.life -= 0.02;
    });
    floatingTexts.current = floatingTexts.current.filter(t => t.life > 0);

    // Particles (Faster fade)
    particles.current.forEach(p => {
        if (p.size === 100) {
            p.life -= 0.15;
        } else {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += GRAVITY * 0.5;
            p.life -= 0.05; // Increased fade speed
        }
    });
    particles.current = particles.current.filter(p => p.life > 0);


    // --- RENDER SECTION ---

    // 1. Particles - No Shadow for performance
    particles.current.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        
        if (p.size === 100) { 
             ctx.translate(p.x, p.y);
             ctx.rotate(Math.random() * Math.PI); 
             ctx.fillStyle = 'white';
             ctx.fillRect(-100, -2, 200, 4);
        } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });

    // 2. Sliced Fruits
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = FRUIT_FONT_SIZE;
    // Set Shadow once here if possible, but color changes per fruit. 
    // To optimize, reduce blur radius.
    ctx.shadowBlur = 5; 

    slicedFruits.current.forEach(s => {
        ctx.save();
        ctx.globalAlpha = s.life; 
        ctx.translate(s.x, s.y);
        ctx.rotate(s.cutAngle);
        ctx.beginPath();
        if (s.side === 'left') {
             ctx.rect(-150, -150, 300, 150); 
        } else {
             ctx.rect(-150, 0, 300, 150); 
        }
        ctx.clip();
        ctx.rotate(-s.cutAngle); 
        ctx.rotate(s.rotation);  
        ctx.shadowColor = s.color; // Expensive change, but necessary
        ctx.fillText(s.emoji, 0, 10);
        ctx.restore();
    });

    // 3. Active Entities
    if (entities.current.length > 0) {
        entities.current.forEach(e => {
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(e.rotation);
            ctx.shadowColor = e.color;
            ctx.shadowBlur = 10; // slightly reduced from 15
            ctx.fillText(e.emoji, 0, 10); 
            ctx.restore();
        });
    }
    
    // 4. Floating Texts (No shadow for perf)
    ctx.shadowBlur = 0;
    ctx.font = "bold 40px 'Exo 2', sans-serif";
    floatingTexts.current.forEach(t => {
        ctx.save();
        ctx.globalAlpha = t.life;
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
    });

    // 5. Blade Trail
    if (bladeTrail.current.length > 1) {
        ctx.beginPath();
        ctx.moveTo(bladeTrail.current[0].x, bladeTrail.current[0].y);
        for (let i = 1; i < bladeTrail.current.length; i++) {
            const point = bladeTrail.current[i];
            if (i < bladeTrail.current.length - 1) {
              const next = bladeTrail.current[i + 1];
              const cx = (point.x + next.x) / 2;
              const cy = (point.y + next.y) / 2;
              ctx.quadraticCurveTo(point.x, point.y, cx, cy);
            } else {
               ctx.lineTo(point.x, point.y);
            }
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#d8b4fe';
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#d8b4fe';
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
    }
    
    // 6. Cursor Tip
    const cursorPos = lastMousePos.current;
    if (cursorPos.x !== 0 && cursorPos.y !== 0) {
        ctx.save();
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'white';
        ctx.beginPath();
        ctx.arc(cursorPos.x, cursorPos.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cursorPos.x, cursorPos.y, 20, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    // Decay trail
    if (bladeTrail.current.length > 0) {
        bladeTrail.current.shift();
    }

    frameId.current = requestAnimationFrame(() => update(performance.now()));
  }, [isHandDetected]); 

  // Start Loop on Mount
  useEffect(() => {
    // IMPORTANT: Reset context with alpha: true for CSS background visibility
    if (canvasRef.current) {
        // Just triggering a resize to ensure context is ready
    }
    frameId.current = requestAnimationFrame(() => update(performance.now()));
    return () => cancelAnimationFrame(frameId.current);
  }, [update]);

  // Handle Motion Input
  const handleMotionMove = useCallback((normX: number, normY: number) => {
    if (!canvasRef.current) return;

    const targetX = normX * canvasRef.current.width;
    const targetY = normY * canvasRef.current.height;
    
    // Smoother lerp for index finger
    const lerpFactor = 0.6;
    lastMousePos.current.x = lastMousePos.current.x + (targetX - lastMousePos.current.x) * lerpFactor;
    lastMousePos.current.y = lastMousePos.current.y + (targetY - lastMousePos.current.y) * lerpFactor;

    // Add to trail
    bladeTrail.current.push({ ...lastMousePos.current });
    if (bladeTrail.current.length > 7) { 
        bladeTrail.current.shift();
    }
  }, []);

  const handleHandDetected = useCallback((detected: boolean) => {
    setIsHandDetected(detected);
  }, []);

  // Game Timer
  useEffect(() => {
    let timerId: any;
    if (gameState === GameState.PLAYING) {
      timerId = setInterval(() => {
        const elapsed = (Date.now() - gameStartTime.current) / 1000;
        const remaining = Math.max(0, GAME_DURATION - Math.floor(elapsed));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          endGame();
        }
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [gameState]);

  const endGame = async () => {
    setGameState(GameState.GAME_OVER);
    
    // Clear all game objects immediately for a clean Game Over screen
    entities.current = [];
    slicedFruits.current = [];
    
    const result: GameResult = {
        score: scoreRef.current,
        fruitsSliced: statsRef.current.fruits,
        bombsHit: statsRef.current.bombs,
        rankTitle: "计算中...",
        rankDescription: "..."
    };
    setGameResult(result);
    
    setIsAnalyzing(true);
    const analysis = await generateGameFeedback(result.score, result.fruitsSliced, result.bombsHit);
    setGameResult({
        ...result,
        rankTitle: analysis.title,
        rankDescription: analysis.description
    });
    setIsAnalyzing(false);
  };

  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current && containerRef.current) {
            canvasRef.current.width = containerRef.current.clientWidth;
            canvasRef.current.height = containerRef.current.clientHeight;
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-slate-950 overflow-hidden cursor-none select-none font-sans">
      
      {/* --- NEW ANIMATED BACKGROUND --- */}
      <div className="absolute inset-0 z-[-3] overflow-hidden">
          {/* Deep Space Base */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#312e81]"></div>

          {/* Animated Aurora Blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/30 rounded-full blur-[80px] animate-blob mix-blend-screen opacity-70"></div>
          <div className="absolute top-[30%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-500/20 rounded-full blur-[80px] animate-blob animation-delay-2000 mix-blend-screen opacity-70"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-pink-600/20 rounded-full blur-[80px] animate-blob animation-delay-4000 mix-blend-screen opacity-60"></div>

          {/* Holographic Grid Floor */}
          <div className="absolute inset-0" 
               style={{
                   backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)", 
                   backgroundSize: "60px 60px",
                   maskImage: "radial-gradient(circle at center, black 0%, transparent 85%)",
                   WebkitMaskImage: "radial-gradient(circle at center, black 0%, transparent 85%)"
               }}>
          </div>
          
          {/* Subtle Noise Texture for high-end feel */}
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
      </div>
      
      {/* Flash overlay for bomb hits */}
      <div id="flash-overlay" className="absolute inset-0 bg-white opacity-0 pointer-events-none transition-opacity duration-100 z-50 mix-blend-overlay"></div>

      {/* Active in Menu AND Playing for detection */}
      <MotionEngine 
        isActive={true} 
        onMove={handleMotionMove} 
        onHandDetected={handleHandDetected}
      />

      <canvas 
        ref={canvasRef}
        className="absolute inset-0 z-0 block"
      />
      
      <GameOverlay 
        gameState={gameState} 
        score={score} 
        timeLeft={timeLeft}
        gameResult={gameResult}
        onStart={startGame}
        isAnalyzing={isAnalyzing}
        hasHand={isHandDetected}
      />
    </div>
  );
}