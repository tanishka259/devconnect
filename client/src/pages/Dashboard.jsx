import { useEffect, useState } from "react";
import axios from "axios";

import MainLayout from "../layouts/MainLayout";
import PostCard from "./feed/PostCard";
import RightPanel from "./feed/RightPanel";

function Dashboard() {
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    const response = await axios.get("https://devconnect-api-hwvw.onrender.com/api/posts");
    setPosts(response.data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <MainLayout>
      <div className="feed-layout">
        <div className="feed-main">
          <div className="feed-title-card">
            <h1>Developer Feed</h1>
            <p>Explore posts, ideas, snippets, and projects shared by developers.</p>
          </div>

          {posts.length === 0 && (
            <p className="empty-search-text">No posts yet.</p>
          )}

          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onLikeUpdated={fetchPosts}
            />
          ))}
        </div>

        <RightPanel />
      </div>
    </MainLayout>
  );
}

export default Dashboard;