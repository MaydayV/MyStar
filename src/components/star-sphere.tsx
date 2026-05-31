"use client";

import { useRef, useMemo, useState, useEffect, Suspense } from "react";
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

const CAT_COLORS: Record<string, string> = {
  AI: "#a855f7",
  Frontend: "#06b6d4",
  Backend: "#22c55e",
  Mobile: "#f43f5e",
  DevOps: "#f97316",
  Data: "#3b82f6",
  Tooling: "#64748b",
  Security: "#ef4444",
  Other: "#6b7280",
};

// ═══════════════════════════════════════════════════════════════════
// Card geometry: proportional to Fibonacci point spacing
// ═══════════════════════════════════════════════════════════════════

/** Average great-circle neighbour distance on Fibonacci sphere */
function avgNeighbourDist(n: number, r: number): number {
  return r * Math.sqrt((4 * Math.PI) / n);
}

function getCardDims(n: number, r: number) {
  const avgDist = avgNeighbourDist(n, r);
  const w = avgDist * 0.7; // 70 % → leaves a tiny gap like mosaic grout
  const h = w * 0.36;
  return { w, h, avgDist };
}

// ═══════════════════════════════════════════════════════════════════
// Canvas texture — frosted glass card
// ═══════════════════════════════════════════════════════════════════

const TEX_W = 160;
const TEX_H = 60;

function createCardTexture(repo: StarRepo): THREE.CanvasTexture {
  if (typeof document === "undefined") return new THREE.CanvasTexture();
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;
  const pad = 6;
  const langColor = getLangColor(repo.language);
  const catColor = CAT_COLORS[repo.category] || "#6b7280";

  // ── Glass bg ──
  roundRect(ctx, pad, pad, TEX_W - pad * 2, TEX_H - pad * 2, 5);
  ctx.fillStyle = "rgba(12, 16, 38, 0.85)";
  ctx.fill();

  // ── Border ──
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // ── Category accent left bar ──
  ctx.fillStyle = catColor;
  roundRect(ctx, pad, pad, 3, TEX_H - pad * 2, 1.5);
  ctx.fill();

  // ── Repo name ──
  const name =
    repo.name.length > 22 ? repo.name.slice(0, 21) + "\u2026" : repo.name;
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 13px system-ui, -apple-system, sans-serif";
  ctx.fillText(name, pad + 12, pad + 26);

  // ── Language dot + star count ──
  ctx.beginPath();
  ctx.arc(pad + 14, pad + 42, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = langColor;
  ctx.fill();

  const starCount =
    repo.stars >= 1000
      ? `${(repo.stars / 1000).toFixed(1)}k`
      : String(repo.stars);
  ctx.fillStyle = "rgba(148,163,184,0.65)";
  ctx.font = "10px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    `${repo.language || "\u2014"}  \u2605${starCount}`,
    pad + 22,
    pad + 46,
  );

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ═══════════════════════════════════════════════════════════════════
// Single card — flat like a sticker on a globe
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

  // Align plane normal → radial direction (tangent to sphere surface)
  const quat = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        position.clone().normalize(),
      ),
    [position],
  );

  // Outline material (only visible on hover)
  const outlineMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: CAT_COLORS[repo.category] || "#6b7280",
        transparent: true,
        opacity: 0,
        side: THREE.FrontSide,
        depthTest: true,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => {
    outlineMat.opacity = hovered ? 0.28 : 0;
    outlineMat.needsUpdate = true;
  }, [hovered, outlineMat]);

  return (
    <group position={position} quaternion={quat}>
      {/* Outline — behind card in local z, raycast disabled */}
      <mesh
        material={outlineMat}
        position={[0, 0, -0.005]}
        raycast={() => null}
        scale={hovered ? [1.05, 1.05, 1] : [1, 1, 1]}
      >
        <planeGeometry args={[cardW * 1.12, cardH * 1.12]} />
      </mesh>

      {/* Card face */}
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
        onClick={(e) => {
          e.stopPropagation();
          onClick(repo.htmlUrl);
        }}
        scale={hovered ? [1.04, 1.04, 1] : [1, 1, 1]}
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
// Sphere group
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

  // ── Responsive radius ──
  const radius = useMemo(() => {
    const minDim = Math.min(size.width, size.height);
    const clamped = Math.min(minDim * 0.0052, 6.0);
    return Math.max(clamped, 2.5);
  }, [size.width, size.height]);

  // ── Card size = 70 % of average neighbour distance (no overlap) ──
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

  // ── Rotation ──
  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const { x, y, active } = pointer.current;

    if (!active) {
      autoAngle.current += delta * 0.25;
      g.rotation.y += (autoAngle.current - g.rotation.y) * 0.04;
      g.rotation.x += (0 - g.rotation.x) * 0.04;
      return;
    }

    autoAngle.current = g.rotation.y;

    const dist = Math.sqrt(x * x + y * y);
    const speed =
      dist < 0.08 ? 0 : Math.min(Math.pow(dist, 0.55) * 0.7, 0.9);

    targetRot.current.y += x * delta * speed;
    targetRot.current.x += y * delta * speed * 0.7;

    g.rotation.y += (targetRot.current.y - g.rotation.y) * 0.06;
    g.rotation.x += (targetRot.current.x - g.rotation.x) * 0.06;
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
