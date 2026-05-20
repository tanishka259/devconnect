import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import MainLayout from "../layouts/MainLayout";
import GitHubStats from "../components/profile/GitHubStats";
import PostCard from "./feed/PostCard";

function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [connectionCount, setConnectionCount] = useState(0);
  const [mutuals, setMutuals] = useState([]);

  useEffect(() => {
    if (id === currentUser?._id) {
      navigate("/profile");
    }
  }, [id, currentUser?._id, navigate]);

  const fetchPublicProfile = async () => {
    try {
      const userResponse = await axios.get(
        `https://devconnect-api-hwvw.onrender.com/api/users/${id}`
      );

      const postsResponse = await axios.get(
        "https://devconnect-api-hwvw.onrender.com/api/posts"
      );

      const projectsResponse = await axios.get(
        "https://devconnect-api-hwvw.onrender.com/api/projects"
      );

      const snippetsResponse = await axios.get(
        "https://devconnect-api-hwvw.onrender.com/api/snippets"
      );

      const mutualResponse = await axios.get(
        `https://devconnect-api-hwvw.onrender.com/api/connections/mutual/${currentUser._id}/${id}`
      );

      setProfile(userResponse.data);

      setPosts(
        postsResponse.data.filter(
          (post) => post.user?._id === id
        )
      );

      setProjects(
        projectsResponse.data.filter(
          (project) => project.user?._id === id
        )
      );

      setSnippets(
        snippetsResponse.data.filter(
          (snippet) => snippet.user?._id === id
        )
      );

      setConnectionCount(mutualResponse.data.connectionCount);

      const uniqueMutuals = mutualResponse.data.mutuals.filter(
        (person, index, self) =>
          index === self.findIndex((p) => p._id === person._id)
      );

      setMutuals(uniqueMutuals);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (id !== currentUser?._id) {
      fetchPublicProfile();
    }
  }, [id]);

  if (!profile) {
    return (
      <MainLayout>
        <h2>Loading profile...</h2>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="public-profile-page">
        <div className="public-profile-card">
          <div className="profile-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt="avatar" />
            ) : (
              profile.name?.charAt(0)
            )}
          </div>

          <h1>{profile.name}</h1>

          <p className="profile-role">
            {profile.role || "Developer"}
          </p>

          <div className="profile-social-stats">
            <span>{connectionCount} Connections</span>
            <span>{mutuals.length} Mutual</span>
          </div>

          <p className="profile-bio">
            {profile.bio || "No bio added yet."}
          </p>

          <div className="profile-info">
            <p>📍 {profile.location || "Location not added"}</p>
            <p>🐙 GitHub: {profile.githubUsername || "Not added"}</p>
            <p>📧 {profile.email}</p>
          </div>

          <div className="profile-skills">
            {profile.skills?.length > 0 ? (
              profile.skills.map((skill, index) => (
                <span key={index}>{skill}</span>
              ))
            ) : (
              <p>No skills added yet.</p>
            )}
          </div>

          <div className="mutual-box">
            <h3>Mutual Connections</h3>

            {mutuals.length === 0 ? (
              <p>No mutual connections</p>
            ) : (
              mutuals.map((person) => (
                <div className="mutual-person" key={person._id}>
                  <div className="mini-avatar">
                    {person.avatar ? (
                      <img src={person.avatar} alt="avatar" />
                    ) : (
                      person.name?.charAt(0)
                    )}
                  </div>

                  <span>{person.name}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <GitHubStats username={profile.githubUsername} />

        <div className="public-section">
          <h2>{profile.name}'s Feed</h2>

          {posts.length === 0 && <p>No posts yet.</p>}

          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onLikeUpdated={fetchPublicProfile}
            />
          ))}
        </div>

        <div className="public-section">
          <h2>{profile.name}'s Projects</h2>

          {projects.length === 0 && <p>No projects yet.</p>}

          <div className="public-grid">
            {projects.map((project) => (
              <div className="project-card" key={project._id}>
                <h3>{project.title}</h3>

                <p className="project-desc">
                  {project.description}
                </p>

                <div className="project-tags">
                  {project.tech?.map((item, index) => (
                    <span key={index}>{item}</span>
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
        </div>

        <div className="public-section">
          <h2>{profile.name}'s Snippets</h2>

          {snippets.length === 0 && <p>No snippets yet.</p>}

          <div className="public-grid">
            {snippets.map((snippet) => (
              <div className="snippet-card" key={snippet._id}>
                <div className="snippet-header">
                  <div>
                    <h3>{snippet.title}</h3>
                    <p>{snippet.language}</p>
                  </div>
                </div>

                <pre>
                  <code>{snippet.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default PublicProfile;