import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

function Notifications() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    const response = await axios.get(
      `http://localhost:5000/api/notifications/${user._id}`
    );

    setNotifications(response.data);
  };

  const markAsRead = async () => {
    await axios.put(
      `http://localhost:5000/api/notifications/read/${user._id}`
    );

    fetchNotifications();
  };


  useEffect(() => {
  fetchNotifications();
  markAsRead();
}, []);

  return (
    <MainLayout>
      <div className="notifications-page">
        <div className="notifications-header">
          <h1>Notifications</h1>
          <button onClick={markAsRead}>Mark all as read</button>
        </div>

        {notifications.length === 0 && (
          <p className="empty-search-text">No notifications yet.</p>
        )}

        {notifications.map((notification) => (
          <Link
            to={notification.link || "/dashboard"}
            className={
              notification.isRead
                ? "notification-card"
                : "notification-card unread-notification"
            }
            key={notification._id}
          >
            <div className="avatar">
              {notification.sender?.avatar ? (
                <img src={notification.sender.avatar} alt="avatar" />
              ) : (
                notification.sender?.name?.charAt(0)
              )}
            </div>

            <div>
              <p>
                <strong>{notification.sender?.name}</strong>{" "}
                {notification.text}
              </p>

              <span>
                {new Date(notification.createdAt).toLocaleString([], {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </MainLayout>
  );
}

export default Notifications;