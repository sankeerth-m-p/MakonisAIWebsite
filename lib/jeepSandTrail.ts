export const SAND_COLORS = [
  "#6f4322",
  "#8a5328",
  "#a96d39",
  "#c89262",
  "#4a2c14",
] as const;

/** 0 = circle, 1 = oval, 2 = grain chip */
export type SandParticleShape = 0 | 1 | 2;

export type SandParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  decay: number;
  color: string;
  shape: SandParticleShape;
  rotation: number;
  stretch: number;
  spin: number;
  jitter: number;
  /** X at spawn — used to fade trail behind the jeep, not by screen position. */
  spawnX: number;
};

function pickSandShape(): Pick<SandParticle, "shape" | "rotation" | "stretch" | "spin"> {
  const r = Math.random();
  if (r < 0.42) {
    return { shape: 0, rotation: 0, stretch: 1, spin: 0 };
  }
  if (r < 0.78) {
    return {
      shape: 1,
      rotation: Math.random() * Math.PI,
      stretch: 1.35 + Math.random() * 1.15,
      spin: (Math.random() - 0.5) * 0.04,
    };
  }
  return {
    shape: 2,
    rotation: Math.random() * Math.PI,
    stretch: 0.55 + Math.random() * 0.55,
    spin: (Math.random() - 0.5) * 0.08,
  };
}

// Keep the dirt low to the ground: narrower upward cone, more particles biased
// downward, and a touch more gravity so they settle quickly instead of pluming up.
const ANGLE_UP = 0.62;
const ANGLE_DOWN = 0.3;
const UP_BIAS = 0.48;
const GRAVITY = 0.16;
const DRAG = 0.985;

export const MAX_SAND_PARTICLES = 2200;
export const SAND_SPAWN_SPEED_THRESHOLD = 0.35;

/** Jeep drives right → left; dirt cone uses this fixed travel vector. */
export const JEEP_TRAVEL_DIR = { dx: -1, dy: 0 };

export function getJeepDirtAnchor(anchorEl: HTMLElement, section: HTMLElement) {
  const anchorRect = anchorEl.getBoundingClientRect();
  const sectionRect = section.getBoundingClientRect();

  return {
    x: anchorRect.left + anchorRect.width * 0.5 - sectionRect.left,
    y: anchorRect.top + anchorRect.height * 0.5 - sectionRect.top,
  };
}

export function spawnSandBurst(
  particles: SandParticle[],
  x: number,
  y: number,
  dx: number,
  dy: number,
  speed: number,
  maxParticles = MAX_SAND_PARTICLES,
  originSpread = 4,
) {
  if (speed <= 0) return;

  const count = Math.min(96, 18 + Math.floor(speed * 3.6));
  const mag = Math.hypot(dx, dy) || 1;
  const bx = -dx / mag;
  const by = -dy / mag;

  const pA = { x: -by, y: bx };
  const pB = { x: by, y: -bx };
  const up = pA.y < pB.y ? pA : pB;
  const down = up === pA ? pB : pA;

  for (let i = 0; i < count; i++) {
    const goUp = Math.random() < UP_BIAS;
    const side = goUp ? up : down;
    const maxA = goUp ? ANGLE_UP : ANGLE_DOWN;
    const theta = Math.pow(Math.random(), 0.65) * maxA;

    const cx = bx * Math.cos(theta) + side.x * Math.sin(theta);
    const cy = by * Math.cos(theta) + side.y * Math.sin(theta);
    // Lower launch power so the trail hugs the ground instead of pluming up.
    const power = (0.3 + Math.random() * 0.7) * (1 + speed * 0.1);

    const px = x + (Math.random() - 0.5) * originSpread;
    particles.push({
      x: px,
      y: y + (Math.random() - 0.5) * originSpread,
      vx: cx * power - dx * 0.05,
      vy: cy * power - dy * 0.05,
      // Medium-to-big grains so the trail reads clearly while the jeep moves.
      size: 2.8 + Math.random() * 5.2,
      life: 1,
      // Linger a touch longer so the trail stays visible behind the jeep.
      decay: 0.008 + Math.random() * 0.016,
      color: SAND_COLORS[(Math.random() * SAND_COLORS.length) | 0],
      jitter: 0.16 + Math.random() * 0.32,
      spawnX: px,
      ...pickSandShape(),
    });
  }

  if (particles.length > maxParticles) {
    particles.splice(0, particles.length - maxParticles);
  }
}

/** Fade particles that have drifted right behind the jeep (not by screen X). */
const TRAIL_FADE_PX = 160;
const TRAIL_FADE_STRENGTH = 2.4;

export function stepSandParticles(
  particles: SandParticle[],
  height: number,
  _width = 0,
) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vx *= DRAG;
    p.vy = p.vy * DRAG + GRAVITY;
    const shake = p.jitter * p.life;
    p.x += p.vx + (Math.random() - 0.5) * shake;
    p.y += p.vy + (Math.random() - 0.5) * shake * 0.7;
    if (p.spin !== 0) p.rotation += p.spin;

    const driftRight = Math.max(0, p.x - p.spawnX);
    const trailT = Math.min(1, driftRight / TRAIL_FADE_PX);
    const fadeMul = 1 + trailT * TRAIL_FADE_STRENGTH;
    p.life -= p.decay * fadeMul;

    if (p.life <= 0 || p.y > height + 40) {
      particles.splice(i, 1);
    }
  }
}

export function drawSandParticles(
  ctx: CanvasRenderingContext2D,
  particles: SandParticle[],
  _width = 0,
) {
  for (const p of particles) {
    const driftRight = Math.max(0, p.x - p.spawnX);
    const trailT = Math.min(1, driftRight / TRAIL_FADE_PX);
    let alpha = Math.max(0, p.life) * 0.92;
    alpha *= 1 - trailT * 0.35;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    const scale = p.size * (0.4 + p.life * 0.6);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    if (p.shape === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 1) {
      ctx.beginPath();
      ctx.ellipse(0, 0, scale * p.stretch, scale / p.stretch, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const w = scale * 2.1;
      const h = scale * p.stretch;
      ctx.beginPath();
      ctx.roundRect(-w * 0.5, -h * 0.5, w, h, Math.min(w, h) * 0.35);
      ctx.fill();
    }

    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
