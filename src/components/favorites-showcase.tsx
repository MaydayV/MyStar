"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import clsx from "clsx";
import type { RepoCategory, StarRepo } from "@/lib/types";

interface Props {
  repos: StarRepo[];
  categories: RepoCategory[];
  username: string;
  generatedAt: string;
}

const ITEMS_PER_PAGE = 30;

export default function FavoritesShowcase({ repos, categories, username, generatedAt }: Props) {
  const [activeCategory, setActiveCategory] = useState<RepoCategory | "All">("All");
  const [query, setQuery] = useState("");
  const [recentOnly, setRecentOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [liveStars, setLiveStars] = useState<Record<number, number>>({});

  const filtered = useMemo(() => {
    const latestStarTs = repos.reduce((max, repo) => Math.max(max, Date.parse(repo.starredAt) || 0), 0);
    const threeMonthsAgo = latestStarTs - 1000 * 60 * 60 * 24 * 90;

    return repos.filter((repo) => {
      const inCategory = activeCategory === "All" || repo.category === activeCategory;
      const searchable = `${repo.fullName} ${repo.description} ${repo.topics.join(" ")}`.toLowerCase();
      const hit = searchable.includes(query.toLowerCase());
      const inRecent = !recentOnly || Date.parse(repo.starredAt) >= threeMonthsAgo;
      return inCategory && hit && inRecent;
    });
  }, [activeCategory, query, recentOnly, repos]);

  const displayed = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filtered.slice(start, end);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  // 重置分页当筛选条件改变
  useEffect(() => {
    setPage(1);
  }, [activeCategory, query, recentOnly]);

  // 获取实时星星数
  useEffect(() => {
    const fetchStars = async () => {
      const visibleRepos = displayed.slice(0, 50); // 只获取前50个可见仓库的实时数据
      for (const repo of visibleRepos) {
        if (liveStars[repo.id]) continue; // 已经获取过
        
        try {
          const response = await fetch(`https://api.github.com/repos/${repo.fullName}`);
          if (response.ok) {
            const data = await response.json();
            setLiveStars((prev) => ({ ...prev, [repo.id]: data.stargazers_count }));
          }
        } catch (error) {
          // 静默失败，使用缓存数据
        }
        
        // 避免 API 限流
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };

    fetchStars();
  }, [displayed]);

  return (
    <div className="app-grid">
      <aside className="card sidebar-card">
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

        <div className="mt-4">
          <div className="side-title">搜索</div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="repo / topic / keyword"
            className="search-input text-sm"
          />
        </div>

        <div className="mt-4">
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

        <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={recentOnly}
            onChange={(e) => setRecentOnly(e.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
          仅看最近90天
        </label>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
            <div className="text-xs text-slate-500">总项目</div>
            <div className="mt-1 font-semibold">{repos.length}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
            <div className="text-xs text-slate-500">命中</div>
            <div className="mt-1 font-semibold">{filtered.length}</div>
          </div>
        </div>
      </aside>

      <section className="space-y-3">
        <div className="card content-header">
          <div>
            <div className="text-xs text-slate-500">Live Collection View</div>
            <div className="text-sm font-semibold text-slate-900">{activeCategory === "All" ? "全部分类" : activeCategory}</div>
          </div>
          <div className="text-xs text-slate-500">最后同步：{generatedAt ? new Date(generatedAt).toLocaleDateString("zh-CN") : "--"}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">没有符合当前筛选条件的仓库。</div>
        ) : (
          <>
            <div className="repo-grid">
              {displayed.map((repo) => (
                <a key={repo.id} href={repo.htmlUrl} target="_blank" rel="noreferrer" className="repo-item block">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{repo.category}</span>
                    <span className="text-xs text-slate-500">⭐ {(liveStars[repo.id] || repo.stars).toLocaleString()}</span>
                  </div>
                  <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{repo.fullName}</h3>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">{repo.description || "No description"}</p>
                  <div className="mt-3 rounded-lg bg-blue-50 p-3 border border-blue-100">
                    <p className="line-clamp-2 text-sm text-slate-700">{repo.recommendation}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {repo.language && <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{repo.language}</span>}
                    {repo.topics.slice(0, 3).map((topic) => (
                      <span key={topic} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        #{topic}
                      </span>
                    ))}
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
