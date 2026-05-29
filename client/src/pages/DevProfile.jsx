import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function DevProfile() {
  const { username } = useParams();

  const [data, setData] = useState(null);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        `https://devconnect-api-hwvw.onrender.com/api/dev/${username}`
      );

      setData(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (!data) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="public-dev-page">
      <div className="public-profile-card">
        <div className="avatar large-avatar">
          {data.user.avatar ? (
            <img
              src={data.user.avatar}
              alt="avatar"
            />
          ) : (
            data.user.name?.charAt(0)
          )}
        </div>

        <h1>{data.user.name}</h1>

        <p>{data.user.role}</p>

        <p>{data.user.bio}</p>

        <div className="search-skill-tags">
          {data.user.skills?.map((skill, index) => (
            <span key={index}>{skill}</span>
          ))}
        </div>
      </div>

      <div className="public-section">
        <h2>Projects</h2>

        {data.projects.map((project) => (
          <div
            key={project._id}
            className="project-card"
          >
            <h3>{project.title}</h3>
            <p>{project.description}</p>
          </div>
        ))}
      </div>

      <div className="public-section">
        <h2>Code Snippets</h2>

        {data.snippets.map((snippet) => (
          <div
            key={snippet._id}
            className="snippet-card"
          >
            <h3>{snippet.title}</h3>
            <pre>{snippet.code}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DevProfile;