import { useCallback, useRef, useEffect, useState } from "react";
import {
  type GameState,
  type Direction,
  type Position,
  type Difficulty,
  type FruitType,
  type BoardSize,
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

function randomFruitPos(snake: Position[], cols: number, rows: number): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

function createInitialSnake(cols: number, rows: number): Position[] {
  const centerX = Math.floor(cols / 2);
  const centerY = Math.floor(rows / 2);
  return [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];
}

function createInitialState(cols: number, rows: number): GameState {
  const initialSnake = createInitialSnake(cols, rows);
  return {
    snake: [...initialSnake],
    fruit: randomFruitPos(initialSnake, cols, rows),
    fruitType: randomFruitType(),
    direction: "RIGHT",
    score: 0,
    phase: 1,
    speed: 150,
    isRunning: false,
    isPaused: false,
    isGameOver: false,
    themeIndex: 0, // Start from first palette; auto-cycles every 3 phases
  };
}

const OPPOSITE: Record<Direction, Direction> = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

export function useSnakeGame(
  difficulty: Difficulty,
  onEatFruit: () => void,
  onGameOver: () => void,
  trainingMode = false,
  boardSizeOrCellCount: BoardSize | number = CELL_COUNT
) {
  const initialBoard: BoardSize =
    typeof boardSizeOrCellCount === "number"
      ? { cols: boardSizeOrCellCount, rows: boardSizeOrCellCount }
      : boardSizeOrCellCount;

  const [gameState, setGameState] = useState<GameState>(() => createInitialState(initialBoard.cols, initialBoard.rows));
  const directionRef = useRef<Direction>("RIGHT");
  const gameLoopRef = useRef<number | null>(null);
  const [phaseAnnounce, setPhaseAnnounce] = useState<number | null>(null);
  const onEatFruitRef = useRef(onEatFruit);
  const onGameOverRef = useRef(onGameOver);
  const trainingModeRef = useRef(trainingMode);
  const boardSizeRef = useRef<BoardSize>(initialBoard);
  const prevBoardSizeRef = useRef<BoardSize>(initialBoard);

  const config = DIFFICULTY_CONFIG[difficulty];

  const currentTheme = GAME_THEMES[gameState.themeIndex % GAME_THEMES.length];

  // Update refs when dependencies change
  onEatFruitRef.current = onEatFruit;
  onGameOverRef.current = onGameOver;
  trainingModeRef.current = trainingMode;
  boardSizeRef.current =
    typeof boardSizeOrCellCount === "number"
      ? { cols: boardSizeOrCellCount, rows: boardSizeOrCellCount }
      : boardSizeOrCellCount;

  // Adjust positions when cellCount changes to avoid loops
  useEffect(() => {
    const prevBoardSize = prevBoardSizeRef.current;
    const newBoardSize = boardSizeRef.current;

    if (
      (prevBoardSize.cols !== newBoardSize.cols || prevBoardSize.rows !== newBoardSize.rows) &&
      prevBoardSize.cols > 0 &&
      prevBoardSize.rows > 0
    ) {
      setGameState((prev) => {
        if (!prev.snake.length) return prev;

        // Calculate scaling factors
        const scaleX = newBoardSize.cols / prevBoardSize.cols;
        const scaleY = newBoardSize.rows / prevBoardSize.rows;

        // Adjust snake positions proportionally
        const adjustedSnake = prev.snake.map(segment => ({
          x: Math.round(segment.x * scaleX),
          y: Math.round(segment.y * scaleY),
        }));

        // Ensure positions stay within bounds
        const clampedSnake = adjustedSnake.map(segment => ({
          x: Math.max(0, Math.min(newBoardSize.cols - 1, segment.x)),
          y: Math.max(0, Math.min(newBoardSize.rows - 1, segment.y)),
        }));

        // Adjust fruit position proportionally
        const adjustedFruit = {
          x: Math.round(prev.fruit.x * scaleX),
          y: Math.round(prev.fruit.y * scaleY),
        };

        // Ensure fruit stays within bounds and doesn't collide with snake
        let clampedFruit = {
          x: Math.max(0, Math.min(newBoardSize.cols - 1, adjustedFruit.x)),
          y: Math.max(0, Math.min(newBoardSize.rows - 1, adjustedFruit.y)),
        };

        // If fruit would collide with snake after adjustment, find a new position
        const fruitCollides = adjustedSnake.some(s => s.x === clampedFruit.x && s.y === clampedFruit.y);
        if (fruitCollides) {
          clampedFruit = randomFruitPos(adjustedSnake, newBoardSize.cols, newBoardSize.rows);
        }

        return {
          ...prev,
          snake: clampedSnake,
          fruit: clampedFruit,
        };
      });
    }

    prevBoardSizeRef.current = newBoardSize;
  }, [boardSizeOrCellCount]);

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

      const { cols, rows } = boardSizeRef.current;

      // No walls: always wrap-around on all sides
      if (newHead.x < 0) newHead.x = cols - 1;
      else if (newHead.x >= cols) newHead.x = 0;

      if (newHead.y < 0) newHead.y = rows - 1;
      else if (newHead.y >= rows) newHead.y = 0;

      // Self collision - always active
      const tolerance = config.collisionTolerance;
      const bodyToCheck = prev.snake.slice(0, prev.snake.length - tolerance);
      if (bodyToCheck.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        onGameOverRef.current();
        return { ...prev, isRunning: false, isGameOver: true };
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
          // Change theme every 3 phases (1-3 same theme, 4-6 next, etc.)
          // So the change happens when entering phase 4, 7, 10...
          if (newPhase > 1 && (newPhase - 1) % 3 === 0) {
            newThemeIndex = (prev.themeIndex + 1) % GAME_THEMES.length;
          }
          newSpeed = trainingModeRef.current ? config.baseSpeed : Math.max(50, config.baseSpeed - (newPhase - 1) * config.speedIncrement);
        }
      }

      return {
        ...prev,
        snake: newSnake,
        fruit: ate ? randomFruitPos(newSnake, boardSizeRef.current.cols, boardSizeRef.current.rows) : prev.fruit,
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
    const { cols, rows } = boardSizeRef.current;
    const state = createInitialState(cols, rows);
    state.speed = config.baseSpeed;
    state.isRunning = true;
    directionRef.current = "RIGHT";
    setGameState(state);
  }, [config]);

  const resumeSave = useCallback((saved: GameState) => {
    directionRef.current = saved.direction;
    const { cols, rows } = boardSizeRef.current;
    const wrap = (n: number, m: number) => ((n % m) + m) % m;

    // When the board size changes (e.g. user increased zoom), old saved coordinates may fall
    // outside the current grid. Normalize everything back into bounds.
    const wrappedSnake = (saved.snake ?? []).map((p) => ({
      x: wrap(p.x, cols),
      y: wrap(p.y, rows),
    }));
    let wrappedFruit = {
      x: wrap(saved.fruit?.x ?? 0, cols),
      y: wrap(saved.fruit?.y ?? 0, rows),
    };

    // If fruit would collide after wrapping, pick a new position.
    if (wrappedSnake.some((s) => s.x === wrappedFruit.x && s.y === wrappedFruit.y)) {
      wrappedFruit = randomFruitPos(wrappedSnake, cols, rows);
    }

    setGameState({
      ...saved,
      snake: wrappedSnake,
      fruit: wrappedFruit,
      isRunning: true,
      isPaused: false,
    });
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
