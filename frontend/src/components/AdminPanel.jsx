import React, { useState, useEffect } from "react";
import { getAvailableMonths, deleteData } from "../api/api";
import BackupManager from "./BackupManager";
import {
  Storage as StorageIcon,
  Backup as BackupIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  BrandingWatermark as BrandingIcon,
  TextFields as TextFieldsIcon
} from "@mui/icons-material";
import "./AdminPanel.css";

function AdminPanel() {
  const [activeTab, setActiveTab] = useState("data");
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
      <div className="admin-header">
        <h2>Admin Panel</h2>
        <p>Kelola data sistem, backup, dan konfigurasi aplikasi</p>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "data" ? "active" : ""}`}
          onClick={() => setActiveTab("data")}
        >
          <StorageIcon fontSize="small" />
          Kelola Data
        </button>
        <button
          className={`admin-tab ${activeTab === "backup" ? "active" : ""}`}
          onClick={() => setActiveTab("backup")}
        >
          <BackupIcon fontSize="small" />
          Backup & Restore
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "backup" ? (
          <BackupManager />
        ) : (
          <div className="data-management">
            {/* Branding Section */}
            <div className="branding-section">
              <div className="section-title">
                <BrandingIcon className="section-icon" />
                <h4>Pengaturan Branding</h4>
              </div>

              <div className="branding-grid">
                {/* Title & Tagline */}
                <div className="branding-card">
                  <div className="card-header">
                    <TextFieldsIcon fontSize="small" />
                    <h5>Judul & Tagline</h5>
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label htmlFor="app-title">Judul Aplikasi</label>
                      <input
                        type="text"
                        id="app-title"
                        value={appTitle}
                        onChange={(e) => setAppTitle(e.target.value)}
                        placeholder="Contoh: Data Pegawai"
                        className="modern-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="app-tagline">Tagline</label>
                      <input
                        type="text"
                        id="app-tagline"
                        value={appTagline}
                        onChange={(e) => setAppTagline(e.target.value)}
                        placeholder="Contoh: Sistem Perbandingan"
                        className="modern-input"
                      />
                    </div>
                    <button
                      className="primary-button"
                      onClick={handleTitleUpdate}
                    >
                      <SaveIcon fontSize="small" />
                      Simpan Perubahan
                    </button>
                    {titleMessage && (
                      <div className={`status-message ${titleMessage.type}`}>
                        {titleMessage.text}
                      </div>
                    )}
                  </div>
                </div>

                {/* Logo Upload */}
                <div className="branding-card">
                  <div className="card-header">
                    <UploadIcon fontSize="small" />
                    <h5>Logo Aplikasi</h5>
                  </div>
                  <div className="card-body">
                    <div className="upload-area">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        style={{ display: "none" }}
                      />
                      <label htmlFor="logo-upload" className="upload-label">
                        <div className="upload-placeholder">
                          <UploadIcon fontSize="large" />
                          <span>Klik untuk pilih logo</span>
                          <small>PNG, JPG, SVG (Max 2MB)</small>
                        </div>
                      </label>
                    </div>
                    {logoMessage && (
                      <div className={`status-message ${logoMessage.type}`}>
                        {logoMessage.text}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {message && (
              <div className={`admin-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="data-list-section">
              <h4>Data Tersimpan</h4>
              {loading && <div className="admin-loading">Loading data...</div>}

              {!loading && months.length === 0 && (
                <div className="empty-state">
                  <StorageIcon fontSize="large" />
                  <p>Tidak ada data tersimpan</p>
                </div>
              )}

              {!loading && months.length > 0 && (
                <div className="table-wrapper">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Unit Kerja</th>
                        <th>Bulan</th>
                        <th>Tahun</th>
                        <th className="text-center">Jumlah Records</th>
                        <th className="text-right">Aksi</th>
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
                            <td className="font-medium">{item.unit}</td>
                            <td>
                              <span className="pill-badge blue">{monthName}</span>
                            </td>
                            <td>
                              <span className="pill-badge gray">{item.year}</span>
                            </td>
                            <td className="text-center">{item.count}</td>
                            <td className="text-right">
                              <button
                                className="icon-button delete"
                                onClick={() =>
                                  handleDelete(item.month, item.year, item.unit)
                                }
                                disabled={loading}
                                title="Hapus Data"
                              >
                                <DeleteIcon fontSize="small" />
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
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
