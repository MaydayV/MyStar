"use client";

import { useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import type { StarRepo } from "@/lib/types";
import { getLangColor } from "@/lib/colors";

// ─────────────────────────────────────────────────────────────
// Dynamic import — Globe creates its own canvas, no SSR
// ─────────────────────────────────────────────────────────────
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface GlobePoint {
  lat: number;
  lng: number;
  repo: StarRepo;
}

// ─────────────────────────────────────────────────────────────
// Fibonacci sphere → lat/lng (even distribution on sphere)
// ─────────────────────────────────────────────────────────────
function fibonacciToLatLng(
  i: number,
  n: number,
): { lat: number; lng: number } {
  const phi = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / (n - 1)) * 2; // [-1, 1]
  const ry = Math.sqrt(1 - y * y);
  const theta = phi * i;
  const x = Math.cos(theta) * ry;
  const z = Math.sin(theta) * ry;

  const lat = Math.asin(y) * (180 / Math.PI);
  const lng = Math.atan2(z, x) * (180 / Math.PI);

  return { lat, lng };
}

// ─────────────────────────────────────────────────────────────
// Create a DOM card element for a repo (frosted glass style)
// ─────────────────────────────────────────────────────────────
function createCardElement(
  d: GlobePoint,
  onClick: (url: string) => void,
): HTMLElement {
  const repo = d.repo;
  const langColor = getLangColor(repo.language);
  const starLabel =
    repo.stars >= 1000
      ? `${(repo.stars / 1000).toFixed(1)}k`
      : String(repo.stars);
  const displayName =
    repo.name.length > 22
      ? repo.name.slice(0, 21) + "\u2026"
      : repo.name;

  const card = document.createElement("div");
  card.className = "globe-card";
  card.setAttribute("data-repo-url", repo.htmlUrl);

  // Inner structure
  card.innerHTML = `
    <div class="globe-card-inner">
      <span class="globe-card-name">${escapeHtml(displayName)}</span>
      <span class="globe-card-meta">
        <span class="globe-card-dot" style="background:${langColor}"></span>
        <span class="globe-card-lang">${escapeHtml(repo.language || "\u2014")}</span>
        <span class="globe-card-stars">\u2605${starLabel}</span>
      </span>
    </div>
  `;

  // Click handler — use pointerdown for better globe.gl compatibility
  card.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick(repo.htmlUrl);
  });

  card.style.cursor = "pointer";

  return card;
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════

export default function StarSphere({
  repos,
  onRepoClick,
}: {
  repos: StarRepo[];
  onRepoClick: (url: string) => void;
}) {
  // ── Convert repos to globe points (Fibonacci sphere) ──
  const points: GlobePoint[] = useMemo(() => {
    return repos.map((repo, i) => {
      const { lat, lng } = fibonacciToLatLng(i, repos.length);
      return { lat, lng, repo };
    });
  }, [repos]);

  // ── Globe material — dark, subtle ──
  const globeMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: "#0a0d1a",
        emissive: "#020410",
        emissiveIntensity: 0.3,
        shininess: 5,
        specular: "#1a1a3e",
      }),
    [],
  );

  // ── HTML element renderer ──
  const htmlElement = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => createCardElement(d as GlobePoint, onRepoClick),
    [onRepoClick],
  );

  // ── Card visibility: fade out when behind globe ──
  const htmlElementVisibilityModifier = useCallback(
    (el: unknown, isVisible: boolean) => {
      (el as HTMLElement).style.opacity = isVisible ? "1" : "0";
      (el as HTMLElement).style.pointerEvents = isVisible ? "auto" : "none";
    },
    [],
  );

  return (
    <div className="globe-container">
      <Globe
        // ── Container ──
        backgroundColor="#060610"
        animateIn={true}
        waitForGlobeReady={true}
        // ── Globe surface ──
        showGlobe={true}
        showAtmosphere={true}
        atmosphereColor="#4f8fff"
        atmosphereAltitude={0.12}
        globeMaterial={globeMaterial}
        globeCurvatureResolution={3}
        // ── HTML cards ──
        htmlElementsData={points}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.02}
        htmlElement={htmlElement}
        htmlElementVisibilityModifier={htmlElementVisibilityModifier}
        htmlTransitionDuration={600}
      />
    </div>
  );
}
