import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ProfileSettings.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function ProfileSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(response.data);
      setFormData({
        full_name: response.data.full_name || "",
        email: response.data.email || "",
      });
      setAvatarPreview(response.data.avatar_url);
      setLoading(false);
    } catch (error) {
      showMessage("error", "Gagal memuat profil");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showMessage("error", "Ukuran file terlalu besar. Maksimal 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showMessage("error", "File harus berupa gambar");
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Update profile info
      await axios.put(
        `${API_BASE_URL}/auth/profile`,
        {
          full_name: formData.full_name,
          email: formData.email,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update avatar if changed
      if (avatarFile) {
        const formDataAvatar = new FormData();
        formDataAvatar.append("file", avatarFile);

        const avatarResponse = await axios.post(
          `${API_BASE_URL}/auth/profile/avatar`,
          formDataAvatar,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setAvatarPreview(avatarResponse.data.avatar_url);
      }

      showMessage("success", "Profil berhasil diupdate!");
      loadUserProfile();

      // Trigger sidebar update
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.detail || "Gagal update profil"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm("Hapus avatar?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/auth/profile/avatar`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAvatarPreview(null);
      setAvatarFile(null);
      showMessage("success", "Avatar berhasil dihapus");
      loadUserProfile();

      // Trigger sidebar update
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.detail || "Gagal hapus avatar"
      );
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading && !user) {
    return (
      <div className="profile-settings">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-settings">
      <div className="profile-header">
        <h2>👤 Edit Profil</h2>
        <p className="profile-description">
          Kelola informasi profil dan avatar Anda
        </p>
      </div>

      {message && (
        <div className={`profile-message ${message.type}`}>{message.text}</div>
      )}

      <div className="profile-content">
        {/* Avatar Section */}
        <div className="avatar-section">
          <h3>Avatar</h3>
          <div className="avatar-container">
            <div className="avatar-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">
                  {user?.full_name?.charAt(0) ||
                    user?.username?.charAt(0) ||
                    "?"}
                </div>
              )}
            </div>
            <div className="avatar-actions">
              <input
                type="file"
                id="avatar-input"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
              <label htmlFor="avatar-input" className="upload-avatar-btn">
                📷 Pilih Avatar
              </label>
              {avatarPreview && (
                <button
                  className="delete-avatar-btn"
                  onClick={handleDeleteAvatar}
                >
                  🗑️ Hapus
                </button>
              )}
              <p className="avatar-hint">
                Format: PNG, JPG, JPEG. Maksimal 2MB
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleUpdateProfile} className="profile-form">
          <h3>Informasi Profil</h3>

          <div className="form-group">
            <label>Username</label>
            <input type="text" value={user?.username || ""} disabled />
            <small>Username tidak bisa diubah</small>
          </div>

          <div className="form-group">
            <label>Nama Lengkap</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Masukkan email"
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <input
              type="text"
              value={user?.role || ""}
              disabled
              style={{ textTransform: "capitalize" }}
            />
          </div>

          <button type="submit" className="save-profile-btn" disabled={loading}>
            {loading ? "⏳ Menyimpan..." : "💾 Simpan Perubahan"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileSettings;
