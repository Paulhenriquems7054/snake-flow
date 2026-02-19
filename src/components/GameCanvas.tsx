import { useRef, useEffect, useCallback } from "react";
import { type BoardSize, type GameState, type GameTheme, type Position, FRUIT_EMOJIS } from "@/types/game";

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
  boardSize: BoardSize;
}

const GameCanvas = ({ gameState, theme, boardSize }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const prevScoreRef = useRef(gameState.score);
  const metricsRef = useRef<{
    width: number;
    height: number;
    dpr: number;
    cellW: number;
    cellH: number;
  } | null>(null);

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

  // Keep canvas backing store perfectly in sync with displayed size (prevents "moving grid")
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateSize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;

      const dpr = window.devicePixelRatio || 1;
      const { cols, rows } = boardSize;
      const cellW = width / cols;
      const cellH = height / rows;

      // Set CSS size explicitly (so layout size == drawing size)
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Set backing store size with DPR for crisp rendering
      const nextW = Math.floor(width * dpr);
      const nextH = Math.floor(height * dpr);
      if (canvas.width !== nextW) canvas.width = nextW;
      if (canvas.height !== nextH) canvas.height = nextH;

      metricsRef.current = { width, height, dpr, cellW, cellH };
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [boardSize]);

  // Detect fruit eaten → spawn particles
  useEffect(() => {
      if (gameState.score > prevScoreRef.current) {
        const m = metricsRef.current;
        if (m) {
          const head = gameState.snake[0];
          const cx = head.x * m.cellW + m.cellW / 2;
          const cy = head.y * m.cellH + m.cellH / 2;
          spawnParticles(cx, cy, theme.fruitColor, FRUIT_EMOJIS[gameState.fruitType]);
        }
      }
    prevScoreRef.current = gameState.score;
  }, [boardSize, gameState.score, gameState.snake, gameState.fruitType, theme.fruitColor, spawnParticles]);

  // Main render + particle animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use full container space for canvas
    const m = metricsRef.current;
    if (!m) return;

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 3); // normalize to ~60fps
      lastTime = now;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const mm = metricsRef.current;
      if (!mm) return;

      // Map drawing coordinates to CSS pixels
      ctx.setTransform(mm.dpr, 0, 0, mm.dpr, 0, 0);

      // Clear canvas
      ctx.clearRect(0, 0, mm.width, mm.height);

      // Save context state
      ctx.save();

      // Background with rounded corners
      drawBoard(ctx, mm.width, mm.height, 0, theme.bgColor);

      // Grid
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= boardSize.cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * mm.cellW, 0);
        ctx.lineTo(i * mm.cellW, mm.height);
        ctx.stroke();
      }
      for (let i = 0; i <= boardSize.rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * mm.cellH);
        ctx.lineTo(mm.width, i * mm.cellH);
        ctx.stroke();
      }

      // Snake body - all segments as circles
      drawSnake(ctx, gameState.snake, mm.cellW, mm.cellH, theme.snakeColor, theme.snakeHeadColor);

      // Fruit (circle)
      drawFood(ctx, gameState.fruit, mm.cellW, mm.cellH, theme.fruitColor, theme.bgColor);

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
  }, [boardSize, gameState, theme]);

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

function drawSnake(
  ctx: CanvasRenderingContext2D,
  snake: Position[],
  cellW: number,
  cellH: number,
  snakeColor: string,
  snakeHeadColor: string
) {
  ctx.imageSmoothingEnabled = true;

  snake.forEach((segment, idx) => {
    const cx = segment.x * cellW + cellW / 2;
    const cy = segment.y * cellH + cellH / 2;
    const base = Math.min(cellW, cellH);
    const radius = (idx === 0 ? base / 2.1 : base / 2.3);

    ctx.fillStyle = idx === 0 ? snakeHeadColor : snakeColor;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = idx === 0 ? 10 : 4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function isDarkHex(hex: string) {
  const v = hex.startsWith("#") ? hex.slice(1) : hex;
  if (v.length !== 6) return true;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  // Perceived luminance (sRGB)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum < 0.5;
}

function drawFood(
  ctx: CanvasRenderingContext2D,
  food: Position,
  cellW: number,
  cellH: number,
  foodColor: string,
  bgColor: string
) {
  ctx.fillStyle = foodColor;
  ctx.imageSmoothingEnabled = true;

  const cx = food.x * cellW + cellW / 2;
  const cy = food.y * cellH + cellH / 2;
  const base = Math.min(cellW, cellH);
  // Slightly bigger than before, still safely inside the cell.
  const radius = base / 2.25;

  ctx.shadowColor = foodColor;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Contrast outline so the fruit stays visible at high zoom / bright themes.
  const darkBg = isDarkHex(bgColor);
  ctx.lineWidth = Math.max(1, base * 0.08);
  ctx.strokeStyle = darkBg ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius - ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Small highlight gives a "3D" cue and prevents flat blending.
  ctx.fillStyle = darkBg ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(cx - radius * 0.25, cy - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

export default GameCanvas;
