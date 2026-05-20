import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";
import axios from "axios";

import MainLayout from "../layouts/MainLayout";

const socket = io("https://devconnect-api-hwvw.onrender.com");

function CodeRoom() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [mode, setMode] = useState("create");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [language, setLanguage] = useState("javascript");

  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(null);

  const [code, setCode] = useState(
    `function hello() {
  console.log("Welcome to DevConnect Code Room");
}`,
  );

  useEffect(() => {
    socket.on("receive-code", (incomingCode) => {
      setCode(incomingCode);
    });

    socket.on("receive-language", (incomingLanguage) => {
      setLanguage(incomingLanguage);
    });

    return () => {
      socket.off("receive-code");
      socket.off("receive-language");
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!title.trim()) {
      return alert("Room title is required");
    }

    const response = await axios.post("https://devconnect-api-hwvw.onrender.com/api/code-rooms", {
      title,
      description,
      language,
      difficulty,
      userId: user._id,
    });

    const room = response.data.room;

    socket.emit("join-room", room.roomId);

    setJoinedRoom(room);
    setRoomId(room.roomId);
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) return;

    try {
      const response = await axios.get(
        `https://devconnect-api-hwvw.onrender.com/api/code-rooms/${roomId}`,
      );

      socket.emit("join-room", roomId);

      setJoinedRoom(response.data);
      setLanguage(response.data.language);
    } catch (error) {
      alert("Room not found");
    }
  };

  const handleCodeChange = (value) => {
    setCode(value);

    if (joinedRoom) {
      socket.emit("code-change", {
        roomId: joinedRoom.roomId,
        code: value,
      });
    }
  };

  const handleLanguageChange = (e) => {
    const selectedLanguage = e.target.value;

    setLanguage(selectedLanguage);

    if (joinedRoom) {
      socket.emit("language-change", {
        roomId: joinedRoom.roomId,
        language: selectedLanguage,
      });
    }
  };

  return (
    <MainLayout>
      <div className="code-room-page">
        {!joinedRoom ? (
          <div className="code-room-start">
            <div className="join-room-card">
              <div className="room-tabs">
                <button
                  className={mode === "create" ? "active-room-tab" : ""}
                  onClick={() => setMode("create")}
                >
                  Create Room
                </button>

                <button
                  className={mode === "join" ? "active-room-tab" : ""}
                  onClick={() => setMode("join")}
                >
                  Join Room
                </button>
              </div>

              {mode === "create" ? (
                <>
                  <h1>Create Code Room</h1>
                  <p>Set your room requirements before starting.</p>

                  <input
                    type="text"
                    placeholder="Room title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <textarea
                    placeholder="Room description / task requirements"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />


                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                  </select>

                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>

                  <button onClick={handleCreateRoom}>Create & Join Room</button>
                </>
              ) : (
                <>
                  <h1>Join Code Room</h1>
                  <p>Enter the room ID shared by your friend.</p>

                  <input
                    type="text"
                    placeholder="Enter room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />

                  <button onClick={handleJoinRoom}>Join Room</button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="editor-layout">
            <div className="editor-topbar">
              <div>
                <h2>{joinedRoom.title}</h2>
                <p>{joinedRoom.description}</p>
                <small>
                  Room ID: {joinedRoom.roomId} • {joinedRoom.difficulty}
                </small>
              </div>

              <select value={language} onChange={handleLanguageChange}>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
              </select>
            </div>

            <div className="editor-wrapper">
              <Editor
                height="80vh"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default CodeRoom;
