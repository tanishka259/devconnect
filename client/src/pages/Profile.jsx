import { useEffect, useState } from "react";
import axios from "axios";

import MainLayout from "../layouts/MainLayout";
import GitHubStats from "../components/profile/GitHubStats";
import PostCard from "./feed/PostCard";

function Profile() {
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const [profile, setProfile] = useState(null);
  const [myPosts, setMyPosts] = useState([]);

  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("");

  const [aiReview, setAiReview] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        `https://devconnect-api-hwvw.onrender.com/api/users/${storedUser._id}`,
      );

      const postsResponse = await axios.get(
        "https://devconnect-api-hwvw.onrender.com/api/posts",
      );

      setProfile(response.data);

      setMyPosts(
        postsResponse.data.filter((post) => post.user?._id === storedUser._id),
      );

      setBio(response.data.bio || "");
      setSkills(response.data.skills?.join(", ") || "");
      setGithubUsername(response.data.githubUsername || "");
      setLocation(response.data.location || "");
      setRole(response.data.role || "Developer");
    } catch (error) {
      console.log(error);
    }
  };

  const handleAIReview = async () => {
    try {
      setAiLoading(true);

      const storedUser = JSON.parse(localStorage.getItem("user"));

      const response = await axios.post(
        `https://devconnect-api-hwvw.onrender.com/api/ai/portfolio-review/${storedUser._id}`,
      );

      setAiReview(response.data.review);
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "AI review failed");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const skillsArray = skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== "");

      const response = await axios.put(
        `https://devconnect-api-hwvw.onrender.com/api/users/${storedUser._id}`,
        {
          bio,
          skills: skillsArray,
          githubUsername,
          location,
          role,
        },
      );

      localStorage.setItem("user", JSON.stringify(response.data.user));

      setProfile(response.data.user);

      alert("Profile updated successfully");
    } catch (error) {
      console.log(error);
      alert("Profile update failed");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();

    formData.append("avatar", file);

    const response = await axios.post(
      `https://devconnect-api-hwvw.onrender.com/api/users/${storedUser._id}/avatar`,
      formData,
    );

    localStorage.setItem("user", JSON.stringify(response.data.user));

    setProfile(response.data.user);

    alert("Profile photo updated");
  };

  if (!profile) {
    return (
      <MainLayout>
        <h2>Loading profile...</h2>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="profile-layout">
        <div className="profile-card">
          <div className="profile-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt="avatar" />
            ) : (
              profile.name?.charAt(0)
            )}
          </div>

          <label className="avatar-upload-btn">
            Change Photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleAvatarUpload}
              hidden
            />
          </label>

          <h1>{profile.name}</h1>

          <p className="profile-role">{profile.role || "Developer"}</p>

          <p className="profile-bio">{profile.bio || "No bio added yet."}</p>

          <div className="profile-info">
            <p>📍 {profile.location || "Location not added"}</p>
            <p>🐙 GitHub: {profile.githubUsername || "Not added"}</p>
            <p>📧 {profile.email}</p>
          </div>

          <div className="profile-skills">
            {profile.skills?.length > 0 ? (
              profile.skills.map((skill, index) => (
                <span key={index}>{skill}</span>
              ))
            ) : (
              <p>No skills added yet.</p>
            )}
          </div>
        </div>

        <div className="edit-profile-card">
          <h2>Edit Profile</h2>

          <label>Role</label>
          <input
            type="text"
            placeholder="MERN Stack Developer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />

          <label>Bio</label>
          <textarea
            placeholder="Write something about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <label>Skills</label>
          <input
            type="text"
            placeholder="React, Node.js, MongoDB"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />

          <label>GitHub Username</label>
          <input
            type="text"
            placeholder="your-github-username"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
          />

          <label>Location</label>
          <input
            type="text"
            placeholder="India"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <button onClick={handleUpdateProfile}>Save Profile</button>
        </div>

        <GitHubStats username={profile.githubUsername} />

        <div className="ai-review-card">
          <h2>AI Portfolio Review</h2>

          <p>
            Get AI feedback on your profile, skills, projects, and recruiter
            impression.
          </p>

          <button onClick={handleAIReview} disabled={aiLoading}>
            {aiLoading ? "Reviewing..." : "Review My Portfolio"}
          </button>

          {aiReview && <pre className="ai-review-output">{aiReview}</pre>}
        </div>

        <div className="public-section">
          <h2>My Feed</h2>

          {myPosts.length === 0 && <p>No posts yet.</p>}

          {myPosts.map((post) => (
            <PostCard key={post._id} post={post} onLikeUpdated={fetchProfile} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Profile;
