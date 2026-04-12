export type RepoCategory =
  | "AI"
  | "Frontend"
  | "Backend"
  | "Mobile"
  | "DevOps"
  | "Data"
  | "Tooling"
  | "Security"
  | "Other";

export interface StarRepo {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  htmlUrl: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  topics: string[];
  homepage: string;
  updatedAt: string;
  starredAt: string;
  category: RepoCategory;
  recommendation: string;
}

export interface RepoData {
  generatedAt: string;
  username: string;
  total: number;
  categories: RepoCategory[];
  repos: StarRepo[];
}
