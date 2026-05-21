import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeSwitcher from "../ThemeSwitcher";

function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    navigate(`/search?q=${query}`);
    setQuery("");
  };

  return (
    <nav className="navbar">
      <h2 className="logo">DevConnect</h2>

      <form className="top-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search users, posts, skills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>
          <ThemeSwitcher />

      <div className="navbar-user">
        <div className="avatar small-avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" />
          ) : (
            user?.name?.charAt(0)
          )}
        </div>
        <span>{user?.name}</span>
      </div>
    </nav>
  );
}

export default Navbar;