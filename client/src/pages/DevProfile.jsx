import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API_URL = "https://devconnect-api-hwvw.onrender.com";

function DevProfile() {
  const { id } = useParams();

  const [data, setData] = useState(null);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dev/${id}`);
      setData(response.data);
    } catch (error) {
      console.log("Public profile error:", error);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "black";

    document.body.className = "";
    document.body.classList.add(`theme-${savedTheme}`);

    if (id) {
      fetchProfile();
    }
  }, [id]);

  if (!data) {
    return (
      <div className="public-dev-page">
        <h2 className="public-loading">Loading profile...</h2>
      </div>
    );
  }

  return (
    <div className="public-dev-page">
      <div className="public-profile-card">
        <div className="public-avatar">
          {data.user.avatar ? (
            <img src={data.user.avatar} alt="avatar" />
          ) : (
            data.user.name?.charAt(0)
          )}
        </div>

        <h1>{data.user.name}</h1>
        <h4>{data.user.role || "Developer"}</h4>

        <p>{data.user.bio || "No bio added yet."}</p>

        <div className="public-skills">
          {data.user.skills?.length > 0 ? (
            data.user.skills.map((skill, index) => (
              <span key={index}>{skill}</span>
            ))
          ) : (
            <small>No skills added yet.</small>
          )}
        </div>
      </div>

      <div className="public-section">
        <h2>Projects</h2>

        {data.projects.length === 0 && <p>No projects yet.</p>}

        {data.projects.map((project) => (
          <div className="public-project-card" key={project._id}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
          </div>
        ))}
      </div>

      <div className="public-section">
        <h2>Code Snippets</h2>

        {data.snippets.length === 0 && <p>No snippets yet.</p>}

        {data.snippets.map((snippet) => (
          <div className="public-snippet-card" key={snippet._id}>
            <h3>{snippet.title}</h3>
            <pre>{snippet.code}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DevProfile;