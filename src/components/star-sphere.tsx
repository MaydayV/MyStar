"use client";

import { useRef, useMemo, useCallback, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import type { StarRepo } from "@/lib/types";
import { getLangColor, getGlowColor } from "@/lib/colors";

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

// ── Single repo label (billboard text) ────────────────────────────
function RepoLabel({
  repo,
  position,
  onClick,
}: {
  repo: StarRepo;
  position: THREE.Vector3;
  onClick: (url: string) => void;
}) {
  const [hovered, setHover] = useState(false);
  const color = getLangColor(repo.language);
  const displayName = repo.name.length > 20 ? repo.name.slice(0, 19) + "…" : repo.name;
  const starWeight = Math.min(Math.log10(repo.stars + 1) * 0.4, 1.2); // 0 .. 1.2

  return (
    <Billboard position={position}>
      <Text
        fontSize={hovered ? 0.13 : 0.07 + starWeight * 0.04}
        color={hovered ? "#ffffff" : color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={hovered ? 1 : 0.72}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          onClick(repo.htmlUrl);
        }}
      >
        {displayName}
      </Text>
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

    if (!active) {
      // Gentle auto-rotation
      autoAngle.current += delta * 0.25;
      g.rotation.y += (autoAngle.current - g.rotation.y) * 0.04;
      g.rotation.x += (0 - g.rotation.x) * 0.04;
      return;
    }

    autoAngle.current = g.rotation.y; // sync

    const dist = Math.sqrt(x * x + y * y);
    const speed = dist < 0.08 ? 0 : dist * 1.8;

    targetRot.current.y += x * delta * speed;
    targetRot.current.x += y * delta * speed * 0.7;

    g.rotation.y += (targetRot.current.y - g.rotation.y) * 0.06;
    g.rotation.x += (targetRot.current.x - g.rotation.x) * 0.06;
  });

  return (
    <group ref={groupRef}>
      {repos.map((repo, i) => (
        <RepoLabel key={repo.id} repo={repo} position={positions[i]} onClick={onRepoClick} />
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
