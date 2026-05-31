"use client";

import { useRef, useMemo, useState, useEffect, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { StarRepo } from "@/lib/types";
import { getLangColor } from "@/lib/colors";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function fibonacciSphere(n: number, r: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const ry = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pts.push(
      new THREE.Vector3(
        Math.cos(theta) * ry * r,
        y * r,
        Math.sin(theta) * ry * r,
      ),
    );
  }
  return pts;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ═══════════════════════════════════════════════════════════════════
// Card geometry — proportional to Fibonacci point spacing
// ═══════════════════════════════════════════════════════════════════

function avgNeighbourDist(n: number, r: number): number {
  return r * Math.sqrt((4 * Math.PI) / n);
}

function getCardDims(n: number, r: number) {
  const avgDist = avgNeighbourDist(n, r);
  const w = avgDist * 0.94; // 94 % → near-zero gap, mosaic / puzzle fit
  const h = w * 0.36;
  return { w, h, avgDist };
}

// ═══════════════════════════════════════════════════════════════════
// Canvas texture — frosted glass card with reflection
// ═══════════════════════════════════════════════════════════════════

const TEX_W = 192;
const TEX_H = 72;

function createCardTexture(repo: StarRepo): THREE.CanvasTexture {
  if (typeof document === "undefined") return new THREE.CanvasTexture();
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;
  const pad = 7;
  const langColor = getLangColor(repo.language);

  // ── Glass body — gradient from lighter top-left to darker bottom-right ──
  const grad = ctx.createLinearGradient(pad, pad, TEX_W - pad, TEX_H - pad);
  grad.addColorStop(0, "rgba(30, 41, 82, 0.72)");
  grad.addColorStop(0.35, "rgba(14, 18, 42, 0.84)");
  grad.addColorStop(1, "rgba(6, 8, 24, 0.92)");
  roundRect(ctx, pad, pad, TEX_W - pad * 2, TEX_H - pad * 2, 6);
  ctx.fillStyle = grad;
  ctx.fill();

  // ── Glass border — white, low opacity ──
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // ── Top glass reflection / shine ──
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  roundRect(
    ctx,
    pad + 3,
    pad + 2,
    TEX_W - pad * 2 - 6,
    (TEX_H - pad * 2) * 0.45,
    4,
  );
  ctx.fill();

  // ── Subtle inner shadow (bottom edge) ──
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  roundRect(ctx, pad + 2, TEX_H - pad - 8, TEX_W - pad * 2 - 4, 6, 3);
  ctx.fill();

  // ── Repo name ──
  const name =
    repo.name.length > 24 ? repo.name.slice(0, 23) + "\u2026" : repo.name;
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 14px system-ui, -apple-system, sans-serif";
  ctx.fillText(name, pad + 14, pad + 30);

  // ── Language dot + star count ──
  ctx.beginPath();
  ctx.arc(pad + 16, pad + 48, 4, 0, Math.PI * 2);
  ctx.fillStyle = langColor;
  ctx.fill();

  const starCount =
    repo.stars >= 1000
      ? `${(repo.stars / 1000).toFixed(1)}k`
      : String(repo.stars);
  ctx.fillStyle = "rgba(148,163,184,0.6)";
  ctx.font = "11px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    `${repo.language || "\u2014"}  \u2605${starCount}`,
    pad + 25,
    pad + 53,
  );

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ═══════════════════════════════════════════════════════════════════
// Single card — flat sticker, no hover glow, frosted glass texture
// ═══════════════════════════════════════════════════════════════════

function RepoCard({
  repo,
  position,
  onClick,
  cardW,
  cardH,
}: {
  repo: StarRepo;
  position: THREE.Vector3;
  onClick: (url: string) => void;
  cardW: number;
  cardH: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  const texture = useMemo(() => createCardTexture(repo), [repo]);

  const quat = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        position.clone().normalize(),
      ),
    [position],
  );

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      onClick(repo.htmlUrl);
    },
    [onClick, repo.htmlUrl],
  );

  return (
    <group position={position} quaternion={quat}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          setHover(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
          setHover(false);
        }}
        onClick={handleClick}
        scale={hovered ? [1.06, 1.06, 1] : [1, 1, 1]}
      >
        <planeGeometry args={[cardW, cardH]} />
        <meshBasicMaterial
          map={texture}
          transparent
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Background particles
// ═══════════════════════════════════════════════════════════════════

