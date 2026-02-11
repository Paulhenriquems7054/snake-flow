export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export type Difficulty = "easy" | "medium" | "hard";

export type AppTheme = "system" | "light" | "dark";

export type GameThemeId = "classic" | "ocean" | "lava" | "forest" | "cyber" | "desert";

export interface Position {
  x: number;
  y: number;
}

export interface GameTheme {
  id: GameThemeId;
  name: string;
  bgColor: string;
  snakeColor: string;
  snakeHeadColor: string;
  fruitColor: string;
  gridColor: string;
  hudBg: string;
  hudText: string;
}

export type FruitType = "apple" | "cherry" | "grape" | "orange" | "watermelon" | "lemon";

export const FRUIT_EMOJIS: Record<FruitType, string> = {
  apple: "🍎",
  cherry: "🍒",
  grape: "🍇",
  orange: "🍊",
  watermelon: "🍉",
  lemon: "🍋",
};

export const FRUIT_TYPES: FruitType[] = ["apple", "cherry", "grape", "orange", "watermelon", "lemon"];

export interface GameState {
  snake: Position[];
  fruit: Position;
  fruitType: FruitType;
  direction: Direction;
  score: number;
  phase: number;
  speed: number;
  isRunning: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  themeIndex: number;
}

export interface Settings {
  musicOn: boolean;
  soundEffectsOn: boolean;
  appTheme: AppTheme;
  gameThemeMode: "auto";
  vibrationOn: boolean;
  difficulty: Difficulty;
  trainingMode: boolean;
}

export interface RecordData {
  highScore: number;
  maxPhase: number;
  difficulty: Difficulty;
}

export interface SaveData {
  gameState: GameState;
  difficulty: Difficulty;
  timestamp: number;
}

export const GRID_SIZE = 20;
export const CELL_COUNT = 20;

export const DIFFICULTY_CONFIG: Record<Difficulty, { baseSpeed: number; speedIncrement: number; collisionTolerance: number }> = {
  easy: { baseSpeed: 200, speedIncrement: 8, collisionTolerance: 1 },
  medium: { baseSpeed: 150, speedIncrement: 12, collisionTolerance: 0 },
  hard: { baseSpeed: 100, speedIncrement: 18, collisionTolerance: 0 },
};

export const GAME_THEMES: GameTheme[] = [
  { id: "classic", name: "Classic", bgColor: "#0a1628", snakeColor: "#22c55e", snakeHeadColor: "#4ade80", fruitColor: "#ef4444", gridColor: "#1a2744", hudBg: "#111d33", hudText: "#22c55e" },
  { id: "ocean", name: "Ocean", bgColor: "#0c1929", snakeColor: "#06b6d4", snakeHeadColor: "#22d3ee", fruitColor: "#f59e0b", gridColor: "#152540", hudBg: "#0f1f35", hudText: "#06b6d4" },
  { id: "lava", name: "Lava", bgColor: "#1a0a0a", snakeColor: "#f97316", snakeHeadColor: "#fb923c", fruitColor: "#a855f7", gridColor: "#2a1515", hudBg: "#1f0e0e", hudText: "#f97316" },
  { id: "forest", name: "Forest", bgColor: "#0a1a0a", snakeColor: "#84cc16", snakeHeadColor: "#a3e635", fruitColor: "#ec4899", gridColor: "#152a15", hudBg: "#0e1f0e", hudText: "#84cc16" },
  { id: "cyber", name: "Cyber", bgColor: "#0f0a1a", snakeColor: "#a855f7", snakeHeadColor: "#c084fc", fruitColor: "#14b8a6", gridColor: "#1a1530", hudBg: "#130e22", hudText: "#a855f7" },
  { id: "desert", name: "Desert", bgColor: "#1a1508", snakeColor: "#eab308", snakeHeadColor: "#facc15", fruitColor: "#3b82f6", gridColor: "#2a2510", hudBg: "#1f1a0c", hudText: "#eab308" },
];

export const DEFAULT_SETTINGS: Settings = {
  musicOn: true,
  soundEffectsOn: true,
  appTheme: "dark",
  gameThemeMode: "auto",
  vibrationOn: true,
  difficulty: "medium",
  trainingMode: false,
};
