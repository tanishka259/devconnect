import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

import {
  FiHome,
  FiUser,
  FiFolder,
  FiCodepen,
  FiUsers,
  FiMessageCircle,
  FiTerminal,
  FiBriefcase,
  FiLogOut,
  FiPlusSquare,
  FiBell,
  FiBookmark,
} from "react-icons/fi";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const user = JSON.parse(localStorage.getItem("user"));

  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const fetchCounts = async () => {
    if (!user?._id) return;

    const notificationResponse = await axios.get(
      `https://devconnect-api-hwvw.onrender.com/api/notifications/unread-count/${user._id}`,
    );

    const messageResponse = await axios.get(
      `https://devconnect-api-hwvw.onrender.com/api/messages/unread-count/${user._id}`,
    );

    setNotificationCount(notificationResponse.data.count);
    setMessageCount(messageResponse.data.count);
  };

  useEffect(() => {
    fetchCounts();

    const interval = setInterval(fetchCounts, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="sidebar">
      <Link to="/notifications" className="sidebar-link-with-badge">
        <FiBell size={20} />
        <span>Notifications</span>

        {notificationCount > 0 && (
          <span className="sidebar-badge">{notificationCount}</span>
        )}
      </Link>
      <Link to="/dashboard">
        <FiHome size={20} />
        <span>Feed</span>
      </Link>

      <Link to="/profile">
        <FiUser size={20} />
        <span>Profile</span>
      </Link>

      <Link to="/add-post">
        <FiPlusSquare size={20} />
        <span>Add Post</span>
      </Link>

      <Link to="/projects">
        <FiFolder size={20} />
        <span>Projects</span>
      </Link>

      <Link to="/snippets">
        <FiCodepen size={20} />
        <span>Snippets</span>
      </Link>

      <Link to="/connections">
        <FiUsers size={20} />
        <span>Connections</span>
      </Link>

      <Link to="/messages" className="sidebar-link-with-badge">
        <FiMessageCircle size={20} />
        <span>Messages</span>

        {messageCount > 0 && (
          <span className="sidebar-badge">{messageCount}</span>
        )}
      </Link>

      <Link to="/code-room">
        <FiTerminal size={20} />
        <span>Code Room</span>
      </Link>

      <Link to="/recruiter">
        <FiBriefcase size={20} />
        <span>Recruiter</span>
      </Link>

      <Link to="/saved-posts">
        <FiBookmark size={20} />
        <span>Saved</span>
      </Link>

      <button className="sidebar-logout-btn" onClick={handleLogout}>
        <FiLogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;
