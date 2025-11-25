import React, { useState, useEffect } from "react";
import { getAvailableMonths, deleteData } from "../api/api";
import "./AdminPanel.css";

function AdminPanel() {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [logoMessage, setLogoMessage] = useState(null);
  const [appTitle, setAppTitle] = useState(
    localStorage.getItem("appTitle") || "Data Pegawai"
  );
  const [appTagline, setAppTagline] = useState(
    localStorage.getItem("appTagline") || "Sistem Perbandingan"
  );
  const [titleMessage, setTitleMessage] = useState(null);
  const loadMonths = async () => {
    setLoading(true);
    try {
      const result = await getAvailableMonths();
      setMonths(result.months || []);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonths();
  }, []);

  const handleTitleUpdate = () => {
    if (!appTitle.trim()) {
      setTitleMessage({
        type: "error",
        text: "Judul tidak boleh kosong",
      });
      return;
    }

    localStorage.setItem("appTitle", appTitle);
    localStorage.setItem("appTagline", appTagline);
    setTitleMessage({
      type: "success",
      text: "Judul dan tagline berhasil diupdate! Refresh halaman untuk melihat perubahan.",
    });
    window.dispatchEvent(new Event("storage"));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoMessage({
        type: "error",
        text: "Ukuran file terlalu besar. Maksimal 2MB",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setLogoMessage({
        type: "error",
        text: "File harus berupa gambar (PNG, JPG, atau SVG)",
      });
      return;
    }

    // Read file and save to localStorage
    const reader = new FileReader();
    reader.onload = (event) => {
      localStorage.setItem("appLogo", event.target.result);
      setLogoMessage({
        type: "success",
        text: "Logo berhasil diupload! Refresh halaman untuk melihat perubahan.",
      });
      // Trigger storage event to update logo in sidebar
      window.dispatchEvent(new Event("storage"));
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (month, year, unit) => {
    const monthName = new Date(year, month - 1, 1).toLocaleString("id-ID", {
      month: "long",
    });

    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus data ${unit} ${monthName} ${year}?`
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await deleteData(month, year, unit);
      setMessage({
        type: "success",
        text: `Berhasil menghapus ${result.records_deleted} records untuk ${unit} ${monthName} ${year}`,
      });
      // Reload months list
      await loadMonths();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Gagal menghapus data",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel-container">
      <div className="admin-panel">
        <h3>Kelola Data</h3>

        {/* Branding Section */}
        <div className="branding-section">
          <h4>Pengaturan Branding</h4>

          {/* Title & Tagline */}
          <div className="title-form">
            <div className="form-group">
              <label htmlFor="app-title">Judul Aplikasi:</label>
              <input
                type="text"
                id="app-title"
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                placeholder="Contoh: Data Pegawai"
              />
            </div>
            <div className="form-group">
              <label htmlFor="app-tagline">Tagline:</label>
              <input
                type="text"
                id="app-tagline"
                value={appTagline}
                onChange={(e) => setAppTagline(e.target.value)}
                placeholder="Contoh: Sistem Perbandingan"
              />
            </div>
            <button className="update-title-button" onClick={handleTitleUpdate}>
              💾 Simpan Perubahan
            </button>
            {titleMessage && (
              <div className={`title-message ${titleMessage.type}`}>
                {titleMessage.text}
              </div>
            )}
          </div>

          {/* Logo Upload */}
          <div className="logo-upload-form">
            <label className="form-label">Logo Aplikasi:</label>
            <input
              type="file"
              id="logo-upload"
              accept="image/*"
              onChange={handleLogoUpload}
              style={{ display: "none" }}
            />
            <label htmlFor="logo-upload" className="logo-upload-button">
              📷 Pilih Logo
            </label>
            {logoMessage && (
              <span className={`logo-message ${logoMessage.type}`}>
                {logoMessage.text}
              </span>
            )}
            <p className="logo-hint">
              Format: PNG, JPG, atau SVG. Ukuran maksimal: 2MB
            </p>
          </div>
        </div>

        {message && (
          <div className={`admin-message ${message.type}`}>{message.text}</div>
        )}

        {loading && <div className="admin-loading">Loading...</div>}

        {!loading && months.length === 0 && (
          <p className="no-data">Tidak ada data tersimpan</p>
        )}

        {!loading && months.length > 0 && (
          <div className="months-list">
            <table>
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Bulan</th>
                  <th>Tahun</th>
                  <th>Jumlah Records</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {months.map((item) => {
                  const monthName = new Date(
                    item.year,
                    item.month - 1,
                    1
                  ).toLocaleString("id-ID", { month: "long" });
                  return (
                    <tr key={`${item.year}-${item.month}-${item.unit}`}>
                      <td>{item.unit}</td>
                      <td>{monthName}</td>
                      <td>{item.year}</td>
                      <td>{item.count}</td>
                      <td>
                        <button
                          className="delete-button"
                          onClick={() =>
                            handleDelete(item.month, item.year, item.unit)
                          }
                          disabled={loading}
                        >
                          🗑️ Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
