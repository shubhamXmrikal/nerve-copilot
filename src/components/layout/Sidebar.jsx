import { NavLink, useLocation } from "react-router-dom";
import { Home, User, Tv, Gift, Clock, Settings, LogOut, Sparkles } from "lucide-react";
import useAppStore from "../../store/useAppStore";
import "./Sidebar.css";

const navItems = [
  { to: "/", label: "HOME", icon: Home },
  // { to: '#sub',      label: 'SUBSCRIBER', icon: User },
  // { to: '#plans',    label: 'PLANS',      icon: Tv },
  // { to: '#offers',   label: 'OFFERS',     icon: Gift },
  // { to: '#history',  label: 'HISTORY',    icon: Clock },
];

export default function Sidebar() {
  const agentName = useAppStore((s) => s.agentName);
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Branding */}
      <div className="sidebar-brand">
        <span className="brand-name">NERVE</span>
        <span className="brand-sub">AI NAV</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isHash = to.startsWith("#");

          if (isHash) {
            return (
              <div key={to} className="sidebar-nav-item" title={label}>
                <Icon size={20} strokeWidth={1.6} />
                <span className="sidebar-nav-label">{label}</span>
              </div>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive: active }) =>
                `sidebar-nav-item ${active ? "sidebar-nav-item--active" : ""}`
              }
              title={label}
            >
              <Icon size={20} strokeWidth={1.6} />
              <span className="sidebar-nav-label">{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <NavLink
          to="/agent"
          className={({ isActive }) =>
            `sidebar-nav-item ${isActive ? "sidebar-nav-item--active" : ""}`
          }
          title="CRM AGENT"
        >
          <Sparkles size={20} strokeWidth={1.6} />
          <span className="sidebar-nav-label">AGENT</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-nav-item ${isActive ? "sidebar-nav-item--active" : ""}`
          }
          title="SETTINGS"
        >
          <Settings size={20} strokeWidth={1.6} />
          <span className="sidebar-nav-label">SETTINGS</span>
        </NavLink>
        <div className="sidebar-nav-item" title="LOGOUT">
          <LogOut size={20} strokeWidth={1.6} />
          <span className="sidebar-nav-label">LOGOUT</span>
        </div>
      </div>
    </aside>
  );
}
