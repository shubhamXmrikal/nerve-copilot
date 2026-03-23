import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, Settings, HelpCircle, Loader2, Sun, Moon } from "lucide-react";
import useAppStore from "../../store/useAppStore";
import "./TopBar.css";

const navLinks = [
  { label: "Dashboard", path: "/" },
  // { label: 'Inventory', path: '#inv' },
  // { label: 'Support',   path: '#sup' },
  // { label: 'Reports',   path: '#rep' },
];

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("nerve-theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    localStorage.setItem("nerve-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const vcNo = useAppStore((s) => s.vcNo);
  const isLoadingSubscriber = useAppStore((s) => s.isLoadingSubscriber);
  const setVcNo = useAppStore((s) => s.setVcNo);
  const fetchSubscriber = useAppStore((s) => s.fetchSubscriber);

  const handleFetch = () => {
    if (!vcNo.trim() || isLoadingSubscriber) return;
    fetchSubscriber(vcNo.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleFetch();
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-brand">NERVE AI</span>
        <nav className="topbar-nav">
          {navLinks.map(({ label, path }) => {
            const isActive = path === "/" ? location.pathname === "/" : false;
            return (
              <span
                key={path}
                className={`topbar-nav-link ${isActive ? "topbar-nav-link--active" : ""}`}
                onClick={() => !path.startsWith("#") && navigate(path)}
              >
                {label}
              </span>
            );
          })}
        </nav>
      </div>

      <div className="topbar-right">
        <div className="topbar-search-group">
          <Search size={14} className="topbar-search-icon" />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search customer or VC..."
            value={vcNo}
            onChange={(e) => setVcNo(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoadingSubscriber}
          />
          {isLoadingSubscriber && (
            <Loader2 size={13} className="spin topbar-search-spinner" />
          )}
        </div>

        <div className="topbar-icons">
          <button
            className="topbar-icon-btn"
            onClick={() => setIsDark((d) => !d)}
            title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
          >
            {isDark ? <Sun size={16} strokeWidth={1.6} /> : <Moon size={16} strokeWidth={1.6} />}
          </button>
          <button className="topbar-icon-btn" title="Notifications">
            <Bell size={16} strokeWidth={1.6} />
          </button>
          <button
            className="topbar-icon-btn"
            onClick={() => navigate("/settings")}
            title="Settings"
          >
            <Settings size={16} strokeWidth={1.6} />
          </button>
          <button className="topbar-icon-btn" title="Help">
            <HelpCircle size={16} strokeWidth={1.6} />
          </button>
          <div className="topbar-avatar">
            <img
              src="https://ui-avatars.com/api/?name=Agent&background=3b82f6&color=fff&size=32&bold=true&font-size=0.4"
              alt="Agent"
              className="topbar-avatar-img"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
