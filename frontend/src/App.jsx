import React, { useState } from "react";
import { SettingsProvider } from "./contexts/SettingsContext";
import ThemeCustomization from "./themes";
import DashboardLayout from "./layout/Dashboard";
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
import MaintenanceSettings from "./components/MaintenanceSettings";
import MaintenancePage from "./components/MaintenancePage";
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
          <p>An unexpected error occurred. Please refresh the page.</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const API_BASE_URL = process.env.REACT_APP_API_URL;

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });
  const [maintenanceMode, setMaintenanceMode] = useState(null);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [userPermissions, setUserPermissions] = useState(() => {
    const saved = localStorage.getItem("permissions");
    return saved ? JSON.parse(saved) : [];
  });
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

  const { notification, showNotification, hideNotification } =
    useNotification();

  // Check maintenance mode on mount
  React.useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/maintenance/status`);
        if (response.ok) {
          const data = await response.json();
          setMaintenanceMode(data);
        }
      } catch (error) {
        console.error("Failed to check maintenance status:", error);
      } finally {
        setCheckingMaintenance(false);
      }
    };

    checkMaintenance();
  }, []);

  React.useEffect(() => {
    const handleShowNotification = (event) => {
      const { message, type } = event.detail;
      showNotification(message, type);
    };

    window.addEventListener("showNotification", handleShowNotification);
    return () => {
      window.removeEventListener("showNotification", handleShowNotification);
    };
  }, [showNotification]);

  const handleUploadSuccess = async (result) => {
    setError(null);
    setUploadedMonth(result.month);
    setUploadedYear(result.year);
    setUploadedUnit(result.unit);

    localStorage.setItem("uploadedMonth", result.month);
    localStorage.setItem("uploadedYear", result.year);
    localStorage.setItem("uploadedUnit", result.unit);

    showNotification(
      `Berhasil upload ${result.records_processed} records untuk ${result.unit}`,
      "success"
    );

    await handleComparison(result.month, result.year, result.unit);
  };

  const handleUploadError = (error) => {
    const errorMsg = error.message || "Upload failed";
    setError(errorMsg);
    setComparisonResults(null);
    showNotification(errorMsg, "error");
  };

  const handleComparison = async (month, year, unit) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getComparison(month, year, unit);
      const existingResults = comparisonResults || [];

      const otherUnitsData = existingResults.filter(
        (row) =>
          !(row.month === month && row.year === year && row.unit === unit)
      );

      const newResults = result.results.filter(
        (row) => row.month === month && row.year === year && row.unit === unit
      );

      const mergedResults = [...otherUnitsData, ...newResults];
      setComparisonResults(mergedResults);
      localStorage.setItem("comparisonResults", JSON.stringify(mergedResults));

      showNotification(
        `Perbandingan selesai! Ditemukan ${newResults.length} records untuk ${unit}`,
        "success"
      );
    } catch (err) {
      const errorMessage = err.message || "Failed to get comparison results";
      setError(errorMessage);
      setComparisonResults(null);
      localStorage.removeItem("comparisonResults");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (user, permissions) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setUserPermissions(permissions || []);
    localStorage.setItem("permissions", JSON.stringify(permissions || []));

    // Trigger settings reload
    window.dispatchEvent(new CustomEvent("globalSettingsUpdated"));

    showNotification(
      `Selamat datang, ${user.full_name || user.username}!`,
      "success"
    );
  };

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

  // Show maintenance page if enabled (except for superadmin)
  if (!checkingMaintenance && maintenanceMode?.enabled) {
    // If user is superadmin, allow access
    if (currentUser?.role !== "superadmin") {
      return <MaintenancePage settings={maintenanceMode} />;
    }
  }

  if (!isAuthenticated) {
    // Check maintenance for login page too
    if (!checkingMaintenance && maintenanceMode?.enabled) {
      return <MaintenancePage settings={maintenanceMode} />;
    }
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderContent = () => {
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

      case "maintenance":
        if (currentUser?.role !== "superadmin") return <PermissionDenied />;
        return <MaintenanceSettings />;

      default:
        return null;
    }
  };

  return (
    <>
      <DashboardLayout
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        currentUser={currentUser}
        onLogout={handleLogout}
        hasPermission={hasPermission}
      >
        {renderContent()}
      </DashboardLayout>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
          duration={notification.duration}
        />
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeCustomization>
          <AppContent />
        </ThemeCustomization>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
