import { useEffect, useState } from "react";

const themes = [
  "pastel",
  "ocean",
  "mint",
  "sunset",
  "rose",
  "dark",
  "crimson",
  "gold",
  "purple",
  "cyan",
  "mocha",
  "black",
];

function ThemeSwitcher() {
 const [theme, setTheme] = useState(
  localStorage.getItem("theme") || "black"
);

  useEffect(() => {
  document.body.className = "";
  document.body.classList.add(`theme-${theme}`);
  localStorage.setItem("theme", theme);
}, [theme]);

  return (
    <select
      className="theme-switcher"
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
    >
      {themes.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}

export default ThemeSwitcher;