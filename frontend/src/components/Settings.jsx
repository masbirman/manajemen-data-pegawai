import React, { useState } from "react";
import { useSettings } from "../contexts/SettingsContext";
import "./Settings.css";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const FONTS = {
  inter: { name: "Inter", value: "'Inter', sans-serif" },
  jakarta: {
    name: "Plus Jakarta Sans",
    value: "'Plus Jakarta Sans', sans-serif",
  },
  poppins: { name: "Poppins", value: "'Poppins', sans-serif" },
};

function Settings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [message, setMessage] = useState(null);

  // Local state for form
  const [selectedFont, setSelectedFont] = useState(
    settings.selectedFont || "inter"
  );
  const [fontSize, setFontSize] = useState(settings.fontSize || 100);
  const [darkMode, setDarkMode] = useState(settings.darkMode || false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState(null);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");

      const newSettings = {
        selectedFont,
        fontSize: String(fontSize),
        darkMode,
        // Include required fields with defaults
        sidebarWidth: "normal",
        contentSpacing: "normal",
        themeColor: "blue",
        accentColor: "blue",
      };

      // Save to API
      const response = await fetch(`${API_BASE_URL}/app-settings/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      // Update context
      updateSettings(newSettings);

      // Trigger reload for theme changes
      window.dispatchEvent(new CustomEvent("globalSettingsUpdated"));

      setMessage({
        type: "success",
        text: "Pengaturan berhasil disimpan! Halaman akan di-refresh untuk menerapkan perubahan.",
      });

      // Reload page to apply theme changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Gagal menyimpan pengaturan: " + error.message,
      });
    }

    setTimeout(() => setMessage(null), 5000);
  };

  const handleReset = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/app-settings/reset/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to reset settings");
      }

      // Reset context
      resetSettings();

      // Reset local state
      setSelectedFont("inter");
      setFontSize(100);
      setDarkMode(false);

      setMessage({
        type: "success",
        text: "Pengaturan berhasil direset! Halaman akan di-refresh.",
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Gagal reset pengaturan: " + error.message,
      });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "Semua field harus diisi!" });
      setTimeout(() => setPasswordMessage(null), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Password baru tidak cocok!" });
      setTimeout(() => setPasswordMessage(null), 3000);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "Password minimal 6 karakter!",
      });
      setTimeout(() => setPasswordMessage(null), 3000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({
          type: "success",
          text: "Password berhasil diubah!",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({
          type: "error",
          text: data.detail || "Gagal mengubah password",
        });
      }
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: "Terjadi kesalahan saat mengubah password",
      });
    }

    setTimeout(() => setPasswordMessage(null), 3000);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>⚙️ Pengaturan</h2>
        <p>Sesuaikan tampilan dan preferensi aplikasi</p>
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>{message.text}</div>
      )}

      <div className="settings-sections">
        {/* Appearance */}
        <div className="settings-section">
          <h3>🎨 Tampilan</h3>

          <div className="setting-item">
            <div className="setting-label">
              <span>🌙 Dark Mode</span>
              <p>Aktifkan mode gelap untuk tampilan yang lebih nyaman</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <span>🔤 Font</span>
              <p>Pilih font untuk aplikasi</p>
            </div>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="setting-select"
            >
              {Object.entries(FONTS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <span>📏 Ukuran Font</span>
              <p>Sesuaikan ukuran teks ({fontSize}%)</p>
            </div>
            <div className="font-size-control">
              <input
                type="range"
                min="75"
                max="125"
                step="5"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="font-size-slider"
              />
              <div className="font-size-labels">
                <span>75%</span>
                <span>100%</span>
                <span>125%</span>
              </div>
              <div className="font-size-preview">
                Preview:{" "}
                <span style={{ fontSize: `${fontSize}%` }}>Aa Bb Cc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="settings-section">
          <h3>🔒 Ubah Password</h3>

          {passwordMessage && (
            <div className={`settings-message ${passwordMessage.type}`}>
              {passwordMessage.text}
            </div>
          )}

          <div className="setting-item">
            <div className="setting-label">
              <span>Password Saat Ini</span>
            </div>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="setting-input"
              placeholder="Masukkan password saat ini"
            />
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <span>Password Baru</span>
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="setting-input"
              placeholder="Masukkan password baru (min. 6 karakter)"
            />
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <span>Konfirmasi Password Baru</span>
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="setting-input"
              placeholder="Masukkan ulang password baru"
            />
          </div>

          <button
            className="save-button"
            onClick={handleChangePassword}
            style={{ marginTop: "16px" }}
          >
            🔒 Ubah Password
          </button>
        </div>
      </div>

      <div className="settings-actions">
        <button className="save-button" onClick={handleSave}>
          💾 Simpan Pengaturan
        </button>
        <button className="reset-button" onClick={handleReset}>
          🔄 Reset ke Default
        </button>
      </div>
    </div>
  );
}

export default Settings;
