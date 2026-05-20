import { useEffect, useState } from "react";
import axios from "axios";

function GitHubStats({ username }) {
  const [githubData, setGithubData] = useState(null);

  const fetchGithubData = async () => {
    if (!username) return;

    const response = await axios.get(
      `https://devconnect-api-hwvw.onrender.com/api/github/${username}`
    );

    setGithubData(response.data);
  };

  useEffect(() => {
    fetchGithubData();
  }, [username]);

  if (!username) {
    return (
      <div className="github-card">
        <h2>GitHub Stats</h2>
        <p>Add your GitHub username in profile edit section.</p>
      </div>
    );
  }

  if (!githubData) {
    return (
      <div className="github-card">
        <h2>GitHub Stats</h2>
        <p>Loading GitHub data...</p>
      </div>
    );
  }

  return (
    <div className="github-card">
      <div className="github-header">
        <img
          src={githubData.profile.avatar_url}
          alt="GitHub avatar"
        />

        <div>
          <h2>{githubData.profile.name || githubData.profile.login}</h2>
          <p>@{githubData.profile.login}</p>
        </div>
      </div>

      <div className="github-stats">
        <div>
          <h3>{githubData.profile.public_repos}</h3>
          <p>Repos</p>
        </div>

        <div>
          <h3>{githubData.profile.followers}</h3>
          <p>Followers</p>
        </div>

        <div>
          <h3>{githubData.profile.following}</h3>
          <p>Following</p>
        </div>
      </div>

      <a
        className="github-link"
        href={githubData.profile.html_url}
        target="_blank"
        rel="noreferrer"
      >
        View GitHub Profile
      </a>

      <h3 className="repo-title">Latest Repositories</h3>

      <div className="repo-list">
        {githubData.repos.map((repo) => (
          <a
            key={repo.id}
            className="repo-card"
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
          >
            <h4>{repo.name}</h4>
            <p>{repo.description || "No description"}</p>
            <span>⭐ {repo.stargazers_count}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default GitHubStats;