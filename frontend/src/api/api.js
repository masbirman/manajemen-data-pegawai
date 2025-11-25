import axios from "axios";

// Base URL for API - use environment variable or default to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Upload Excel file with employee data
 * @param {File} file - Excel file (.xlsx or .csv)
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year number
 * @param {string} unit - Unit kerja
 * @returns {Promise} Response with upload status and record count
 */
export async function uploadFile(file, month, year, unit) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("month", month);
    formData.append("year", year);
    formData.append("unit", unit);

    const response = await apiClient.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    // Transform error for better handling
    if (error.response) {
      // Server responded with error status
      throw new Error(
        error.response.data.detail ||
          error.response.data.message ||
          "Upload failed"
      );
    } else if (error.request) {
      // Request made but no response
      throw new Error("No response from server. Please check your connection.");
    } else {
      // Error setting up request
      throw new Error(error.message || "Failed to upload file");
    }
  }
}

/**
 * Get comparison results for a specific month/year/unit
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year number
 * @param {string} unit - Unit kerja
 * @returns {Promise} Comparison results with employee data
 */
export async function getComparison(month, year, unit) {
  try {
    const response = await apiClient.post("/compare", {
      month,
      year,
      unit,
    });

    return response.data;
  } catch (error) {
    // Transform error for better handling
    if (error.response) {
      // Server responded with error status
      throw new Error(
        error.response.data.detail ||
          error.response.data.message ||
          "Comparison failed"
      );
    } else if (error.request) {
      // Request made but no response
      throw new Error("No response from server. Please check your connection.");
    } else {
      // Error setting up request
      throw new Error(error.message || "Failed to get comparison");
    }
  }
}

/**
 * Health check endpoint
 * @returns {Promise} Health status
 */
export async function healthCheck() {
  try {
    const response = await apiClient.get("/health");
    return response.data;
  } catch (error) {
    throw new Error("Health check failed");
  }
}

/**
 * Download template Excel file
 * @returns {Promise} Blob data for download
 */
export async function downloadTemplate() {
  try {
    const response = await apiClient.get("/template/download", {
      responseType: "blob",
    });

    // Create download link with proper MIME type
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "template_data_pegawai.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    throw new Error("Failed to download template");
  }
}

/**
 * Get list of available months with data
 * @returns {Promise} List of months
 */
export async function getAvailableMonths() {
  try {
    const response = await apiClient.get("/admin/months");
    return response.data;
  } catch (error) {
    throw new Error("Failed to get available months");
  }
}

/**
 * Delete data for a specific month/year/unit
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year number
 * @param {string} unit - Unit kerja
 * @returns {Promise} Delete result
 */
export async function deleteData(month, year, unit) {
  try {
    const response = await apiClient.delete("/admin/data", {
      data: {
        month,
        year,
        unit,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.detail ||
          error.response.data.message ||
          "Delete failed"
      );
    } else if (error.request) {
      throw new Error("No response from server. Please check your connection.");
    } else {
      throw new Error(error.message || "Failed to delete data");
    }
  }
}

/**
 * Get archive data with optional filters
 * @param {number} month - Optional month filter
 * @param {number} year - Optional year filter
 * @param {string} unit - Optional unit filter
 * @param {string} search - Optional search term
 * @returns {Promise} Archive data
 */
export async function getArchiveData(
  month = null,
  year = null,
  unit = null,
  search = null
) {
  try {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    if (unit) params.unit = unit;
    if (search) params.search = search;

    const response = await apiClient.get("/archive/data", { params });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.detail ||
          error.response.data.message ||
          "Failed to get archive data"
      );
    } else {
      throw new Error(error.message || "Failed to get archive data");
    }
  }
}

/**
 * Login user
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise} Login response with token and user info
 */
export async function login(username, password) {
  try {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await apiClient.post("/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.detail ||
          error.response.data.message ||
          "Login failed"
      );
    } else {
      throw new Error(error.message || "Failed to login");
    }
  }
}

/**
 * Initialize default admin user
 * @returns {Promise} Init result
 */
export async function initAdmin() {
  try {
    const response = await apiClient.post("/auth/init-admin");
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.detail ||
          error.response.data.message ||
          "Init admin failed"
      );
    } else {
      throw new Error(error.message || "Failed to init admin");
    }
  }
}

/**
 * Get landing page settings
 * @returns {Promise} Landing page settings
 */
export async function getLandingSettings() {
  try {
    const response = await apiClient.get("/landing/settings");
    return response.data;
  } catch (error) {
    throw new Error("Failed to get landing settings");
  }
}

/**
 * Update landing page settings (admin only)
 * @param {object} settings - Landing page settings
 * @returns {Promise} Update result
 */
export async function updateLandingSettings(settings) {
  try {
    const token = localStorage.getItem("token");
    const response = await apiClient.put("/landing/settings", settings, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.detail ||
          error.response.data.message ||
          "Update failed"
      );
    } else {
      throw new Error(error.message || "Failed to update settings");
    }
  }
}

/**
 * Upload landing page illustration (admin only)
 * @param {File} file - Image file
 * @returns {Promise} Upload result
 */
export async function uploadLandingIllustration(file) {
  try {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post(
      "/landing/upload-illustration",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.detail ||
          error.response.data.message ||
          "Upload failed"
      );
    } else {
      throw new Error(error.message || "Failed to upload illustration");
    }
  }
}

export default {
  uploadFile,
  getComparison,
  healthCheck,
  downloadTemplate,
  getAvailableMonths,
  deleteData,
  getArchiveData,
  login,
  initAdmin,
  getLandingSettings,
  updateLandingSettings,
  uploadLandingIllustration,
};

/**
 * Update employee status
 * @param {number} id - Employee ID
 * @param {string} status - New status
 * @returns {Promise} Update result
 */
export async function updateEmployeeStatus(id, status) {
  try {
    const response = await apiClient.put("/update/status", {
      id,
      status,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.detail ||
          error.response.data.message ||
          "Update failed"
      );
    } else {
      throw new Error(error.message || "Failed to update status");
    }
  }
}

/**
 * Update departed employee status (creates new record in target month)
 * @param {string} nip - Employee NIP
 * @param {number} month - Target month
 * @param {number} year - Target year
 * @param {string} unit - Unit name
 * @param {string} status - New status
 * @returns {Promise} Update result
 */
export async function updateDepartedEmployeeStatus(
  nip,
  month,
  year,
  unit,
  status
) {
  try {
    const response = await apiClient.post("/update/departed-status", {
      nip,
      month,
      year,
      unit,
      status,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.detail ||
          error.response.data.message ||
          "Update failed"
      );
    } else {
      throw new Error(
        error.message || "Failed to update departed employee status"
      );
    }
  }
}
