"use client";

import { useEffect, useRef } from "react";

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface ProjectedPoint extends Point3D {
  f: number;
}

const N = 110;
const R = 200;
const GA = Math.PI * (3 - Math.sqrt(5));

function buildNodes(): Point3D[] {
  const nodes: Point3D[] = [];
  for (let k = 0; k < N; k++) {
    const y = 1 - (k / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = GA * k;
    nodes.push({ x: R * Math.cos(th) * r, y: R * y, z: R * Math.sin(th) * r });
  }
  return nodes;
}

function buildEdges(nodes: Point3D[]): [number, number][] {
  const edges: [number, number][] = [];
  for (let a = 0; a < N; a++) {
    const dists: { b: number; d: number }[] = [];
    for (let b = 0; b < N; b++) {
      if (a === b) continue;
      const dx = nodes[a].x - nodes[b].x;
      const dy = nodes[a].y - nodes[b].y;
      const dz = nodes[a].z - nodes[b].z;
      dists.push({ b, d: dx * dx + dy * dy + dz * dz });
    }
    dists.sort((p, q) => p.d - q.d);
    for (let e = 0; e < 3; e++) {
      const bb = dists[e].b;
      if (a < bb) edges.push([a, bb]);
      else edges.push([bb, a]);
    }
  }
  return edges;
}

function rotY(p: Point3D, a: number): Point3D {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: p.x * c - p.z * s, y: p.y, z: p.x * s + p.z * c };
}

function rotX(p: Point3D, a: number): Point3D {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}

function proj(p: Point3D, cx: number, cy: number): ProjectedPoint {
  const per = 2.4;
  const f = per / (per - p.z / R);
  return { x: cx + p.x * f, y: cy + p.y * f, z: p.z, f };
}

const NODES = buildNodes();
const EDGES = buildEdges(NODES);

type NetworkGlobeProps = {
  size?: number;
  rotationSpeed?: number;
  className?: string;
};

export default function NetworkGlobe({
  size = 300,
  rotationSpeed = 1,
  className = "",
}: NetworkGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = 300, cy = 300;
    let t = 0;
    let rafId: number;

    function frame() {
      t += 0.004 * rotationSpeed;
      ctx!.clearRect(0, 0, 600, 600);

      const P: ProjectedPoint[] = NODES.map((node) =>
        proj(rotX(rotY(node, -t * 0.9), 0.22), cx, cy)
      );

      for (const [a, b] of EDGES) {
        const p1 = P[a], p2 = P[b];
        const dep = ((p1.z + p2.z) / 2 / R + 1) / 2;
        ctx!.beginPath();
        ctx!.moveTo(p1.x, p1.y);
        ctx!.lineTo(p2.x, p2.y);
        ctx!.strokeStyle = `rgba(255,255,255,${(0.05 + 0.25 * dep).toFixed(3)})`;
        ctx!.lineWidth = 3.5;
        ctx!.stroke();
      }

      for (let n = 0; n < N; n++) {
        const dp = (P[n].z / R + 1) / 2;
        ctx!.beginPath();
        ctx!.arc(P[n].x, P[n].y, 4 + 4.5 * dp, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${(0.35 + 0.55 * dp).toFixed(3)})`;
        ctx!.fill();
      }

      rafId = requestAnimationFrame(frame);
    }

    frame();
    return () => cancelAnimationFrame(rafId);
  }, [rotationSpeed]);

  return (
    <div className={className} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className="w-full h-full"
      />
    </div>
  );
}