import React, { useState, useEffect } from "react";
import "./UserManagement.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("users");

  // Form states
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    email: "",
    full_name: "",
    role: "viewer",
  });

  // Edit states
  const [editingUser, setEditingUser] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(null);

  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch permissions");
      const data = await response.json();
      setPermissions(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchPermissions()]);
      setLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to add user");
      }

      await fetchUsers();
      setShowAddUser(false);
      setNewUser({
        username: "",
        password: "",
        email: "",
        full_name: "",
        role: "viewer",
      });
      showNotification("User berhasil ditambahkan", "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to update user");
      }

      await fetchUsers();
      setEditingUser(null);
      showNotification("User berhasil diupdate", "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Yakin ingin menghapus user "${username}"?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to delete user");
      }

      await fetchUsers();
      showNotification("User berhasil dihapus", "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handleResetPassword = async (userId) => {
    if (!newPassword) {
      showNotification("Password tidak boleh kosong", "error");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/users/${userId}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ new_password: newPassword }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to reset password");
      }

      setResetPasswordUser(null);
      setNewPassword("");
      showNotification("Password berhasil direset", "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handleAvatarUpload = async (userId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE_URL}/auth/users/${userId}/avatar`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to upload avatar");
      }

      await fetchUsers();
      setUploadingAvatar(null);
      showNotification("Avatar berhasil diupload", "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handleDeleteAvatar = async (userId) => {
    if (!window.confirm("Yakin ingin menghapus avatar?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/users/${userId}/avatar`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to delete avatar");
      }

      await fetchUsers();
      showNotification("Avatar berhasil dihapus", "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handleUpdatePermissions = async (role, newPermissions) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role, permissions: newPermissions }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to update permissions");
      }

      await fetchPermissions();
      showNotification(
        `Permissions untuk ${role} berhasil diupdate`,
        "success"
      );
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const showNotification = (message, type) => {
    window.dispatchEvent(
      new CustomEvent("showNotification", {
        detail: { message, type },
      })
    );
  };

  const togglePermission = (role, permission, currentPerms) => {
    const newPerms = currentPerms.includes(permission)
      ? currentPerms.filter((p) => p !== permission)
      : [...currentPerms, permission];
    handleUpdatePermissions(role, newPerms);
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <header className="content-header">
        <h1>👥 User Management</h1>
        <p className="subtitle">Kelola user dan hak akses sistem</p>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👤 Users
        </button>
        <button
          className={`tab ${activeTab === "permissions" ? "active" : ""}`}
          onClick={() => setActiveTab("permissions")}
        >
          🔐 Permissions
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeTab === "users" && (
        <div className="users-section">
          <div className="section-header">
            <h2>Daftar User</h2>
            <button
              className="btn-primary"
              onClick={() => setShowAddUser(true)}
            >
              + Tambah User
            </button>
          </div>

          {showAddUser && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Tambah User Baru</h3>
                <form onSubmit={handleAddUser}>
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser({ ...newUser, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Nama Lengkap</label>
                    <input
                      type="text"
                      value={newUser.full_name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, full_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value })
                      }
                    >
                      <option value="viewer">Viewer</option>
                      <option value="operator">Operator</option>
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowAddUser(false)}
                    >
                      Batal
                    </button>
                    <button type="submit" className="btn-primary">
                      Simpan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <table className="users-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Username</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="avatar-cell">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="user-avatar-img"
                        />
                      ) : (
                        <div className="user-avatar-placeholder">
                          {(user.full_name || user.username)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <button
                        className="avatar-edit-btn"
                        title="Upload Avatar"
                        onClick={() => setUploadingAvatar(user)}
                      >
                        📷
                      </button>
                    </div>
                  </td>
                  <td>{user.username}</td>
                  <td>{user.full_name || "-"}</td>
                  <td>{user.email || "-"}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        user.is_active ? "active" : "inactive"
                      }`}
                    >
                      {user.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>
                    {user.last_login
                      ? new Date(user.last_login).toLocaleString("id-ID")
                      : "-"}
                  </td>
                  <td className="actions">
                    <button
                      className="btn-icon"
                      title="Edit"
                      onClick={() => setEditingUser(user)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon"
                      title="Reset Password"
                      onClick={() => setResetPasswordUser(user)}
                    >
                      🔑
                    </button>
                    <button
                      className="btn-icon danger"
                      title="Hapus"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {uploadingAvatar && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Upload Avatar: {uploadingAvatar.username}</h3>
                <div className="avatar-preview">
                  {uploadingAvatar.avatar_url ? (
                    <img
                      src={uploadingAvatar.avatar_url}
                      alt="Current avatar"
                      className="avatar-preview-img"
                    />
                  ) : (
                    <div className="avatar-preview-placeholder">
                      {(uploadingAvatar.full_name || uploadingAvatar.username)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Pilih Gambar (PNG, JPG, JPEG, WebP)</label>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleAvatarUpload(
                          uploadingAvatar.id,
                          e.target.files[0]
                        );
                      }
                    }}
                  />
                </div>
                <div className="modal-actions">
                  {uploadingAvatar.avatar_url && (
                    <button
                      className="btn-danger"
                      onClick={() => {
                        handleDeleteAvatar(uploadingAvatar.id);
                        setUploadingAvatar(null);
                      }}
                    >
                      🗑️ Hapus Avatar
                    </button>
                  )}
                  <button
                    className="btn-secondary"
                    onClick={() => setUploadingAvatar(null)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          {editingUser && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Edit User: {editingUser.username}</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateUser(editingUser.id, {
                      email: editingUser.email,
                      full_name: editingUser.full_name,
                      role: editingUser.role,
                      is_active: editingUser.is_active,
                    });
                  }}
                >
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editingUser.email || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Nama Lengkap</label>
                    <input
                      type="text"
                      value={editingUser.full_name || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          full_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, role: e.target.value })
                      }
                    >
                      <option value="viewer">Viewer</option>
                      <option value="operator">Operator</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={editingUser.is_active}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            is_active: e.target.checked,
                          })
                        }
                      />{" "}
                      User Aktif
                    </label>
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEditingUser(null)}
                    >
                      Batal
                    </button>
                    <button type="submit" className="btn-primary">
                      Simpan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {resetPasswordUser && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Reset Password: {resetPasswordUser.username}</h3>
                <div className="form-group">
                  <label>Password Baru</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setResetPasswordUser(null);
                      setNewPassword("");
                    }}
                  >
                    Batal
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => handleResetPassword(resetPasswordUser.id)}
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "permissions" && (
        <div className="permissions-section">
          <h2>Pengaturan Hak Akses</h2>
          <p className="info-text">
            Centang permission yang ingin diberikan untuk setiap role. Super
            Admin memiliki semua akses secara otomatis.
          </p>

          <div className="permissions-grid">
            {permissions.role_permissions?.map((rolePerm) => (
              <div key={rolePerm.role} className="permission-card">
                <h3 className={`role-title ${rolePerm.role}`}>
                  {rolePerm.role === "operator" ? "👷 Operator" : "👁️ Viewer"}
                </h3>
                <div className="permission-list">
                  {permissions.available_permissions?.map((perm) => (
                    <label key={perm} className="permission-item">
                      <input
                        type="checkbox"
                        checked={rolePerm.permissions.includes(perm)}
                        onChange={() =>
                          togglePermission(
                            rolePerm.role,
                            perm,
                            rolePerm.permissions
                          )
                        }
                      />
                      <span className="permission-name">
                        {getPermissionLabel(perm)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getPermissionLabel(permission) {
  const labels = {
    dashboard: "📊 Dashboard - Lihat statistik",
    upload: "📤 Upload - Upload data pegawai",
    compare: "📈 Compare - Bandingkan data",
    archive: "📁 Archive - Lihat arsip data",
    download: "📥 Download - Download Excel",
    edit_status: "✏️ Edit Status - Ubah status pegawai",
  };
  return labels[permission] || permission;
}

export default UserManagement;
