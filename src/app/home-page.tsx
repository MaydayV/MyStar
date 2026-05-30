"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import StarSphere from "@/components/star-sphere";
import type { StarRepo } from "@/lib/types";
import { CATEGORIES } from "@/lib/repos";

const ALL_CATEGORIES = ["All", ...CATEGORIES] as const;

export default function HomePage({
  repos: initialRepos,
  username,
}: {
  repos: StarRepo[];
  username: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [query, setQuery] = useState("");

  useEffect(() => setMounted(true), []);

  const filtered = useMemo(() => {
    return initialRepos.filter((repo) => {
      const inCategory = activeCategory === "All" || repo.category === activeCategory;
      const searchable = `${repo.fullName} ${repo.description} ${repo.topics.join(" ")}`.toLowerCase();
      return inCategory && searchable.includes(query.toLowerCase());
    });
  }, [activeCategory, query, initialRepos]);

  const handleRepoClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!mounted) return null;

  return (
    <>
      {/* 3D sphere background */}
      <StarSphere repos={filtered} onRepoClick={handleRepoClick} />

      {/* Floating top bar */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="floating-bar"
      >
        <div className="floating-bar-inner">
          <div className="brand-pill">
            <span className="brand-dot" />
            @{username}
          </div>

          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search repos…"
              className="search-field"
            />
            {query && (
              <button onClick={() => setQuery("")} className="search-clear" aria-label="clear">
                ×
              </button>
            )}
          </div>

          <div className="cat-scroll">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={clsx("cat-pill", activeCategory === cat && "cat-pill-active")}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="meta-text">
            {filtered.length} / {initialRepos.length} repos
          </div>
        </div>
      </motion.header>

      {/* Footer hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="footer-hint"
      >
        <span className="text-white/25 text-xs tracking-wider">
          move mouse to rotate · click any label to open repo
        </span>
      </motion.div>
    </>
  );
}
