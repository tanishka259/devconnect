import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

import MainLayout from "../layouts/MainLayout";

const socket = io("http://localhost:5000");

function Messages() {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/connections/${currentUser._id}`,
      );

      const uniqueUsers = response.data.filter(
        (user, index, self) =>
          index === self.findIndex((u) => u._id === user._id),
      );

      setUsers(uniqueUsers);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/messages/${currentUser._id}/${userId}`,
      );

      setMessages(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
  fetchUsers();

  socket.emit("user-online", currentUser._id);

  socket.on("online-users", (users) => {
    setOnlineUsers(users);
  });

  socket.on("receive-message", (message) => {
    if (
      selectedUser &&
      (message.sender._id === selectedUser._id ||
        message.receiver._id === selectedUser._id)
    ) {
      setMessages((prev) => [...prev, message]);
    }
  });

  socket.on("user-typing", (data) => {
    if (
      data.receiverId === currentUser._id &&
      selectedUser &&
      data.senderId === selectedUser._id
    ) {
      setTypingUser(data.senderName);
    }
  });

  socket.on("user-stop-typing", (data) => {
    if (
      data.receiverId === currentUser._id &&
      selectedUser &&
      data.senderId === selectedUser._id
    ) {
      setTypingUser(null);
    }
  });

  return () => {
    socket.off("online-users");
    socket.off("receive-message");
    socket.off("user-typing");
    socket.off("user-stop-typing");
  };
}, [selectedUser]);

  const handleSelectUser = async (user) => {
    setSelectedUser(user);

    await fetchMessages(user._id);

    await axios.put(
      `http://localhost:5000/api/messages/read/${currentUser._id}/${user._id}`,
    );
  };

  const handleSendMessage = () => {
    if (!text.trim() || !selectedUser) return;

    socket.emit("send-message", {
      sender: currentUser._id,
      receiver: selectedUser._id,
      text,
    });

    setText("");
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  let typingTimeout;

  const handleTyping = (e) => {
    setText(e.target.value);

    if (!selectedUser) return;

    socket.emit("typing", {
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      senderName: currentUser.name,
    });

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
      socket.emit("stop-typing", {
        senderId: currentUser._id,
        receiverId: selectedUser._id,
      });
    }, 1000);
  };

  return (
    <MainLayout>
      <div className="messages-page">
        <div className="chat-users">
          <h2>Developers</h2>

          {users.map((user) => (
            <div
              className={`chat-user ${
                selectedUser?._id === user._id ? "active-chat-user" : ""
              }`}
              key={user._id}
              onClick={() => handleSelectUser(user)}
            >
              <div className="avatar online-avatar-wrapper">
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" />
                ) : (
                  user.name?.charAt(0)
                )}

                {isUserOnline(user._id) && <span className="online-dot"></span>}
              </div>

              <div>
                <span>{user.name}</span>

                <p className="online-status-text">
                  {isUserOnline(user._id) ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-box">
          {selectedUser ? (
            <>
              <div className="chat-header">
                <h2>{selectedUser.name}</h2>

                <p>
                  {isUserOnline(selectedUser._id) ? "🟢 Online now" : "Offline"}
                  {typingUser && (
                    <p className="typing-text">{typingUser} is typing...</p>
                  )}
                </p>
              </div>

              <div className="chat-messages">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={
                      message.sender._id === currentUser._id
                        ? "my-message"
                        : "other-message"
                    }
                  >
                    <p>{message.text}</p>

                    <span className="message-time">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Type message..."
                  value={text}
                  onChange={handleTyping}
                />

                <button onClick={handleSendMessage}>Send</button>
              </div>
            </>
          ) : (
            <div className="empty-chat">
              <h2>Select a developer to start chatting</h2>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default Messages;
