import React, { useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import FileUpload from "./components/FileUpload";
import ComparisonView from "./components/ComparisonView";
import AdminPanel from "./components/AdminPanel";
import ArchiveViewer from "./components/ArchiveViewer";
import Settings from "./components/Settings";
import ProfileSettings from "./components/ProfileSettings";
import LandingPage from "./components/LandingPage";
import LandingPageSettings from "./components/LandingPageSettings";
import UserManagement from "./components/UserManagement";
import Notification from "./components/Notification";
import { useNotification } from "./hooks/useNotification";
import { getComparison } from "./api/api";
import "./App.css";
import "./styles/common.css";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>
            An unexpected error occurred. Please refresh the page and try again.
          </p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [userPermissions, setUserPermissions] = useState(() => {
    const saved = localStorage.getItem("permissions");
    return saved ? JSON.parse(saved) : [];
  });

  // Load from localStorage on initial render
  const [comparisonResults, setComparisonResults] = useState(() => {
    const saved = localStorage.getItem("comparisonResults");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedMonth, setUploadedMonth] = useState(() => {
    const saved = localStorage.getItem("uploadedMonth");
    return saved ? parseInt(saved) : null;
  });
  const [uploadedYear, setUploadedYear] = useState(() => {
    const saved = localStorage.getItem("uploadedYear");
    return saved ? parseInt(saved) : null;
  });
  const [uploadedUnit, setUploadedUnit] = useState(() => {
    const saved = localStorage.getItem("uploadedUnit");
    return saved || null;
  });
  const [activeMenu, setActiveMenu] = useState("dashboard");

  // Notification system
  const { notification, showNotification, hideNotification } =
    useNotification();

  // Listen for notification events from other components
  React.useEffect(() => {
    const handleShowNotification = (event) => {
      const { message, type } = event.detail;
      showNotification(message, type);
    };

    const handleGlobalSettingsUpdate = async () => {
      // Reload settings when Super Admin updates them
      try {
        const token = localStorage.getItem("token");
        const API_BASE_URL =
          process.env.REACT_APP_API_URL || "http://localhost:8000";
        const response = await fetch(`${API_BASE_URL}/app-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          applyGlobalSettings(data.settings);
        }
      } catch (error) {
        console.error("Failed to reload settings:", error);
      }
    };

    // Listen for localStorage changes from other tabs
    const handleStorageChange = (e) => {
      if (e.key === "settingsUpdateTrigger") {
        // Settings updated in another tab, reload
        handleGlobalSettingsUpdate();
      }
    };

    window.addEventListener("showNotification", handleShowNotification);
    window.addEventListener(
      "globalSettingsUpdated",
      handleGlobalSettingsUpdate
    );
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("showNotification", handleShowNotification);
      window.removeEventListener(
        "globalSettingsUpdated",
        handleGlobalSettingsUpdate
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [showNotification]);

  // Load dark mode on mount
  React.useEffect(() => {
    const darkMode = localStorage.getItem("darkMode") === "true";
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }

    // Load theme colors
    const themeColor = localStorage.getItem("themeColor") || "blue";
    const THEME_COLORS = {
      blue: { primary: "#1e3a8a", secondary: "#1e40af" },
      green: { primary: "#065f46", secondary: "#047857" },
      purple: { primary: "#5b21b6", secondary: "#6d28d9" },
      red: { primary: "#991b1b", secondary: "#b91c1c" },
      dark: { primary: "#1f2937", secondary: "#374151" },
      white: { primary: "#ffffff", secondary: "#f3f4f6" },
      gray: { primary: "#6b7280", secondary: "#9ca3af" },
    };
    const theme = THEME_COLORS[themeColor];
    if (theme) {
      document.documentElement.style.setProperty(
        "--sidebar-primary",
        theme.primary
      );
      document.documentElement.style.setProperty(
        "--sidebar-secondary",
        theme.secondary
      );
    }

    // Load accent color
    const accentColor = localStorage.getItem("accentColor") || "blue";
    const ACCENT_COLORS = {
      blue: "#2563eb",
      green: "#10b981",
      orange: "#f59e0b",
      red: "#ef4444",
      purple: "#8b5cf6",
    };
    const accent = ACCENT_COLORS[accentColor];
    if (accent) {
      document.documentElement.style.setProperty("--accent-color", accent);
    }

    // Load font
    const selectedFont = localStorage.getItem("selectedFont") || "jakarta";
    const FONTS = {
      inter: "'Inter', sans-serif",
      jakarta: "'Plus Jakarta Sans', sans-serif",
      poppins: "'Poppins', sans-serif",
    };
    const font = FONTS[selectedFont];
    if (font) {
      document.documentElement.style.setProperty("--app-font", font);
    }
  }, []);

  const handleUploadSuccess = async (result) => {
    setError(null);
    setUploadedMonth(result.month);
    setUploadedYear(result.year);
    setUploadedUnit(result.unit);

    // Save to localStorage
    localStorage.setItem("uploadedMonth", result.month);
    localStorage.setItem("uploadedYear", result.year);
    localStorage.setItem("uploadedUnit", result.unit);

    // Show success notification
    showNotification(
      `Berhasil upload ${result.records_processed} records untuk ${result.unit}`,
      "success"
    );

    // Automatically trigger comparison after successful upload
    await handleComparison(result.month, result.year, result.unit);
  };

  const handleUploadError = (error) => {
    const errorMsg = error.message || "Upload failed";
    setError(errorMsg);
    setComparisonResults(null);

    // Show error notification
    showNotification(errorMsg, "error");
  };

  const handleComparison = async (month, year, unit) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getComparison(month, year, unit);

      // Get existing comparison results from state or localStorage
      const existingResults = comparisonResults || [];

      // Merge new results with existing results
      // Remove old data for the same month/year/unit, then add new data
      const otherUnitsData = existingResults.filter(
        (row) =>
          !(row.month === month && row.year === year && row.unit === unit)
      );

      const newResults = result.results.filter(
        (row) => row.month === month && row.year === year && row.unit === unit
      );

      const mergedResults = [...otherUnitsData, ...newResults];

      setComparisonResults(mergedResults);

      // Save to localStorage
      localStorage.setItem("comparisonResults", JSON.stringify(mergedResults));

      // Show success notification
      showNotification(
        `Perbandingan selesai! Ditemukan ${newResults.length} records untuk ${unit}`,
        "success"
      );
    } catch (err) {
      const errorMessage = err.message || "Failed to get comparison results";
      setError(errorMessage);
      setComparisonResults(null);

      // Clear localStorage on error
      localStorage.removeItem("comparisonResults");

      // Check if it's a network error
      if (errorMessage.includes("No response from server")) {
        setError(
          "Cannot connect to server. Please ensure the backend is running."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (uploadedMonth && uploadedYear && uploadedUnit) {
      handleComparison(uploadedMonth, uploadedYear, uploadedUnit);
    }
  };

  const handleLoginSuccess = async (user, permissions) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setUserPermissions(permissions || []);
    localStorage.setItem("permissions", JSON.stringify(permissions || []));

    // Load global app settings
    try {
      const token = localStorage.getItem("token");
      const API_BASE_URL =
        process.env.REACT_APP_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE_URL}/app-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const settings = data.settings;

        // Apply settings
        applyGlobalSettings(settings);
      }
    } catch (error) {
      console.error("Failed to load app settings:", error);
    }

    showNotification(
      `Selamat datang, ${user.full_name || user.username}!`,
      "success"
    );
  };

  // Function to apply global settings
  const applyGlobalSettings = (settings) => {
    if (!settings) return;

    // Apply theme colors
    const THEME_COLORS = {
      blue: { primary: "#1e3a8a", secondary: "#1e40af" },
      green: { primary: "#065f46", secondary: "#047857" },
      purple: { primary: "#5b21b6", secondary: "#6d28d9" },
      red: { primary: "#991b1b", secondary: "#b91c1c" },
      dark: { primary: "#1f2937", secondary: "#374151" },
      white: { primary: "#ffffff", secondary: "#f3f4f6" },
      gray: { primary: "#6b7280", secondary: "#9ca3af" },
    };

    const ACCENT_COLORS = {
      blue: "#2563eb",
      green: "#10b981",
      orange: "#f59e0b",
      red: "#ef4444",
      purple: "#8b5cf6",
    };

    const FONTS = {
      inter: "'Inter', sans-serif",
      jakarta: "'Plus Jakarta Sans', sans-serif",
      poppins: "'Poppins', sans-serif",
    };

    if (settings.themeColor && THEME_COLORS[settings.themeColor]) {
      const theme = THEME_COLORS[settings.themeColor];
      document.documentElement.style.setProperty(
        "--sidebar-primary",
        theme.primary
      );
      document.documentElement.style.setProperty(
        "--sidebar-secondary",
        theme.secondary
      );
    }

    if (settings.accentColor && ACCENT_COLORS[settings.accentColor]) {
      document.documentElement.style.setProperty(
        "--accent-color",
        ACCENT_COLORS[settings.accentColor]
      );
    }

    if (settings.selectedFont && FONTS[settings.selectedFont]) {
      document.documentElement.style.setProperty(
        "--app-font",
        FONTS[settings.selectedFont]
      );
    }

    if (settings.fontSize) {
      document.documentElement.style.setProperty(
        "--font-scale",
        parseInt(settings.fontSize) / 100
      );
    }

    if (settings.sidebarWidth) {
      const widths = { narrow: "180px", normal: "250px", wide: "320px" };
      document.documentElement.style.setProperty(
        "--sidebar-width",
        widths[settings.sidebarWidth] || "250px"
      );
    }

    if (settings.contentSpacing) {
      const spacings = { compact: "0.75", normal: "1", comfortable: "1.5" };
      document.documentElement.style.setProperty(
        "--spacing-scale",
        spacings[settings.contentSpacing] || "1"
      );
    }

    if (settings.darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (currentUser.role === "superadmin") return true;
    return userPermissions.includes(permission);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserPermissions([]);
    setActiveMenu("dashboard");
    showNotification("Anda telah logout", "info");
  };

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderContent = () => {
    // Permission denied component
    const PermissionDenied = () => (
      <div className="permission-denied">
        <h2>🚫 Akses Ditolak</h2>
        <p>Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        <p>Silakan hubungi Super Admin untuk mendapatkan akses.</p>
      </div>
    );

    switch (activeMenu) {
      case "dashboard":
        if (!hasPermission("dashboard")) return <PermissionDenied />;
        return <Dashboard />;

      case "comparison":
        if (!hasPermission("compare")) return <PermissionDenied />;
        return <ComparisonView hasPermission={hasPermission} />;

      case "upload":
        if (!hasPermission("upload")) return <PermissionDenied />;
        return (
          <>
            <header className="content-header">
              <h1>Upload Data Pegawai</h1>
              <p className="subtitle">
                Upload file Excel atau CSV untuk perbandingan data
              </p>
            </header>

            <FileUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </>
        );

      case "archive":
        if (!hasPermission("archive")) return <PermissionDenied />;
        return (
          <>
            <header className="content-header">
              <h1>Arsip Data Pegawai</h1>
              <p className="subtitle">
                Lihat dan cari data pegawai dari periode sebelumnya
              </p>
            </header>

            <ArchiveViewer hasPermission={hasPermission} />
          </>
        );

      case "admin":
        if (currentUser?.role !== "superadmin") return <PermissionDenied />;
        return (
          <>
            <header className="content-header">
              <h1>Admin Panel</h1>
              <p className="subtitle">Kelola dan hapus data pegawai</p>
            </header>

            <AdminPanel />
          </>
        );

      case "user-management":
        if (currentUser?.role !== "superadmin") return <PermissionDenied />;
        return <UserManagement />;

      case "profile":
        return <ProfileSettings />;

      case "settings":
        return <Settings />;

      case "landing-settings":
        if (currentUser?.role !== "superadmin") return <PermissionDenied />;
        return (
          <>
            <header className="content-header">
              <h1>Pengaturan Landing Page</h1>
              <p className="subtitle">
                Customize tampilan landing page dan form login
              </p>
            </header>

            <LandingPageSettings />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <Layout
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        currentUser={currentUser}
        onLogout={handleLogout}
        hasPermission={hasPermission}
      >
        {renderContent()}
      </Layout>

      {/* Notification System */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
          duration={notification.duration}
        />
      )}
    </ErrorBoundary>
  );
}

export default App;
