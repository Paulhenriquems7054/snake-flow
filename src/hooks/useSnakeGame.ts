import { useCallback, useRef, useEffect, useState } from "react";
import {
  type GameState,
  type Direction,
  type Position,
  type Difficulty,
  type FruitType,
  CELL_COUNT,
  MIN_CELL_SIZE,
  DIFFICULTY_CONFIG,
  GAME_THEMES,
  FRUIT_TYPES,
} from "@/types/game";

// Função para calcular CELL_COUNT dinâmico baseado no tamanho da tela
function calculateCellCount(containerWidth: number, containerHeight: number): number {
  const maxCellsX = Math.floor(containerWidth / MIN_CELL_SIZE);
  const maxCellsY = Math.floor(containerHeight / MIN_CELL_SIZE);
  return Math.min(maxCellsX, maxCellsY, 50); // Máximo de 50 células para evitar grid muito grande
}

function randomFruitType(): FruitType {
  return FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
}

function randomFruitPos(snake: Position[], cellCount: number): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * cellCount),
      y: Math.floor(Math.random() * cellCount),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

function createInitialSnake(cellCount: number): Position[] {
  const centerX = Math.floor(cellCount / 2);
  const centerY = Math.floor(cellCount / 2);
  return [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];
}

function createInitialState(cellCount: number): GameState {
  const initialSnake = createInitialSnake(cellCount);
  return {
    snake: [...initialSnake],
    fruit: randomFruitPos(initialSnake, cellCount),
    fruitType: randomFruitType(),
    direction: "RIGHT",
    score: 0,
    phase: 1,
    speed: 150,
    isRunning: false,
    isPaused: false,
    isGameOver: false,
    themeIndex: 6, // Modern theme
  };
}

const OPPOSITE: Record<Direction, Direction> = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

