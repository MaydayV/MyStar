"use client";

import { useRef, useMemo, useState, useEffect, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { StarRepo } from "@/lib/types";
import { getLangColor } from "@/lib/colors";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface FaceData {
  center: THREE.Vector3;
  normal: THREE.Vector3;
  area: number;
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

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
// Geodesic face extraction from IcosahedronGeometry
// ═══════════════════════════════════════════════════════════════════

function extractFaces(geo: THREE.BufferGeometry): FaceData[] {
  const pos = geo.getAttribute("position");
  const faces: FaceData[] = [];

  for (let i = 0; i < pos.count; i += 3) {
    const a = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
    const b = new THREE.Vector3(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1));
    const c = new THREE.Vector3(pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2));
    // Face center on sphere surface
    const center = a.clone().add(b).add(c).multiplyScalar(1 / 3).normalize();
    faces.push({
      center,
      normal: center.clone(),
      area: new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).length() / 2,
    });
  }
  return faces;
}

// ═══════════════════════════════════════════════════════════════════
// Canvas texture — frosted glass card
// ═══════════════════════════════════════════════════════════════════

const TEX_W = 300;
const TEX_H = 108;
const PAD = 8;

function createCardTexture(repo: StarRepo): THREE.CanvasTexture {
  if (typeof document === "undefined") return new THREE.CanvasTexture();
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;
  const langColor = getLangColor(repo.language);

  // ── Frosted glass base — multi-stop gradient ──
  roundRect(ctx, 2, 2, TEX_W - 4, TEX_H - 4, 10);
  const grad = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
  grad.addColorStop(0, "rgba(18, 22, 52, 0.94)");
  grad.addColorStop(0.3, "rgba(22, 28, 60, 0.88)");
  grad.addColorStop(0.7, "rgba(16, 20, 48, 0.90)");
  grad.addColorStop(1, "rgba(14, 18, 44, 0.94)");
  ctx.fillStyle = grad;
  ctx.fill();

  // ── Glass border ──
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Inner glass sheen (top half highlight) ──
  roundRect(ctx, 3, 3, TEX_W - 6, TEX_H / 2 - 2, 8);
  ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
  ctx.fill();

  // ── Owner / Repo name ──
  const ownerSlash = `${repo.owner}/`;
  ctx.fillStyle = "rgba(148, 163, 184, 0.65)";
  ctx.font = "400 12px system-ui, -apple-system, sans-serif";
  const ownerW = ctx.measureText(ownerSlash).width;
  ctx.fillText(ownerSlash, PAD + 12, PAD + 30);

  const maxNameW = TEX_W - PAD * 2 - 24 - ownerW - 12;
  let name = repo.name;
  ctx.fillStyle = "#e8ecf4";
  ctx.font = "600 14px system-ui, -apple-system, sans-serif";
  if (ctx.measureText(name).width > maxNameW) {
    while (name.length > 2 && ctx.measureText(name + "\u2026").width > maxNameW)
      name = name.slice(0, -1);
    name += "\u2026";
  }
  ctx.fillText(name, PAD + 12 + ownerW + 8, PAD + 30);

  // ── Description ──
  if (repo.description) {
    const maxDesc = 60;
    const desc = repo.description.length > maxDesc
      ? repo.description.slice(0, maxDesc - 1) + "\u2026"
      : repo.description;
    ctx.fillStyle = "rgba(148, 163, 184, 0.45)";
    ctx.font = "400 10px system-ui, -apple-system, sans-serif";
    ctx.fillText(desc, PAD + 12, PAD + 52);
  }

  // ── Bottom row: lang dot + lang name + stars ──
  const bottomY = repo.description ? PAD + 68 : PAD + 58;

  // Language dot
  ctx.beginPath();
  ctx.arc(PAD + 15, bottomY + 2, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = langColor;
  ctx.fill();

  // Language name
  ctx.fillStyle = "rgba(148, 163, 184, 0.65)";
  ctx.font = "400 11px system-ui, -apple-system, sans-serif";
  ctx.fillText(repo.language || "\u2014", PAD + 25, bottomY + 6);

  // Star count
  const starStr = repo.stars >= 1000
    ? `${(repo.stars / 1000).toFixed(1)}k`
    : String(repo.stars);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(203, 213, 225, 0.55)";
  ctx.fillText(`\u2605 ${starStr}`, TEX_W - PAD - 8, bottomY + 6);
  ctx.textAlign = "left";

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ═══════════════════════════════════════════════════════════════════
// Single frosted glass card — positioned at geodesic face center
// ═══════════════════════════════════════════════════════════════════

function RepoCard({
  repo,
  faceData,
  onClick,
}: {
  repo: StarRepo;
  faceData: FaceData;
  onClick: (url: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  const texture = useMemo(() => createCardTexture(repo), [repo]);

  // Card size proportional to face area
  const cardSize = useMemo(() => {
    // Approximate edge length of equilateral triangle with given area
    const L = Math.sqrt((faceData.area * 4) / Math.sqrt(3));
    // Card size proportional to face (sphere radius controls overall scale)
    const w = L * 0.55;
    const h = w * (TEX_H / TEX_W);
    return { w, h };
  }, [faceData.area]);

  // Slightly offset from sphere surface
  const cardPos = useMemo(
    () => faceData.center.clone().multiplyScalar(1.025),
    [faceData.center],
  );

  const quat = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        faceData.normal,
      ),
    [faceData.normal],
  );

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onClick(repo.htmlUrl);
    },
    [onClick, repo.htmlUrl],
  );

  return (
    <group position={cardPos} quaternion={quat}>
      {/* Card shadow plate */}
      <mesh position={[0, 0, -0.005]} scale={[1.03, 1.03, 1]}>
        <planeGeometry args={[cardSize.w, cardSize.h]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* Main card */}
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
        scale={hovered ? [1.10, 1.10, 1] : [1, 1, 1]}
      >
        <planeGeometry args={[cardSize.w, cardSize.h]} />
        <meshBasicMaterial
          map={texture}
          transparent
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Background particles
// ═══════════════════════════════════════════════════════════════════

function Particles({ count = 300 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++)
      arr[i] = (Math.random() - 0.5) * 35;
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.03;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.015}
        color="#4a5568"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Geodesic glass sphere backdrop
// ═══════════════════════════════════════════════════════════════════

function GlassSphere({ radius }: { radius: number }) {
  const sphereGeo = useMemo(
    () => new THREE.IcosahedronGeometry(radius, 3),
    [radius],
  );

  const edgeGeo = useMemo(
    () => new THREE.EdgesGeometry(sphereGeo, 25),
    [sphereGeo],
  );

  return (
    <group>
      {/* Frosted glass surface */}
      <mesh geometry={sphereGeo}>
        <meshStandardMaterial
          color="#08082a"
          metalness={0.05}
          roughness={0.4}
          transparent
          opacity={0.10}
          depthWrite={false}
        />
      </mesh>

      {/* Geodesic wireframe — subtle blue glow lines */}
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial
          color="#4466cc"
          transparent
          opacity={0.06}
          depthTest
        />
      </lineSegments>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sphere group — rotation, cards, pause controls
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
    // 0.014 gives 1.4x viewport height — sphere dominates the viewport
    const clamped = Math.min(minDim * 0.014, 10.0);
    return Math.max(clamped, 4.0);
  }, [size.width, size.height]);

  // ── Geodesic face data (icosahedron subdiv 3 = 1280 faces) ──
  const faceData = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(radius, 3).toNonIndexed();
    return extractFaces(geo);
  }, [radius]);

  // ── Map repos to faces ──
  const repoFaces = useMemo(() => {
    return repos.slice(0, faceData.length).map((repo, i) => ({
      repo,
      face: faceData[i],
    }));
  }, [repos, faceData]);

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

  // ── Rotation — edge-dampened speed curve ──
  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const { x, y, active } = pointer.current;

    // ── Auto-rotate when idle ──
    if (!active || pausedRef.current) {
      if (!pausedRef.current) {
        // Auto-rotate at ~28°/s (up from ~14°/s) — fast enough to be clearly visible
        autoAngle.current += delta * 0.5;
        g.rotation.y += (autoAngle.current - g.rotation.y) * 0.06;
        g.rotation.x += (0 - g.rotation.x) * 0.06;
      }
      return;
    }

    // Save auto-position so resume is seamless
    autoAngle.current = g.rotation.y;

    const dist = Math.sqrt(x * x + y * y);

    // ── Edge dampening: progressively reduce speed beyond 60% radius ──
    // dist 0.6 → edgeFactor 1.0 (full speed)
    // dist 1.0 → edgeFactor 0.35 (65% reduction)
    const edgeThreshold = 0.6;
    const edgeZone = dist > edgeThreshold
      ? Math.min(1, (dist - edgeThreshold) / (1 - edgeThreshold))
      : 0;
    const edgeFactor = 1 - edgeZone * 0.65;

    // ── Speed curve: sub-linear growth, dampened at edges ──
    const rawSpeed = Math.pow(dist, 0.6) * 0.42;
    const speed = dist < 0.04 ? 0 : Math.min(rawSpeed * edgeFactor, 0.48);

    // ── Accumulate rotation targets with smooth lerp ──
    targetRot.current.y += x * delta * speed;
    targetRot.current.x += y * delta * speed * 0.6;

    g.rotation.y += (targetRot.current.y - g.rotation.y) * 0.07;
    g.rotation.x += (targetRot.current.x - g.rotation.x) * 0.07;
  });

  return (
    <group ref={groupRef}>
      <GlassSphere radius={radius} />
      {repoFaces.map(({ repo, face }) => (
        <RepoCard
          key={repo.id}
          repo={repo}
          faceData={face}
          onClick={onRepoClick}
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
      <color attach="background" args={["#05050e"]} />
      <fog attach="fog" args={["#060610", 3, 18]} />
      <ambientLight intensity={0.5} />
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
      camera={{ position: [0, 0, 6], fov: 55, near: 0.5, far: 25 }}
      style={{ position: "fixed", inset: 0, zIndex: 0 }}
      gl={{ antialias: true, alpha: false }}
    >
      <Suspense fallback={null}>
        <Scene repos={repos} onRepoClick={onRepoClick} />
      </Suspense>
    </Canvas>
  );
}
