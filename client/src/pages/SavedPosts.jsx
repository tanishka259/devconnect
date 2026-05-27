import { useEffect, useState } from "react";
import axios from "axios";

import MainLayout from "../layouts/MainLayout";
import PostCard from "./feed/PostCard";

function SavedPosts() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [posts, setPosts] = useState([]);

  const fetchSavedPosts = async () => {
    try {
      const response = await axios.get(
        `https://devconnect-api-hwvw.onrender.com/api/users/${user._id}/saved-posts`
      );

      setPosts(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  return (
    <MainLayout>
      <div className="saved-posts-page">
        <div className="main-dashboard-card">
          <h1>Saved Posts</h1>
          <p>Your bookmarked developer posts in one place.</p>
        </div>

        {posts.length === 0 && (
          <p className="empty-search-text">No saved posts yet.</p>
        )}

        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onLikeUpdated={fetchSavedPosts}
          />
        ))}
      </div>
    </MainLayout>
  );
}

export default SavedPosts;