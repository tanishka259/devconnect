import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = "https://devconnect-api-hwvw.onrender.com";

function RightPanel() {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [trending, setTrending] = useState({
    trendingPosts: [],
    topDevelopers: [],
    trendingTags: [],
  });

  const fetchSuggestedUsers = async () => {
    try {
      const usersResponse = await axios.get(`${API_URL}/api/users`);

      const connectionsResponse = await axios.get(
        `${API_URL}/api/connections/${currentUser._id}`
      );

      const connectedIds = connectionsResponse.data.map((user) => user._id);

      const filteredUsers = usersResponse.data.filter(
        (user) =>
          user._id !== currentUser._id &&
          !connectedIds.includes(user._id)
      );

      setSuggestedUsers(filteredUsers.slice(0, 4));
    } catch (error) {
      console.log(error);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/trending`);
      setTrending(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchSuggestedUsers();
    fetchTrending();
  }, []);

  return (
    <div className="right-panel">
      <div className="panel-card">
        <h3>Suggested Developers</h3>

        {suggestedUsers.length === 0 && <p>No suggestions available.</p>}

        {suggestedUsers.map((user) => (
          <Link
            to={`/profile/${user._id}`}
            className="suggested-dev-card"
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
              <h4>{user.name}</h4>
              <p>{user.role || "Developer"}</p>

              <div className="suggested-skills">
                {user.skills?.slice(0, 3).map((skill, index) => (
                  <span key={index}>{skill}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="panel-card">
        <h3>Trending Tech</h3>

        {trending.trendingTags.length === 0 && <p>No trending tags yet.</p>}

        <div className="trending-tags">
          {trending.trendingTags.map((item) => (
            <span key={item.tag}>
              #{item.tag} <small>{item.count}</small>
            </span>
          ))}
        </div>
      </div>

      <div className="panel-card">
        <h3>Top Developers</h3>

        {trending.topDevelopers.length === 0 && <p>No top developers yet.</p>}

        {trending.topDevelopers.map((user) => (
          <Link
            to={`/profile/${user._id}`}
            className="top-dev-card"
            key={user._id}
          >
            <div className="mini-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt="avatar" />
              ) : (
                user.name?.charAt(0)
              )}
            </div>

            <div>
              <h4>{user.name}</h4>
              <p>{user.role || "Developer"}</p>
            </div>

            <strong>{user.score}</strong>
          </Link>
        ))}
      </div>

      <div className="panel-card">
        <h3>Hot Posts</h3>

        {trending.trendingPosts.length === 0 && <p>No hot posts yet.</p>}

        {trending.trendingPosts.map((post) => (
          <Link
            to="/dashboard"
            className="hot-post-card"
            key={post._id}
          >
            <p>{post.content?.slice(0, 80)}...</p>

            <small>
              🔥 Score {post.trendingScore} • ❤️ {post.likes?.length || 0} • 💬{" "}
              {post.comments?.length || 0}
            </small>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default RightPanel;