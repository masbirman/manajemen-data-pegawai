import React, { useState, useEffect } from "react";
import {
  getLandingSettings,
  updateLandingSettings,
  uploadLandingIllustration,
} from "../api/api";
import "./LandingPageSettings.css";

function LandingPageSettings() {
  const [settings, setSettings] = useState({
    title: "",
    subtitle: "",
    welcome_message: "",
    footer_text: "",
    image_width: 100,
    image_height: 350,
    background_color: "#667eea",
    card_background: "#ffffff",
    left_gradient_start: "#667eea",
    left_gradient_end: "#764ba2",
    primary_color: "#1e3a8a",
    button_color: "#667eea",
    button_text_color: "#ffffff",
    title_size: 32,
    subtitle_size: 16,
    welcome_size: 14,
    text_align: "center",
    sidebar_title: "Data Pegawai",
    sidebar_tagline: "Sistem Perbandingan",
  });
  const [sidebarLogo, setSidebarLogo] = useState(null);
  const [illustration, setIllustration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getLandingSettings();
      setSettings(data.settings);
      setIllustration(data.settings.illustration_url);
      setSidebarLogo(data.settings.sidebar_logo_url);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Gagal memuat pengaturan landing page",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await updateLandingSettings(settings);
      setMessage({
        type: "success",
        text: "Pengaturan landing page berhasil disimpan!",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Gagal menyimpan pengaturan",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleIllustrationUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: "Format file tidak valid. Gunakan PNG, JPG, SVG, atau WebP",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Ukuran file terlalu besar. Maksimal 5MB",
      });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const result = await uploadLandingIllustration(file);
      // Add timestamp to bypass browser cache
      setIllustration(result.url + "?t=" + Date.now());
      setMessage({
        type: "success",
        text: "Ilustrasi berhasil diupload!",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Gagal mengupload ilustrasi",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-settings-loading">
        <div className="spinner-large"></div>
        <p>Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="landing-settings-container">
      <div className="settings-header">
        <h2>🏠 Pengaturan Landing Page</h2>
        <p>Customize tampilan landing page dan form login</p>
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>{message.text}</div>
      )}

      <div className="settings-sections">
        {/* Illustration Section */}
        <div className="settings-section">
          <h3>🖼️ Ilustrasi Landing Page</h3>
          <p className="section-description">
            Upload gambar ilustrasi yang akan ditampilkan di sisi kiri landing
            page
          </p>

          <div className="illustration-preview">
            {illustration ? (
              <div className="preview-image-container">
                <img
                  src={illustration}
                  alt="Landing Illustration"
                  className="preview-image"
                />
              </div>
            ) : (
              <div className="preview-placeholder">
                <span className="placeholder-icon">🖼️</span>
                <p>Belum ada ilustrasi</p>
              </div>
            )}
          </div>

          <div className="upload-section">
            <label htmlFor="illustration-upload" className="upload-button">
              {uploading ? "Mengupload..." : "📤 Upload Ilustrasi"}
            </label>
            <input
              type="file"
              id="illustration-upload"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              onChange={handleIllustrationUpload}
              disabled={uploading}
              style={{ display: "none" }}
            />
            <p className="upload-hint">
              Format: PNG, JPG, SVG, WebP | Maksimal: 5MB
            </p>
          </div>
        </div>

        {/* Text Content Section */}
        <div className="settings-section">
          <h3>📝 Konten Teks</h3>

          <div className="form-group">
            <label htmlFor="title">Judul Aplikasi</label>
            <input
              type="text"
              id="title"
              name="title"
              value={settings.title}
              onChange={handleInputChange}
              placeholder="Sistem Perbandingan Data Pegawai"
            />
          </div>

          <div className="form-group">
            <label htmlFor="subtitle">Subtitle / Tagline</label>
            <input
              type="text"
              id="subtitle"
              name="subtitle"
              value={settings.subtitle}
              onChange={handleInputChange}
              placeholder="Kelola dan bandingkan data pegawai dengan mudah"
            />
          </div>

          <div className="form-group">
            <label htmlFor="welcome_message">Pesan Sambutan</label>
            <textarea
              id="welcome_message"
              name="welcome_message"
              value={settings.welcome_message}
              onChange={handleInputChange}
              placeholder="Selamat datang di sistem perbandingan data pegawai"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="footer_text">Footer Text</label>
            <input
              type="text"
              id="footer_text"
              name="footer_text"
              value={settings.footer_text}
              onChange={handleInputChange}
              placeholder="© 2024 Sistem Data Pegawai"
            />
          </div>
        </div>

        {/* Image Size Section */}
        <div className="settings-section">
          <h3>📐 Ukuran Gambar</h3>

          <div className="form-group">
            <label htmlFor="image_width">Lebar Gambar (%)</label>
            <input
              type="range"
              id="image_width"
              name="image_width"
              min="50"
              max="100"
              value={settings.image_width}
              onChange={handleInputChange}
            />
            <span className="range-value">{settings.image_width}%</span>
          </div>

          <div className="form-group">
            <label htmlFor="image_height">Tinggi Gambar (px)</label>
            <input
              type="range"
              id="image_height"
              name="image_height"
              min="200"
              max="500"
              value={settings.image_height}
              onChange={handleInputChange}
            />
            <span className="range-value">{settings.image_height}px</span>
          </div>
        </div>

        {/* Typography Section */}
        <div className="settings-section">
          <h3>🔤 Ukuran Font</h3>

          <div className="form-group">
            <label htmlFor="title_size">Ukuran Judul (px)</label>
            <input
              type="range"
              id="title_size"
              name="title_size"
              min="20"
              max="48"
              value={settings.title_size}
              onChange={handleInputChange}
            />
            <span className="range-value">{settings.title_size}px</span>
          </div>

          <div className="form-group">
            <label htmlFor="subtitle_size">Ukuran Subtitle (px)</label>
            <input
              type="range"
              id="subtitle_size"
              name="subtitle_size"
              min="12"
              max="24"
              value={settings.subtitle_size}
              onChange={handleInputChange}
            />
            <span className="range-value">{settings.subtitle_size}px</span>
          </div>

          <div className="form-group">
            <label htmlFor="welcome_size">Ukuran Welcome Message (px)</label>
            <input
              type="range"
              id="welcome_size"
              name="welcome_size"
              min="10"
              max="20"
              value={settings.welcome_size}
              onChange={handleInputChange}
            />
            <span className="range-value">{settings.welcome_size}px</span>
          </div>

          <div className="form-group">
            <label htmlFor="text_align">Alignment Text</label>
            <select
              id="text_align"
              name="text_align"
              value={settings.text_align}
              onChange={handleInputChange}
            >
              <option value="left">Kiri</option>
              <option value="center">Tengah</option>
              <option value="right">Kanan</option>
            </select>
          </div>
        </div>

        {/* Color Customization Section */}
        <div className="settings-section">
          <h3>🎨 Warna</h3>

          <div className="color-picker-group">
            <div className="color-picker-item">
              <label htmlFor="background_color">Background Halaman</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="background_color"
                  name="background_color"
                  value={settings.background_color}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  value={settings.background_color}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      background_color: e.target.value,
                    }))
                  }
                  className="color-text-input"
                />
              </div>
            </div>

            <div className="color-picker-item">
              <label htmlFor="card_background">Background Card</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="card_background"
                  name="card_background"
                  value={settings.card_background}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  value={settings.card_background}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      card_background: e.target.value,
                    }))
                  }
                  className="color-text-input"
                />
              </div>
            </div>

            <div className="color-picker-item">
              <label htmlFor="left_gradient_start">Gradient Kiri (Start)</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="left_gradient_start"
                  name="left_gradient_start"
                  value={settings.left_gradient_start}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  value={settings.left_gradient_start}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      left_gradient_start: e.target.value,
                    }))
                  }
                  className="color-text-input"
                />
              </div>
            </div>

            <div className="color-picker-item">
              <label htmlFor="left_gradient_end">Gradient Kiri (End)</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="left_gradient_end"
                  name="left_gradient_end"
                  value={settings.left_gradient_end}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  value={settings.left_gradient_end}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      left_gradient_end: e.target.value,
                    }))
                  }
                  className="color-text-input"
                />
              </div>
            </div>

            <div className="color-picker-item">
              <label htmlFor="primary_color">Warna Primary (Judul Login)</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="primary_color"
                  name="primary_color"
                  value={settings.primary_color}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      primary_color: e.target.value,
                    }))
                  }
                  className="color-text-input"
                />
              </div>
            </div>

            <div className="color-picker-item">
              <label htmlFor="button_color">Warna Tombol Login</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="button_color"
                  name="button_color"
                  value={settings.button_color || "#667eea"}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  value={settings.button_color || "#667eea"}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      button_color: e.target.value,
                    }))
                  }
                  className="color-text-input"
                />
              </div>
            </div>

            <div className="color-picker-item">
              <label htmlFor="button_text_color">Warna Teks Tombol Login</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="button_text_color"
                  name="button_text_color"
                  value={settings.button_text_color || "#ffffff"}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  value={settings.button_text_color || "#ffffff"}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      button_text_color: e.target.value,
                    }))
                  }
                  className="color-text-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings Section */}
        <div className="settings-section">
          <h3>📱 Pengaturan Sidebar</h3>
          <p className="section-description">
            Atur logo dan judul yang tampil di sidebar aplikasi
          </p>

          <div className="sidebar-logo-preview">
            {sidebarLogo ? (
              <img
                src={sidebarLogo}
                alt="Sidebar Logo"
                className="sidebar-logo-img"
              />
            ) : (
              <div className="sidebar-logo-placeholder">🏛️</div>
            )}
          </div>

          <div className="upload-section">
            <label htmlFor="sidebar-logo-upload" className="upload-button">
              📤 Upload Logo Sidebar
            </label>
            <input
              type="file"
              id="sidebar-logo-upload"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append("file", file);

                try {
                  const token = localStorage.getItem("token");
                  const response = await fetch(
                    `${
                      process.env.REACT_APP_API_URL || "http://localhost:8000"
                    }/landing/upload-sidebar-logo`,
                    {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                      body: formData,
                    }
                  );

                  if (response.ok) {
                    const data = await response.json();
                    // Add timestamp to bypass browser cache
                    setSidebarLogo(data.url + "?t=" + Date.now());
                    setMessage({
                      type: "success",
                      text: "Logo sidebar berhasil diupload!",
                    });
                    setTimeout(() => setMessage(null), 3000);
                  } else {
                    throw new Error("Upload failed");
                  }
                } catch (err) {
                  setMessage({
                    type: "error",
                    text: "Gagal mengupload logo sidebar",
                  });
                }
              }}
              style={{ display: "none" }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="sidebar_title">Judul Sidebar</label>
            <input
              type="text"
              id="sidebar_title"
              name="sidebar_title"
              value={settings.sidebar_title || ""}
              onChange={handleInputChange}
              placeholder="Data Pegawai"
            />
          </div>

          <div className="form-group">
            <label htmlFor="sidebar_tagline">Tagline Sidebar</label>
            <input
              type="text"
              id="sidebar_tagline"
              name="sidebar_tagline"
              value={settings.sidebar_tagline || ""}
              onChange={handleInputChange}
              placeholder="Sistem Perbandingan"
            />
          </div>
        </div>

        {/* Preview Section */}
        <div className="settings-section">
          <h3>👁️ Preview</h3>
          <p className="section-description">
            Preview tampilan landing page dengan pengaturan saat ini
          </p>

          <div className="preview-container">
            <div
              className="preview-landing"
              style={{ backgroundColor: settings.background_color }}
            >
              <div
                className="preview-left"
                style={{
                  background: `linear-gradient(135deg, ${settings.left_gradient_start} 0%, ${settings.left_gradient_end} 100%)`,
                }}
              >
                {illustration ? (
                  <img
                    src={illustration}
                    alt="Preview"
                    className="preview-illustration"
                    style={{
                      width: `${settings.image_width}%`,
                      height: `${settings.image_height * 0.5}px`,
                    }}
                  />
                ) : (
                  <div className="preview-placeholder-small">📊</div>
                )}
                <div style={{ textAlign: settings.text_align }}>
                  <h3
                    style={{
                      fontSize: `${settings.title_size * 0.6}px`,
                      margin: "8px 0",
                    }}
                  >
                    {settings.title || "Judul"}
                  </h3>
                  <p
                    style={{
                      fontSize: `${settings.subtitle_size * 0.6}px`,
                      margin: "4px 0",
                    }}
                  >
                    {settings.subtitle || "Subtitle"}
                  </p>
                </div>
              </div>
              <div
                className="preview-right"
                style={{ backgroundColor: settings.card_background }}
              >
                <h3 style={{ color: settings.primary_color }}>Login</h3>
                <div className="preview-login-form">
                  <div className="preview-input"></div>
                  <div className="preview-input"></div>
                  <div
                    className="preview-button"
                    style={{ backgroundColor: settings.primary_color }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="save-button"
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? "Menyimpan..." : "💾 Simpan Pengaturan"}
        </button>
        <button className="reset-button" onClick={loadSettings}>
          🔄 Reset
        </button>
      </div>
    </div>
  );
}

export default LandingPageSettings;
