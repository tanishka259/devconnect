import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function PostCard({ post, onLikeUpdated }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const [commentText, setCommentText] = useState("");

  const isLiked = post.likes?.some((id) => id.toString() === user?._id);

  const formattedTime = new Date(post.createdAt).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleLike = async () => {
    await axios.put(`https://devconnect-api-hwvw.onrender.com/api/posts/${post._id}/like`, {
      userId: user._id,
    });

    onLikeUpdated();
  };

  const handleDelete = async () => {
    await axios.delete(`https://devconnect-api-hwvw.onrender.com/api/posts/${post._id}`, {
      data: { userId: user._id },
    });

    onLikeUpdated();
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    await axios.post(`https://devconnect-api-hwvw.onrender.com/api/posts/${post._id}/comment`, {
      userId: user._id,
      text: commentText,
    });

    setCommentText("");
    onLikeUpdated();
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.user?._id}`} className="avatar-link">
          <div className="avatar">
            {post.user?.avatar ? (
              <img src={post.user.avatar} alt="avatar" />
            ) : (
              post.user?.name?.charAt(0)
            )}
          </div>
        </Link>

        <div>
          <h3>{post.user?.name}</h3>
          <p>Developer • {formattedTime}</p>
        </div>
      </div>

      {post.user?._id === user?._id && (
        <button className="delete-btn" onClick={handleDelete}>
          Delete
        </button>
      )}

      <p className="post-content">{post.content}</p>

      {post.image && (
        <img className="post-image" src={post.image} alt="post" />
      )}

      <div className="tech-tags">
        {post.tech?.map((item, index) => (
          <span key={index}>{item}</span>
        ))}
      </div>

      <div className="post-actions">
        <button onClick={handleLike}>
          {isLiked ? "❤️ Liked" : "♡ Like"} ({post.likes?.length || 0})
        </button>

        <button>💬 Comment</button>
        <button>↗ Share</button>
      </div>

      <div className="comment-box">
        <input
          type="text"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />

        <button onClick={handleComment}>Send</button>
      </div>

      <div className="comments-list">
        {post.comments?.map((comment) => (
          <div className="comment-item" key={comment._id}>
            <Link to={`/profile/${comment.user?._id}`} className="comment-avatar-link">
              <div className="comment-avatar">
                {comment.user?.avatar ? (
                  <img src={comment.user.avatar} alt="avatar" />
                ) : (
                  comment.user?.name?.charAt(0)
                )}
              </div>
            </Link>

            <div className="comment-content">
              <div className="comment-top">
                <Link
                  to={`/profile/${comment.user?._id}`}
                  className="comment-user-link"
                >
                  {comment.user?.name}
                </Link>

                <span className="comment-time">
                  {new Date(comment.createdAt).toLocaleString([], {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p>{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PostCard;