import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";

import MainLayout from "../layouts/MainLayout";
import PostCard from "./feed/PostCard";

function Search() {
  const [searchParams] = useSearchParams();

  const q = searchParams.get("q") || "";

  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);

  const fetchSearch = async () => {
    const usersResponse = await axios.get("https://devconnect-api-hwvw.onrender.com/api/users");
    const postsResponse = await axios.get("https://devconnect-api-hwvw.onrender.com/api/posts");

    const lower = q.toLowerCase();

    const filteredUsers = usersResponse.data.filter((user) => {
      const nameMatch = user.name?.toLowerCase().includes(lower);
      const roleMatch = user.role?.toLowerCase().includes(lower);

      const skillMatch = user.skills?.some((skill) =>
        skill.toLowerCase().includes(lower)
      );

      return nameMatch || roleMatch || skillMatch;
    });

    const filteredPosts = postsResponse.data.filter((post) => {
      const contentMatch = post.content?.toLowerCase().includes(lower);

      const techMatch = post.tech?.some((tag) =>
        tag.toLowerCase().includes(lower)
      );

      return contentMatch || techMatch;
    });

    setUsers(filteredUsers);
    setPosts(filteredPosts);
  };

  useEffect(() => {
    fetchSearch();
  }, [q]);

  return (
    <MainLayout>
      <div className="search-page">
        <h1>Search results for "{q}"</h1>

        <div className="search-section">
          <h2>Developers</h2>

          {users.length === 0 && (
            <p className="empty-search-text">
              No developers found.
            </p>
          )}

          {users.map((user) => (
            <Link
              to={`/profile/${user._id}`}
              className="search-user-card"
              key={user._id}
            >
              <div className="avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" />
                ) : (
                  user.name?.charAt(0)
                )}
              </div>

              <div>
                <h3>{user.name}</h3>
                <p>{user.role || "Developer"}</p>

                <div className="search-skill-tags">
                  {user.skills?.slice(0, 4).map((skill, index) => (
                    <span key={index}>{skill}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="search-section">
          <h2>Posts</h2>

          {posts.length === 0 && (
            <p className="empty-search-text">
              No posts found.
            </p>
          )}

          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onLikeUpdated={fetchSearch}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Search;