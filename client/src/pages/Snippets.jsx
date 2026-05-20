import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

function Snippets() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [snippets, setSnippets] = useState([]);

  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [code, setCode] = useState("");

  const fetchSnippets = async () => {
    const response = await axios.get("https://devconnect-api-hwvw.onrender.com/api/snippets");
    setSnippets(response.data);
  };

  useEffect(() => {
    fetchSnippets();
  }, []);

  const handleCreateSnippet = async () => {
    if (!title.trim() || !code.trim()) {
      return alert("Title and code are required");
    }

    await axios.post("https://devconnect-api-hwvw.onrender.com/api/snippets", {
      title,
      language,
      code,
      userId: user._id,
    });

    setTitle("");
    setLanguage("JavaScript");
    setCode("");

    fetchSnippets();
  };

  const handleDeleteSnippet = async (snippetId) => {
    await axios.delete(`https://devconnect-api-hwvw.onrender.com/api/snippets/${snippetId}`, {
      data: {
        userId: user._id,
      },
    });

    fetchSnippets();
  };

  const handleCopyCode = async (codeText) => {
    await navigator.clipboard.writeText(codeText);
    alert("Code copied");
  };

  return (
    <MainLayout>
      <div className="snippets-page">
        <div className="snippet-form-card">
          <h2>Create Code Snippet</h2>

          <input
            type="text"
            placeholder="Snippet title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option>JavaScript</option>
            <option>Python</option>
            <option>Java</option>
            <option>C++</option>
            <option>HTML</option>
            <option>CSS</option>
            <option>React</option>
            <option>Node.js</option>
          </select>

          <textarea
            placeholder="Paste your code here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <button onClick={handleCreateSnippet}>
            Save Snippet
          </button>
        </div>

        <div className="snippets-list">
          {snippets.map((snippet) => (
            <div className="snippet-card" key={snippet._id}>
              <div className="snippet-header">
                <div>
                  <h3>{snippet.title}</h3>
                  <p>
                    {snippet.language} • by {snippet.user?.name}
                  </p>
                </div>

                <div className="snippet-actions">
                  <button onClick={() => handleCopyCode(snippet.code)}>
                    Copy
                  </button>

                  {snippet.user?._id === user?._id && (
                    <button
                      className="delete-snippet-btn"
                      onClick={() => handleDeleteSnippet(snippet._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <pre>
                <code>{snippet.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Snippets;