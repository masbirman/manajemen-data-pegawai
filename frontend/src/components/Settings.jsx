import React, { useState, useEffect } from "react";
import "./Settings.css";

const THEME_COLORS = {
  blue: { name: "Biru", primary: "#1e3a8a", secondary: "#1e40af" },
  green: { name: "Hijau", primary: "#065f46", secondary: "#047857" },
  purple: { name: "Ungu", primary: "#5b21b6", secondary: "#6d28d9" },
  red: { name: "Merah", primary: "#991b1b", secondary: "#b91c1c" },
  dark: { name: "Hitam", primary: "#1f2937", secondary: "#374151" },
  white: { name: "Putih", primary: "#ffffff", secondary: "#f3f4f6" },
  gray: { name: "Abu-abu", primary: "#6b7280", secondary: "#9ca3af" },
};

const ACCENT_COLORS = {
  blue: "#2563eb",
  green: "#10b981",
  orange: "#f59e0b",
  red: "#ef4444",
  purple: "#8b5cf6",
};

const FONTS = {
  inter: { name: "Inter", value: "'Inter', sans-serif" },
  jakarta: {
    name: "Plus Jakarta Sans",
    value: "'Plus Jakarta Sans', sans-serif",
  },
  poppins: { name: "Poppins", value: "'Poppins', sans-serif" },
};

