import { useRef, useEffect, useCallback } from "react";
import { type GameState, type GameTheme, type Position, CELL_COUNT, MIN_CELL_SIZE, FRUIT_EMOJIS } from "@/types/game";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
  emoji?: string;
}

interface Props {
  gameState: GameState;
  theme: GameTheme;
  onCellCountChange?: (cellCount: number) => void;
}

const GameCanvas = ({ gameState, theme, onCellCountChange }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const prevScoreRef = useRef(gameState.score);
  const prevCellCountRef = useRef<number | null>(null);

  const spawnParticles = useCallback((cx: number, cy: number, color: string, emoji: string) => {
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5) * 0.4;
      const speed = 1.5 + Math.random() * 2.5;
      particlesRef.current.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: 3 + Math.random() * 4,
        color,
        emoji: Math.random() > 0.6 ? emoji : undefined,
      });
    }
  }, []);

  // Detect fruit eaten → spawn particles
  useEffect(() => {
      if (gameState.score > prevScoreRef.current) {
        const container = containerRef.current;
        if (container) {
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;
          const cellCount = Math.floor(Math.min(containerWidth / MIN_CELL_SIZE, containerHeight / MIN_CELL_SIZE, 50));
          const cellSize = Math.floor(Math.min(containerWidth / cellCount, containerHeight / cellCount));
          const head = gameState.snake[0];
          const cx = head.x * cellSize + cellSize / 2;
          const cy = head.y * cellSize + cellSize / 2;
          spawnParticles(cx, cy, theme.fruitColor, FRUIT_EMOJIS[gameState.fruitType]);
        }
      }
    prevScoreRef.current = gameState.score;
  }, [gameState.score, gameState.snake, gameState.fruitType, theme.fruitColor, spawnParticles]);

  // Main render + particle animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate cell size to fill available screen space
    const availableWidth = containerWidth;
    const availableHeight = containerHeight;

    // Calculate dynamic cell count based on screen size
    const cellCount = Math.floor(Math.min(availableWidth / MIN_CELL_SIZE, availableHeight / MIN_CELL_SIZE, 50));
    const cellSize = Math.floor(Math.min(availableWidth / cellCount, availableHeight / cellCount));
    const totalSize = cellSize * cellCount;

    // Notify parent component of cell count change only when significantly different
    const prevCellCount = prevCellCountRef.current;
    if (onCellCountChange && (prevCellCount === null || Math.abs(cellCount - prevCellCount) >= 2)) {
      onCellCountChange(cellCount);
    }
    prevCellCountRef.current = cellCount;

    // Use full container space for canvas
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 3); // normalize to ~60fps
      lastTime = now;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save context state
      ctx.save();

      // Background with rounded corners
      drawBoard(ctx, containerWidth, containerHeight, 0, theme.bgColor);

      // Grid
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= cellCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, containerHeight);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(containerWidth, i * cellSize);
        ctx.stroke();
      }

      // Snake body - all segments as circles
      drawSnake(ctx, gameState.snake, cellSize, theme.snakeColor);

      // Fruit (circle)
      drawFood(ctx, gameState.fruit, cellSize, theme.fruitColor);

      // Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.05 * dt; // gravity
        p.life -= 0.025 * dt;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.life;
        if (p.emoji) {
          const emojiSize = p.size * 2.5;
          ctx.font = `${emojiSize}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.emoji, p.x, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
      }

      // No need to restore context state since we removed scaling

      // Keep animating if particles exist
      if (particles.length > 0) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        animFrameRef.current = null;
      }
    };

    // Always do initial render; if particles exist, animate
    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, theme, onCellCountChange]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="rounded-lg"
        style={{ border: `1px solid ${theme.gridColor}` }}
      />
    </div>
  );
};


function drawBoard(ctx: CanvasRenderingContext2D, width: number, height: number, padding: number, backgroundColor: string) {
  ctx.fillStyle = backgroundColor;

  const radius = 40;

  ctx.beginPath();
  ctx.moveTo(padding + radius, padding);
  ctx.arcTo(width - padding, padding, width - padding, height - padding, radius);
  ctx.arcTo(width - padding, height - padding, padding, height - padding, radius);
  ctx.arcTo(padding, height - padding, padding, padding, radius);
  ctx.arcTo(padding, padding, width - padding, padding, radius);
  ctx.closePath();
  ctx.fill();
}

function drawSnake(ctx: CanvasRenderingContext2D, snake: Position[], cellSize: number, snakeColor: string) {
  ctx.fillStyle = snakeColor;
  ctx.imageSmoothingEnabled = true;

  snake.forEach(segment => {
    const cx = segment.x * cellSize + cellSize / 2;
    const cy = segment.y * cellSize + cellSize / 2;
    const radius = cellSize / 2.3;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawFood(ctx: CanvasRenderingContext2D, food: Position, cellSize: number, foodColor: string) {
  ctx.fillStyle = foodColor;
  ctx.imageSmoothingEnabled = true;

  const cx = food.x * cellSize + cellSize / 2;
  const cy = food.y * cellSize + cellSize / 2;
  const radius = cellSize / 2.5;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

export default GameCanvas;
