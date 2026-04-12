import repoData from "@/data/repos.json";
import type { RepoCategory, RepoData, StarRepo } from "@/lib/types";

export const CATEGORIES: RepoCategory[] = repoData.categories as RepoCategory[];

export function getRepoData(): RepoData {
  return repoData as RepoData;
}

export function getRepos(): StarRepo[] {
  return [...(repoData.repos as StarRepo[])].sort(
    (a, b) => Date.parse(b.starredAt) - Date.parse(a.starredAt),
  );
}
