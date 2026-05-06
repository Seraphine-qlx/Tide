import { createNoise2D } from "simplex-noise";
import type { GameData } from "./scoring";

const W = 300;
const H = 300;
const BG = "#0a0e14";
const FG = "224, 223, 219";

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function makeRng(seed: number): () => number {
  let s = Math.abs(seed) % 2147483647;
  if (s === 0) s = 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function setStroke(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  width = 1,
): void {
  ctx.strokeStyle = `rgba(${FG}, ${alpha})`;
  ctx.lineWidth = width;
}

function setFill(ctx: CanvasRenderingContext2D, alpha: number): void {
  ctx.fillStyle = `rgba(${FG}, ${alpha})`;
}

function clearCanvas(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
}

function renderTide(
  ctx: CanvasRenderingContext2D,
  data: GameData,
  rng: () => number,
): void {
  const amplitude = lerp(20, 60, data.drift.distanceVariance / 50000);
  const intervalT = (data.pulse.meanInterval - 200) / (2000 - 200);
  const baseFreq = lerp(0.04, 0.015, intervalT);
  const phaseSpread = lerp(0, Math.PI, data.pulse.intervalVariance / 200000);
  const opacities = [0.25, 0.55, 0.9, 0.55, 0.25];

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < 5; i++) {
    const yCenter = (i + 0.5) * (H / 5);
    const phase = (rng() - 0.5) * 2 * phaseSpread + (i - 2) * 0.35;
    setStroke(ctx, opacities[i], 1.5);
    ctx.beginPath();
    for (let x = 0; x <= W; x++) {
      const y = yCenter + amplitude * Math.sin(baseFreq * x + phase);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function renderMountain(
  ctx: CanvasRenderingContext2D,
  data: GameData,
  rng: () => number,
): void {
  const noise = createNoise2D(rng);
  const scale = lerp(0.008, 0.003, data.drift.distanceVariance / 50000);
  const trailLen = Math.round(
    lerp(100, 400, data.current.longestDwell / 40000),
  );
  const particles = Math.round(lerp(8, 20, data.pulse.tapCount / 50));

  setStroke(ctx, 0.6, 1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let p = 0; p < particles; p++) {
    let x = 0;
    let y = rng() * H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < trailLen; s++) {
      const angle = noise(x * scale, y * scale) * Math.PI * 2;
      x += Math.cos(angle) * 1.2;
      y += Math.sin(angle) * 1.2;
      if (x < 0 || x > W || y < 0 || y > H) break;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function renderMirror(
  ctx: CanvasRenderingContext2D,
  data: GameData,
  rng: () => number,
): void {
  const axesTable = [2, 4, 4, 6, 8];
  const acc = Math.max(0, Math.min(4, Math.round(data.periphery.accuracy)));
  const n = axesTable[acc];
  const depth = Math.max(1, Math.min(3, Math.round(data.glimpse.whole)));
  const sector = (Math.PI * 2) / n;
  const cx = 150;
  const cy = 150;

  type Mark = {
    kind: "line" | "arc";
    r1: number;
    r2: number;
    a1: number;
    a2: number;
    alpha: number;
  };
  const marks: Mark[] = [];
  for (let d = 0; d < depth; d++) {
    const baseRadius = 25 + d * 35;
    const ringWidth = 28;
    const count = 3 + d * 2;
    for (let m = 0; m < count; m++) {
      marks.push({
        kind: rng() < 0.55 ? "line" : "arc",
        r1: baseRadius + rng() * ringWidth,
        r2: baseRadius + rng() * ringWidth,
        a1: rng() * sector,
        a2: rng() * sector,
        alpha: lerp(0.4, 0.9, rng()),
      });
    }
  }

  ctx.lineCap = "round";
  for (let k = 0; k < n; k++) {
    const rot = k * sector;
    for (const m of marks) {
      setStroke(ctx, m.alpha, 1);
      if (m.kind === "line") {
        const x1 = cx + Math.cos(rot + m.a1) * m.r1;
        const y1 = cy + Math.sin(rot + m.a1) * m.r1;
        const x2 = cx + Math.cos(rot + m.a2) * m.r2;
        const y2 = cy + Math.sin(rot + m.a2) * m.r2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      } else {
        const r = (m.r1 + m.r2) / 2;
        const start = rot + Math.min(m.a1, m.a2);
        const end = rot + Math.max(m.a1, m.a2);
        ctx.beginPath();
        ctx.arc(cx, cy, r, start, end);
        ctx.stroke();
      }
    }
  }
}

function renderStream(
  ctx: CanvasRenderingContext2D,
  data: GameData,
  rng: () => number,
): void {
  const noise = createNoise2D(rng);
  const branchProb = lerp(0.02, 0.15, data.current.switches / 30);
  const mainWidth = lerp(1, 3, data.current.longestDwell / 40000);
  const startCount = Math.max(
    1,
    Math.min(3, Math.round(data.glimpse.structure)),
  );
  const scale = 0.005;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  type Particle = {
    x: number;
    y: number;
    isMain: boolean;
    life: number;
    maxLife: number;
    angleBias: number;
  };
  const queue: Particle[] = [];
  for (let i = 0; i < startCount; i++) {
    queue.push({
      x: 0,
      y: ((i + 0.5) * H) / startCount + (rng() - 0.5) * 30,
      isMain: true,
      life: 0,
      maxLife: 600,
      angleBias: 0,
    });
  }

  let safety = 0;
  while (queue.length > 0 && safety < 200) {
    safety++;
    const p = queue.shift()!;
    setStroke(ctx, p.isMain ? 0.85 : 0.4, p.isMain ? mainWidth : 1);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    while (p.life < p.maxLife) {
      const n = noise(p.x * scale, p.y * scale);
      const angle = n * Math.PI * 0.8 + p.angleBias;
      p.x += Math.cos(angle) * 1.4 + 0.6;
      p.y += Math.sin(angle) * 1.4;
      p.life++;
      if (p.x < 0 || p.x > W || p.y < -5 || p.y > H + 5) break;
      ctx.lineTo(p.x, p.y);
      if (p.isMain && rng() < branchProb && queue.length < 80) {
        queue.push({
          x: p.x,
          y: p.y,
          isMain: false,
          life: 0,
          maxLife: 60 + Math.floor(rng() * 60),
          angleBias: (rng() - 0.5) * 1.4,
        });
      }
    }
    ctx.stroke();
  }
}

function renderFirefly(
  ctx: CanvasRenderingContext2D,
  data: GameData,
  rng: () => number,
): void {
  const stepSize = lerp(2, 8, data.drift.distanceVariance / 50000);
  const walkers = Math.round(lerp(10, 30, data.pulse.tapCount / 50));
  const angleVariance = lerp(
    0.2,
    Math.PI,
    data.pulse.intervalVariance / 200000,
  );
  const steps = 80;

  type Dot = { x: number; y: number; r: number; alpha: number };
  const dots: Dot[] = [];
  for (let w = 0; w < walkers; w++) {
    let x = lerp(50, W - 50, rng());
    let y = lerp(50, H - 50, rng());
    let angle = rng() * Math.PI * 2;
    for (let s = 0; s < steps; s++) {
      angle += (rng() - 0.5) * 2 * angleVariance;
      x += Math.cos(angle) * stepSize;
      y += Math.sin(angle) * stepSize;
      if (x < 6) {
        x = 6;
        angle = Math.PI - angle;
      }
      if (x > W - 6) {
        x = W - 6;
        angle = Math.PI - angle;
      }
      if (y < 6) {
        y = 6;
        angle = -angle;
      }
      if (y > H - 6) {
        y = H - 6;
        angle = -angle;
      }
    }
    dots.push({
      x,
      y,
      r: lerp(2, 5, rng()),
      alpha: lerp(0.2, 0.95, rng()),
    });
  }

  for (const d of dots) {
    if (d.r > 3.5) {
      ctx.shadowColor = `rgba(${FG}, ${d.alpha})`;
      ctx.shadowBlur = 6;
    } else {
      ctx.shadowBlur = 0;
    }
    setFill(ctx, d.alpha);
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

export function renderPortrait(
  type: string,
  gameData: GameData,
  canvas: HTMLCanvasElement,
): void {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const seed =
    hashCode(type) ^ Math.floor(gameData.drift.distanceVariance);
  const rng = makeRng(seed);

  clearCanvas(ctx);

  switch (type.toLowerCase()) {
    case "tide":
      renderTide(ctx, gameData, rng);
      break;
    case "mountain":
      renderMountain(ctx, gameData, rng);
      break;
    case "mirror":
      renderMirror(ctx, gameData, rng);
      break;
    case "stream":
      renderStream(ctx, gameData, rng);
      break;
    case "firefly":
      renderFirefly(ctx, gameData, rng);
      break;
    default:
      renderTide(ctx, gameData, rng);
  }
}
