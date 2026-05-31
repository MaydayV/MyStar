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
    pts.push(new THREE.Vector3(Math.cos(theta) * ry * r, y * r, Math.sin(theta) * ry * r));
  }
  return pts;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
  AI: "#a855f7", Frontend: "#06b6d4", Backend: "#22c55e", Mobile: "#f43f5e",
  DevOps: "#f97316", Data: "#3b82f6", Tooling: "#64748b", Security: "#ef4444", Other: "#6b7280",
};

const CARD_W = 256, CARD_H = 96, CARD_R = 10;

// ═══════════════════════════════════════════════════════════════════
// Canvas texture — frosted glass card
// ═══════════════════════════════════════════════════════════════════

function createCardTexture(repo: StarRepo): THREE.CanvasTexture {
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  if (!canvas) return new THREE.CanvasTexture();
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  const pad = 10;
  const langColor = getLangColor(repo.language);
  const catColor = CAT_COLORS[repo.category] || "#6b7280";

  // Glass bg
  roundRect(ctx, pad, pad, CARD_W - pad * 2, CARD_H - pad * 2, CARD_R);
  ctx.fillStyle = "rgba(12, 16, 35, 0.82)";
  ctx.fill();

  // Border
  roundRect(ctx, pad, pad, CARD_W - pad * 2, CARD_H - pad * 2, CARD_R);
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Category accent top bar
  ctx.fillStyle = catColor;
  roundRect(ctx, pad, pad, CARD_W - pad * 2, 3, 1.5);
  ctx.fill();

  // Repo name
  const name = repo.name.length > 24 ? repo.name.slice(0, 23) + "\u2026" : repo.name;
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 15px system-ui, -apple-system, sans-serif";
  ctx.fillText(name, pad + 14, pad + 30);

  // Language dot
  ctx.beginPath();
  ctx.arc(pad + 18, pad + 48, 4, 0, Math.PI * 2);
  ctx.fillStyle = langColor;
  ctx.fill();
  ctx.fillStyle = "rgba(148,163,184,0.7)";
  ctx.font = "11px system-ui, -apple-system, sans-serif";
  ctx.fillText(repo.language || "\u2014", pad + 28, pad + 52);

  // Stars
  const starCount = repo.stars >= 1000 ? `${(repo.stars / 1000).toFixed(1)}k` : String(repo.stars);
  ctx.fillStyle = "rgba(250,204,21,0.85)";
  ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("\u2605 " + starCount, pad + 14, pad + 74);

  // Owner
  ctx.fillStyle = "rgba(100,116,139,0.5)";
  ctx.font = "10px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(repo.owner, CARD_W - pad - 12, pad + 74);
  ctx.textAlign = "start";

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ═══════════════════════════════════════════════════════════════════
// Single card — tangent to sphere (curvature via normal alignment)
// ═══════════════════════════════════════════════════════════════════

function RepoCard({
  repo, position, onClick, cardW, cardH,
}: {
  repo: StarRepo;
  position: THREE.Vector3;
  onClick: (url: string) => void;
  cardW: number;
  cardH: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  const texture = useMemo(() => createCardTexture(repo), [repo]);
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize()),
    [position],
  );
  const catColor = CAT_COLORS[repo.category] || "#6b7280";
  const glowMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: catColor, transparent: true, opacity: 0, depthWrite: false }),
    [],
  );

  useEffect(() => { glowMat.opacity = hovered ? 0.25 : 0; glowMat.needsUpdate = true; }, [hovered, glowMat]);

  return (
    <group position={position} quaternion={quat}>
      {/* Glow behind card */}
      <mesh ref={glowRef} material={glowMat} scale={hovered ? [1.14, 1.14, 1] : [1, 1, 1]}>
        <planeGeometry args={[cardW * 1.14, cardH * 1.14]} />
      </mesh>
      {/* Card */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={() => setHover(false)}
        onClick={(e) => { e.stopPropagation(); onClick(repo.htmlUrl); }}
        scale={hovered ? [1.08, 1.08, 1] : [1, 1, 1]}
      >
        <planeGeometry args={[cardW, cardH]} />
        <meshBasicMaterial map={texture} transparent side={THREE.FrontSide} />
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
    for (let i = 0; i < count * 3; i++) arr[i] = (Math.random() - 0.5) * 40;
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count]);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.04; });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.02} color="#334155" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sphere group — responsive radius + curvature
// ═══════════════════════════════════════════════════════════════════

function SphereGroup({ repos, onRepoClick }: { repos: StarRepo[]; onRepoClick: (url: string) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const autoAngle = useRef(0);
  const pointer = useRef({ x: 0, y: 0, active: false });
  const targetRot = useRef({ x: 0, y: 0 });
  const { size } = useThree();

  const radius = useMemo(() => {
    const minDim = Math.min(size.width, size.height);
    const clamped = Math.min(minDim * 0.0052, 6.0);
    return Math.max(clamped, 2.5);
  }, [size.width, size.height]);

  const cardW = useMemo(() => Math.max(radius * 0.32, 0.85), [radius]);
  const cardH = useMemo(() => cardW * 0.375, [cardW]);
  const positions = useMemo(() => fibonacciSphere(repos.length, radius), [repos.length, radius]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / size.width) * 2 - 1;
      pointer.current.y = -(e.clientY / size.height) * 2 + 1;
      pointer.current.active = true;
    };
    const onLeave = () => { pointer.current.active = false; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [size]);

  useFrame((_, delta) => {
    const g = groupRef.current; if (!g) return;
    const { x, y, active } = pointer.current;
    if (!active) {
      autoAngle.current += delta * 0.25;
      g.rotation.y += (autoAngle.current - g.rotation.y) * 0.04;
      g.rotation.x += (0 - g.rotation.x) * 0.04;
      return;
    }
    autoAngle.current = g.rotation.y;
    const dist = Math.sqrt(x * x + y * y);
    const speed = dist < 0.08 ? 0 : Math.min(Math.pow(dist, 0.55) * 0.7, 0.9);
    targetRot.current.y += x * delta * speed;
    targetRot.current.x += y * delta * speed * 0.7;
    g.rotation.y += (targetRot.current.y - g.rotation.y) * 0.06;
    g.rotation.x += (targetRot.current.x - g.rotation.x) * 0.06;
  });

  return (
    <group ref={groupRef}>
      {repos.map((repo, i) => (
        <RepoCard key={repo.id} repo={repo} position={positions[i]} onClick={onRepoClick} cardW={cardW} cardH={cardH} />
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Scene
// ═══════════════════════════════════════════════════════════════════

function Scene({ repos, onRepoClick }: { repos: StarRepo[]; onRepoClick: (url: string) => void }) {
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

export default function StarSphere({ repos, onRepoClick }: { repos: StarRepo[]; onRepoClick: (url: string) => void }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 11], fov: 50, near: 0.5, far: 40 }}
      style={{ position: "fixed", inset: 0, zIndex: 0 }} gl={{ antialias: true, alpha: false }}>
      <Suspense fallback={null}>
        <Scene repos={repos} onRepoClick={onRepoClick} />
      </Suspense>
    </Canvas>
  );
}
