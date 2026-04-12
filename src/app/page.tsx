import FavoritesShowcase from "@/components/favorites-showcase";
import { getRepoData, getRepos } from "@/lib/repos";

export default function Home() {
  const data = getRepoData();
  const repos = getRepos();

  return (
    <main className="app-shell">
      <FavoritesShowcase
        repos={repos}
        categories={data.categories}
        username={data.username}
        generatedAt={data.generatedAt}
      />
    </main>
  );
}
