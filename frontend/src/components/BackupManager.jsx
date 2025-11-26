import React, { useState, useEffect } from "react";
import axios from "axios";
import "./BackupManager.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function BackupManager() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/backup/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBackups(response.data.backups);
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.detail || "Gagal memuat daftar backup"
      );
    }
  };

  const createBackup = async () => {
    if (
      !window.confirm(
        "Buat backup database sekarang? Proses ini mungkin memakan waktu beberapa detik."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/backup/create`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showMessage(
        "success",
        `Backup berhasil dibuat: ${response.data.filename} (${response.data.size_mb} MB)`
      );
      loadBackups();
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.detail || "Gagal membuat backup"
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = async (filename) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/backup/download/${filename}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showMessage("success", `Backup ${filename} berhasil didownload`);
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.detail || "Gagal mendownload backup"
      );
    }
  };

  const restoreBackup = async (filename) => {
    if (
      !window.confirm(
        `⚠️ PERINGATAN!\n\nRestore backup akan MENGHAPUS semua data saat ini dan menggantinya dengan data dari backup "${filename}".\n\nProses ini TIDAK BISA DIBATALKAN!\n\nApakah Anda yakin ingin melanjutkan?`
      )
    ) {
      return;
    }

    if (
      !window.confirm(
        "Konfirmasi sekali lagi: Anda YAKIN ingin restore backup ini? Semua data saat ini akan HILANG!"
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/backup/restore/${filename}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showMessage(
        "success",
        `Database berhasil di-restore dari ${filename}. Halaman akan reload...`
      );

      // Reload page after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.detail || "Gagal restore backup"
      );
      setLoading(false);
    }
  };

  const deleteBackup = async (filename) => {
    if (
      !window.confirm(
        `Hapus backup "${filename}"?\n\nFile backup akan dihapus permanen.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/backup/delete/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showMessage("success", `Backup ${filename} berhasil dihapus`);
      loadBackups();
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.detail || "Gagal menghapus backup"
      );
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="backup-manager">
      <div className="backup-header">
        <h2>🔒 Backup & Restore Database</h2>
        <p className="backup-description">
          Kelola backup database untuk mencegah kehilangan data
        </p>
      </div>

      {message && (
        <div className={`backup-message ${message.type}`}>{message.text}</div>
      )}

      <div className="backup-actions">
        <button
          className="create-backup-btn"
          onClick={createBackup}
          disabled={loading}
        >
          {loading ? "⏳ Membuat Backup..." : "💾 Buat Backup Baru"}
        </button>
        <button
          className="refresh-btn"
          onClick={loadBackups}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      <div className="backup-warning">
        <strong>⚠️ Peringatan:</strong>
        <ul>
          <li>Backup database secara berkala untuk mencegah kehilangan data</li>
          <li>
            Restore akan MENGHAPUS semua data saat ini dan menggantinya dengan
            data dari backup
          </li>
          <li>Download backup ke komputer lokal sebagai backup tambahan</li>
          <li>Proses restore tidak bisa dibatalkan setelah dimulai</li>
        </ul>
      </div>

      <div className="backup-list">
        <h3>📋 Daftar Backup ({backups.length})</h3>

        {backups.length === 0 ? (
          <div className="no-backups">
            <p>Belum ada backup. Buat backup pertama Anda sekarang!</p>
          </div>
        ) : (
          <table className="backup-table">
            <thead>
              <tr>
                <th>Nama File</th>
                <th>Ukuran</th>
                <th>Tanggal Dibuat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.filename}>
                  <td className="filename">{backup.filename}</td>
                  <td>{backup.size_mb} MB</td>
                  <td>{backup.created_at}</td>
                  <td className="actions">
                    <button
                      className="download-btn"
                      onClick={() => downloadBackup(backup.filename)}
                      title="Download backup"
                    >
                      📥
                    </button>
                    <button
                      className="restore-btn"
                      onClick={() => restoreBackup(backup.filename)}
                      disabled={loading}
                      title="Restore dari backup ini"
                    >
                      ♻️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => deleteBackup(backup.filename)}
                      title="Hapus backup"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="backup-tips">
        <h4>💡 Tips:</h4>
        <ul>
          <li>
            <strong>Backup Otomatis:</strong> Buat backup sebelum melakukan
            perubahan besar
          </li>
          <li>
            <strong>Backup Berkala:</strong> Disarankan backup minimal 1x
            seminggu
          </li>
          <li>
            <strong>Download Lokal:</strong> Simpan backup penting di komputer
            lokal
          </li>
          <li>
            <strong>Hapus Backup Lama:</strong> Hapus backup yang sudah tidak
            diperlukan untuk menghemat space
          </li>
        </ul>
      </div>
    </div>
  );
}

export default BackupManager;
