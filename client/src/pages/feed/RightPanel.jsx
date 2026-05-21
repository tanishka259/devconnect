import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function RightPanel() {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [suggestedUsers, setSuggestedUsers] = useState([]);

  const fetchSuggestedUsers = async () => {
    try {
      const usersResponse = await axios.get(
        "https://https://devconnect-api-hwvw.onrender.com/api/users"
      );

      const connectionsResponse = await axios.get(
        `https://https://devconnect-api-hwvw.onrender.com/api/connections/${currentUser._id}`
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

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  return (
    <div className="right-panel">
      <div className="panel-card">
        <h3>Suggested Developers</h3>

        {suggestedUsers.length === 0 && (
          <p>No suggestions available.</p>
        )}

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

        <p>#React</p>
        <p>#NodeJS</p>
        <p>#MongoDB</p>
        <p>#AI</p>
      </div>
    </div>
  );
}

export default RightPanel;