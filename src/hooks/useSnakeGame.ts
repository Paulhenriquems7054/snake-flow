import { useCallback, useRef, useEffect, useState } from "react";
import {
  type GameState,
  type Direction,
  type Position,
  type Difficulty,
  type FruitType,
  CELL_COUNT,
  DIFFICULTY_CONFIG,
  GAME_THEMES,
  FRUIT_TYPES,
} from "@/types/game";

function randomFruitType(): FruitType {
  return FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
}

function randomFruitPos(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * CELL_COUNT),
      y: Math.floor(Math.random() * CELL_COUNT),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

function createInitialState(): GameState {
  return {
    snake: [...INITIAL_SNAKE],
    fruit: randomFruitPos(INITIAL_SNAKE),
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

export function useSnakeGame(difficulty: Difficulty, onEatFruit: () => void, onGameOver: () => void, trainingMode = false) {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const directionRef = useRef<Direction>("RIGHT");
  const gameLoopRef = useRef<number | null>(null);
  const [phaseAnnounce, setPhaseAnnounce] = useState<number | null>(null);
  const onEatFruitRef = useRef(onEatFruit);
  const onGameOverRef = useRef(onGameOver);
  const trainingModeRef = useRef(trainingMode);

  const config = DIFFICULTY_CONFIG[difficulty];

  const currentTheme = GAME_THEMES[gameState.themeIndex % GAME_THEMES.length];

  // Update refs when dependencies change
  onEatFruitRef.current = onEatFruit;
  onGameOverRef.current = onGameOver;
  trainingModeRef.current = trainingMode;

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

      // Wall wrap-around (teleport to opposite side)
      if (newHead.x < 0 || newHead.x >= CELL_COUNT || newHead.y < 0 || newHead.y >= CELL_COUNT) {
        newHead = {
          x: (newHead.x + CELL_COUNT) % CELL_COUNT,
          y: (newHead.y + CELL_COUNT) % CELL_COUNT,
        };
      }

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
        fruit: ate ? randomFruitPos(newSnake) : prev.fruit,
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
    const state = createInitialState();
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
