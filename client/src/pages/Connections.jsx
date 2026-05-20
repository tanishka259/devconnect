import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

function Connections() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  const fetchUsers = async () => {
    const allUsersResponse = await axios.get("https://devconnect-api-hwvw.onrender.com/api/users");

    const connectionsResponse = await axios.get(
      `https://devconnect-api-hwvw.onrender.com/api/connections/${user._id}`,
    );

    const connectedIds = connectionsResponse.data.map((u) => u._id);

    const filtered = allUsersResponse.data.filter(
      (u) => u._id !== user._id && !connectedIds.includes(u._id),
    );

    setUsers(filtered);
  };
  const fetchRequests = async () => {
    const response = await axios.get(
      `https://devconnect-api-hwvw.onrender.com/api/connections/requests/${user._id}`,
    );

    setRequests(response.data);
  };

  useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, []);

  const sendRequest = async (receiverId) => {
    await axios.post("https://devconnect-api-hwvw.onrender.com/api/connections/request", {
      senderId: user._id,
      receiverId,
    });

    setSentRequests((prev) => [...prev, receiverId]);
  };

  const acceptRequest = async (senderId) => {
    await axios.post("https://devconnect-api-hwvw.onrender.com/api/connections/accept", {
      userId: user._id,
      senderId,
    });

    fetchRequests();
    fetchUsers();

    alert("Request accepted");
  };

  return (
    <MainLayout>
      <div className="connections-page">
        <div className="connections-card">
          <h2>Connection Requests</h2>

          {requests.length === 0 && <p>No pending requests</p>}

          {requests.map((req) => (
            <div className="connection-item" key={req._id}>
              <div>
                <h3>{req.name}</h3>
                <p>{req.role || "Developer"}</p>
              </div>

              <button onClick={() => acceptRequest(req._id)}>Accept</button>
            </div>
          ))}
        </div>

        <div className="connections-card">
          <h2>Discover Developers</h2>

          {users.map((dev) => (
            <div className="connection-item" key={dev._id}>
              <div>
                <h3>{dev.name}</h3>
                <p>{dev.role || "Developer"}</p>
              </div>

              <button
                className={
                  sentRequests.includes(dev._id) ? "request-sent-btn" : ""
                }
                onClick={() => sendRequest(dev._id)}
                disabled={sentRequests.includes(dev._id)}
              >
                {sentRequests.includes(dev._id) ? "✓ Requested" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Connections;
