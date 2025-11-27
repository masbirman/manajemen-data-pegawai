import React, { useState, useEffect } from "react";
import "./MaintenanceSettings.css";

const API_BASE_URL = process.env.REACT_APP_API_URL;

function MaintenanceSettings() {
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("Sedang Dalam Perbaikan");
  const [message, setMessage] = useState(
    "Sistem sedang dalam pemeliharaan. Silakan kembali beberapa saat lagi."
  );
  const [imageUrl, setImageUrl] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/maintenance/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const settings = data.settings;
        setEnabled(settings.enabled || false);
        setTitle(settings.title || "Sedang Dalam Perbaikan");
        setMessage(settings.message || "");
        setImageUrl(settings.image_url || "");
        setEstimatedTime(settings.estimated_time || "");
      }
    } catch (error) {
      console.error("Failed to fetch maintenance settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/maintenance/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled,
          title,
          message,
          image_url: imageUrl,
          estimated_time: estimatedTime,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotification({
          type: "success",
          text: data.message || "Pengaturan berhasil disimpan!",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      setNotification({
        type: "error",
        text: "Gagal menyimpan pengaturan: " + error.message,
      });
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/maintenance/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.image_url);
        setNotification({ type: "success", text: "Gambar berhasil diupload!" });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      setNotification({ type: "error", text: "Gagal upload gambar" });
    } finally {
      setUploading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  if (loading) {
    return <div className="maintenance-loading">Memuat pengaturan...</div>;
  }

  return (
    <div className="maintenance-settings">
      <div className="maintenance-header">
        <h2>🔧 Mode Maintenance</h2>
        <p>
          Aktifkan mode maintenance untuk menampilkan halaman perbaikan ke
          publik
        </p>
      </div>

      {notification && (
        <div className={`maintenance-notification ${notification.type}`}>
          {notification.text}
        </div>
      )}

      <div className="maintenance-content">
        {/* Toggle Section */}
        <div className="maintenance-section toggle-section">
          <div className="toggle-header">
            <div>
              <h3>Status Maintenance</h3>
              <p>
                {enabled
                  ? "Mode maintenance AKTIF - Pengguna akan melihat halaman maintenance"
                  : "Mode maintenance NONAKTIF - Aplikasi berjalan normal"}
              </p>
            </div>
            <label className="toggle-switch large">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          {enabled && (
            <div className="status-warning">
              ⚠️ Perhatian: Semua pengguna (kecuali Super Admin) akan melihat
              halaman maintenance saat mengakses aplikasi.
            </div>
          )}
        </div>

        {/* Form Section */}
        <div className="maintenance-section">
          <h3>📝 Konten Halaman Maintenance</h3>

          <div className="form-group">
            <label>Judul</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Sedang Dalam Perbaikan"
            />
          </div>

          <div className="form-group">
            <label>Pesan / Keterangan</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Jelaskan alasan maintenance dan kapan akan selesai..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Estimasi Waktu Selesai (opsional)</label>
            <input
              type="text"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="Contoh: 2 jam, Besok pagi, dll"
            />
          </div>

          <div className="form-group">
            <label>Gambar (opsional)</label>
            <div className="image-upload-area">
              {imageUrl ? (
                <div className="image-preview">
                  <img
                    src={
                      imageUrl.startsWith("http")
                        ? imageUrl
                        : `${API_BASE_URL}${imageUrl}`
                    }
                    alt="Maintenance"
                  />
                  <button
                    className="remove-image"
                    onClick={() => setImageUrl("")}
                  >
                    ✕ Hapus
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    id="maintenance-image"
                  />
                  <label htmlFor="maintenance-image">
                    {uploading ? "Mengupload..." : "📷 Pilih Gambar"}
                  </label>
                  <p>PNG, JPG, GIF, atau SVG (maks. 5MB)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="maintenance-section">
          <h3>👁️ Preview</h3>
          <div className="maintenance-preview">
            <div className="preview-content">
              {imageUrl && (
                <img
                  src={
                    imageUrl.startsWith("http")
                      ? imageUrl
                      : `${API_BASE_URL}${imageUrl}`
                  }
                  alt="Maintenance"
                  className="preview-image"
                />
              )}
              <h1>{title || "Judul Maintenance"}</h1>
              <p>
                {message || "Pesan maintenance akan ditampilkan di sini..."}
              </p>
              {estimatedTime && (
                <div className="preview-time">
                  ⏱️ Estimasi selesai: {estimatedTime}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="maintenance-actions">
        <button className="save-button" onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : "💾 Simpan Pengaturan"}
        </button>
      </div>
    </div>
  );
}

export default MaintenanceSettings;
