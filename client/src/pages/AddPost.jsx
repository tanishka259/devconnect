import { useNavigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import CreatePost from "./feed/CreatePost";

function AddPost() {
  const navigate = useNavigate();

  const handlePostCreated = () => {
    navigate("/dashboard");
  };

  return (
    <MainLayout>
      <div className="add-post-page">
        <h1>Create New Post</h1>
        <p>Share your dev update, idea, project, or code thought.</p>

        <CreatePost onPostCreated={handlePostCreated} />
      </div>
    </MainLayout>
  );
}

export default AddPost;