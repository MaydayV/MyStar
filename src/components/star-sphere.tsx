"use client";

import { useRef, useMemo, useState, useEffect, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
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

// ═══════════════════════════════════════════════════════════════════
// Card geometry — proportional to Fibonacci point spacing
// ═══════════════════════════════════════════════════════════════════

function avgNeighbourDist(n: number, r: number): number {
  return r * Math.sqrt((4 * Math.PI) / n);
}

function getCardDims(n: number, r: number) {
  const avgDist = avgNeighbourDist(n, r);
  const w = avgDist * 0.94;
  const h = w * 0.36;
  return { w, h, avgDist };
}

// ═══════════════════════════════════════════════════════════════════
// Single card — clean puzzle tile
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
  const [hovered, setHover] = useState(false);
  const langColor = getLangColor(repo.language);

  const quat = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        position.clone().normalize(),
      ),
    [position],
  );

  const starLabel = useMemo(() => {
    return repo.stars >= 1000
      ? `${(repo.stars / 1000).toFixed(1)}k`
      : String(repo.stars);
  }, [repo.stars]);

  const displayName = useMemo(() => {
    return repo.name.length > 26
      ? repo.name.slice(0, 25) + "\u2026"
      : repo.name;
  }, [repo.name]);

  // Font size scales with card height — keeps text proportional
  const titleSize = cardH * 0.38;
  const metaSize = cardH * 0.30;
  const langDotR = metaSize * 0.55;

  return (
    <group
      position={position}
      quaternion={quat}
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
      scale={hovered ? [1.06, 1.06, 1.06] : [1, 1, 1]}
    >
      {/* Card background — solid, no gradient, no blur */}
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[cardW, cardH]} />
        <meshBasicMaterial color="#0d1125" transparent opacity={0.92} />
      </mesh>

      {/* Subtle border line */}
      <mesh position={[0, 0, -0.003]}>
        <planeGeometry args={[cardW - 0.012, cardH - 0.012]} />
        <meshBasicMaterial color="#1e2a4a" transparent opacity={0.6} />
      </mesh>

      {/* Inner face */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[cardW - 0.02, cardH - 0.02]} />
        <meshBasicMaterial color="#0b1020" transparent opacity={0.95} />
      </mesh>

      {/* Repo name — SDF text, crisp at any scale */}
      <Text
        position={[-cardW * 0.42, cardH * 0.15, 0.006]}
        fontSize={titleSize}
        color="#e2e8f0"
        anchorX="left"
        anchorY="middle"
        maxWidth={cardW * 0.84}
        overflowWrap="break-word"
      >
        {displayName}
      </Text>

      {/* Language dot */}
      <mesh position={[-cardW * 0.42, -cardH * 0.22, 0.006]}>
        <circleGeometry args={[langDotR, 16]} />
        <meshBasicMaterial color={langColor} />
      </mesh>

      {/* Language + stars label */}
      <Text
        position={[-cardW * 0.42 + langDotR * 2.5, -cardH * 0.22, 0.006]}
        fontSize={metaSize}
        color="rgba(148,163,184,0.7)"
        anchorX="left"
        anchorY="middle"
      >
        {`${repo.language || "\u2014"}  \u2605${starLabel}`}
      </Text>
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
// Sphere group — pause + gentle rotation
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

  // ── Pause: spacebar & right-click ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
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

  // ── Rotation — gentle, damped at edges ──
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