function Settings() {
  const [itemsPerPage, setItemsPerPage] = useState(
    localStorage.getItem("itemsPerPage") || "100"
  );
  const [defaultUnit, setDefaultUnit] = useState(
    localStorage.getItem("defaultUnit") || "Dinas"
  );
  const [themeColor, setThemeColor] = useState(
    localStorage.getItem("themeColor") || "blue"
  );
  const [accentColor, setAccentColor] = useState(
    localStorage.getItem("accentColor") || "blue"
  );
  const [selectedFont, setSelectedFont] = useState(
    localStorage.getItem("selectedFont") || "jakarta"
  );
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );
  const [message, setMessage] = useState(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    // Apply theme colors
    const theme = THEME_COLORS[themeColor];
    document.documentElement.style.setProperty(
      "--sidebar-primary",
      theme.primary
    );
    document.documentElement.style.setProperty(
      "--sidebar-secondary",
      theme.secondary
    );
  }, [themeColor]);

  useEffect(() => {
    // Apply accent color
    const accent = ACCENT_COLORS[accentColor];
    document.documentElement.style.setProperty("--accent-color", accent);
  }, [accentColor]);

  useEffect(() => {
    // Apply font
    const font = FONTS[selectedFont];
    document.documentElement.style.setProperty("--app-font", font.value);
  }, [selectedFont]);

  useEffect(() => {
    // Apply dark mode
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  const handleSave = () => {
    localStorage.setItem("itemsPerPage", itemsPerPage);
    localStorage.setItem("defaultUnit", defaultUnit);
    localStorage.setItem("themeColor", themeColor);
    localStorage.setItem("accentColor", accentColor);
    localStorage.setItem("selectedFont", selectedFont);
    localStorage.setItem("darkMode", darkMode);

    setMessage({
      type: "success",
      text: "Pengaturan berhasil disimpan! Refresh halaman untuk melihat perubahan.",
    });

    window.dispatchEvent(new Event("storage"));

    setTimeout(() => setMessage(null), 5000);
  };

  const handleReset = () => {
    setItemsPerPage("100");
    setDefaultUnit("Dinas");
    setThemeColor("blue");
    setAccentColor("blue");
    setSelectedFont("jakarta");
    setDarkMode(false);

    localStorage.removeItem("itemsPerPage");
    localStorage.removeItem("defaultUnit");
    localStorage.removeItem("themeColor");
    localStorage.removeItem("accentColor");
    localStorage.removeItem("selectedFont");
    localStorage.removeItem("darkMode");

    document.documentElement.style.setProperty(
      "--sidebar-primary",
      THEME_COLORS.blue.primary
    );
    document.documentElement.style.setProperty(
      "--sidebar-secondary",
      THEME_COLORS.blue.secondary
    );
    document.documentElement.style.setProperty(
      "--accent-color",
      ACCENT_COLORS.blue
    );
    document.documentElement.style.setProperty(
      "--app-font",
      FONTS.jakarta.value
    );
    document.body.classList.remove("dark-mode");

    setMessage({
      type: "success",
      text: "Pengaturan berhasil direset ke default!",
    });

    window.dispatchEvent(new Event("storage"));

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
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:8000"
        }/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

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
              <span>🎨 Warna Sidebar</span>
              <p>Pilih warna tema sidebar</p>
            </div>
            <div className="color-options">
              {Object.entries(THEME_COLORS).map(([key, value]) => (
                <button
                  key={key}
                  className={`color-btn ${themeColor === key ? "active" : ""}`}
                  style={{
                    background:
                      key === "white"
                        ? `linear-gradient(135deg, ${value.primary}, ${value.secondary})`
                        : `linear-gradient(135deg, ${value.primary}, ${value.secondary})`,
                    border: key === "white" ? "2px solid #e5e7eb" : "none",
                    color:
                      key === "white" || key === "gray" ? "#1e3a8a" : "white",
                  }}
                  onClick={() => setThemeColor(key)}
                  title={value.name}
                >
                  {themeColor === key && "✓"}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <span>✨ Warna Aksen</span>
              <p>Warna untuk button dan highlight</p>
            </div>
            <div className="color-options">
              {Object.entries(ACCENT_COLORS).map(([key, value]) => (
                <button
                  key={key}
                  className={`color-btn ${accentColor === key ? "active" : ""}`}
                  style={{ backgroundColor: value }}
                  onClick={() => setAccentColor(key)}
                >
                  {accentColor === key && "✓"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Display */}
        <div className="settings-section">
          <h3>📊 Tampilan Data</h3>

          <div className="setting-item">
            <div className="setting-label">
              <span>📄 Baris per Halaman</span>
              <p>Jumlah data yang ditampilkan per halaman</p>
            </div>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(e.target.value)}
              className="setting-select"
            >
              <option value="10">10 baris</option>
              <option value="100">100 baris</option>
              <option value="500">500 baris</option>
              <option value="1000">1000 baris</option>
              <option value="all">Semua</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <span>🏢 Unit Default</span>
              <p>Unit yang dipilih saat membuka tabel</p>
            </div>
            <select
              value={defaultUnit}
              onChange={(e) => setDefaultUnit(e.target.value)}
              className="setting-select"
            >
              <option value="Semua">Semua Unit</option>
              <option value="Dinas">Dinas</option>
              <option value="Cabdis Wil. 1">Cabdis Wil. 1</option>
              <option value="Cabdis Wil. 2">Cabdis Wil. 2</option>
              <option value="Cabdis Wil. 3">Cabdis Wil. 3</option>
              <option value="Cabdis Wil. 4">Cabdis Wil. 4</option>
              <option value="Cabdis Wil. 5">Cabdis Wil. 5</option>
              <option value="Cabdis Wil. 6">Cabdis Wil. 6</option>
              <option value="PPPK">PPPK</option>
            </select>
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
        <button
          className="reset-button"
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          style={{ backgroundColor: "#ef4444" }}
        >
          🗑️ Clear All Data
        </button>
      </div>

      {/* Test Notification Section */}
      <div className="settings-section" style={{ marginTop: "24px" }}>
        <h3>🔔 Test Notification System</h3>
        <p style={{ marginBottom: "16px", color: "#666" }}>
          Klik tombol di bawah untuk mencoba notification system
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            className="test-notification-btn success"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("showNotification", {
                  detail: {
                    message: "Operasi berhasil! Data telah disimpan.",
                    type: "success",
                  },
                })
              );
            }}
          >
            ✅ Success
          </button>
          <button
            className="test-notification-btn error"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("showNotification", {
                  detail: {
                    message: "Terjadi kesalahan! Silakan coba lagi.",
                    type: "error",
                  },
                })
              );
            }}
          >
            ❌ Error
          </button>
          <button
            className="test-notification-btn warning"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("showNotification", {
                  detail: {
                    message: "Peringatan! Periksa kembali data Anda.",
                    type: "warning",
                  },
                })
              );
            }}
          >
            ⚠️ Warning
          </button>
          <button
            className="test-notification-btn info"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("showNotification", {
                  detail: {
                    message: "Informasi: Sistem akan maintenance besok.",
                    type: "info",
                  },
                })
              );
            }}
          >
            ℹ️ Info
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
