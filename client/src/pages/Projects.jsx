import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

function Projects() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [projects, setProjects] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tech, setTech] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [demoLink, setDemoLink] = useState("");

  const fetchProjects = async () => {
    const response = await axios.get("https://devconnect-api-hwvw.onrender.com/api/projects");
    setProjects(response.data);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!title.trim() || !description.trim()) {
      return alert("Title and description are required");
    }

    const techArray = tech
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    await axios.post("https://devconnect-api-hwvw.onrender.com/api/projects", {
      title,
      description,
      tech: techArray,
      githubLink,
      demoLink,
      userId: user._id,
    });

    setTitle("");
    setDescription("");
    setTech("");
    setGithubLink("");
    setDemoLink("");

    fetchProjects();
  };

  const handleDeleteProject = async (projectId) => {
    await axios.delete(`https://devconnect-api-hwvw.onrender.com/api/projects/${projectId}`, {
      data: {
        userId: user._id,
      },
    });

    fetchProjects();
  };

  return (
    <MainLayout>
      <div className="projects-page">
        <div className="project-form-card">
          <h2>Add New Project</h2>

          <input
            type="text"
            placeholder="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Project description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="text"
            placeholder="Tech stack: React, Node.js, MongoDB"
            value={tech}
            onChange={(e) => setTech(e.target.value)}
          />
        

          <input
            type="text"
            placeholder="GitHub link"
            value={githubLink}
            onChange={(e) => setGithubLink(e.target.value)}
          />

          <input
            type="text"
            placeholder="Live demo link"
            value={demoLink}
            onChange={(e) => setDemoLink(e.target.value)}
          />

          <button onClick={handleCreateProject}>Add Project</button>
        </div>

        <div className="projects-grid">
          {projects.map((project) => (
            <div className="project-card" key={project._id}>
              <div className="project-card-header">
                <div>
                  <h3>{project.title}</h3>
                  <p>by {project.user?.name}</p>
                </div>

                {project.user?._id === user?._id && (
                  <button
                    className="delete-project-btn"
                    onClick={() => handleDeleteProject(project._id)}
                  >
                    Delete
                  </button>
                )}
              </div>

              <p className="project-desc">{project.description}</p>

              <div className="project-tags">
                {project.tech?.map((item, index) => (
                  <span key={index}>{item}</span>
                ))}
              </div>

              <div className="project-links">
                {project.githubLink && (
                  <a href={project.githubLink} target="_blank" rel="noreferrer">
                    GitHub
                  </a>
                )}

                {project.demoLink && (
                  <a href={project.demoLink} target="_blank" rel="noreferrer">
                    Live Demo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Projects;
