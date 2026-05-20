import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

function MainLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-area">
        <Sidebar />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;