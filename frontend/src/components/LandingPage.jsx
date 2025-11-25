import React, { useState, useEffect } from "react";
import { login, getLandingSettings } from "../api/api";
import "./LandingPage.css";

function LandingPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Load landing page settings
    const loadSettings = async () => {
      try {
        const data = await getLandingSettings();
        setSettings(data.settings);
      } catch (err) {
        console.error("Failed to load landing settings:", err);
        // Use default settings if API fails
        setSettings({
          title: "Sistem Perbandingan Data Pegawai",
          subtitle: "Kelola dan bandingkan data pegawai dengan mudah",
          welcome_message: "Selamat datang di sistem perbandingan data pegawai",
          footer_text: "© 2024 Sistem Data Pegawai",
          background_color: "#f5f5f5",
          primary_color: "#1e3a8a",
        });
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await login(username, password);

      // Save token and user info
      localStorage.setItem("token", response.access_token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Fetch user permissions based on role
      let permissions = [];
      if (response.user.role === "superadmin") {
        // Superadmin has all permissions
        permissions = [
          "dashboard",
          "upload",
          "compare",
          "archive",
          "download",
          "edit_status",
        ];
      } else {
        // Fetch role permissions from API
        try {
          const API_BASE_URL =
            process.env.REACT_APP_API_URL || "http://localhost:8000";
          const permResponse = await fetch(
            `${API_BASE_URL}/auth/permissions/${response.user.role}`,
            {
              headers: { Authorization: `Bearer ${response.access_token}` },
            }
          );
          if (permResponse.ok) {
            const permData = await permResponse.json();
            permissions = permData.permissions || [];
          }
        } catch (permErr) {
          console.error("Failed to fetch permissions:", permErr);
        }
      }

      // Call success callback with permissions
      onLoginSuccess(response.user, permissions);
    } catch (err) {
      setError(
        err.message || "Login gagal. Periksa username dan password Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!settings) {
    return (
      <div className="landing-loading">
        <div className="spinner-large"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="landing-page"
      style={{
        background: `linear-gradient(135deg, ${settings.background_color} 0%, ${settings.background_color} 100%)`,
      }}
    >
      <div
        className="landing-container"
        style={{ backgroundColor: settings.card_background }}
      >
        {/* Left Side - Illustration */}
        <div
          className="landing-left"
          style={{
            background: `linear-gradient(135deg, ${settings.left_gradient_start} 0%, ${settings.left_gradient_end} 100%)`,
          }}
        >
          {/* Title and Tagline - Above Illustration */}
          <div
            className="landing-info"
            style={{ textAlign: settings.text_align, marginBottom: "20px" }}
          >
            <h1 style={{ fontSize: `${settings.title_size}px` }}>
              {settings.title}
            </h1>
            <p
              className="landing-welcome"
              style={{
                fontSize: `${settings.welcome_size}px`,
                whiteSpace: "pre-line",
              }}
            >
              {settings.welcome_message}
            </p>
          </div>

          {/* Illustration */}
          {settings.illustration_url ? (
            <div
              className="landing-illustration"
              style={{ height: `${settings.image_height}px` }}
            >
              <img
                src={settings.illustration_url}
                alt="Illustration"
                className="illustration-image"
                style={{ width: `${settings.image_width}%` }}
              />
            </div>
          ) : (
            <div
              className="illustration-placeholder"
              style={{ height: `${settings.image_height}px` }}
            >
              <div className="placeholder-icon">📊</div>
            </div>
          )}
        </div>

        {/* Right Side - Login Form */}
        <div className="landing-right">
          <div className="login-card">
            <div className="login-header">
              <h2 style={{ color: settings.primary_color }}>Masuk</h2>
              <p>Silakan masuk untuk melanjutkan</p>
            </div>

            {error && (
              <div className="login-error">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-field">
                <label htmlFor="username">Username</label>
                <div className="input-with-icon">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
                style={{
                  backgroundColor:
                    settings.button_color || settings.primary_color,
                  color: settings.button_text_color || "#ffffff",
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>
          </div>

          <div className="landing-footer">
            <p>{settings.footer_text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
