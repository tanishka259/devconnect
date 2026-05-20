import { useState } from "react";
import axios from "axios";

function CreatePost({ onPostCreated }) {
  const user = JSON.parse(localStorage.getItem("user"));

  const [content, setContent] = useState("");
  const [techInput, setTechInput] = useState("");
  const [image, setImage] = useState(null);

  const handleCreatePost = async () => {
    if (!content.trim()) return alert("Please write something");

    const formData = new FormData();
    formData.append("content", content);
    formData.append("tech", techInput);
    formData.append("userId", user._id);

    if (image) {
      formData.append("image", image);
    }

    await axios.post("http://localhost:5000/api/posts", formData);

    setContent("");
    setTechInput("");
    setImage(null);
    onPostCreated();
  };

  return (
    <div className="create-post-card">
      <div className="create-post-top">
        <div className="avatar">
          {user?.avatar ? <img src={user.avatar} alt="avatar" /> : user?.name?.charAt(0)}
        </div>

        <input
          type="text"
          placeholder="Share your project, idea, or code snippet..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <input
        className="tech-input"
        type="text"
        placeholder="Tech tags: React, Node, MongoDB"
        value={techInput}
        onChange={(e) => setTechInput(e.target.value)}
      />

      <label className="post-image-upload">
        📸 Upload Photo
        <input
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => setImage(e.target.files[0])}
        />
      </label>

      {image && <p className="selected-file">Selected: {image.name}</p>}

      <div className="create-post-actions">
        <button onClick={handleCreatePost}>🚀 Post</button>
      </div>
    </div>
  );
}

export default CreatePost;