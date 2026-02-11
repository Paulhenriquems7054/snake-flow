import { useRef, useEffect, useCallback } from "react";
import { type GameState, type GameTheme, CELL_COUNT, FRUIT_EMOJIS } from "@/types/game";

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
}

const GameCanvas = ({ gameState, theme }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const prevScoreRef = useRef(gameState.score);

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
        const size = Math.min(container.clientWidth, container.clientHeight);
        const cellSize = Math.floor(size / CELL_COUNT);
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

    const size = Math.min(container.clientWidth, container.clientHeight);
    const cellSize = Math.floor(size / CELL_COUNT);
    const totalSize = cellSize * CELL_COUNT;

    canvas.width = totalSize;
    canvas.height = totalSize;

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 3); // normalize to ~60fps
      lastTime = now;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = theme.bgColor;
      ctx.fillRect(0, 0, totalSize, totalSize);

      // Grid
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= CELL_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, totalSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(totalSize, i * cellSize);
        ctx.stroke();
      }

      // Snake body
      gameState.snake.forEach((seg, i) => {
        const x = seg.x * cellSize;
        const y = seg.y * cellSize;
        const pad = 1;

        if (i === 0) {
          ctx.fillStyle = theme.snakeHeadColor;
          ctx.shadowColor = theme.snakeHeadColor;
          ctx.shadowBlur = 8;
          roundRect(ctx, x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2, 4);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Eyes
          const eyeSize = cellSize * 0.15;
          ctx.fillStyle = theme.bgColor;
          const dir = gameState.direction;
          let ex1: number, ey1: number, ex2: number, ey2: number;
          const cx = x + cellSize / 2;
          const cy = y + cellSize / 2;
          const off = cellSize * 0.2;

          if (dir === "RIGHT") { ex1 = cx + off; ey1 = cy - off; ex2 = cx + off; ey2 = cy + off; }
          else if (dir === "LEFT") { ex1 = cx - off; ey1 = cy - off; ex2 = cx - off; ey2 = cy + off; }
          else if (dir === "UP") { ex1 = cx - off; ey1 = cy - off; ex2 = cx + off; ey2 = cy - off; }
          else { ex1 = cx - off; ey1 = cy + off; ex2 = cx + off; ey2 = cy + off; }

          ctx.beginPath();
          ctx.arc(ex1, ey1, eyeSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ex2, ey2, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = theme.snakeColor;
          const opacity = 1 - (i / gameState.snake.length) * 0.4;
          ctx.globalAlpha = opacity;
          roundRect(ctx, x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2, 3);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      // Fruit (emoji)
      const fx = gameState.fruit.x * cellSize + cellSize / 2;
      const fy = gameState.fruit.y * cellSize + cellSize / 2;
      const emoji = FRUIT_EMOJIS[gameState.fruitType];
      const fontSize = cellSize * 0.75;
      ctx.font = `${fontSize}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = theme.fruitColor;
      ctx.shadowBlur = 10;
      ctx.fillText(emoji, fx, fy);
      ctx.shadowBlur = 0;

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
  }, [gameState, theme]);

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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default GameCanvas;
