export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export type Difficulty = "easy" | "medium" | "hard";

export type AppTheme = "light" | "dark";

export type GameThemeId =
  | "classic"
  | "ocean"
  | "lava"
  | "forest"
  | "cyber"
  | "desert"
  | "modern"
  | "neon"
  | "ice"
  | "sunset"
  | "midnight";

export type Language = "en" | "pt";

export interface Position {
  x: number;
  y: number;
}

export interface BoardSize {
  cols: number;
  rows: number;
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
  musicVolume: number; // 0-1
  soundEffectsOn: boolean;
  soundEffectsVolume: number; // 0-1
  gameZoom: number; // 0.8-2.0 (multiplies MIN_CELL_SIZE -> bigger zoom = bigger cells)
  appTheme: AppTheme;
  gameThemeMode: "auto";
  vibrationOn: boolean;
  difficulty: Difficulty;
  trainingMode: boolean;
  language: Language;
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
export const MIN_CELL_SIZE = 15; // Tamanho mínimo de célula em pixels
export const CELL_COUNT = 20; // Valor padrão, será calculado dinamicamente

export const DIFFICULTY_CONFIG: Record<Difficulty, { baseSpeed: number; speedIncrement: number; collisionTolerance: number }> = {
  // baseSpeed is in ms per tick (higher = slower start). speedIncrement reduces ms each phase (faster over time).
  easy: { baseSpeed: 280, speedIncrement: 6, collisionTolerance: 1 },
  medium: { baseSpeed: 240, speedIncrement: 8, collisionTolerance: 0 },
  hard: { baseSpeed: 200, speedIncrement: 10, collisionTolerance: 0 },
};

export const GAME_THEMES: GameTheme[] = [
  { id: "classic", name: "Classic", bgColor: "#0a1628", snakeColor: "#22c55e", snakeHeadColor: "#4ade80", fruitColor: "#ef4444", gridColor: "#1a2744", hudBg: "#111d33", hudText: "#22c55e" },
  { id: "ocean", name: "Ocean", bgColor: "#0f1419", snakeColor: "#06b6d4", snakeHeadColor: "#22d3ee", fruitColor: "#f59e0b", gridColor: "#1a252f", hudBg: "#0f1f35", hudText: "#06b6d4" },
  { id: "lava", name: "Lava", bgColor: "#2d1813", snakeColor: "#f97316", snakeHeadColor: "#fb923c", fruitColor: "#a855f7", gridColor: "#3d241e", hudBg: "#1f0e0e", hudText: "#f97316" },
  { id: "forest", name: "Forest", bgColor: "#1a2e1a", snakeColor: "#84cc16", snakeHeadColor: "#a3e635", fruitColor: "#ec4899", gridColor: "#2a3d2a", hudBg: "#0e1f0e", hudText: "#84cc16" },
  { id: "cyber", name: "Cyber", bgColor: "#1a1a2e", snakeColor: "#a855f7", snakeHeadColor: "#c084fc", fruitColor: "#14b8a6", gridColor: "#2a2a3e", hudBg: "#130e22", hudText: "#a855f7" },
  { id: "desert", name: "Desert", bgColor: "#3d2b1f", snakeColor: "#eab308", snakeHeadColor: "#facc15", fruitColor: "#3b82f6", gridColor: "#4d3a2f", hudBg: "#1f1a0c", hudText: "#eab308" },
  { id: "modern", name: "Modern", bgColor: "#f0f9f0", snakeColor: "#4CAF50", snakeHeadColor: "#66BB6A", fruitColor: "#FFD54F", gridColor: "#e0f0e0", hudBg: "#F1F8E9", hudText: "#2E7D32" },
  // Extra palettes for stronger alternation every 3 phases
  { id: "neon", name: "Neon", bgColor: "#0f0f23", snakeColor: "#22c55e", snakeHeadColor: "#86efac", fruitColor: "#f43f5e", gridColor: "#1f1f33", hudBg: "#0d0d14", hudText: "#22c55e" },
  { id: "ice", name: "Ice", bgColor: "#0f1926", snakeColor: "#38bdf8", snakeHeadColor: "#7dd3fc", fruitColor: "#a78bfa", gridColor: "#1f2936", hudBg: "#0b2231", hudText: "#38bdf8" },
  { id: "sunset", name: "Sunset", bgColor: "#2d1b2d", snakeColor: "#f472b6", snakeHeadColor: "#f9a8d4", fruitColor: "#f59e0b", gridColor: "#3d2b3d", hudBg: "#1f0d23", hudText: "#f472b6" },
  { id: "midnight", name: "Midnight", bgColor: "#0a0a14", snakeColor: "#22d3ee", snakeHeadColor: "#67e8f9", fruitColor: "#eab308", gridColor: "#1a1a24", hudBg: "#0b0d16", hudText: "#67e8f9" },
];

export const DEFAULT_SETTINGS: Settings = {
  musicOn: true,
  musicVolume: 0.3,
  soundEffectsOn: true,
  soundEffectsVolume: 0.6,
  gameZoom: 1,
  appTheme: "dark",
  gameThemeMode: "auto",
  vibrationOn: true,
  difficulty: "medium",
  trainingMode: false,
  language: "pt",
};
