import { useRef, useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pause, Play, Save, ArrowLeft } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useSnakeGame } from "@/hooks/useSnakeGame";
import { useSoundManager } from "@/hooks/useSoundManager";
import { CELL_COUNT, type Direction, type SaveData } from "@/types/game";
import GameCanvas from "@/components/GameCanvas";

const GameScreen = () => {
  const navigate = useNavigate();
  const { settings, updateRecord, saveData, setSaveData } = useSettings();
  const [showGameOver, setShowGameOver] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [cellCount, setCellCount] = useState(CELL_COUNT);
  const [gameInitialized, setGameInitialized] = useState(false);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const [touchFeedback, setTouchFeedback] = useState<{ x: number; y: number } | null>(null);

  const { playEat, playOver, playPhase, pauseMusic, resumeMusic, stopMusic } =
    useSoundManager(settings.musicOn, settings.musicVolume, settings.soundEffectsOn, settings.soundEffectsVolume);

  const vibrate = useCallback(
    (ms: number) => {
      if (settings.vibrationOn && navigator.vibrate) {
        navigator.vibrate(ms);
      }
    },
    [settings.vibrationOn]
  );

  const onEatFruit = useCallback(() => {
    vibrate(30);
    playEat();
  }, [vibrate, playEat]);

  const onGameOver = useCallback(() => {
    vibrate(100);
    playOver();
    setShowGameOver(true);
  }, [vibrate, playOver]);

  const onCellCountChange = useCallback((newCellCount: number) => {
    setCellCount(newCellCount);
  }, []);

  const {
    gameState,
    currentTheme,
    phaseAnnounce,
    changeDirection,
    startGame,
    resumeSave,
    togglePause,
    getSnapshot,
  } = useSnakeGame(settings.difficulty, onEatFruit, onGameOver, settings.trainingMode, cellCount);

  // Handle cell count changes during gameplay (adjust positions but don't restart)
  useEffect(() => {
    if (gameInitialized && gameState.isRunning && !gameState.isGameOver) {
      // Cell count changes are handled automatically by the useSnakeGame hook
      // No need to restart the game, just let it adjust positions
    }
  }, [cellCount, gameInitialized, gameState.isRunning, gameState.isGameOver]);

  // Play phase sound on phase change
  useEffect(() => {
    if (phaseAnnounce) playPhase();
  }, [phaseAnnounce, playPhase]);

  // Pause/resume music sync
  useEffect(() => {
    if (gameState.isPaused) {
      pauseMusic();
    } else if (gameState.isRunning) {
      resumeMusic();
    }
  }, [gameState.isPaused, gameState.isRunning, pauseMusic, resumeMusic]);

  // Stop music on game over
  useEffect(() => {
    if (gameState.isGameOver) stopMusic();
  }, [gameState.isGameOver, stopMusic]);

  // Start or resume game on mount (only once)
  useEffect(() => {
    if (!gameInitialized) {
      if (saveData) {
        resumeSave(saveData.gameState);
        setSaveData(null);
      } else {
        startGame();
      }
      setGameInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameInitialized]);

  // Update record on game over
  useEffect(() => {
    if (gameState.isGameOver) {
      updateRecord(gameState.score, gameState.phase, settings.difficulty);
    }
  }, [gameState.isGameOver, gameState.score, gameState.phase, settings.difficulty, updateRecord]);

  // Auto-save on app exit (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (gameState.isRunning && !gameState.isGameOver) {
        const snapshot = getSnapshot();
        const data: SaveData = {
          gameState: snapshot,
          difficulty: settings.difficulty,
          timestamp: Date.now(),
        };
        localStorage.setItem("snake-flow-save", JSON.stringify(data));
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [gameState.isRunning, gameState.isGameOver, getSnapshot, settings.difficulty]);


  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
      };
      if (map[e.key]) {
        e.preventDefault();
        changeDirection(map[e.key]);
      }
      if (e.key === " " || e.key === "Escape") {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [changeDirection, togglePause]);

  // Touch/swipe controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY };
    // Mostrar feedback visual do toque
    setTouchFeedback({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchRef.current && touchFeedback) {
      const touch = e.touches[0];
      setTouchFeedback({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) {
      setTouchFeedback(null);
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchRef.current.x;
    const dy = touch.clientY - touchRef.current.y;
    const minSwipe = 20; // Reduzido para ser mais responsivo
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Só muda direção se o swipe for significativo
    if (distance > minSwipe) {
      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > minSwipe) {
          changeDirection(dx > 0 ? "RIGHT" : "LEFT");
          vibrate(20); // Feedback tátil leve
        }
      } else {
        if (Math.abs(dy) > minSwipe) {
          changeDirection(dy > 0 ? "DOWN" : "UP");
          vibrate(20); // Feedback tátil leve
        }
      }
    }

    touchRef.current = null;
    setTouchFeedback(null);
  };

  const doSave = useCallback(() => {
    const snapshot = getSnapshot();
    const data: SaveData = {
      gameState: snapshot,
      difficulty: settings.difficulty,
      timestamp: Date.now(),
    };
    setSaveData(data);
    return data;
  }, [getSnapshot, settings.difficulty, setSaveData]);

  const handleSave = () => {
    doSave();
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1200);
  };

  const handleBack = () => {
    // Auto-save on back if game is running
    if (gameState.isRunning && !gameState.isGameOver) {
      doSave();
    }
    stopMusic();
    navigate("/menu");
  };

  const handleRestart = () => {
    setShowGameOver(false);
    startGame();
  };

  return (
    <div
      className="fixed inset-0 flex flex-col select-none"
      style={{ backgroundColor: currentTheme.bgColor }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* HUD */}
      <div
        className="flex items-center justify-between px-4 py-3 z-10"
        style={{ backgroundColor: currentTheme.hudBg }}
      >
        <button onClick={handleBack} className="p-2 rounded-lg transition-colors hover:opacity-80">
          <ArrowLeft className="w-5 h-5" style={{ color: currentTheme.hudText }} />
        </button>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider opacity-60" style={{ color: currentTheme.hudText }}>Score</p>
            <p className="font-game text-lg font-bold" style={{ color: currentTheme.hudText }}>{gameState.score}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider opacity-60" style={{ color: currentTheme.hudText }}>Phase</p>
            <p className="font-game text-lg font-bold" style={{ color: currentTheme.hudText }}>{gameState.phase}</p>
          </div>
        </div>

        <div className="flex gap-1">
          <button onClick={handleSave} className="p-2 rounded-lg transition-colors hover:opacity-80">
            <Save className="w-5 h-5" style={{ color: currentTheme.hudText }} />
          </button>
          <button onClick={togglePause} className="p-2 rounded-lg transition-colors hover:opacity-80">
            {gameState.isPaused ? (
              <Play className="w-5 h-5" style={{ color: currentTheme.hudText }} />
            ) : (
              <Pause className="w-5 h-5" style={{ color: currentTheme.hudText }} />
            )}
          </button>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center p-2 relative">
        <GameCanvas gameState={gameState} theme={currentTheme} onCellCountChange={onCellCountChange} />

        {/* Touch feedback indicator */}
        {touchFeedback && (
          <div
            className="absolute pointer-events-none z-10 animate-pulse"
            style={{
              left: touchFeedback.x - 20,
              top: touchFeedback.y - 20,
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: currentTheme.snakeColor,
              opacity: 0.3,
              border: `2px solid ${currentTheme.snakeHeadColor}`,
            }}
          />
        )}

        {/* Phase announcement */}
        {phaseAnnounce && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="animate-phase-announce font-game text-4xl font-bold" style={{ color: currentTheme.hudText, textShadow: `0 0 20px ${currentTheme.snakeColor}` }}>
              PHASE {phaseAnnounce}
            </div>
          </div>
        )}

        {/* Pause overlay */}
        {gameState.isPaused && !gameState.isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
            <div className="flex flex-col items-center gap-4 animate-scale-in">
              <Pause className="w-16 h-16" style={{ color: currentTheme.snakeColor }} />
              <p className="font-game text-xl tracking-wider" style={{ color: currentTheme.hudText }}>PAUSED</p>
              <button
                onClick={togglePause}
                className="font-game text-sm px-6 py-2 rounded-xl border transition-all hover:opacity-80"
                style={{ borderColor: currentTheme.snakeColor, color: currentTheme.snakeColor }}
              >
                RESUME
              </button>
            </div>
          </div>
        )}

        {/* Saved toast */}
        {showSaved && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
            <div className="font-game text-sm px-4 py-2 rounded-lg" style={{ backgroundColor: currentTheme.hudBg, color: currentTheme.snakeColor, border: `1px solid ${currentTheme.snakeColor}40` }}>
              💾 SAVED
            </div>
          </div>
        )}

        {/* Game Over overlay */}
        {showGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
            <div className="flex flex-col items-center gap-5 animate-scale-in">
              <p className="font-game text-3xl font-bold text-destructive">GAME OVER</p>
              <div className="text-center">
                <p className="font-game text-lg" style={{ color: currentTheme.hudText }}>Score: {gameState.score}</p>
                <p className="font-game text-sm opacity-70" style={{ color: currentTheme.hudText }}>Phase: {gameState.phase}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRestart}
                  className="font-game text-sm px-6 py-3 rounded-xl transition-all hover:opacity-80"
                  style={{ backgroundColor: currentTheme.snakeColor, color: currentTheme.bgColor }}
                >
                  PLAY AGAIN
                </button>
                <button
                  onClick={handleBack}
                  className="font-game text-sm px-6 py-3 rounded-xl border transition-all hover:opacity-80"
                  style={{ borderColor: currentTheme.snakeColor, color: currentTheme.snakeColor }}
                >
                  MENU
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GameScreen;
