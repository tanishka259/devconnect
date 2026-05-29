import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";

import MainLayout from "../layouts/MainLayout";
import PostCard from "./feed/PostCard";

const API_URL = "https://devconnect-api-hwvw.onrender.com";

function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [projects, setProjects] = useState([]);

  const fetchSearch = async () => {
    try {
      if (!q.trim()) {
        setUsers([]);
        setPosts([]);
        setProjects([]);
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/search/${encodeURIComponent(q)}`
      );

      setUsers(response.data.users || []);
      setPosts(response.data.posts || []);
      setProjects(response.data.projects || []);
    } catch (error) {
      console.log("Search error:", error);
    }
  };

  useEffect(() => {
    fetchSearch();
  }, [q]);

  return (
    <MainLayout>
      <div className="search-page">
        <h1>Search results for "{q}"</h1>

        <div className="search-section">
          <h2>Developers</h2>

          {users.length === 0 && (
            <p className="empty-search-text">No developers found.</p>
          )}

          {users.map((user) => (
            <Link
              to={`/profile/${user._id}`}
              className="search-user-card"
              key={user._id}
            >
              <div className="avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" />
                ) : (
                  user.name?.charAt(0)
                )}
              </div>

              <div>
                <h3>{user.name}</h3>
                <p>{user.role || "Developer"}</p>

                <div className="search-skill-tags">
                  {user.skills?.slice(0, 4).map((skill, index) => (
                    <span key={index}>{skill}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="search-section">
          <h2>Projects</h2>

          {projects.length === 0 && (
            <p className="empty-search-text">No projects found.</p>
          )}

          {projects.map((project) => (
            <div className="project-card" key={project._id}>
              <h3>{project.title}</h3>

              <p>{project.description}</p>

              <div className="project-tags">
                {project.tech?.map((tech, index) => (
                  <span key={index}>{tech}</span>
                ))}
              </div>

              <div className="project-links">
                {project.githubLink && (
                  <a
                    href={project.githubLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub
                  </a>
                )}

                {project.demoLink && (
                  <a
                    href={project.demoLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Live Demo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="search-section">
          <h2>Posts</h2>

          {posts.length === 0 && (
            <p className="empty-search-text">No posts found.</p>
          )}

          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onLikeUpdated={fetchSearch}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Search;