function Particles({ count = 400 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++)
      arr[i] = (Math.random() - 0.5) * 40;
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.04;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.02}
        color="#334155"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sphere group — slow edges + pause (spacebar / right-click)
// ═══════════════════════════════════════════════════════════════════

function SphereGroup({
  repos,
  onRepoClick,
}: {
  repos: StarRepo[];
  onRepoClick: (url: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const autoAngle = useRef(0);
  const pointer = useRef({ x: 0, y: 0, active: false });
  const targetRot = useRef({ x: 0, y: 0 });
  const { size } = useThree();
  const pausedRef = useRef(false);

  // ── Responsive radius ──
  const radius = useMemo(() => {
    const minDim = Math.min(size.width, size.height);
    const clamped = Math.min(minDim * 0.0052, 6.0);
    return Math.max(clamped, 2.5);
  }, [size.width, size.height]);

  const { w: cardW, h: cardH } = useMemo(
    () => getCardDims(repos.length, radius),
    [repos.length, radius],
  );

  const positions = useMemo(
    () => fibonacciSphere(repos.length, radius),
    [repos.length, radius],
  );

  // ── Pointer tracking ──
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / size.width) * 2 - 1;
      pointer.current.y = -(e.clientY / size.height) * 2 + 1;
      pointer.current.active = true;
    };
    const onLeave = () => {
      pointer.current.active = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [size]);

  // ── Pause toggles: spacebar & right-click ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        pausedRef.current = !pausedRef.current;
      }
    };
    const onCtx = (e: MouseEvent) => {
      e.preventDefault();
      pausedRef.current = !pausedRef.current;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("contextmenu", onCtx);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("contextmenu", onCtx);
    };
  }, []);

  // ── Rotation — gentle speed, even at screen edges ──
  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const { x, y, active } = pointer.current;

    if (!active || pausedRef.current) {
      if (!pausedRef.current) {
        autoAngle.current += delta * 0.25;
        g.rotation.y += (autoAngle.current - g.rotation.y) * 0.04;
        g.rotation.x += (0 - g.rotation.x) * 0.04;
      }
      return;
    }

    autoAngle.current = g.rotation.y;

    const dist = Math.sqrt(x * x + y * y);
    // Strong sub-linear damping — rises slowly, caps low so edges don't spin too fast
    const speed =
      dist < 0.06 ? 0 : Math.min(Math.pow(dist, 0.35) * 0.45, 0.5);

    targetRot.current.y += x * delta * speed;
    targetRot.current.x += y * delta * speed * 0.7;

    g.rotation.y += (targetRot.current.y - g.rotation.y) * 0.07;
    g.rotation.x += (targetRot.current.x - g.rotation.x) * 0.07;
  });

  return (
    <group ref={groupRef}>
      {repos.map((repo, i) => (
        <RepoCard
          key={repo.id}
          repo={repo}
          position={positions[i]}
          onClick={onRepoClick}
          cardW={cardW}
          cardH={cardH}
        />
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Scene
// ═══════════════════════════════════════════════════════════════════

function Scene({
  repos,
  onRepoClick,
}: {
  repos: StarRepo[];
  onRepoClick: (url: string) => void;
}) {
  return (
    <>
      <color attach="background" args={["#060610"]} />
      <fog attach="fog" args={["#060610", 8, 22]} />
      <ambientLight intensity={0.6} />
      <Particles />
      <SphereGroup repos={repos} onRepoClick={onRepoClick} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════

export default function StarSphere({
  repos,
  onRepoClick,
}: {
  repos: StarRepo[];
  onRepoClick: (url: string) => void;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 11], fov: 50, near: 0.5, far: 40 }}
      style={{ position: "fixed", inset: 0, zIndex: 0 }}
      gl={{ antialias: true, alpha: false }}
    >
      <Suspense fallback={null}>
        <Scene repos={repos} onRepoClick={onRepoClick} />
      </Suspense>
    </Canvas>
  );
}
