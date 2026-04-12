import fs from "node:fs/promises";
import path from "node:path";

const token = process.env.GITHUB_TOKEN;
const usernameFromEnv = process.env.GITHUB_USERNAME || "maydayv";
const outFile = path.resolve("src/data/repos.json");

const CATEGORIES = [
  "AI",
  "Frontend",
  "Backend",
  "Mobile",
  "DevOps",
  "Data",
  "Tooling",
  "Security",
  "Other",
];

const KEYWORDS = {
  AI: ["ai", "llm", "gpt", "agent", "rag", "langchain", "model"],
  Frontend: ["react", "vue", "next", "tailwind", "ui", "frontend", "css"],
  Backend: ["api", "server", "backend", "node", "go", "java", "spring"],
  Mobile: ["android", "ios", "flutter", "react-native", "swift", "kotlin"],
  DevOps: ["docker", "kubernetes", "devops", "terraform", "ansible", "ci", "cd"],
  Data: ["data", "etl", "analytics", "spark", "pandas", "warehouse", "ml"],
  Tooling: ["tool", "cli", "plugin", "extension", "boilerplate", "starter"],
  Security: ["security", "auth", "jwt", "oauth", "encryption", "vulnerability"],
};

function pickCategory(repo) {
  const blob = `${repo.language || ""} ${(repo.topics || []).join(" ")} ${repo.name} ${repo.description || ""}`.toLowerCase();
  for (const [category, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => blob.includes(w))) return category;
  }

  const lang = (repo.language || "").toLowerCase();
  if (["typescript", "javascript", "html", "css"].includes(lang)) return "Frontend";
  if (["python", "rust", "go", "java", "c#"].includes(lang)) return "Backend";
  return "Other";
}


async function fetchUsername() {
  if (token) {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (res.ok) {
      const user = await res.json();
      return user.login || usernameFromEnv;
    }
  }
  return usernameFromEnv;
}

async function fetchStarsByApi(username) {
  const all = [];
  let page = 1;

  while (true) {
    const url = token
      ? `https://api.github.com/user/starred?per_page=100&page=${page}`
      : `https://api.github.com/users/${username}/starred?per_page=100&page=${page}`;

    const res = await fetch(url, {
      headers: {
        Accept: token ? "application/vnd.github.star+json" : "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub API failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;

    all.push(...data);
    page += 1;
  }

  return all.map((item) => item.repo || item);
}

async function fetchStarsByScrape(username) {
  const repos = new Set();
  for (let page = 1; page <= 20; page += 1) {
    const url = `https://github.com/${username}?page=${page}&tab=stars`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) break;
    const html = await res.text();

    const matches = [...html.matchAll(/<h3[^>]*>\s*<a[^>]*href="\/([^"?#]+)"/g)].map((m) => m[1]);
    const before = repos.size;
    matches.forEach((m) => {
      if (m && m.split("/").length === 2) repos.add(m.trim());
    });

    if (repos.size === before) break;
    if (!html.includes('rel="next"')) break;
  }

  const out = [];
  for (const fullName of repos) {
    const res = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) continue;
    out.push(await res.json());
  }

  return out;
}

async function main() {
  const username = await fetchUsername();

  let starredRepos = [];
  try {
    starredRepos = await fetchStarsByApi(username);
  } catch (err) {
    console.warn(`API mode failed, fallback to scrape mode: ${err.message}`);
    starredRepos = await fetchStarsByScrape(username);
  }

  const repos = starredRepos.map((repo) => {
    const category = pickCategory(repo);

    return {
      id: repo.id,
      fullName: repo.full_name,
      name: repo.name,
      owner: repo.owner?.login || "",
      htmlUrl: repo.html_url,
      description: repo.description || "",
      language: repo.language || "",
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      topics: repo.topics || [],
      homepage: repo.homepage || "",
      updatedAt: repo.updated_at,
      starredAt: repo.updated_at,
      category,
    };
  });

  repos.sort((a, b) => b.stars - a.stars);

  const payload = {
    generatedAt: new Date().toISOString(),
    username,
    total: repos.length,
    categories: CATEGORIES,
    repos,
  };

  await fs.writeFile(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Synced ${repos.length} starred repos for @${username}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
