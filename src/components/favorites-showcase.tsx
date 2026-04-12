"use client";

import { useMemo, useState, useEffect } from "react";
import clsx from "clsx";
import type { RepoCategory, StarRepo } from "@/lib/types";

interface Props {
  repos: StarRepo[];
  categories: RepoCategory[];
  username: string;
  generatedAt: string;
}

const ITEMS_PER_PAGE = 32;

export default function FavoritesShowcase({ repos, categories, username, generatedAt }: Props) {
  const [activeCategory, setActiveCategory] = useState<RepoCategory | "All">("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return repos.filter((repo) => {
      const inCategory = activeCategory === "All" || repo.category === activeCategory;
      const searchable = `${repo.fullName} ${repo.description} ${repo.topics.join(" ")}`.toLowerCase();
      const hit = searchable.includes(query.toLowerCase());
      return inCategory && hit;
    });
  }, [activeCategory, query, repos]);

  const displayed = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filtered.slice(start, end);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, query]);

  return (
    <div className="app-stack">
      <section className="card top-panel">
        <div className="top-panel-head">
          <div>
            <div className="brand">github收藏夹</div>
            <h2 className="mt-3 text-xl font-bold">仓库发现中心</h2>
            <p className="mt-2 text-sm text-slate-600">
              基于
              <a
                href={`https://github.com/${username}`}
                target="_blank"
                rel="noreferrer"
                className="mx-1 text-slate-900 underline decoration-slate-400 underline-offset-2 hover:text-blue-600"
              >
                @{username}
              </a>
              的 Star 自动整理。这里是筛选台，不是传统首页。
            </p>
          </div>
        </div>
      </section>

      <section className="card filter-panel">
        <div className="top-controls">
          <div className="control-block">
            <div className="side-title">搜索</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="repo / topic / keyword"
              className="search-input text-sm"
            />
          </div>

          <div className="control-block">
            <div className="side-title">分类</div>
            <div className="tag-list">
              {["All", ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat as RepoCategory | "All")}
                  className={clsx("tag", activeCategory === cat && "active")}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="card content-header">
          <div>
            <div className="text-xs text-slate-500">Live Collection View</div>
            <div className="text-sm font-semibold text-slate-900">{activeCategory === "All" ? "全部分类" : activeCategory}</div>
          </div>
          <div className="content-header-meta">
            <span className="meta-pill">总项目 {repos.length}</span>
            <span className="meta-pill">命中 {filtered.length}</span>
            <span className="text-xs text-slate-500">最后同步：{generatedAt ? new Date(generatedAt).toLocaleDateString("zh-CN") : "--"}</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">没有符合当前筛选条件的仓库。</div>
        ) : (
          <>
            <div className="repo-grid">
              {displayed.map((repo) => (
                <a key={repo.id} href={repo.htmlUrl} target="_blank" rel="noreferrer" className="repo-item block">
                  <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{repo.fullName}</h3>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">{repo.description || "No description"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {repo.language && <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{repo.language}</span>}
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">Star {repo.stars.toLocaleString()}</span>
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">Fork {repo.forks.toLocaleString()}</span>
                  </div>
                </a>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="py-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="px-3 sm:px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    上一页
                  </button>
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (page <= 4) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = page - 3 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium ${
                            page === pageNum
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex sm:hidden items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 3) {
                        pageNum = i + 1;
                      } else if (page === 1) {
                        pageNum = i + 1;
                      } else if (page === totalPages) {
                        pageNum = totalPages - 2 + i;
                      } else {
                        pageNum = page - 1 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium ${
                            page === pageNum
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="px-3 sm:px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    下一页
                  </button>
                </div>
                <div className="text-xs sm:text-sm text-slate-600">
                  {page}/{totalPages} 页 · {filtered.length} 个
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
