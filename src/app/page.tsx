import HomePage from "./home-page";
import { getRepoData, getRepos } from "@/lib/repos";

export default function Page() {
  const data = getRepoData();
  const repos = getRepos();

  return <HomePage repos={repos} username={data.username} />;
}
