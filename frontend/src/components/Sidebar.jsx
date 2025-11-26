import React, { useState, useEffect } from "react";
import "./Sidebar.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function Sidebar({
  activeMenu,
  onMenuChange,
  currentUser,
  onLogout,
  hasPermission,
}) {
  const [logoSrc, setLogoSrc] = useState(null);
  const [title, setTitle] = useState("Data Pegawai");
  const [tagline, setTagline] = useState("Sistem Perbandingan");
  const [themeColor, setThemeColor] = useState(
    localStorage.getItem("themeColor") || "blue"
  );

  useEffect(() => {
    // Fetch sidebar settings from API
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/landing/settings`);
        if (response.ok) {
          const data = await response.json();
          const settings = data.settings;

          // Use API settings if available
          if (settings.sidebar_logo_url) {
            const fixedUrl = settings.sidebar_logo_url.replace(
              /http:\/\/localhost:\d+/,
              process.env.REACT_APP_API_URL || "http://localhost:8000"
            );
            setLogoSrc(fixedUrl);
          }
          if (settings.sidebar_title) {
            setTitle(settings.sidebar_title);
          }
          if (settings.sidebar_tagline) {
            setTagline(settings.sidebar_tagline);
          }
        }
      } catch (err) {
        console.error("Failed to fetch sidebar settings:", err);
      }
    };

    fetchSettings();

    // Load theme from localStorage
    const savedTheme = localStorage.getItem("themeColor");
    if (savedTheme) setThemeColor(savedTheme);

    // Listen for theme updates
    const handleStorageChange = () => {
      const updatedTheme = localStorage.getItem("themeColor");
      if (updatedTheme) setThemeColor(updatedTheme);
    };

    // Listen for profile updates
    const handleProfileUpdate = () => {
      // Force re-render by triggering parent component update
      window.location.reload();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, []);
  const menuItems = [
    {
      id: "dashboard",
      icon: "📊",
      label: "Dashboard",
      description: "Statistik & grafik",
      permission: "dashboard",
    },
    {
      id: "comparison",
      icon: "📈",
      label: "Perbandingan Data",
      description: "Lihat hasil perbandingan",
      permission: "compare",
    },
    {
      id: "upload",
      icon: "📤",
      label: "Upload Data",
      description: "Upload data pegawai",
      permission: "upload",
    },
    {
      id: "archive",
      icon: "📁",
      label: "Arsip Data",
      description: "Lihat data historis",
      permission: "archive",
    },
    {
      id: "admin",
      icon: "🔧",
      label: "Admin Panel",
      description: "Kelola data",
      superadminOnly: true,
    },
    {
      id: "user-management",
      icon: "👥",
      label: "User Management",
      description: "Kelola user & akses",
      superadminOnly: true,
    },
    {
      id: "landing-settings",
      icon: "🏠",
      label: "Landing Page",
      description: "Customize landing page",
      superadminOnly: true,
    },
    {
      id: "profile",
      icon: "👤",
      label: "Edit Profil",
      description: "Kelola profil Anda",
      superadminOnly: true,
    },
    {
      id: "settings",
      icon: "⚙️",
      label: "Pengaturan",
      description: "Font & preferensi",
      superadminOnly: true,
    },
  ];

  // Filter menu items based on user role and permissions
  const filteredMenuItems = menuItems.filter((item) => {
    // Super admin only items
    if (item.superadminOnly && currentUser?.role !== "superadmin") {
      return false;
    }
    // Permission-based items
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    return true;
  });

  return (
    <div
      className="sidebar"
      data-theme={
        themeColor === "white" || themeColor === "gray" ? themeColor : ""
      }
    >
      <div className="sidebar-logo">
        {logoSrc ? (
          <img src={logoSrc} alt="Logo" className="logo-image" />
        ) : (
          <div className="logo-placeholder">🏛️</div>
        )}
      </div>

      <div className="sidebar-header">
        <h2>{title}</h2>
        <p className="sidebar-subtitle">{tagline}</p>
      </div>

      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-menu-item ${
              activeMenu === item.id ? "active" : ""
            }`}
            onClick={() => onMenuChange(item.id)}
          >
            <span className="menu-icon">{item.icon}</span>
            <div className="menu-content">
              <span className="menu-label">{item.label}</span>
              <span className="menu-description">{item.description}</span>
            </div>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {currentUser && (
          <div className="user-info">
            {currentUser.avatar_url ? (
              <img
                src={currentUser.avatar_url.replace(
                  /http:\/\/localhost:\d+/,
                  process.env.REACT_APP_API_URL || "http://localhost:8000"
                )}
                alt={currentUser.username}
                className="user-avatar-image"
                onError={(e) => {
                  // If image fails to load, hide it and show placeholder
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="user-avatar"
              style={{
                display: currentUser.avatar_url ? "none" : "flex",
              }}
            >
              {currentUser.full_name
                ? currentUser.full_name.charAt(0).toUpperCase()
                : currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">
                {currentUser.full_name || currentUser.username}
              </span>
              <span className="user-role">{currentUser.role}</span>
            </div>
            <button className="logout-button" onClick={onLogout} title="Logout">
              🚪
            </button>
          </div>
        )}
        <p>© 2024 Aplikasi Perbandingan Data Pegawai</p>
      </div>
    </div>
  );
}

export default Sidebar;
