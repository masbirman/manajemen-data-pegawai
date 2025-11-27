import React, { useState } from "react";
import { login } from "../api/api";
import "./AdminLogin.css";

function AdminLogin({ onLoginSuccess, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await login(username, password);

      // Check if user is superadmin
      if (response.user.role !== "superadmin") {
        setError(
          "Akses ditolak. Hanya Super Admin yang dapat login melalui halaman ini."
        );
        setLoading(false);
        return;
      }

      // Save token and user info
      localStorage.setItem("token", response.access_token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Superadmin has all permissions
      const permissions = [
        "dashboard",
        "upload",
        "compare",
        "archive",
        "download",
        "edit_status",
      ];

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

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-icon">🔐</div>
            <h2>Admin Access</h2>
            <p>Login khusus Super Administrator</p>
          </div>

          {error && (
            <div className="admin-login-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="form-field">
              <label htmlFor="username">Username</label>
              <div className="input-with-icon">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username admin"
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
                  placeholder="Password admin"
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
              className="admin-login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Memproses...
                </>
              ) : (
                "Masuk sebagai Admin"
              )}
            </button>
          </form>

          {onBack && (
            <button className="back-button" onClick={onBack}>
              ← Kembali
            </button>
          )}
        </div>

        <div className="admin-login-footer">
          <p>🛡️ Halaman ini hanya untuk Super Administrator</p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
