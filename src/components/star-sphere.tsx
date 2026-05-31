"use client";

import { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Billboard } from "@react-three/drei";
import * as THREE from "three";
import type { StarRepo } from "@/lib/types";
import { getLangColor } from "@/lib/colors";

// ── Fibonacci sphere ──────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────
function formatStars(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Compact frosted-glass repo label ───────────────────────────────
function RepoCard({
  repo,
  position,
  onClick,
  isOverCardRef,
}: {
  repo: StarRepo;
  position: THREE.Vector3;
  onClick: (url: string) => void;
  isOverCardRef: React.MutableRefObject<boolean>;
}) {
  const [hovered, setHover] = useState(false);
  const color = getLangColor(repo.language);
  const displayName = repo.name.length > 20 ? repo.name.slice(0, 19) + "\u2026" : repo.name;

  const handlePointerOver = (e: React.PointerEvent) => {
    e.stopPropagation();
    isOverCardRef.current = true;
    setHover(true);
  };

  const handlePointerOut = () => {
    isOverCardRef.current = false;
    setHover(false);
  };

  return (
    <Billboard position={position}>
      <Html
        transform
        center
        distanceFactor={16}
        occlude={false}
        style={{ pointerEvents: "auto" }}
      >
        <div
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={(e) => {
            e.stopPropagation();
            onClick(repo.htmlUrl);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: hovered
              ? "rgba(30, 41, 59, 0.85)"
              : "rgba(10, 18, 32, 0.55)",
            backdropFilter: "blur(6px) saturate(80%)",
            WebkitBackdropFilter: "blur(6px) saturate(80%)",
            border: `1px solid ${
              hovered ? hexToRgba(color, 0.4) : "rgba(148, 163, 184, 0.06)"
            }`,
            borderLeft: `2px solid ${color}`,
            borderRadius: "5px",
            padding: "3px 8px 3px 6px",
            width: "fit-content",
            maxWidth: "110px",
            whiteSpace: "nowrap",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: hovered ? "scale(1.15)" : "scale(1)",
            boxShadow: hovered
              ? `0 0 12px ${hexToRgba(color, 0.25)}, 0 2px 12px rgba(0,0,0,0.35)`
              : "0 1px 4px rgba(0,0,0,0.2)",
            fontFamily:
              "'Inter', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
            userSelect: "none",
          }}
        >
          {/* Language dot */}
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: color,
              flexShrink: 0,
            }}
          />
          {/* Repo name */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#e2e8f0",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayName}
          </span>
          {/* Stars */}
          {hovered && (
            <span
              style={{
                fontSize: 9,
                color: "#fbbf24",
                flexShrink: 0,
                marginLeft: 2,
              }}
            >
              {"\u2B50"}{formatStars(repo.stars)}
            </span>
          )}
        </div>
      </Html>
    </Billboard>
  );
}

// ── Background particles ──────────────────────────────────────────
function Particles({ count = 400 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) arr[i] = (Math.random() - 0.5) * 40;
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.04;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.02} color="#334155" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// ── The sphere group ──────────────────────────────────────────────
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
  const isOverCard = useRef(false);
  const { size } = useThree();

  const radius = 5.5;
  const positions = useMemo(() => fibonacciSphere(repos.length, radius), [repos.length]);

  // Track pointer
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

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const { x, y, active } = pointer.current;

    // Pause rotation while hovering a card
    if (!active || isOverCard.current) {
      autoAngle.current += delta * 0.25;
      g.rotation.y += (autoAngle.current - g.rotation.y) * 0.04;
      g.rotation.x += (0 - g.rotation.x) * 0.04;
      return;
    }

    autoAngle.current = g.rotation.y; // sync

    const dist = Math.sqrt(x * x + y * y);
    // Sub-linear speed curve — edges rotate proportionally slower
    const speed = dist < 0.08 ? 0 : Math.min(Math.pow(dist, 0.55) * 0.7, 0.9);

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
          isOverCardRef={isOverCard}
        />
      ))}
    </group>
  );
}

// ── Canvas scene ──────────────────────────────────────────────────
function Scene({ repos, onRepoClick }: { repos: StarRepo[]; onRepoClick: (url: string) => void }) {
  return (
    <>
      <color attach="background" args={["#060610"]} />
      <fog attach="fog" args={["#060610", 8, 22]} />
      <ambientLight intensity={0.4} />
      <Particles />
      <SphereGroup repos={repos} onRepoClick={onRepoClick} />
    </>
  );
}

// ── Exported component ────────────────────────────────────────────
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