export function useSnakeGame(difficulty: Difficulty, onEatFruit: () => void, onGameOver: () => void, trainingMode = false, cellCount = CELL_COUNT) {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState(cellCount));
  const directionRef = useRef<Direction>("RIGHT");
  const gameLoopRef = useRef<number | null>(null);
  const [phaseAnnounce, setPhaseAnnounce] = useState<number | null>(null);
  const onEatFruitRef = useRef(onEatFruit);
  const onGameOverRef = useRef(onGameOver);
  const trainingModeRef = useRef(trainingMode);
  const cellCountRef = useRef(cellCount);
  const prevCellCountRef = useRef(cellCount);

  const config = DIFFICULTY_CONFIG[difficulty];

  const currentTheme = GAME_THEMES[gameState.themeIndex % GAME_THEMES.length];

  // Update refs when dependencies change
  onEatFruitRef.current = onEatFruit;
  onGameOverRef.current = onGameOver;
  trainingModeRef.current = trainingMode;
  cellCountRef.current = cellCount;

  // Adjust positions when cellCount changes to avoid loops
  useEffect(() => {
    const prevCellCount = prevCellCountRef.current;
    const newCellCount = cellCount;

    if (prevCellCount !== newCellCount && prevCellCount > 0) {
      setGameState((prev) => {
        if (!prev.snake.length) return prev;

        // Calculate scaling factor
        const scaleFactor = newCellCount / prevCellCount;

        // Adjust snake positions proportionally
        const adjustedSnake = prev.snake.map(segment => ({
          x: Math.round(segment.x * scaleFactor),
          y: Math.round(segment.y * scaleFactor),
        }));

        // Ensure positions stay within bounds
        const clampedSnake = adjustedSnake.map(segment => ({
          x: Math.max(0, Math.min(newCellCount - 1, segment.x)),
          y: Math.max(0, Math.min(newCellCount - 1, segment.y)),
        }));

        // Adjust fruit position proportionally
        const adjustedFruit = {
          x: Math.round(prev.fruit.x * scaleFactor),
          y: Math.round(prev.fruit.y * scaleFactor),
        };

        // Ensure fruit stays within bounds
        const clampedFruit = {
          x: Math.max(0, Math.min(newCellCount - 1, adjustedFruit.x)),
          y: Math.max(0, Math.min(newCellCount - 1, adjustedFruit.y)),
        };

        return {
          ...prev,
          snake: clampedSnake,
          fruit: clampedFruit,
        };
      });
    }

    prevCellCountRef.current = newCellCount;
  }, [cellCount]);

  const stopLoop = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setGameState((prev) => {
      if (!prev.isRunning || prev.isPaused || prev.isGameOver) return prev;

      const dir = directionRef.current;
      const head = prev.snake[0];
      let newHead: Position;

      switch (dir) {
        case "UP": newHead = { x: head.x, y: head.y - 1 }; break;
        case "DOWN": newHead = { x: head.x, y: head.y + 1 }; break;
        case "LEFT": newHead = { x: head.x - 1, y: head.y }; break;
        case "RIGHT": newHead = { x: head.x + 1, y: head.y }; break;
      }

      // Wall wrap-around (teleport to opposite side) - only when actually crossing boundaries
      const currentCellCount = cellCountRef.current;
      if (newHead.x < 0) {
        newHead.x = currentCellCount - 1;
      } else if (newHead.x >= currentCellCount) {
        newHead.x = 0;
      }

      if (newHead.y < 0) {
        newHead.y = currentCellCount - 1;
      } else if (newHead.y >= currentCellCount) {
        newHead.y = 0;
      }

      // Self collision - always active
      const tolerance = config.collisionTolerance;
      const bodyToCheck = prev.snake.slice(0, prev.snake.length - tolerance);
      if (bodyToCheck.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        onGameOverRef.current();
        return { ...prev, isRunning: false, isGameOver: true };
      }

      // Validate new head position
      if (newHead.x < 0 || newHead.x >= currentCellCount || newHead.y < 0 || newHead.y >= currentCellCount) {
        // This should not happen with proper wrap-around, but safety check
        console.warn('Invalid snake position detected:', newHead);
        return prev;
      }

      const ate = newHead.x === prev.fruit.x && newHead.y === prev.fruit.y;
      const newSnake = [newHead, ...prev.snake];
      if (!ate) newSnake.pop();

      let newScore = prev.score;
      let newPhase = prev.phase;
      let newSpeed = prev.speed;
      let newThemeIndex = prev.themeIndex;

      if (ate) {
        newScore += 10;
        onEatFruitRef.current();
        // Phase progression: every 50 points
        const calculatedPhase = Math.floor(newScore / 50) + 1;
        if (calculatedPhase > prev.phase) {
          newPhase = calculatedPhase;
          // Every 3 phases, change theme
          if (newPhase % 3 === 1 && newPhase > 1) {
            newThemeIndex = (prev.themeIndex + 1) % GAME_THEMES.length;
          }
          newSpeed = trainingModeRef.current ? config.baseSpeed : Math.max(50, config.baseSpeed - (newPhase - 1) * config.speedIncrement);
        }
      }

      return {
        ...prev,
        snake: newSnake,
        fruit: ate ? randomFruitPos(newSnake, cellCountRef.current) : prev.fruit,
        fruitType: ate ? randomFruitType() : prev.fruitType,
        direction: dir,
        score: newScore,
        phase: newPhase,
        speed: newSpeed,
        themeIndex: newThemeIndex,
      };
    });
  }, [config]);

  // Start/restart loop when speed changes
  useEffect(() => {
    if (gameState.isRunning && !gameState.isPaused && !gameState.isGameOver) {
      stopLoop();
      gameLoopRef.current = window.setInterval(tick, gameState.speed);
    } else {
      stopLoop();
    }
    return stopLoop;
  }, [gameState.isRunning, gameState.isPaused, gameState.isGameOver, gameState.speed, stopLoop]);

  // Phase announce
  useEffect(() => {
    if (gameState.phase > 1) {
      setPhaseAnnounce(gameState.phase);
      const t = setTimeout(() => setPhaseAnnounce(null), 1500);
      return () => clearTimeout(t);
    }
  }, [gameState.phase]);

  const changeDirection = useCallback((newDir: Direction) => {
    if (OPPOSITE[newDir] !== directionRef.current) {
      directionRef.current = newDir;
    }
  }, []);

  const startGame = useCallback(() => {
    const state = createInitialState(cellCountRef.current);
    state.speed = config.baseSpeed;
    state.isRunning = true;
    directionRef.current = "RIGHT";
    setGameState(state);
  }, [config]);

  const resumeSave = useCallback((saved: GameState) => {
    directionRef.current = saved.direction;
    setGameState({ ...saved, isRunning: true, isPaused: false });
  }, []);

  const togglePause = useCallback(() => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const getSnapshot = useCallback((): GameState => {
    return { ...gameState };
  }, [gameState]);

  return {
    gameState,
    currentTheme,
    phaseAnnounce,
    changeDirection,
    startGame,
    resumeSave,
    togglePause,
    getSnapshot,
  };
}
