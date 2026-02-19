import { useRef, useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pause, Play, Save, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useSnakeGame } from "@/hooks/useSnakeGame";
import { useSoundManager } from "@/hooks/useSoundManager";
import { CELL_COUNT, MIN_CELL_SIZE, type BoardSize, type Direction, type SaveData } from "@/types/game";
import GameCanvas from "@/components/GameCanvas";
import { setJsonBoth } from "@/utils/persist";

const GameScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings, updateRecord, saveData, setSaveData, customAudio } = useSettings();
  const [showGameOver, setShowGameOver] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [boardSize, setBoardSize] = useState<BoardSize>({ cols: CELL_COUNT, rows: CELL_COUNT });
  const [boardMeasured, setBoardMeasured] = useState(false);
  const [gameInitialized, setGameInitialized] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [touchFeedback, setTouchFeedback] = useState<{ x: number; y: number } | null>(null);
  const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeTriggeredRef = useRef(false);
  const lastSwipeDirRef = useRef<Direction | null>(null);

  const { playEat, playOver, playPhase, pauseMusic, resumeMusic, stopMusic } =
    useSoundManager(settings.musicOn, settings.musicVolume, settings.soundEffectsOn, settings.soundEffectsVolume, {
      music: customAudio.music,
      eat: customAudio.eat,
      over: customAudio.over,
      phase: customAudio.phase,
    });
  // Audio is managed globally by AudioManagerProvider. Do not control it from screens.

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

  // Keep board size stable and consistent between rendering and game logic
  useEffect(() => {
    const el = gameAreaRef.current;
    if (!el) return;

    const calc = () => {
      if (gameInitialized) return; // freeze boardSize during gameplay to avoid drifting
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const rawZoom = typeof settings.gameZoom === "number" ? settings.gameZoom : 1;
      const zoom = Math.max(0.8, Math.min(2, isFinite(rawZoom) ? rawZoom : 1));
      // Bigger zoom => bigger cells => fewer cols/rows => snake/fruit/grid appear larger.
      const minCellSize = MIN_CELL_SIZE * zoom;
      const cols = Math.max(8, Math.floor(Math.min(w / minCellSize, 80)));
      const rows = Math.max(8, Math.floor(Math.min(h / minCellSize, 80)));
      setBoardSize((prev) => (prev.cols === cols && prev.rows === rows ? prev : { cols, rows }));
      setBoardMeasured(true);
    };

    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gameInitialized, settings.gameZoom]);

  const {
    gameState,
    currentTheme,
    phaseAnnounce,
    changeDirection,
    startGame,
    resumeSave,
    togglePause,
    getSnapshot,
  } = useSnakeGame(settings.difficulty, onEatFruit, onGameOver, settings.trainingMode, boardSize);

  // Play phase sound on phase change
  useEffect(() => {
    if (phaseAnnounce) playPhase();
  }, [phaseAnnounce, playPhase]);

  // Music should play continuously while enabled. Do not stop music on pause/gameover.
  // Keep volume adjustments via settings through useSoundManager.

  // Do not apply global "dark mode" on the Game screen.
  // The game palette is controlled by phase themes, not by the app theme.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    if (hadDark) root.classList.remove("dark");
    return () => {
      if (settings.appTheme === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    };
  }, [settings.appTheme]);

  // Force background update when theme changes
  useEffect(() => {
    const gameContainer = document.querySelector('.fixed.inset-0.flex.flex-col.select-none') as HTMLElement;
    if (gameContainer) {
      gameContainer.style.backgroundColor = currentTheme.bgColor;
    }
  }, [currentTheme.bgColor, gameState.themeIndex]);

  // Start or resume game on mount (only once)
  useEffect(() => {
    if (!gameInitialized && boardMeasured) {
      if (saveData) {
        resumeSave(saveData.gameState);
        setSaveData(null);
      } else {
        startGame();
      }
      setGameInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameInitialized, boardMeasured]);

  // Update record on game over
  useEffect(() => {
    if (gameState.isGameOver) {
      updateRecord(gameState.score, gameState.phase, settings.difficulty);
    }
  }, [gameState.isGameOver, gameState.score, gameState.phase, settings.difficulty, updateRecord]);

  // Auto-save on app exit (beforeunload)
  useEffect(() => {
    const persistSnapshot = () => {
      if (gameState.isRunning && !gameState.isGameOver) {
        const snapshot = getSnapshot();
        const data: SaveData = {
          gameState: snapshot,
          difficulty: settings.difficulty,
          timestamp: Date.now(),
        };
        setJsonBoth("snake-flow-save", data);
      }
    };

    const handleBeforeUnload = () => persistSnapshot();
    const handlePageHide = () => persistSnapshot();
    const handleVisibility = () => {
      if (document.hidden) persistSnapshot();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
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

  // Touch controls by single tap: divide screen into 4 areas
  const handleTouchStart = (e: React.TouchEvent) => {
    // Verifica se o toque foi em um botão - se sim, não interfere
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return; // Permite que o botão receba o evento normalmente
    }

    // Bloqueia comportamento padrão do navegador (scroll/zoom/pull-to-refresh)
    e.preventDefault();

    if (!isMobile) return; // ativa apenas em mobile

    const touch = e.touches[0];
    setTouchFeedback({ x: touch.clientX, y: touch.clientY });
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    swipeTriggeredRef.current = false;
    lastSwipeDirRef.current = null;

    // Esconde feedback rapidamente
    setTimeout(() => setTouchFeedback(null), 120);
  };

  // Não usamos move/end para evitar qualquer gesto contínuo
  const handleTouchMove = (e: React.TouchEvent) => {
    // Verifica se o movimento foi iniciado em um botão - se sim, não interfere
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return; // Permite que o botão receba o evento normalmente
    }
    e.preventDefault();

    if (!isMobile) return;
    const start = touchStartRef.current;
    if (!start) return;
    const touch = e.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const threshold = 18; // px - small but intentional swipe

    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

    let dir: Direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx < 0 ? "LEFT" : "RIGHT";
    } else {
      dir = dy < 0 ? "UP" : "DOWN";
    }

    if (lastSwipeDirRef.current === dir) return;
    lastSwipeDirRef.current = dir;
    swipeTriggeredRef.current = true;

    changeDirection(dir);
    vibrate(20);

    // Allow consecutive swipes by resetting the start point
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Verifica se o toque foi em um botão - se sim, não interfere
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return; // Permite que o botão receba o evento normalmente
    }
    e.preventDefault();
    setTouchFeedback(null);

    if (!isMobile) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;

    // If user swiped, direction already changed during move.
    if (swipeTriggeredRef.current) return;
    if (!start) return;

    // Tap-to-direct: choose direction based on tap position relative to game area center.
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;
    const rect = gameArea.getBoundingClientRect();
    const x = start.x - rect.left;
    const y = start.y - rect.top;
    const w = rect.width;
    const h = rect.height;

    const dx = x - w / 2;
    const dy = y - h / 2;
    let dir: Direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx < 0 ? "LEFT" : "RIGHT";
    } else {
      dir = dy < 0 ? "UP" : "DOWN";
    }

    changeDirection(dir);
    vibrate(20);
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
    navigate("/menu");
  };

  const handleRestart = () => {
    setShowGameOver(false);
    startGame();
  };

  return (
    <div
      className="fixed inset-0 flex flex-col select-none"
      style={{ backgroundColor: currentTheme.bgColor, touchAction: "none" }}
      key={`theme-${gameState.themeIndex}`}
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
            <p className="text-[10px] uppercase tracking-wider opacity-60" style={{ color: currentTheme.hudText }}>{t("Score")}</p>
            <p className="font-game text-lg font-bold" style={{ color: currentTheme.hudText }}>{gameState.score}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider opacity-60" style={{ color: currentTheme.hudText }}>{t("Phase")}</p>
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
      <div ref={gameAreaRef} className="flex-1 flex items-center justify-center p-2 relative" style={{ touchAction: "none" }}>
        <GameCanvas gameState={gameState} theme={currentTheme} boardSize={boardSize} />

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
              {t("Phase")} {phaseAnnounce}
            </div>
          </div>
        )}

        {/* Pause overlay */}
        {gameState.isPaused && !gameState.isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
            <div className="flex flex-col items-center gap-4 animate-scale-in">
              <Pause className="w-16 h-16" style={{ color: currentTheme.snakeColor }} />
              <p className="font-game text-xl tracking-wider" style={{ color: currentTheme.hudText }}>{t("PAUSED")}</p>
              <button
                onClick={togglePause}
                className="font-game text-sm px-6 py-2 rounded-xl border transition-all hover:opacity-80"
                style={{ borderColor: currentTheme.snakeColor, color: currentTheme.snakeColor }}
              >
                {t("RESUME")}
              </button>
            </div>
          </div>
        )}

        {/* Saved toast */}
        {showSaved && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
            <div className="font-game text-sm px-4 py-2 rounded-lg" style={{ backgroundColor: currentTheme.hudBg, color: currentTheme.snakeColor, border: `1px solid ${currentTheme.snakeColor}40` }}>
              💾 {t("SAVED")}
            </div>
          </div>
        )}

        {/* Game Over overlay */}
        {showGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
            <div className="flex flex-col items-center gap-5 animate-scale-in">
              <p className="font-game text-3xl font-bold text-destructive">{t("GAME OVER")}</p>
              <div className="text-center">
                <p className="font-game text-lg" style={{ color: currentTheme.hudText }}>{t("Score")}: {gameState.score}</p>
                <p className="font-game text-sm opacity-70" style={{ color: currentTheme.hudText }}>{t("Phase")}: {gameState.phase}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRestart}
                  className="font-game text-sm px-6 py-3 rounded-xl transition-all hover:opacity-80"
                  style={{ backgroundColor: currentTheme.snakeColor, color: currentTheme.bgColor }}
                >
                  {t("PLAY AGAIN")}
                </button>
                <button
                  onClick={handleBack}
                  className="font-game text-sm px-6 py-3 rounded-xl border transition-all hover:opacity-80"
                  style={{ borderColor: currentTheme.snakeColor, color: currentTheme.snakeColor }}
                >
                  {t("MENU")}
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
