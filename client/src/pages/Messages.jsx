import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

import MainLayout from "../layouts/MainLayout";

const socket = io("https://devconnect-api-hwvw.onrender.com");

function Messages() {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [onlineUsers, setOnlineUsers] = useState([]);

  const [typingUser, setTypingUser] = useState(null);

  const messagesEndRef = useRef(null);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        "https://devconnect-api-hwvw.onrender.com/api/users"
      );

      const filteredUsers = response.data.filter(
        (user) => user._id !== currentUser._id
      );

      setUsers(filteredUsers);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await axios.get(
        `https://devconnect-api-hwvw.onrender.com/api/messages/${currentUser._id}/${userId}`
      );

      setMessages(response.data);

      await axios.put(
        `https://devconnect-api-hwvw.onrender.com/api/messages/read/${currentUser._id}/${userId}`
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    socket.emit("send-message", {
      sender: currentUser._id,
      receiver: selectedUser._id,
      text: messageText,
    });

    setMessageText("");

    socket.emit("stop-typing", {
      senderId: currentUser._id,
      receiverId: selectedUser._id,
    });
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  useEffect(() => {
    fetchUsers();

    socket.emit("user-online", currentUser._id);

    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("receive-message", (message) => {
      if (
        message.sender._id === selectedUser?._id ||
        message.receiver._id === selectedUser?._id
      ) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on("user-typing", ({ senderId, receiverId, senderName }) => {
      if (
        senderId === selectedUser?._id &&
        receiverId === currentUser._id
      ) {
        setTypingUser(senderName);
      }
    });

    socket.on("user-stop-typing", () => {
      setTypingUser(null);
    });

    return () => {
      socket.off("online-users");
      socket.off("receive-message");
      socket.off("user-typing");
      socket.off("user-stop-typing");
    };
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, typingUser]);

  return (
    <MainLayout>
      <div className="messages-page">
        <div className="chat-users">
          <h2>Messages</h2>

          {users.map((user) => (
            <div
              key={user._id}
              className={`chat-user ${
                selectedUser?._id === user._id
                  ? "active-chat-user"
                  : ""
              }`}
              onClick={() => {
                setSelectedUser(user);
                fetchMessages(user._id);
              }}
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

                <p className="online-status-text">
                  {isUserOnline(user._id)
                    ? "🟢 Online"
                    : user.lastSeen
                    ? `Last seen ${new Date(
                        user.lastSeen
                      ).toLocaleString([], {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Offline"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-box">
          {selectedUser ? (
            <>
              <div className="chat-header">
                <div className="avatar">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt="avatar"
                    />
                  ) : (
                    selectedUser.name?.charAt(0)
                  )}
                </div>

                <div>
                  <h3>{selectedUser.name}</h3>

                  <p>
                    {isUserOnline(selectedUser._id)
                      ? "🟢 Online now"
                      : selectedUser.lastSeen
                      ? `Last seen ${new Date(
                          selectedUser.lastSeen
                        ).toLocaleString([], {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "Offline"}
                  </p>
                </div>
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

                    <small>
                      {new Date(
                        message.createdAt
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                ))}

                {typingUser && (
                  <div className="typing-indicator">
                    {typingUser} is typing...
                  </div>
                )}

                <div ref={messagesEndRef}></div>
              </div>

              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);

                    socket.emit("typing", {
                      senderId: currentUser._id,
                      receiverId: selectedUser._id,
                      senderName: currentUser.name,
                    });

                    setTimeout(() => {
                      socket.emit("stop-typing", {
                        senderId: currentUser._id,
                        receiverId: selectedUser._id,
                      });
                    }, 1200);
                  }}
                />

                <button onClick={handleSendMessage}>
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="empty-chat">
              <h2>Select a user to start chatting</h2>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default Messages;